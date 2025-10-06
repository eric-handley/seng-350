import React, { useState } from 'react';
import { Room } from '../types';
import { RoomCard } from '../components/RoomCard';
import { FilterPanel } from '../components/FilterPanel';
import { useSchedule } from '../hooks/useSchedule';
import { useRooms } from '../hooks/useRooms';
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
  const [showReserved, setShowReserved] = useState(true);

  // Fetch all rooms in the building
  const { rooms: allRooms, loading: loadingRooms, error: errorRooms } = useRooms({
    building_short_name: building || undefined,
  });

  // Fetch booked slots for the requested time range
  const { rooms: bookedRooms, loading: loadingBooked, error: errorBooked } = useSchedule({
    building_short_name: building || undefined,
    date: date || undefined,
    start_time: toApiTime(start),
    end_time: toApiTime(end),
    slot_type: 'booked',
  });

  const { createBooking, error: bookingError } = useBookingHistory(currentUserId);

  const loading = loadingRooms || loadingBooked;
  const error = errorRooms ?? errorBooked;

  // Build a set of room IDs that have bookings overlapping with the requested time
  const bookedRoomIds = new Set(bookedRooms.map(r => r.room_id));

  const apiStart = toApiTime(start);
  const apiEnd = toApiTime(end);
  const hasValidTime = date && apiStart && apiEnd;

  const rooms = allRooms
    .filter(room => !roomQuery || room.room_id.toLowerCase().includes(roomQuery.toLowerCase()))
    .map(room => ({
      ...room,
      id: room.room_id,
      isReserved: !hasValidTime || bookedRoomIds.has(room.room_id),
    }))
    .filter(room => showReserved || !room.isReserved);

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
        showReserved={showReserved}
        setShowReserved={setShowReserved}
        showReservedFilter={true}
      />

      {loading && <div className="empty">Loading available rooms…</div>}
      {error && <div className="empty">Error: {error}</div>}
      {bookingError && <div className="empty error" style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>Booking error: {bookingError}</div>}

      {!loading && !error && rooms.length === 0 ? (
        <div className="empty">No rooms available for the selected time. Try adjusting filters.</div>
      ) : (
        <div className="grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={{
                id: room.id,
                name: `${room.building_short_name} ${room.room_number}`,
                number: room.room_number,
                capacity: room.capacity,
                type: room.room_type,
                building: room.building_short_name,
              } as unknown as Room}
              date={date}
              start={start}
              end={end}
              onBook={handleBook}
              isReserved={room.isReserved}
            />
          ))}
        </div>
      )}
    </section>
  );
};
