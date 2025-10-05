import React from 'react'
import { Booking, User, UserRole } from '../types'
import { BookingCard } from '../components/BookingCard'

interface HistoryPageProps {
  userHistory: Booking[]
  allBookings?: Booking[]
  currentUser?: User
  onCancel: (id: string) => void
  refreshBookings?: () => Promise<void> // <-- async for backend fetch
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  userHistory,
  allBookings,
  currentUser,
  onCancel,
  refreshBookings
}) => {
  const handleRebook = async (id: string) => {
    const booking = allBookings?.find(b => b.id === id)
    if (!booking) return
    // Create a new booking with the same details, but ensure cancelled is false
    const response = await fetch('http://localhost:3000/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        room_id: booking.roomId,
        start_time: booking.start,
        end_time: booking.end,
      }),
    })
    if (response.ok && refreshBookings) {
      await refreshBookings()
    }
  }

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
                onRebook={handleRebook}
                showUser={false}
              />
            ))}
          </div>
        )}
      </section>
      {(currentUser?.role === UserRole.REGISTRAR || currentUser?.role === UserRole.ADMIN) && allBookings && (
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
                  onRebook={handleRebook}
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
