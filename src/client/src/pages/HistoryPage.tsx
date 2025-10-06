import React, { useEffect } from 'react'
import { User, UserRole } from '../types'
import { BookingCard } from '../components/BookingCard'
import type { UiBooking } from '../types'
import { useBookingHistory } from '../hooks/useBookingHistory'

interface HistoryPageProps {
  currentUser: User
  onCancel: (id: string) => void
  onRebook?: (id: string) => void
}

type CardBoundaryProps = {
  fallback: React.ReactNode
  children?: React.ReactNode
}
type CardBoundaryState = { hasError: boolean }

class CardBoundary extends React.Component<CardBoundaryProps, CardBoundaryState> {
  constructor(props: CardBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() {}
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

const FallbackTile: React.FC<{
  booking: UiBooking
  onCancel: (id: string)=>void
  onRebook?: (id: string) => void
  showUser?: boolean
}> = ({ booking, onCancel, onRebook, showUser }) => {
  return (
    <div className="card" style={{padding:'12px'}}>
      <div className="card-title" style={{fontWeight:600}}>
        {booking.name ?? booking.room?.name ?? booking.roomId}
      </div>
      <div className="card-sub" style={{opacity:.8}}>
        {(booking.building ? booking.building + ' ' : '') + (booking.roomNumber ?? '')}
      </div>
      <div className="card-meta" style={{marginTop:6}}>
        {booking.date ? booking.date + ' · ' : ''}{booking.start} → {booking.end}
        {booking.cancelled ? <span className="badge danger" style={{marginLeft:8}}>Cancelled</span> : null}
      </div>
      {booking.cancelled && onRebook && (
        <button className="btn ghost" onClick={() => onRebook(booking.id)}>
          Rebook
        </button>
      )}
    </div>
  )
}

const GuardedBookingCard: React.FC<{
  booking: UiBooking
  onCancel: (id: string) => void
  onRebook?: (id: string) => void
  showUser: boolean
}> = ({ booking, onCancel, onRebook, showUser }) => (
  <CardBoundary
    fallback={<FallbackTile booking={booking} onCancel={onCancel} onRebook={onRebook} showUser={showUser} />}
  >
    <BookingCard booking={booking} onCancel={onCancel} onRebook={onRebook} showUser={showUser} />
  </CardBoundary>
)

export const HistoryPage: React.FC<HistoryPageProps> = ({
  currentUser,
  onCancel,
}) => {
  const { history: userHistory, loading, error, fetchHistory, cancelBooking } = useBookingHistory(currentUser.id)

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id)
    } catch {
      // Error already set by hook
    }
  }

  const handleRebook = async (id: string) => {
    const booking = userHistory?.find(b => b.id === id) || userHistory.find(b => b.id === id)
    if (!booking) return
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
    if (response.ok) {
      alert('Rebooking successful!')
    }
  }

  //const activeAllBookings = allBookings?.filter(b => b.status === 'Active') ?? []

  return (
    <div>
      {loading && (
        <section className="panel" aria-labelledby="history-loading">
          <div className="empty">Loading your bookings…</div>
        </section>
      )}
      {error && (
        <section className="panel" aria-labelledby="history-error">
          <div className="empty">Error: {error}</div>
        </section>
      )}

      <section className="panel" aria-labelledby="history-label">
        <h2 id="history-label" style={{marginTop:0}}>My Bookings &amp; History</h2>

        {userHistory.length === 0 ? (
          <div className="empty">You have no current bookings.</div>
        ) : (
          <div className="grid">
            {userHistory.map(booking => (
              <GuardedBookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onRebook={handleRebook}
                showUser={false}
              />
            ))}
          </div>
        )}
      </section>
      {/* {(currentUser?.role === UserRole.REGISTRAR || currentUser?.role === UserRole.ADMIN) && (
        <section className="panel" aria-labelledby="global-label">
          <h2 id="global-label" style={{marginTop:0}}>All Current Bookings</h2>
          {activeAllBookings.length === 0 ? (
            <div className="empty">There are no current bookings.</div>
          ) : (
            <div className="grid">
              {activeAllBookings.map(booking => (
                <GuardedBookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  onRebook={handleRebook}
                  showUser={true}
                />
              ))}
            </div>
          )}
        </section>
      )} */}
    </div>
  )
}
