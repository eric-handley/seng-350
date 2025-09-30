import React from 'react'
import { Booking } from '../types'
import { ROOMS } from '../constants'
import { FilterPanel } from '../components/FilterPanel'

interface SchedulePageProps {
  date: string
  setDate: (date: string) => void
  building: string
  setBuilding: (building: string) => void
  scheduleForDay: Booking[]
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  date,
  setDate,
  building,
  setBuilding,
  scheduleForDay,
}) => {
  const filteredSchedule = scheduleForDay.filter(b => {
    if (!building) {return true}
    const room = ROOMS.find(r => r.id === b.roomId)
    return room?.building === building
  })

  return (
    <section className="panel" aria-labelledby="schedule-label">
      <h2 id="schedule-label" style={{marginTop:0}}>Schedule for {date}</h2>
      
      <div style={{marginBottom:8}}>
        <FilterPanel
          building={building}
          setBuilding={setBuilding}
          roomQuery=""
          setRoomQuery={() => {}}
          date={date}
          setDate={setDate}
          start=""
          setStart={() => {}}
          end=""
          setEnd={() => {}}
          showTimeFilters={false}
          showRoomFilter={false}
        />
      </div>

      {filteredSchedule.length === 0 ? (
        <div className="empty">No bookings for this date.</div>
      ) : (
        <table className="table" aria-label="Schedule">
          <thead>
            <tr>
              <th>Time</th>
              <th>Room</th>
              <th>Building</th>
              <th>Booked By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedule.map(b => {
              const room = ROOMS.find(r => r.id === b.roomId)!
              const start = new Date(b.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
              const end = new Date(b.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
              return (
                <tr key={b.id}>
                  <td>{start}–{end}</td>
                  <td>{room.name}</td>
                  <td>{room.building}</td>
                  <td>{b.user}</td>
                  <td>{b.cancelled ? 'Cancelled' : 'Active'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}