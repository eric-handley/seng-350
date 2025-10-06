import React from 'react'

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
  // Equal box size
  const MIN_FIELD_WIDTH = 140

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${MIN_FIELD_WIDTH}px, 1fr))`,
    gap: 10,
    alignItems: 'end',
    boxSizing: 'border-box',
    maxWidth: '100%',
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,             // So inputs can shrink
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 500,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0, 
    boxSizing: 'border-box',
  }

  const helperStyle: React.CSSProperties = {
    gridColumn: '1 / -1',
    marginTop: 2,
    fontSize: 12,
    opacity: 0.8,
  }

  return (
    <div style={rowStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>BUILDING</label>
        <input
          className="input"
          placeholder="e.g., CLE, Engineering, Clearihue"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          style={inputStyle}
        />
      </div>

      {showRoomFilter && (
        <div style={fieldStyle}>
          <label style={labelStyle}>ROOM</label>
          <input
            className="input"
            placeholder="e.g., CLE-A308, 130"
            value={roomQuery}
            onChange={(e) => setRoomQuery(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle}>DATE</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      {showTimeFilters && (
        <>
          <div style={fieldStyle}>
            <label style={labelStyle}>START</label>
            <input
              className="input"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>END</label>
            <input
              className="input"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={helperStyle} className="helper">
            Results update automatically. Use Building / Room / Time to narrow options.
          </div>
        </>
      )}
    </div>
  )
}
