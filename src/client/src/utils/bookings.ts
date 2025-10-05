import type { Booking as ApiBooking } from '../api/bookings'
import type { UiBooking } from '../types'

// Build UTC ISO to match API ("...Z")
export function toIsoDateTimeUTC(dateYYYYMMDD: string, timeHms: string): string {
  const hms = timeHms.replace(/-/g, ':')
  return `${dateYYYYMMDD}T${hms}Z`
}

// ISO or "hh-mm-ss"/"hh:mm:ss" -> "hh:mm:ss"
export function isoOrHmsToHms(s: string): string {
  if (s.includes('T')) {
    const afterT = s.split('T')[1] || s
    const trimmed = afterT.replace('Z', '')
    return trimmed.slice(0, 8)
  }
  return s.replace(/-/g, ':').slice(0, 8)
}

// Parse "CLE-A308" -> { building: "CLE", roomNumber: "A308", roomName: "CLE A308" }
export function splitRoomId(roomId: string): { building: string; roomNumber: string; roomName: string } {
  const [building = '', roomNumber = ''] = (roomId || '').split('-')
  const roomName = [building, roomNumber].filter(Boolean).join(' ')
  return { building, roomNumber, roomName }
}

// Map backend booking -> UI booking (enriched for BookingCard)
export function mapApiBookingToUi(b: ApiBooking): UiBooking {
  const { building, roomNumber, roomName } = splitRoomId(b.room_id ?? '')
  const ui: Partial<UiBooking> = {
    id: b.id,
    roomId: b.room_id,
    start: isoOrHmsToHms(b.start_time),
    end: isoOrHmsToHms(b.end_time),
    user: b.user_id,
    cancelled:
      typeof b.status === 'string' && b.status.toLowerCase() !== 'active'
        ? true
        : undefined,
    name: roomName,
    building,
    roomNumber,
    room: { id: b.room_id, name: roomName },
    date: (b.start_time ?? '').split('T')[0],
  }
  return ui as UiBooking
}

// Replace temp booking with real booking after API response
export function reconcileTemp(prev: ApiBooking[], tempId: string, real?: ApiBooking): ApiBooking[] {
  return prev.map(b => (b.id === tempId && real ? real : b))
}

// Merge optimistic and server bookings (server takes precedence)
export function mergeBookings(optimistic: ApiBooking[], server: ApiBooking[]): ApiBooking[] {
  const byId = new Map<string, ApiBooking>()
  for (const b of optimistic) {
    byId.set(b.id, b)
  }
  for (const b of server) {
    byId.set(b.id, b)
  }
  return Array.from(byId.values())
}
