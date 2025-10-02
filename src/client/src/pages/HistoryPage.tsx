import React from 'react'
import { Booking, User } from '../types'
import { BookingCard } from '../components/BookingCard'

interface HistoryPageProps {
  userHistory: Booking[]
  allBookings?: Booking[]
  currentUser?: User
  onCancel: (id: string) => void
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  userHistory,
  allBookings,
  currentUser,
  onCancel
}) => {
  return (
    <div>
      <section className="panel" aria-labelledby="history-label">
        <h2 id="history-label" style={{marginTop:0}}>My Bookings & History</h2>
        {userHistory.length === 0 ? (
          <div className="empty">You have no bookings yet.</div>
        ) : (
          <div className="grid">
            {userHistory.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={onCancel}
                showUser={false}
              />
            ))}
          </div>
        )}
      </section>
      {currentUser?.role === 'registrar' && allBookings && (
        <section className="panel" aria-labelledby="global-label">
          <h2 id="global-label" style={{marginTop:0}}>All Bookings</h2>
          {allBookings.length === 0 ? (
            <div className="empty">There are no bookings yet.</div>
          ) : (
            <div className="grid">
              {allBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={onCancel}
                  showUser={true}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
