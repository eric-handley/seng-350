import { Room, Booking } from '../types'

export const BUILDINGS = ['Engineering', 'Science', 'Business', 'Library'] as const

export const ROOMS: Room[] = [
  { id: 'r-101', name: 'E-101', building: 'Engineering', capacity: 8 },
  { id: 'r-102', name: 'E-201', building: 'Engineering', capacity: 12 },
  { id: 'r-201', name: 'S-140', building: 'Science', capacity: 6 },
  { id: 'r-202', name: 'S-240', building: 'Science', capacity: 10 },
  { id: 'r-301', name: 'B-12',  building: 'Business', capacity: 16 },
  { id: 'r-401', name: 'L-2A',  building: 'Library', capacity: 4 },
]

const seedToday = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  return d
}

const fmt = (d: Date) => d.toISOString()

const isoAt = (dateStr: string, timeStr: string) => {
  return new Date(`${dateStr}T${timeStr}:00`)
}

const initialDate = (() => {
  const d = seedToday()
  return d.toISOString().slice(0, 10)
})()

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    roomId: 'r-101',
    start: fmt(isoAt(initialDate, '09:00')),
    end: fmt(isoAt(initialDate, '10:30')),
    user: 'Alex',
  },
  {
    id: 'bk-2',
    roomId: 'r-202',
    start: fmt(isoAt(initialDate, '11:00')),
    end: fmt(isoAt(initialDate, '12:00')),
    user: 'You',
  },
  {
    id: 'bk-3',
    roomId: 'r-301',
    start: fmt(isoAt(initialDate, '14:00')),
    end: fmt(isoAt(initialDate, '15:00')),
    user: 'Taylor',
  },
]

export const INITIAL_DATE = initialDate
