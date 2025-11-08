import React from 'react'
import { formatTimeForDisplay } from '../utils/time'

type Props = {
  // A booking-like object (supports multiple shapes from API/UI).
  // Consider replacing `any` with a discriminated union for stronger typing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking: any
  // Called when the user cancels an active booking (receives booking id as string)
  onCancel: (id: string) => void
  // Optional: called to rebook a cancelled booking (receives booking id as string)
  onRebook?: (id: string) => void
  // If true, renders user details block
  showUser?: boolean
}

export const BookingCard: React.FC<Props> = ({
  booking,
  onCancel,
  onRebook,
  showUser = false
}) => {
  // Resolve room id from several possible shapes (API vs UI-created objects)
  const roomId: string =
    booking.roomId ?? booking.room_id ?? booking.room?.id ?? ''

  // Prefer explicit room name fields; fall back to id, then generic label
  const roomName: string =
    booking.name ??
    booking.roomName ??
    booking.room?.name ??
    roomId ??
    'Room'

  // Derive date from explicit field, or parse ISO start_time when present
  const date: string =
    booking.date ??
    (typeof booking.start_time === 'string' && booking.start_time.includes('T')
      ? booking.start_time.split('T')[0]
      : '')

  // Raw time extraction: accept UI fields or trim ISO time-of-day (HH:MM:SS)
  const startRaw: string =
    booking.start ??
    (typeof booking.start_time === 'string' && booking.start_time.includes('T')
      ? booking.start_time.split('T')[1].slice(0, 8)
      : '')

  const endRaw: string =
    booking.end ??
    (typeof booking.end_time === 'string' && booking.end_time.includes('T')
      ? booking.end_time.split('T')[1].slice(0, 8)
      : '')

  // Normalize to HH:MM, then format for display (e.g., 24h → 12h if formatter does so)
  const start = formatTimeForDisplay(startRaw.slice(0, 5))
  const end = formatTimeForDisplay(endRaw.slice(0, 5))

  // A booking is considered cancelled if:
  // - `cancelled` is truthy, or
  // - `status` is present and not equal to "active" (case-insensitive)
  const cancelled: boolean =
    !!booking.cancelled ||
    (typeof booking.status === 'string' && booking.status.toLowerCase() !== 'active')

  // Optional user details: prefer flattened fields, fall back to nested `user`
  const userName: string | undefined =
    booking.user_name ??
    (booking.user?.first_name && booking.user?.last_name
      ? `${booking.user.first_name} ${booking.user.last_name}`
      : undefined) ??
    undefined

  const userEmail: string | undefined =
    booking.user_email ??
    booking.user?.email ??
    undefined

  const userRole: string | undefined =
    booking.user_role ??
    booking.user?.role ??
    undefined

  return (
    <article className="card">
      {/* Title and status badge */}
      <div className="card-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>{roomName}</span>
        {cancelled && <span className="badge danger">Cancelled</span>}
      </div>

      {/* Date/time row (omit date if absent) */}
      <div className="card-meta" style={{ marginTop: 6 }}>
        {date && <span>{date} · </span>}
        <span>{start} → {end}</span>
      </div>

      {/* Optional user block */}
      {showUser && (userName ?? userEmail ?? userRole) && (
        <div className="card-meta" style={{ marginTop: 8, fontSize: '0.9em', opacity: 0.9 }}>
          {userName && <div><strong>User:</strong> {userName}</div>}
          {userEmail && <div><strong>Email:</strong> {userEmail}</div>}
          {userRole && <div><strong>Role:</strong> {userRole}</div>}
        </div>
      )}

      {/* Actions:
          - Active bookings: show Cancel
          - Cancelled bookings (and if rebook handler provided): show Rebook */}
      {!cancelled && (
        <div style={{ marginTop: 10 }}>
          <button className="btn danger" onClick={() => onCancel(String(booking.id))}>
            Cancel
          </button>
        </div>
      )}

      {cancelled && onRebook && (
        <div style={{ marginTop: 10 }}>
          <button className="btn ghost" onClick={() => onRebook(String(booking.id))}>
            Rebook
          </button>
        </div>
      )}
    </article>
  )
}

export default BookingCard