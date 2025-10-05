import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './styles/app.css'
import './styles/admin.css'
import { TabKey, Room, UserRole } from './types'
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

// Component for the home page (staff/registrar)
const HomeComponent: React.FC = () => {
  const { currentUser } = useAuth()
  const [tab, setTab] = useState<TabKey>('book')

  const {
    bookings,
    addBooking,
    cancelBooking,
    getUnavailableRoomIds,
    getUserHistory,
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
  const userHistory = getUserHistory()
  const scheduleForDay = getScheduleForDay(date)

  const handleBook = (room: Room) => {
    const success = addBooking(room, date, start, end)
    if (success) {
      setTab('history')
    }
  }

  // TODO: TEMPORARY FIX - Disabled currentUser check while auth is bypassed
  // Re-enable this check when ProtectedRoute is restored
  // if (!currentUser) {
  //   return null
  // }

  // TODO: TEMPORARY FIX - Mock user for testing without auth
  const activeUser =
    currentUser || {
      id: 'temp',
      email: 'guest@example.com',
      first_name: 'Guest',
      last_name: 'User',
      role: UserRole.STAFF,
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
        <HistoryPage
          userHistory={userHistory}
          allBookings={activeUser.role === UserRole.REGISTRAR ? bookings : undefined}
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
          // <ProtectedRoute allowedRoles={[UserRole.STAFF, UserRole.REGISTRAR]}>
            <HomeComponent />
          // </ProtectedRoute>
        }
      />
      <Route
        path="/admin-panel"
        element={
          // <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
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
