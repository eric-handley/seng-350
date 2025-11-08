import React, { useState } from 'react'
import { parseISO, format } from 'date-fns'
import { FilterPanel } from '../components/FilterPanel'
import { useSchedule } from '../hooks/useSchedule'
import { toApiTime } from '../utils/time'

interface SchedulePageProps {
  date: string
  setDate: (date: string) => void
  building: string
  setBuilding: (building: string) => void
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  date,
  setDate,
  building,
  setBuilding,
}) => {
  const [roomQuery, setRoomQuery] = useState('')
  const { rooms, loading, error } = useSchedule({
    building_short_name: building || undefined,
    date: date || undefined,
    start_time: toApiTime('00:00'),
    end_time: toApiTime('23:59'),
    slot_type: 'booked',
  })

  // Flatten rooms with their booked slots and filter by room query
  const bookedSlots = rooms.flatMap(room =>
    room.slots.map(slot => ({
      room_id: room.room_id,
      room_number: room.room_number,
      building_short_name: room.building_short_name,
      building_name: room.building_name,
      capacity: room.capacity,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }))
  ).filter(slot => {
    if (!roomQuery) {return true}
    const query = roomQuery.toLowerCase()
    const roomNum = slot.room_number.toLowerCase()
    const shortName = slot.building_short_name.toLowerCase()
    const fullRoom = `${shortName}${roomNum}`
    return roomNum.includes(query) || shortName.includes(query) || fullRoom.includes(query)
  })

  return (
    <section className="panel" aria-labelledby="schedule-label">
      <h2 id="schedule-label" style={{marginTop:0}}>Schedule for {date}</h2>

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

      {loading && <div className="empty">Loading schedule…</div>}
      {error && <div className="empty">Error: {error}</div>}

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
                const start = format(parseISO(slot.start_time), 'HH:mm')
                const end = format(parseISO(slot.end_time), 'HH:mm')
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