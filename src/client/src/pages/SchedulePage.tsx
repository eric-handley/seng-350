import React, { useState } from 'react'
import { FilterPanel } from '../components/FilterPanel'
import { useSchedule } from '../hooks/useSchedule'
import { toApiTime } from '../utils/time'

/**
 * SchedulePage
 *
 * Responsibilities:
 * - Fetch booked slots for a selected date (all day) and building
 * - Provide a lightweight room query filter (by room number or building short name)
 * - Render loading/error/empty states
 * - Display an accessible table of booked time slots
 */
interface SchedulePageProps {
  // Current date being viewed (YYYY-MM-DD)
  date: string
  // Setter for date (drives data refresh via useSchedule)
  setDate: (date: string) => void
  // Building short name (e.g., "ECS")
  building: string
  // Setter for building (drives data refresh via useSchedule)
  setBuilding: (building: string) => void
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  date,
  setDate,
  building,
  setBuilding,
}) => {
  // Local query to filter rows by room/building
  const [roomQuery, setRoomQuery] = useState('')

  // Fetch booked slots for the selected building and date.
  // We request the full day [00:00, 23:59] and only "booked" slots.
  const { rooms, loading, error } = useSchedule({
    building_short_name: building || undefined,
    date: date || undefined,
    start_time: toApiTime('00:00'),
    end_time: toApiTime('23:59'),
    slot_type: 'booked',
  })

  /**
   * Derive a flat list of booked slots from the rooms response:
   * - Each "room" contains an array of "slots"
   * - We flatten to one row per slot with room/building metadata
   * - Then we apply the text query filter against:
   *   - room number (e.g., "101")
   *   - building short name (e.g., "ECS")
   *   - concatenation (e.g., "ECS101") for quick matching
   */
  const bookedSlots = rooms
    .flatMap(room =>
      room.slots.map(slot => ({
        room_id: room.room_id,
        room_number: room.room_number,
        building_short_name: room.building_short_name,
        building_name: room.building_name,
        capacity: room.capacity,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }))
    )
    .filter(slot => {
      if (!roomQuery) { return true }
      const query = roomQuery.toLowerCase()
      const roomNum = slot.room_number.toLowerCase()
      const shortName = slot.building_short_name.toLowerCase()
      const fullRoom = `${shortName}${roomNum}` // e.g., "ECS101"
      return (
        roomNum.includes(query) ||
        shortName.includes(query) ||
        fullRoom.includes(query)
      )
    })

  return (
    <section className="panel" aria-labelledby="schedule-label">
      {/* Page heading reflects the selected date */}
      <h2 id="schedule-label" style={{marginTop:0}}>Schedule for {date}</h2>

      {/* Filters:
         - Building selector drives useSchedule
         - Room query filters the derived rows client-side
         - Time filters are hidden; this page always shows full-day schedule */}
      <div style={{marginBottom:8}}>
        <FilterPanel
          building={building}
          setBuilding={setBuilding}
          roomQuery={roomQuery}
          setRoomQuery={setRoomQuery}
          date={date}
          setDate={setDate}
          start=""
          setStart={() => {}}
          end=""
          setEnd={() => {}}
          showTimeFilters={false}
          showRoomFilter={true}
        />
      </div>

      {/* Data states from useSchedule */}
      {loading && <div className="empty">Loading schedule…</div>}
      {error && <div className="empty">Error: {error}</div>}

      {/* Empty vs. table render.
         - Empty: no rows after filtering (and not loading/error)
         - Table: accessible table with time/room/building/capacity */}
      {!loading && !error && bookedSlots.length === 0 ? (
        <div className="empty">No bookings for this date.</div>
      ) : (
        !loading && !error && (
          <table className="table" aria-label="Schedule">
            <thead>
              <tr>
                <th>Time</th>
                <th>Room</th>
                <th>Building</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {bookedSlots.map((slot, idx) => {
                // Format times to "HH:MM" in the user's locale
                const start = new Date(slot.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                const end = new Date(slot.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                return (
                  <tr key={`${slot.room_id}-${idx}`}>
                    <td>{start}–{end}</td>
                    <td>{slot.building_short_name} {slot.room_number}</td>
                    <td>{slot.building_name}</td>
                    <td>{slot.capacity}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      )}
    </section>
  )
}