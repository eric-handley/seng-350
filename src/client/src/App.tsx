import React, { useState } from 'react'
import './styles/app.css'
import './styles/admin.css'
import { TabKey } from './types'
import { useBookings } from './hooks/useBookings'
import { useUsers } from './hooks/useUsers'
import { useRoomFiltering } from './hooks/useRoomFiltering'
import { useAuth } from './hooks/useAuth'
import { TabNavigation } from './components/TabNavigation'
import { BookingPage } from './pages/BookingPage'
import { SchedulePage } from './pages/SchedulePage'
import { HistoryPage } from './pages/HistoryPage'
import { UsersPage } from './pages/UsersPage'
import LoginPage from './pages/LoginPage'
import AdminConsole from './components/AdminConsole'

export default function App() {
  const { currentUser, login, isAuthenticated } = useAuth()
  const [tab, setTab] = useState<TabKey>('book')
  
  const { 
    addBooking, 
    cancelBooking, 
    getUnavailableRoomIds, 
    getUserHistory, 
    getScheduleForDay 
  } = useBookings()
  
  const { users, editUser } = useUsers()
  
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
  
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />
  }

  // Role-based routing
  if (currentUser!.role === 'admin') {
    return <AdminConsole />
  }

  // Staff and Registrar use the room booking system
  const unavailableRoomIds = getUnavailableRoomIds(requestedStart, requestedEnd)
  const availableRooms = getAvailableRooms(unavailableRoomIds)
  const userHistory = getUserHistory()
  const scheduleForDay = getScheduleForDay(date)

  const handleBook = (room: any) => {
    const success = addBooking(room, date, start, end)
    if (success) {
      setTab('history')
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <span className="badge">{currentUser!.role.toUpperCase()}</span>
        <h1 className="title">Rooms & Scheduling</h1>
      </div>

      <TabNavigation 
        currentTab={tab} 
        setTab={setTab} 
        currentUser={currentUser!} 
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
          onCancel={cancelBooking}
        />
      )}

      {tab === 'users' && (
        <UsersPage
          users={users}
          currentUser={currentUser!}
          onEditUser={editUser}
        />
      )}
    </div>
  )
}