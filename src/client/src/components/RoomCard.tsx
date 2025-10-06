import React from 'react'
import { Room } from '../types'
import { formatTimeForDisplay } from '../utils/time'

interface RoomCardProps {
  room: Room
  date: string
  start: string
  end: string
  onBook: (room: Room) => void
  isReserved?: boolean
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, date, start, end, onBook, isReserved = false }) => {
  return (
    <article className="card">
      <div className="row">
        <h3>{room.name}</h3>
        <span className="kv">{room.capacity} ppl</span>
      </div>
      <div className="meta">
        <span>Building: <strong>{room.building}</strong></span>
        <span>ID: {room.id}</span>
      </div>
      <div className="row" style={{marginTop:12}}>
        <div className="meta">
          <span>{date}</span>
          <span>{formatTimeForDisplay(start)}–{formatTimeForDisplay(end)}</span>
        </div>
        <button
          className="btn primary"
          onClick={() => onBook(room)}
          disabled={isReserved}
          style={isReserved ? { opacity: 0.5, cursor: 'not-allowed', background: 'grey' } : {}}
        >
          {isReserved ? 'Reserved' : 'Book'}
        </button>
      </div>
    </article>
  )
}
