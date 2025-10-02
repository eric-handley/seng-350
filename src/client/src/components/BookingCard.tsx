import React from "react"

type Room = {
  id: string
  name: string
  building: string
  capacity: number
}

type Booking = {
  id: string
  roomId: string
  start: string
  end: string
  user: string
  cancelled?: boolean
}

type BookingCardProps = {
  booking: Booking
  room: Room
  onCancel: (id: string) => void
  showUser?: boolean
}

export default function BookingCard({ booking, room, onCancel, showUser = false }: BookingCardProps) {
  const d = new Date(booking.start)
  const dEnd = new Date(booking.end)
  const dateStr = d.toLocaleDateString()
  const timeStr = `${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}–${dEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`

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
          <button className="btn ghost" onClick={() => alert('This is a demo. In a real app you might restore or rebook.')}>Rebook</button>
        )}
      </div>
    </article>
  )
}
