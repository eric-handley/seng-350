import { useState, useMemo } from 'react'
import { Room } from '../types'
import { ROOMS } from '../constants'
import { isoAt, getCurrentDate } from '../utils/dateHelpers'

export const useRoomFiltering = () => {
  const [building, setBuilding] = useState<string>('')
  const [roomQuery, setRoomQuery] = useState<string>('')
  const [date, setDate] = useState<string>(getCurrentDate())
  const [start, setStart] = useState<string>('10:00')
  const [end, setEnd] = useState<string>('11:00')

  const requestedStart = useMemo(() => isoAt(date, start), [date, start])
  const requestedEnd = useMemo(() => isoAt(date, end), [date, end])

  const filteredRooms = useMemo(() => {
    const q = roomQuery.trim().toLowerCase()
    return ROOMS.filter(r => {
      const matchBuilding = !building || r.building === building
      const matchRoom =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      return matchBuilding && matchRoom
    })
  }, [building, roomQuery])

  const getAvailableRooms = (unavailableRoomIds: Set<string>) => {
    return filteredRooms.filter(r => !unavailableRoomIds.has(r.id))
  }

  return {
    building,
    setBuilding,
    roomQuery,
    setRoomQuery,
    date,
    setDate,
    start,
    setStart,
    end,
    setEnd,
    requestedStart,
    requestedEnd,
    filteredRooms,
    getAvailableRooms,
  }
}