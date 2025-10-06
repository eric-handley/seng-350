import React from 'react'

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking: any
  onCancel: (id: string) => void
  onRebook?: (id: string) => void
  showUser?: boolean
}

export const BookingCard: React.FC<Props> = ({
  booking,
  onCancel,
  onRebook,
  showUser = false
}) => {
  // Tolerant field mapping (no hard assumptions such that we avoid having nothing render)
  const roomId: string =
    booking.roomId ?? booking.room_id ?? booking.room?.id ?? ''

  const roomName: string =
    booking.name ??
    booking.roomName ??
    booking.room?.name ??
    roomId ??
    'Room'

  // date, start, end (accept UI fields or ISO fields)
  const date: string =
    booking.date ??
    (typeof booking.start_time === 'string' && booking.start_time.includes('T')
      ? booking.start_time.split('T')[0]
      : '')

  const start: string =
    booking.start ??
    (typeof booking.start_time === 'string' && booking.start_time.includes('T')
      ? booking.start_time.split('T')[1].slice(0, 8)
      : '')

  const end: string =
    booking.end ??
    (typeof booking.end_time === 'string' && booking.end_time.includes('T')
      ? booking.end_time.split('T')[1].slice(0, 8)
      : '')

  const cancelled: boolean =
    !!booking.cancelled ||
    (typeof booking.status === 'string' && booking.status.toLowerCase() === 'cancelled')

  const userLabel: string | undefined =
    (typeof booking.user === 'string' && booking.user) ??
    (typeof booking.user_id === 'string' && booking.user_id) ??
    undefined

  return (
    <article className="card">
      <div className="card-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>{roomName}</span>
        {cancelled && <span className="badge danger">Cancelled</span>}
      </div>

      <div className="card-meta" style={{ marginTop: 6 }}>
        {date && <span>{date} · </span>}
        <span>{start} → {end}</span>
        {showUser && userLabel && <span style={{ marginLeft: 8 }}>· User: {userLabel}</span>}
      </div>

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
