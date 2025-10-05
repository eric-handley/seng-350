// src/pages/HistoryPage.tsx
import React from 'react'
import { Booking, User } from '../types'
import { BookingCard } from '../components/BookingCard'

interface HistoryPageProps {
  userHistory: Booking[]
  allBookings?: Booking[]
  currentUser?: User
  onCancel: (id: string) => void
}

// ---- helpers: guard + fallback ----
class CardBoundary extends React.Component<{ fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() { /* swallow */ }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

const FallbackTile: React.FC<{ booking: any, onCancel: (id: string)=>void, showUser?: boolean }> = ({ booking }) => {
  return (
    <div className="card" style={{padding:'12px'}}>
      <div className="card-title" style={{fontWeight:600}}>
        {booking.name || booking.roomName || booking.room?.name || booking.roomId}
      </div>
      <div className="card-sub" style={{opacity:.8}}>
        {(booking.building ? booking.building + ' ' : '') + (booking.roomNumber || '')}
      </div>
      <div className="card-meta" style={{marginTop:6}}>
        {booking.date ? booking.date + ' · ' : ''}{booking.start} → {booking.end}
        {booking.cancelled ? <span className="badge danger" style={{marginLeft:8}}>Cancelled</span> : null}
      </div>
    </div>
  )
}

const GuardedBookingCard: React.FC<{
  booking: any
  onCancel: (id: string) => void
  showUser: boolean
}> = ({ booking, onCancel, showUser }) => (
  <CardBoundary fallback={<FallbackTile booking={booking} onCancel={onCancel} showUser={showUser} />}>
    <BookingCard booking={booking} onCancel={onCancel} showUser={showUser} />
  </CardBoundary>
)

export const HistoryPage: React.FC<HistoryPageProps> = ({
  userHistory,
  allBookings,
  currentUser,
  onCancel
}) => {
  // quick debug to verify what the component actually receives
  // (expandable, so it won’t clutter the UI)
  const Debug = () => (
    <details style={{fontSize:12, marginBottom:12}}>
      <summary>Debug: userHistory length = {userHistory.length}</summary>
      <pre style={{whiteSpace:'pre-wrap', margin:0}}>
        {JSON.stringify(userHistory.slice(0, 3), null, 2)}
      </pre>
    </details>
  )

  return (
    <div>
      <section className="panel" aria-labelledby="history-label">
        <h2 id="history-label" style={{marginTop:0}}>My Bookings &amp; History</h2>

        <Debug />

        {userHistory.length === 0 ? (
          <div className="empty">You have no bookings yet.</div>
        ) : (
          <div className="grid">
            {userHistory.map(booking => (
              <GuardedBookingCard
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
                <GuardedBookingCard
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
