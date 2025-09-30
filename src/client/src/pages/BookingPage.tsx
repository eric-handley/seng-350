import React from 'react'
import { Room } from '../types'
import { RoomCard } from '../components/RoomCard'
import { FilterPanel } from '../components/FilterPanel'

interface BookingPageProps {
  building: string
  setBuilding: (building: string) => void
  roomQuery: string
  setRoomQuery: (query: string) => void
  date: string
  setDate: (date: string) => void
  start: string
  setStart: (start: string) => void
  end: string
  setEnd: (end: string) => void
  availableRooms: Room[]
  onBook: (room: Room) => void
}

export const BookingPage: React.FC<BookingPageProps> = ({
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
  availableRooms,
  onBook,
}) => {
  return (
    <section className="panel" aria-labelledby="book-label">
      <h2 id="book-label" style={{marginTop:0}}>Find an available room</h2>
      
      <FilterPanel
        building={building}
        setBuilding={setBuilding}
        roomQuery={roomQuery}
        setRoomQuery={setRoomQuery}
        date={date}
        setDate={setDate}
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
      />

      {availableRooms.length === 0 ? (
        <div className="empty">No rooms available for the selected time. Try adjusting filters.</div>
      ) : (
        <div className="grid">
          {availableRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              date={date}
              start={start}
              end={end}
              onBook={onBook}
            />
          ))}
        </div>
      )}
    </section>
  )
}