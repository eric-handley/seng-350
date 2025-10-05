import React from 'react';
import { Room } from '../types';
import { RoomCard } from '../components/RoomCard';
import { FilterPanel } from '../components/FilterPanel';
import { useSchedule } from '../hooks/useSchedule';
import { toApiTime } from '../utils/time';
import { useBookingHistory } from '../hooks/useBookingHistory';

interface BookingPageProps {
  currentUserId: string
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
  onBookingCreated?: () => void
}

export const BookingPage: React.FC<BookingPageProps> = ({
  currentUserId,
  building, setBuilding,
  roomQuery, setRoomQuery,
  date, setDate,
  start, setStart,
  end, setEnd,
  onBookingCreated,
}) => {
  const { rooms, loading, error } = useSchedule({
    building_short_name: building || undefined,
    room_id: roomQuery || undefined,
    date: date || undefined,
    start_time: toApiTime(start),
    end_time: toApiTime(end),
    slot_type: 'available',
  });

  const { createBooking } = useBookingHistory(currentUserId);

  const handleBook = async (room: Room) => {
    try {
      await createBooking(room.id, date, start, end);
      onBookingCreated?.();
    } catch {
      // Error already handled by hook
    }
  };

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
              onBook={handleBook}
            />
          ))}
        </div>
      )}
    </section>
  );
};