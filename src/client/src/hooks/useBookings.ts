import { useState } from 'react'
import { Booking, Room } from '../types'
import { INITIAL_BOOKINGS } from '../constants'
import { formatDate, isoAt, overlap } from '../utils/dateHelpers'

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS)

  const addBooking = (room: Room, date: string, start: string, end: string) => {
    const requestedStart = isoAt(date, start)
    const requestedEnd = isoAt(date, end)
    
    if (requestedEnd <= requestedStart) {
      console.error('End time must be after start time.')
      return false
    }

    const id = `bk-${Math.random().toString(36).slice(2, 8)}`
    setBookings(prev => [
      ...prev,
      {
        id,
        roomId: room.id,
        start: formatDate(requestedStart),
        end: formatDate(requestedEnd),
        user: 'You',
      },
    ])
    return true
  }

  const cancelBooking = (id: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === id ? { ...b, cancelled: true } : b))
    )
  }

  const getUnavailableRoomIds = (requestedStart: Date, requestedEnd: Date) => {
    const ids = new Set<string>()
    for (const b of bookings) {
      if (b.cancelled) {continue}
      const bStart = new Date(b.start)
      const bEnd = new Date(b.end)
      if (overlap(requestedStart, requestedEnd, bStart, bEnd)) {
        ids.add(b.roomId)
      }
    }
    return ids
  }

  const getUserHistory = () => {
    return bookings
      .filter(b => b.user === 'You')
      .sort((a, b) => +new Date(b.start) - +new Date(a.start))
  }

  const getScheduleForDay = (date: string) => {
    const dayStart = isoAt(date, '00:00')
    const dayEnd = isoAt(date, '23:59')
    return bookings
      .filter(b => {
        if (b.cancelled) {return false}
        const s = new Date(b.start)
        const e = new Date(b.end)
        return s >= dayStart && e <= dayEnd
      })
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))
  }

  // const refreshBookings = async () => {
  //   try {
  //     const response = await fetch('http://localhost:3000/bookings', { credentials: 'include' })
  //     if (response.ok) {
  //       const data: Booking[] = await response.json()
  //       setBookings(data)
  //     } else {
  //       console.error('Failed to fetch bookings')
  //     }
  //   } catch (error) {
  //     console.error('Error fetching bookings:', error)
  //   }
  // }

  return {
    bookings,
    addBooking,
    cancelBooking,
    getUnavailableRoomIds,
    getUserHistory,
    getScheduleForDay,
  }
}