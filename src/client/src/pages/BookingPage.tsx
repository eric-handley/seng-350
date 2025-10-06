import React from 'react';
import { Room } from '../types';
import { RoomCard } from '../components/RoomCard';
import { FilterPanel } from '../components/FilterPanel';
import { useSchedule } from '../hooks/useSchedule';
import { toApiTime } from '../utils/time';
import { toIsoDateTimeUTC } from '../utils/bookings';
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
  const { rooms: allRooms, loading, error } = useSchedule({
    building_short_name: building || undefined,
    room_id: roomQuery || undefined,
    date: date || undefined,
    start_time: toApiTime(start),
    end_time: toApiTime(end),
    slot_type: 'available',
  });

  const { createBooking, error: bookingError } = useBookingHistory(currentUserId);

  // Filter to only show rooms where an available slot fully contains the requested time
  const rooms = allRooms.filter(room => {
    if (!room.slots || room.slots.length === 0) {
      return false;
    }

    const apiStart = toApiTime(start);
    const apiEnd = toApiTime(end);

    // Bail out early if we couldn't parse the requested time range
    if (!date || !apiStart || !apiEnd) {
      return false;
    }

    const selectedStart = new Date(toIsoDateTimeUTC(date, apiStart));
    const selectedEnd = new Date(toIsoDateTimeUTC(date, apiEnd));

    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime())) {
      return false;
    }

    // Check if there's an available slot that fully contains the requested time
    return room.slots.some(slot => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);

      // Slot must start at or before requested start AND end at or after requested end
      return slotStart <= selectedStart && slotEnd >= selectedEnd;
    });
  });

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
      {bookingError && <div className="empty error" style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>Booking error: {bookingError}</div>}

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
