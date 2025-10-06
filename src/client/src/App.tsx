import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './styles/app.css'
import './styles/admin.css'

import { TabKey, UserRole, User } from './types'

import { useUsers } from './hooks/useUsers'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { getCurrentDate } from './utils/dateHelpers'
import { ProtectedRoute } from './components/ProtectedRoute'

import { TabNavigation } from './components/TabNavigation'
import { BookingPage } from './pages/BookingPage'
import { SchedulePage } from './pages/SchedulePage'
import { HistoryPage } from './pages/HistoryPage'
import { UsersPage } from './pages/UsersPage'
import LoginPage from './pages/LoginPage'
import AdminConsole from './components/AdminConsole'

const HomeComponent: React.FC = () => {
  const { currentUser, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Derive current tab from URL path
  const tab: TabKey =
    location.pathname.includes('/schedule') ? 'schedule' :
    location.pathname.includes('/history') ? 'history' :
    location.pathname.includes('/users') ? 'users' :
    'book'

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
    error,
  } = useUsers({ autoLoad: !!canManageUsers })

  // Room filtering state
  const [building, setBuilding] = useState<string>('')
  const [roomQuery, setRoomQuery] = useState<string>('')
  const [date, setDate] = useState<string>(getCurrentDate())
  const [start, setStart] = useState<string>('10:00')
  const [end, setEnd] = useState<string>('11:00')

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div className="header-info">
          <span className="badge">{String(currentUser.role).toUpperCase()}</span>
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
        currentUser={currentUser}
      />

      {tab === 'book' && (
        <BookingPage
          currentUserId={currentUser.id}
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
          onBookingCreated={() => navigate('/home/history')}
        />
      )}

      {tab === 'schedule' && (
        <SchedulePage
          date={date}
          setDate={setDate}
          building={building}
          setBuilding={setBuilding}
        />
      )}

      {tab === 'history' && (
        <HistoryPage
          currentUser={currentUser}
          onCancel={(id: string) => {
            // Implement cancellation logic here or leave empty if not needed
            console.log(`Cancel booking with id: ${id}`)
          }}
        />
      )}

      {tab === 'users' && (
        <UsersPage
          users={users}
          currentUser={currentUser}
          editingUser={editingUser}
          addingUser={addingUser}
          error={error}
          onEditUser={handleEditUser}
          onSaveUser={handleSaveUser}
          onAddUser={() => handleAddUser(currentUser)}
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
          <ProtectedRoute allowedRoles={[UserRole.STAFF, UserRole.REGISTRAR, UserRole.ADMIN]}>
            <HomeComponent />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home/book" replace />} />
        <Route path="schedule" element={null} />
        <Route path="book" element={null} />
        <Route path="history" element={null} />
        <Route path="users" element={null} />
      </Route>
      <Route
        path="/admin-panel"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin-panel/logs" replace />} />
        <Route path="logs" element={null} />
        <Route path="health" element={null} />
      </Route>
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
