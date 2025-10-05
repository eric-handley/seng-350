import React from 'react'
import { TabKey, User, UserRole } from '../types'

interface TabNavigationProps {
  currentTab: TabKey
  setTab: (tab: TabKey) => void
  currentUser: User
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab, setTab, currentUser }) => {
  return (
    <div className="tabs" role="tablist" aria-label="Sections">
      <button 
        className="tab" 
        role="tab" 
        aria-selected={currentTab === 'schedule'} 
        onClick={() => setTab('schedule')}
      >
        Schedule
      </button>
      <button 
        className="tab" 
        role="tab" 
        aria-selected={currentTab === 'book'} 
        onClick={() => setTab('book')}
      >
        Book Rooms
      </button>
      <button 
        className="tab" 
        role="tab" 
        aria-selected={currentTab === 'history'} 
        onClick={() => setTab('history')}
      >
        Bookings & History
      </button>
      {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR) && (
        <button 
          className="tab" 
          role="tab" 
          aria-selected={currentTab === 'users'} 
          onClick={() => setTab('users')}
        >
          User List
        </button>
      )}
    </div>
  )
}
