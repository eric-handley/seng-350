import React, { useState } from 'react';
import { Room } from '../types';
import { RoomCard } from '../components/RoomCard';
import { FilterPanel } from '../components/FilterPanel';
import { useSchedule } from '../hooks/useSchedule';
import { useRooms } from '../hooks/useRooms';
import { toApiTime } from '../utils/time';
import { useBookingHistory } from '../hooks/useBookingHistory';

/**
 * BookingPage
 *
 * Responsibilities:
 * - Fetch the list of rooms for a building
 * - Fetch booked slots for a given date/time range
 * - Combine both to determine which rooms are currently reserved
 * - Provide filtering (building, room query, date/time, showReserved toggle)
 * - Allow the user to create a booking for an available room
 */
interface BookingPageProps {
  // ID of the currently logged-in user; used when creating bookings
  currentUserId: string
  // Current building short name filter (e.g., "ECS")
  building: string
  // Setter for building filter (drives data hooks)
  setBuilding: (building: string) => void
  // Room text query (matched against room_id)
  roomQuery: string
  // Setter for room text query
  setRoomQuery: (query: string) => void
  // Selected date (YYYY-MM-DD)
  date: string
  // Setter for date
  setDate: (date: string) => void
  // Selected start time (HH:mm)
  start: string
  // Setter for start time
  setStart: (start: string) => void
  // Selected end time (HH:mm)
  end: string
  // Setter for end time
  setEnd: (end: string) => void
  // Optional callback invoked after a booking is created
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
  // Local UI toggle to include/exclude rooms that are already reserved
  const [showReserved, setShowReserved] = useState(true);

  // Fetch all rooms in the selected building (static inventory)
  const { rooms: allRooms, loading: loadingRooms, error: errorRooms } = useRooms({
    building_short_name: building || undefined,
  });

  // Fetch booked time slots for the selected date/time range (dynamic occupancy)
  const { rooms: bookedRooms, loading: loadingBooked, error: errorBooked } = useSchedule({
    building_short_name: building || undefined,
    date: date || undefined,
    start_time: toApiTime(start), // ensure API datetime format
    end_time: toApiTime(end),     // ensure API datetime format
    slot_type: 'booked',
  });

  // Hook to create a booking on behalf of the current user
  const { createBooking, error: bookingError } = useBookingHistory(currentUserId);

  // Aggregate loading/error states from both data sources
  const loading = loadingRooms || loadingBooked;
  const error = errorRooms ?? errorBooked;

  // Build a set of room IDs that have bookings overlapping with the requested time
  const bookedRoomIds = new Set(bookedRooms.map(r => r.room_id));

  // Determine if the user has provided a fully valid time window
  const apiStart = toApiTime(start);
  const apiEnd = toApiTime(end);
  const hasValidTime = date && apiStart && apiEnd;

  // Compute the list of rooms to show:
  // 1) Apply the text filter (roomQuery) against room_id
  // 2) Compute "isReserved" based on booked slots and whether time filters are valid
  // 3) Hide reserved rooms if the user toggled them off
  const rooms = allRooms
    .filter(room => !roomQuery || room.room_id.toLowerCase().includes(roomQuery.toLowerCase()))
    .map(room => ({
      ...room,
      id: room.room_id,
      // If time filters are incomplete, conservatively mark as reserved.
      // Otherwise, mark reserved if the room appears in bookedRoomIds.
      isReserved: !hasValidTime || bookedRoomIds.has(room.room_id),
    }))
    .filter(room => showReserved || !room.isReserved);

  // Attempt to create a booking; errors are surfaced by the hook as `bookingError`
  const handleBook = async (room: Room) => {
    try {
      await createBooking(room.id, date, start, end);
      onBookingCreated?.();
    } catch {
      // No-op: error is exposed via `bookingError` for display
    }
  };

  return (
    <section className="panel" aria-labelledby="book-label">
      {/* Page section title for screen readers and visual users */}
      <h2 id="book-label" style={{ marginTop: 0 }}>Find an available room</h2>

      {/* Filter controls: drive building/date/time/query and the reserved toggle */}
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

      {/* Data states: loading, combined error, and booking creation error */}
      {loading && <div className="empty">Loading available rooms…</div>}
      {error && <div className="empty">Error: {error}</div>}
      {bookingError && (
        <div
          className="empty error"
          style={{
            color: '#d32f2f',
            backgroundColor: '#ffebee',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        >
          Booking error: {bookingError}
        </div>
      )}

      {/* Empty state when filters produce no rooms (and we are not loading and have no error) */}
      {!loading && !error && rooms.length === 0 ? (
        <div className="empty">No rooms available for the selected time. Try adjusting filters.</div>
      ) : (
        // Grid of cards: each card represents a room and its booking action
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
              } as unknown as Room /* Cast to Room to satisfy RoomCard typing */}
              date={date}
              start={start}
              end={end}
              onBook={handleBook}
              // Used by RoomCard to indicate unavailability and disable booking action
              isReserved={room.isReserved}
            />
          ))}
        </div>
      )}
    </section>
  );
};