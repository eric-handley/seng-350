import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import { ProtectedRoute } from './components/ProtectedRoute'

// Component for the home page (staff/registrar)
const HomeComponent: React.FC = () => {
  const { currentUser, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('book')

  const {
    bookings,
    addBooking,
    cancelBooking,
    getUnavailableRoomIds,
    getUserHistory,
    getScheduleForDay
  } = useBookings()

  const canManageUsers = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REGISTRAR
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
  } = useUsers({ autoLoad: !!canManageUsers })

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

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  }

  if (!currentUser) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div className="header-info">
          <span className="badge">{currentUser.role.toUpperCase()}</span>
          <h1 className="title">Rooms & Scheduling</h1>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <TabNavigation
        currentTab={tab}
        setTab={setTab}
        currentUser={currentUser}
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
          allBookings={currentUser.role === UserRole.REGISTRAR ? bookings : undefined}
          currentUser={currentUser}
          onCancel={cancelBooking}
        />
      )}

      {tab === 'users' && (
        <UsersPage
          users={users}
          currentUser={currentUser}
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
          <ProtectedRoute allowedRoles={[UserRole.STAFF, UserRole.REGISTRAR]}>
            <HomeComponent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-panel"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

const AdminPage: React.FC = () => {
  const { currentUser, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  }

  if (!currentUser) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return <AdminConsole onLogout={handleLogout} />
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
