import React from 'react'
import { Booking } from '../types'
import { BookingCard } from '../components/BookingCard'

interface HistoryPageProps {
  userHistory: Booking[]
  onCancel: (id: string) => void
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ userHistory, onCancel }) => {
  return (
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
            />
          ))}
        </div>
      )}
    </section>
  )
}