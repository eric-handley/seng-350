import React from 'react'
import { TabKey, User } from '../types'

interface TabNavigationProps {
  currentTab: TabKey
  setTab: (tab: TabKey) => void
  currentUser: User
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab, setTab, currentUser }) => {
  const isStaff = currentUser.role === 'staff'
  
  return (
    <div className="tabs" role="tablist" aria-label="Sections">
      {!isStaff && (
        <button
          type="button"
          className={currentTab === 'schedule' ? 'tab active' : 'tab'}
          role="tab"
          aria-selected={currentTab === 'schedule'}
          onClick={() => setTab('schedule')}
        >
          Schedule
        </button>
      )}

      <button
        type="button"
        className={currentTab === 'book' ? 'tab active' : 'tab'}
        role="tab"
        aria-selected={currentTab === 'book'}
        onClick={() => setTab('book')}
      >
        Book Rooms
      </button>

      <button
        type="button"
        className={currentTab === 'history' ? 'tab active' : 'tab'}
        role="tab"
        aria-selected={currentTab === 'history'}
        onClick={() => setTab('history')}
      >
        My Bookings &amp; History
      </button>

      {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
        <button
          type="button"
          className={currentTab === 'users' ? 'tab active' : 'tab'}
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
