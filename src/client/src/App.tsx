// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './styles/app.css'
import './styles/admin.css'

import { TabKey, Room } from './types'
import type { Booking as UiBooking } from './types'

import { useBookings } from './hooks/useBookings'
import { useUsers } from './hooks/useUsers'
import { useRoomFiltering } from './hooks/useRoomFiltering'
import { useAuth, AuthProvider } from './contexts/AuthContext'

import { TabNavigation } from './components/TabNavigation'
import { BookingPage } from './pages/BookingPage'
import { SchedulePage } from './pages/SchedulePage'
import { HistoryPage } from './pages/HistoryPage'
import { UsersPage } from './pages/UsersPage'
import LoginPage from './pages/LoginPage'
import AdminConsole from './components/AdminConsole'
// import { ProtectedRoute } from './components/ProtectedRoute'

import { createBooking, fetchUserBookings } from './api/bookings'
import type { Booking as ApiBooking } from './api/bookings'
import { cancelBooking as cancelBookingApi } from './api/bookings'
import { toApiTime } from './utils/time'

// ---------- helpers ----------

// Build UTC ISO to match your API ("...Z")
function toIsoDateTimeUTC(dateYYYYMMDD: string, timeHms: string) {
  const hms = timeHms.replace(/-/g, ':')
  return `${dateYYYYMMDD}T${hms}Z`
}

// ISO or "hh-mm-ss"/"hh:mm:ss" -> "hh:mm:ss"
function isoOrHmsToHms(s: string) {
  if (s.includes('T')) {
    const afterT = s.split('T')[1] || s
    const trimmed = afterT.replace('Z', '')
    return trimmed.slice(0, 8)
  }
  return s.replace(/-/g, ':').slice(0, 8)
}

// Parse "CLE-A308" -> { building: "CLE", roomNumber: "A308", roomName: "CLE A308" }
function splitRoomId(roomId: string) {
  const [building = '', roomNumber = ''] = (roomId || '').split('-')
  const roomName = [building, roomNumber].filter(Boolean).join(' ')
  return { building, roomNumber, roomName }
}

// Map backend booking -> UI booking (enriched for BookingCard)
// We attach extra display fields most cards use.
function mapApiBookingToUi(b: ApiBooking): UiBooking {
  const { building, roomNumber, roomName } = splitRoomId(b.room_id || '')
  const ui: any = {
    id: b.id,
    roomId: b.room_id,                         // "CLE-A308"
    start: isoOrHmsToHms(b.start_time),
    end: isoOrHmsToHms(b.end_time),
    user: b.user_id,
    cancelled:
      typeof b.status === 'string' && b.status.toLowerCase() !== 'active'
        ? true
        : undefined,
    // ---- enriched display fields ----
    name: roomName,                             // some cards read booking.name
    building,                                   // some cards read booking.building
    roomNumber,                                 // some read booking.roomNumber
    room: { id: b.room_id, name: roomName },    // some read booking.room.name
    date: (b.start_time ?? '').split('T')[0],   // "YYYY-MM-DD"
  }
  return ui as UiBooking
}

// Replace optimistic temp booking with server booking, else keep temp
function reconcileTemp(prev: ApiBooking[], tempId: string, real?: ApiBooking) {
  return prev.map(b => (b.id === tempId && real ? real : b))
}

// Merge (dedupe by id). Server data wins where ids collide.
function mergeBookings(optimistic: ApiBooking[], server: ApiBooking[]) {
  const byId = new Map<string, ApiBooking>()
  for (const b of optimistic) byId.set(b.id, b)
  for (const b of server) byId.set(b.id, b)
  return Array.from(byId.values())
}

// ---------- main ----------

const HomeComponent: React.FC = () => {
  const { currentUser } = useAuth()
  const [tab, setTab] = useState<TabKey>('book')

  // legacy/local hooks (schedule + registrar view)
  const {
    bookings,
    cancelBooking,
    getUnavailableRoomIds,
    getScheduleForDay
  } = useBookings()

  const {
    users,
    editingUser,
    addingUser,
    handleEditUser,
    handleSaveUser,
    handleAddUser,
    handleSaveNewUser,
    handleBlockUser,
    setEditingUser,
    setAddingUser,
  } = useUsers()

  const {
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
    requestedStart,
    requestedEnd,
    getAvailableRooms,
  } = useRoomFiltering()

  const unavailableRoomIds = getUnavailableRoomIds(requestedStart, requestedEnd)
  const availableRooms = getAvailableRooms(unavailableRoomIds)
  const scheduleForDay = getScheduleForDay(date)

  // TEMP mock while UI auth is bypassed
  const activeUser = currentUser ?? {
    id: 'temp',
    name: 'Guest',
    email: 'guest@example.com',
    role: 'staff' as const,
    isBlocked: false
  }

  // History state
  const [serverHistory, setServerHistory] = useState<ApiBooking[] | null>(null)
  const [optimisticHistory, setOptimisticHistory] = useState<ApiBooking[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // debug surface
  const [lastPostError, setLastPostError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string>('')

  // keep staff off schedule tab
  useEffect(() => {
    if (activeUser.role === 'staff' && tab === 'schedule') setTab('book')
  }, [activeUser.role, tab])

  // Fetch "my" bookings when opening History. Do not wipe optimistic items.
  useEffect(() => {
    if (tab !== 'history') return
    let cancelled = false
    ;(async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        setLastAction('GET /bookings (me)')
        const data = await fetchUserBookings()
        if (!cancelled) setServerHistory(data)
      } catch (e: any) {
        if (!cancelled) setHistoryError(e?.message ?? 'Failed to load history')
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tab])

  // Book → synthetic optimistic row → POST → reconcile
  const handleBook = async (room: Room) => {
    setLastPostError(null)

    const tempId = `temp-${Date.now()}`
    const startIso = toIsoDateTimeUTC(date, toApiTime(start)!)
    const endIso = toIsoDateTimeUTC(date, toApiTime(end)!)
    const nowIso = new Date().toISOString()

    // optimistic row: same shape as ApiBooking so our merge works
    const temp: ApiBooking = {
      id: tempId,
      user_id: activeUser.id,      // local display; backend derives user
      room_id: room.id,            // e.g., "CLE-A308"
      start_time: startIso,        // ISO with Z
      end_time: endIso,            // ISO with Z
      status: 'Active',
      booking_series_id: tempId,
      created_at: nowIso,
      updated_at: nowIso,
    }

    setOptimisticHistory(prev => [temp, ...prev])
    setTab('history')

    try {
      setLastAction('POST /bookings')
      const created = await createBooking({
        room_id: room.id,
        start_time: startIso,
        end_time: endIso,
      })
      setOptimisticHistory(prev => reconcileTemp(prev, tempId, created))
      try {
        setLastAction('GET /bookings (me) after POST')
        const fresh = await fetchUserBookings()
        setServerHistory(fresh)
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to create booking'
      setLastPostError(msg)
      alert(msg)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelBookingApi(id)               // call backend (expects 204)
      // remove locally for instant UI feedback
      setOptimisticHistory(prev => prev.filter(b => b.id !== id))
      setServerHistory(prev => (prev ? prev.filter(b => b.id !== id) : prev))
      // reconcile with server
      const fresh = await fetchUserBookings()
      setServerHistory(fresh)
    } catch (err: any) {
      alert(err?.message ?? 'Failed to cancel booking')
    }
  }

  // Merge optimistic + server (server wins on same id)
  const mergedApiHistory: ApiBooking[] = useMemo(
    () => mergeBookings(optimisticHistory, serverHistory ?? []),
    [optimisticHistory, serverHistory]
  )

  // Enrich for UI/BookingCard
  const historyForUi: UiBooking[] = useMemo(
    () => mergedApiHistory.map(mapApiBookingToUi),
    [mergedApiHistory]
  )

  return (
    <div className="app-shell">
      <div className="header">
        <span className="badge">{activeUser.role.toUpperCase()}</span>
        <h1 className="title">Rooms & Scheduling</h1>
      </div>

      <TabNavigation
        currentTab={tab}
        setTab={setTab}
        currentUser={activeUser}
      />

      {tab === 'book' && (
        <BookingPage
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
          availableRooms={availableRooms}
          onBook={handleBook}
        />
      )}

      {tab === 'schedule' && (
        <SchedulePage
          date={date}
          setDate={setDate}
          building={building}
          setBuilding={setBuilding}
          scheduleForDay={scheduleForDay}
        />
      )}

      {tab === 'history' && (
        <>
          {historyError && (
            <section className="panel" aria-labelledby="history-error">
              <div className="empty">Couldn’t refresh from server: {historyError}</div>
            </section>
          )}

          <HistoryPage
            userHistory={historyForUi}
            allBookings={activeUser.role === 'registrar' ? bookings : undefined}
            currentUser={activeUser}
            onCancel={handleCancel} 
          />
        </>
      )}

      {tab === 'users' && (
        <UsersPage
          users={users}
          currentUser={activeUser}
          editingUser={editingUser}
          addingUser={addingUser}
          onEditUser={handleEditUser}
          onSaveUser={handleSaveUser}
          onAddUser={handleAddUser}
          onSaveNewUser={handleSaveNewUser}
          onBlockUser={handleBlockUser}
          onCancelEdit={() => setEditingUser(null)}
          onCancelAdd={() => setAddingUser(null)}
        />
      )}
    </div>
  )
}

const AppRouter: React.FC = () => {
  const { login } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route
        path="/home"
        element={
          // <ProtectedRoute allowedRoles={['staff', 'registrar']}>
            <HomeComponent />
          // </ProtectedRoute>
        }
      />
      <Route
        path="/admin-panel"
        element={
          // <ProtectedRoute allowedRoles={['admin']}>
            <AdminConsole />
          // </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  )
}
