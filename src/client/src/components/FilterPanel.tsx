import React from 'react'
import { BUILDINGS } from '../constants'

interface FilterPanelProps {
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
  showTimeFilters?: boolean
  showRoomFilter?: boolean
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
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
  showTimeFilters = true,
  showRoomFilter = true,
}) => {
  return (
    <div className="filters">
      <div className="col-span-2">
        <label>Building{!showTimeFilters ? ' (optional)' : ''}</label>
        <input
          className="input"
          placeholder="e.g., CLE, ECS, BWC"
          value={building}
          onChange={e => setBuilding(e.target.value)}
        />
      </div>
      {showRoomFilter && (
        <div className="col-span-2">
          <label>Room</label>
          <input 
            className="input" 
            placeholder="e.g., BWC-B150" 
            value={roomQuery} 
            onChange={e => setRoomQuery(e.target.value)} 
          />
        </div>
      )}
      <div>
        <label>Date</label>
        <input 
          className="input" 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
        />
      </div>
      {showTimeFilters && (
        <>
          <div>
            <label>Start</label>
            <input 
              className="input" 
              type="time" 
              value={start} 
              onChange={e => setStart(e.target.value)} 
            />
          </div>
          <div>
            <label>End</label>
            <input 
              className="input" 
              type="time" 
              value={end} 
              onChange={e => setEnd(e.target.value)} 
            />
          </div>
          <div className="col-span-3 helper">
            Results update automatically. Use Building / Room / Time to narrow options.
          </div>
        </>
      )}
    </div>
  )
}