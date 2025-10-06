import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TabKey, User, UserRole } from '../types'

interface TabNavigationProps {
  currentTab: TabKey
  currentUser: User
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab, currentUser }) => {
  const navigate = useNavigate()

  return (
    <div className="tabs" role="tablist" aria-label="Sections">
      <button
        type="button"
        className={currentTab === 'book' ? 'tab active' : 'tab'}
        role="tab"
        aria-selected={currentTab === 'book'}
        onClick={() => navigate('/home/book')}
      >
        Book Rooms
      </button>

      <button
        type="button"
        className={currentTab === 'schedule' ? 'tab active' : 'tab'}
        role="tab"
        aria-selected={currentTab === 'schedule'}
        onClick={() => navigate('/home/schedule')}
      >
        Schedule
      </button>

      <button
        type="button"
        className={currentTab === 'history' ? 'tab active' : 'tab'}
        role="tab"
        aria-selected={currentTab === 'history'}
        onClick={() => navigate('/home/history')}
      >
        {(currentUser.role === UserRole.REGISTRAR || currentUser.role === UserRole.ADMIN)
          ? 'All Bookings'
          : 'My Bookings & History'}
      </button>

      {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR) && (
        <button
          type="button"
          className={currentTab === 'users' ? 'tab active' : 'tab'}
          role="tab"
          aria-selected={currentTab === 'users'}
          onClick={() => navigate('/home/users')}
        >
          User List
        </button>
      )}
    </div>
  )
}
