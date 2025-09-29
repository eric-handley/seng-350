// App.tsx
import React, { useMemo, useState } from 'react'

type Room = {
  id: string
  name: string
  building: string
  capacity: number
}

type Booking = {
  id: string
  roomId: string
  start: string // ISO
  end: string   // ISO
  user: string
  cancelled?: boolean
}

const BUILDINGS = ['Engineering', 'Science', 'Business', 'Library'] as const

const ROOMS: Room[] = [
  { id: 'r-101', name: 'E-101', building: 'Engineering', capacity: 8 },
  { id: 'r-102', name: 'E-201', building: 'Engineering', capacity: 12 },
  { id: 'r-201', name: 'S-140', building: 'Science', capacity: 6 },
  { id: 'r-202', name: 'S-240', building: 'Science', capacity: 10 },
  { id: 'r-301', name: 'B-12',  building: 'Business', capacity: 16 },
  { id: 'r-401', name: 'L-2A',  building: 'Library', capacity: 4 },
]

const seedToday = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  return d
}
const fmt = (d: Date) => d.toISOString()
const isoAt = (dateStr: string, timeStr: string) => {
  // dateStr: "2025-09-27", timeStr: "13:00"
  return new Date(`${dateStr}T${timeStr}:00`)
}
const overlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd

const initialDate = (() => {
  const d = seedToday()
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
})()

const initialBookings: Booking[] = [
  {
    id: 'bk-1',
    roomId: 'r-101',
    start: fmt(isoAt(initialDate, '09:00')),
    end: fmt(isoAt(initialDate, '10:30')),
    user: 'Alex',
  },
  {
    id: 'bk-2',
    roomId: 'r-202',
    start: fmt(isoAt(initialDate, '11:00')),
    end: fmt(isoAt(initialDate, '12:00')),
    user: 'You',
  },
  {
    id: 'bk-3',
    roomId: 'r-301',
    start: fmt(isoAt(initialDate, '14:00')),
    end: fmt(isoAt(initialDate, '15:00')),
    user: 'Taylor',
  },
]

type TabKey = 'schedule' | 'book' | 'history'

export default function App() {
  const [tab, setTab] = useState<TabKey>('book')

  // Filters
  const [building, setBuilding] = useState<string>('')
  const [roomQuery, setRoomQuery] = useState<string>('') // partial name/id
  const [date, setDate] = useState<string>(initialDate)
  const [start, setStart] = useState<string>('10:00')
  const [end, setEnd] = useState<string>('11:00')

  // “Database” in component state
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)

  const requestedStart = useMemo(() => isoAt(date, start), [date, start])
  const requestedEnd = useMemo(() => isoAt(date, end), [date, end])

  const filteredRooms = useMemo(() => {
    const q = roomQuery.trim().toLowerCase()
    return ROOMS.filter(r => {
      const matchBuilding = !building || r.building === building
      const matchRoom =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      return matchBuilding && matchRoom
    })
  }, [building, roomQuery])

  const unavailableRoomIds = useMemo(() => {
    const ids = new Set<string>()
    for (const b of bookings) {
      if (b.cancelled) continue
      const bStart = new Date(b.start)
      const bEnd = new Date(b.end)
      if (overlap(requestedStart, requestedEnd, bStart, bEnd)) {
        ids.add(b.roomId)
      }
    }
    return ids
  }, [bookings, requestedStart, requestedEnd])

  const availableRooms = useMemo(
    () => filteredRooms.filter(r => !unavailableRoomIds.has(r.id)),
    [filteredRooms, unavailableRoomIds]
  )

  const userHistory = useMemo(
    () => bookings.filter(b => b.user === 'You').sort((a,b)=>+new Date(b.start)-+new Date(a.start)),
    [bookings]
  )

  const scheduleForDay = useMemo(() => {
    const dayStart = isoAt(date, '00:00')
    const dayEnd = isoAt(date, '23:59')
    return bookings
      .filter(b => {
        if (b.cancelled) return false
        const s = new Date(b.start)
        const e = new Date(b.end)
        // same day
        return s >= dayStart && e <= dayEnd
      })
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))
  }, [bookings, date])

  const handleBook = (room: Room) => {
    if (requestedEnd <= requestedStart) {
      alert('End time must be after start time.')
      return
    }
    const id = `bk-${Math.random().toString(36).slice(2, 8)}`
    setBookings(prev => [
      ...prev,
      {
        id,
        roomId: room.id,
        start: fmt(requestedStart),
        end: fmt(requestedEnd),
        user: 'You',
      },
    ])
    setTab('history')
  }

  const handleCancel = (id: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === id ? { ...b, cancelled: true } : b))
    )
  }

  return (
    <div className="app-shell">
      <div className="header">
        <span className="badge">STAFF</span>
        <h1 className="title">Rooms & Scheduling</h1>
      </div>

      <div className="tabs" role="tablist" aria-label="Sections">
        <button className="tab" role="tab" aria-selected={tab==='schedule'} onClick={()=>setTab('schedule')}>Schedule</button>
        <button className="tab" role="tab" aria-selected={tab==='book'} onClick={()=>setTab('book')}>Book Rooms</button>
        <button className="tab" role="tab" aria-selected={tab==='history'} onClick={()=>setTab('history')}>My Bookings & History</button>
      </div>

      {tab === 'book' && (
        <section className="panel" aria-labelledby="book-label">
          <h2 id="book-label" style={{marginTop:0}}>Find an available room</h2>
          <div className="filters">
            <div className="col-span-2">
              <label>Building</label>
              <select className="select" value={building} onChange={e=>setBuilding(e.target.value)}>
                <option value="">Any</option>
                {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label>Room</label>
              <input className="input" placeholder="e.g., E-201" value={roomQuery} onChange={e=>setRoomQuery(e.target.value)} />
            </div>
            <div>
              <label>Date</label>
              <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div>
              <label>Start</label>
              <input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} />
            </div>
            <div>
              <label>End</label>
              <input className="input" type="time" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
            <div className="col-span-3 helper">
              Results update automatically. Use Building / Room / Time to narrow options.
            </div>
          </div>

          {availableRooms.length === 0 ? (
            <div className="empty">No rooms available for the selected time. Try adjusting filters.</div>
          ) : (
            <div className="grid">
              {availableRooms.map(r => (
                <article key={r.id} className="card">
                  <div className="row">
                    <h3>{r.name}</h3>
                    <span className="kv">{r.capacity} ppl</span>
                  </div>
                  <div className="meta">
                    <span>Building: <strong>{r.building}</strong></span>
                    <span>ID: {r.id}</span>
                  </div>
                  <div className="row" style={{marginTop:12}}>
                    <div className="meta">
                      <span>{date}</span>
                      <span>{start}–{end}</span>
                    </div>
                    <button className="btn primary" onClick={()=>handleBook(r)}>Book</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'schedule' && (
        <section className="panel" aria-labelledby="schedule-label">
          <h2 id="schedule-label" style={{marginTop:0}}>Schedule for {date}</h2>
          <div className="filters" style={{marginBottom:8}}>
            <div className="col-span-2">
              <label>Date</label>
              <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label>Building (optional)</label>
              <select className="select" value={building} onChange={e=>setBuilding(e.target.value)}>
                <option value="">Any</option>
                {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {scheduleForDay.length === 0 ? (
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
                {scheduleForDay
                  .filter(b => {
                    if (!building) return true
                    const room = ROOMS.find(r => r.id === b.roomId)
                    return room?.building === building
                  })
                  .map(b => {
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
      )}

      {tab === 'history' && (
        <section className="panel" aria-labelledby="history-label">
          <h2 id="history-label" style={{marginTop:0}}>My Bookings & History</h2>
          {userHistory.length === 0 ? (
            <div className="empty">You have no bookings yet.</div>
          ) : (
            <div className="grid">
              {userHistory.map(b => {
                const room = ROOMS.find(r => r.id === b.roomId)!
                const d = new Date(b.start)
                const dEnd = new Date(b.end)
                const dateStr = d.toLocaleDateString()
                const timeStr = `${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}–${dEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                return (
                  <article key={b.id} className="card">
                    <div className="row">
                      <h3>{room.name}</h3>
                      <span className="kv">{room.building}</span>
                    </div>
                    <div className="meta">
                      <span>{dateStr}</span>
                      <span>{timeStr}</span>
                      <span>ID: {b.id}</span>
                    </div>
                    <div className="row" style={{marginTop:12}}>
                      <span className="meta">{b.cancelled ? 'Cancelled' : 'Active'}</span>
                      {!b.cancelled ? (
                        <button className="btn danger" onClick={()=>handleCancel(b.id)}>Cancel</button>
                      ) : (
                        <button className="btn ghost" onClick={()=>alert('This is a demo. In a real app you might restore or rebook.')}>Rebook</button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
