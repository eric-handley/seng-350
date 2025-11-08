import { useState, useMemo, useCallback } from 'react'
import { formatISO } from 'date-fns'
import { createBooking, fetchUserBookings, cancelBooking as cancelBookingApi } from '../api/bookings'
import type { Booking as ApiBooking } from '../api/bookings'
import type { UiBooking } from '../types'
import { mapApiBookingToUi, mergeBookings, reconcileTemp, toIsoDateTimeUTC } from '../utils/bookings'
import { toApiTime } from '../utils/time'

export function useBookingHistory(userId: string) {
  const [serverHistory, setServerHistory] = useState<ApiBooking[] | null>(null)
  const [optimisticHistory, setOptimisticHistory] = useState<ApiBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allBookings, setAllBookings] = useState<ApiBooking[]>([])

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUserBookings(userId)
      setServerHistory(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load history'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createNewBooking = async (
    roomId: string,
    date: string,
    start: string,
    end: string
  ): Promise<void> => {
    const startApi = toApiTime(start)
    const endApi = toApiTime(end)

    if (!startApi || !endApi) {
      throw new Error('Invalid time format')
    }

    const tempId = `temp-${Date.now()}`
    const startIso = toIsoDateTimeUTC(date, startApi)
    const endIso = toIsoDateTimeUTC(date, endApi)
    const nowIso = formatISO(new Date())

    const temp: ApiBooking = {
      id: tempId,
      user_id: userId,
      room_id: roomId,
      start_time: startIso,
      end_time: endIso,
      status: 'Active',
      booking_series_id: tempId,
      created_at: nowIso,
      updated_at: nowIso,
    }

    // Optimistically add booking
    setOptimisticHistory(prev => [temp, ...prev])

    try {
      const created = await createBooking({
        room_id: roomId,
        start_time: startIso,
        end_time: endIso,
      })

      // Replace temp with real booking
      setOptimisticHistory(prev => reconcileTemp(prev, tempId, created))

      // Refresh from server
      try {
        const fresh = await fetchUserBookings(userId)
        setServerHistory(fresh)
      } catch {
        // Ignore refresh errors
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create booking'
      setError(msg)
      // Remove optimistic booking on failure
      setOptimisticHistory(prev => prev.filter(b => b.id !== tempId))
      throw err
    }
  }

  const cancelBooking = async (id: string): Promise<void> => {
    try {
      await cancelBookingApi(id)

      // Optimistically remove
      setOptimisticHistory(prev => prev.filter(b => b.id !== id))
      setServerHistory(prev => (prev ? prev.filter(b => b.id !== id) : prev))

      // Refresh from server
      const fresh = await fetchUserBookings(userId)
      setServerHistory(fresh)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking'
      setError(msg)
      throw err
    }
  }

  // Merge optimistic and server bookings
  const mergedApiHistory: ApiBooking[] = useMemo(
    () => mergeBookings(optimisticHistory, serverHistory ?? []),
    [optimisticHistory, serverHistory]
  )

  // Convert to UI format
  const history: UiBooking[] = useMemo(
    () => mergedApiHistory.map(mapApiBookingToUi),
    [mergedApiHistory]
  )

  const fetchAllBookings = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/bookings', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setAllBookings(data)
      }
    } catch (err: unknown) {
      console.error('Failed to fetch all bookings:', err)
    }
  }, [])

  // Convert all bookings to UI format
  const allBookingsUi: UiBooking[] = useMemo(
    () => allBookings.map(mapApiBookingToUi),
    [allBookings]
  )

  return {
    history,
    loading,
    error,
    fetchHistory,
    fetchAllBookings,
    createBooking: createNewBooking,
    cancelBooking,
    allBookings: allBookingsUi,
  }
}
