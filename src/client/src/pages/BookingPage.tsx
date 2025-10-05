import React from 'react';
import { Room } from '../types';
import { RoomCard } from '../components/RoomCard';
import { FilterPanel } from '../components/FilterPanel';
import { useSchedule } from '../hooks/useSchedule';

interface BookingPageProps {
  building: string;
  setBuilding: (building: string) => void;
  roomQuery: string;  // interpreted as room_id here
  setRoomQuery: (query: string) => void;
  date: string;       // YYYY-MM-DD
  setDate: (date: string) => void;
  start: string;      // HH:MM:SS
  setStart: (start: string) => void;
  end: string;        // HH:MM:SS
  setEnd: (end: string) => void;
  availableRooms: Room[]; // no longer used; safe to remove later
  onBook: (room: Room) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  building, setBuilding,
  roomQuery, setRoomQuery,
  date, setDate,
  start, setStart,
  end, setEnd,
  availableRooms, // eslint-disable-line @typescript-eslint/no-unused-vars
  onBook,
}) => {
  const { rooms, loading, error } = useSchedule({
    building_short_name: building || undefined,
    room_id: roomQuery || undefined,
    date: date || undefined,
    start_time: start || undefined,
    end_time: end || undefined,
    slot_type: 'available',
  });

  return (
    <section className="panel" aria-labelledby="book-label">
      <h2 id="book-label" style={{ marginTop: 0 }}>Find an available room</h2>

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

      {loading && <div className="empty">Loading available rooms…</div>}
      {error && <div className="empty">Error: {error}</div>}

      {!loading && !error && rooms.length === 0 ? (
        <div className="empty">No rooms available for the selected time. Try adjusting filters.</div>
      ) : (
        <div className="grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={{
                // adapt to your existing Room type if needed:
                id: room.id,
                name: `${room.building_short_name} ${room.room_number}`,
                number: room.room_number,
                capacity: room.capacity,
                type: room.room_type,
                building: room.building_short_name,
                slots: room.slots, // show these inside RoomCard
              } as unknown as Room}
              date={date}
              start={start}
              end={end}
              onBook={onBook}
            />
          ))}
        </div>
      )}
    </section>
  );
};


// import React from 'react'
// import { Room } from '../types'
// import { RoomCard } from '../components/RoomCard'
// import { FilterPanel } from '../components/FilterPanel'

// interface BookingPageProps {
//   building: string
//   setBuilding: (building: string) => void
//   roomQuery: string
//   setRoomQuery: (query: string) => void
//   date: string
//   setDate: (date: string) => void
//   start: string
//   setStart: (start: string) => void
//   end: string
//   setEnd: (end: string) => void
//   availableRooms: Room[]
//   onBook: (room: Room) => void
// }

// export const BookingPage: React.FC<BookingPageProps> = ({
//   building,
//   setBuilding,
//   roomQuery,
//   setRoomQuery,
//   date,
//   setDate,
//   start,
//   setStart,
//   end,
//   setEnd,
//   availableRooms,
//   onBook,
// }) => {
//   return (
//     <section className="panel" aria-labelledby="book-label">
//       <h2 id="book-label" style={{marginTop:0}}>Find an available room</h2>
      
//       <FilterPanel
//         building={building}
//         setBuilding={setBuilding}
//         roomQuery={roomQuery}
//         setRoomQuery={setRoomQuery}
//         date={date}
//         setDate={setDate}
//         start={start}
//         setStart={setStart}
//         end={end}
//         setEnd={setEnd}
//       />

//       {availableRooms.length === 0 ? (
//         <div className="empty">No rooms available for the selected time. Try adjusting filters.</div>
//       ) : (
//         <div className="grid">
//           {availableRooms.map(room => (
//             <RoomCard
//               key={room.id}
//               room={room}
//               date={date}
//               start={start}
//               end={end}
//               onBook={onBook}
//             />
//           ))}
//         </div>
//       )}
//     </section>
//   )
// }