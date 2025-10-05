import React from 'react'
import { Booking, Room } from '../types'
import { ROOMS } from '../constants'

interface BookingCardProps {
  booking: Booking
  room?: Room
  onCancel: (id: string) => void
  onRebook?: (id: string) => void
  showUser?: boolean
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  room: providedRoom,
  onCancel,
  onRebook,
  showUser = false
}) => {
  const room = providedRoom ?? ROOMS.find(r => r.id === booking.roomId)
  const d = new Date(booking.start)
  const dEnd = new Date(booking.end)
  const dateStr = d.toLocaleDateString()
  const timeStr = `${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}–${dEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`

  if (!room) {
    return null
  }

  return (
    <article className="card">
      <div className="row">
        <h3>{room.name}</h3>
        <span className="kv">{room.building}</span>
      </div>
      <div className="meta">
        <span>{dateStr}</span>
        <span>{timeStr}</span>
        {showUser && <span>User: {booking.user}</span>}
        <span>ID: {booking.id}</span>
      </div>
      <div className="row" style={{marginTop:12}}>
        <span className="meta">{booking.cancelled ? 'Cancelled' : 'Active'}</span>
        {!booking.cancelled ? (
          <button className="btn danger" onClick={() => onCancel(booking.id)}>Cancel</button>
        ) : (
          <button
            className="btn ghost"
            onClick={() => onRebook && onRebook(booking.id)}
          >
            Rebook
          </button>
        )}
      </div>
    </article>
  )
}
