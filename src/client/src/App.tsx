import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './styles/app.css'
import './styles/admin.css'
import { TabKey, Room } from './types'
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
import { toApiTime } from './utils/time'

import type { Booking as UiBooking } from './types'
import type { Booking as ApiBooking } from './api/bookings'
import { fromApiTime } from './utils/time'

function mapApiBookingToUi(b: ApiBooking): UiBooking {
  return {
    id: b.id,
    roomId: b.room_id,
    start: isoToHms(b.start_time),   // server now returns ISO
    end: isoToHms(b.end_time),
    user: b.user_id,
    cancelled: (b as any).status === 'cancelled' ? true : undefined,
  }
}

// Build ISO datetime from date (YYYY-MM-DD) + sanitized hms ("hh-mm-ss" or "hh:mm:ss")
function toIsoDateTime(dateYYYYMMDD: string, timeHms: string) {
  const hms = timeHms.replace(/-/g, ':')            // "hh-mm-ss" -> "hh:mm:ss"
  return `${dateYYYYMMDD}T${hms}`                   // e.g., "2025-10-05T10:00:00"
}

// Turn an ISO datetime into "hh:mm:ss" for UI History cards
function isoToHms(iso: string) {
  // handles "YYYY-MM-DDThh:mm:ss[.sss][Z]"
  const afterT = iso.split('T')[1] || iso
  const trimmed = afterT.replace('Z','')
  return trimmed.slice(0, 8)                        // "hh:mm:ss"
}

// Component for the home page (staff/registrar)
const HomeComponent: React.FC = () => {
  const { currentUser } = useAuth()
  const [tab, setTab] = useState<TabKey>('book')

  // legacy/local hooks (you can prune later)
  const {
    bookings,
    cancelBooking,
    getUnavailableRoomIds,
    getUserHistory,      // fallback if API isn’t available yet
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

  // Mock while auth is bypassed
  const activeUser = currentUser ?? {
    id: 'temp',
    name: 'Guest',
    email: 'guest@example.com',
    role: 'staff' as const,
    isBlocked: false
  }

  // NEW: API-backed user history state
  const [userHistoryApi, setUserHistoryApi] = useState<ApiBooking[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Guard: staff can’t land on hidden schedule tab
  useEffect(() => {
    if (activeUser.role === 'staff' && tab === 'schedule') setTab('book')
  }, [activeUser.role, tab])

  // Load history from API when switching to History tab
  useEffect(() => {
    if (tab !== 'history') return
    let cancelled = false
    ;(async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        const data = await fetchUserBookings()
        if (!cancelled) setUserHistoryApi(data)
      } catch (e: any) {
        if (!cancelled) setHistoryError(e?.message ?? 'Failed to load history')
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tab, activeUser.id])

  // Book via backend, then jump to History and refresh
  const handleBook = async (room: Room) => {
    try {
      await createBooking({
        room_id: room.id,
        start_time: toIsoDateTime(date, toApiTime(start)!), // "YYYY-MM-DDThh:mm:ss"
        end_time: toIsoDateTime(date, toApiTime(end)!),
      })
      setTab('history')
      // eager refresh
      setHistoryLoading(true)
      const fresh = await fetchUserBookings()
      setUserHistoryApi(fresh)
      setHistoryLoading(false)
    } catch (err: any) {
      alert(err?.message ?? 'Failed to create booking')
    }
  }

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
          onBook={handleBook}  // now calls backend
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
        <HistoryPage
          userHistory={
            userHistoryApi
              ? userHistoryApi.map(mapApiBookingToUi) // <-- convert here
              : getUserHistory()                      // legacy local fallback
          }
          allBookings={activeUser.role === 'registrar' ? bookings : undefined}
          currentUser={activeUser}
          onCancel={cancelBooking}
        />
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

// App Router component that has access to hooks
const AppRouter: React.FC = () => {
  const { login } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route
        path="/home"
        element={
          // TODO: TEMPORARY FIX - Auth disabled for /home route
          // Remove this fix and uncomment ProtectedRoute once auth is properly configured
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
