import React from 'react'
import { Room } from '../types'

interface RoomCardProps {
  room: Room
  date: string
  start: string
  end: string
  onBook: (room: Room) => void
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, date, start, end, onBook }) => {
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
          <span>{start}–{end}</span>
        </div>
        <button className="btn primary" onClick={() => onBook(room)}>Book</button>
      </div>
    </article>
  )
}