import React, { useEffect, useState } from 'react'
import { formatTimeForDisplay, parseUserTimeInput } from '../utils/time'

export interface FilterPanelProps {
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
  showReserved?: boolean
  setShowReserved?: (show: boolean) => void
  showReservedFilter?: boolean
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
  showReserved = true,
  setShowReserved,
  showReservedFilter = false,
}) => {
  const [startDisplay, setStartDisplay] = useState(formatTimeForDisplay(start))
  const [endDisplay, setEndDisplay] = useState(formatTimeForDisplay(end))
  const [startFocused, setStartFocused] = useState(false)
  const [endFocused, setEndFocused] = useState(false)

  useEffect(() => {
    if (!startFocused) {
      setStartDisplay(formatTimeForDisplay(start))
    }
  }, [start, startFocused])

  useEffect(() => {
    if (!endFocused) {
      setEndDisplay(formatTimeForDisplay(end))
    }
  }, [end, endFocused])

  const handleTimeChange = (
    value: string,
    setDisplay: (next: string) => void,
  ) => {
    setDisplay(value)
  }

  const focusAndSelect = (
    event: React.FocusEvent<HTMLInputElement>,
    setFocused: (next: boolean) => void,
  ) => {
    setFocused(true)
    const input = event.currentTarget
    // Delay selection until after focus finishes so mouse interactions don't override it
    setTimeout(() => {
      input.select()
    }, 0)
  }

  const retainSelectionOnMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault()
  }

  const handleTimeBlur = (
    value: string,
    commit: (next: string) => void,
    fallback: string,
    setDisplay: (next: string) => void,
  ) => {
    const parsed = parseUserTimeInput(value)
    if (parsed) {
      if (parsed !== fallback) {
        commit(parsed)
      }
      setDisplay(formatTimeForDisplay(parsed))
    } else {
      setDisplay(formatTimeForDisplay(fallback))
    }
  }

  const handleTimeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

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
    minWidth: 0, // So inputs can shrink
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 500,
    fontSize: 12,
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
              type="text"
              inputMode="numeric"
              placeholder="e.g., 7:30 AM"
              value={startDisplay}
              onFocus={(event) => focusAndSelect(event, setStartFocused)}
              onMouseUp={retainSelectionOnMouseUp}
              onChange={(e) => handleTimeChange(e.target.value, setStartDisplay)}
              onKeyDown={handleTimeKeyDown}
              onBlur={(e) => {
                setStartFocused(false)
                handleTimeBlur(e.target.value, setStart, start, setStartDisplay)
              }}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>END</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="e.g., 9:45 AM"
              value={endDisplay}
              onFocus={(event) => focusAndSelect(event, setEndFocused)}
              onMouseUp={retainSelectionOnMouseUp}
              onChange={(e) => handleTimeChange(e.target.value, setEndDisplay)}
              onKeyDown={handleTimeKeyDown}
              onBlur={(e) => {
                setEndFocused(false)
                handleTimeBlur(e.target.value, setEnd, end, setEndDisplay)
              }}
              style={inputStyle}
            />
          </div>

          {showReservedFilter && setShowReserved && (
            <div style={{display: 'flex', flexDirection: 'column', gap: 6, width: 'fit-content'}}>
              <label style={labelStyle}>SHOW RESERVED</label>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 38}}>
                <input
                  type="checkbox"
                  checked={showReserved}
                  onChange={(e) => setShowReserved(e.target.checked)}
                  style={{cursor: 'pointer', width: 16, height: 16}}
                />
              </div>
            </div>
          )}

          <div style={helperStyle} className="helper">
            Results update automatically. Use Building / Room / Time to narrow options.
          </div>
        </>
      )}
    </div>
  )
}
