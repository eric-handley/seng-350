import React, { useEffect, useState } from 'react'
import { User, UserRole } from '../types'
import { BookingCard } from '../components/BookingCard'
import type { UiBooking } from '../types'
import { useBookingHistory } from '../hooks/useBookingHistory'

interface HistoryPageProps {
  currentUser: User
}

type CardBoundaryProps = {
  fallback: React.ReactNode;
  children?: React.ReactNode;
};
type CardBoundaryState = { hasError: boolean };

class CardBoundary extends React.Component<
  CardBoundaryProps,
  CardBoundaryState
> {
  constructor(props: CardBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    /* swallow */
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const FallbackTile: React.FC<{
  booking: UiBooking
  onCancel?: (id: string)=>void
  onRebook?: (id: string) => void
  showUser?: boolean
}> = ({ booking, onRebook, showUser }) => {
  return (
    <div className="card" style={{ padding: "12px" }}>
      <div className="card-title" style={{ fontWeight: 600 }}>
        {booking.name ?? booking.room?.name ?? booking.roomId}
      </div>
      <div className="card-sub" style={{ opacity: 0.8 }}>
        {(booking.building ? booking.building + " " : "") +
          (booking.roomNumber ?? "")}
      </div>
      <div className="card-meta" style={{marginTop:6}}>
        {booking.date ? booking.date + ' · ' : ''}{booking.start} → {booking.end}
        {booking.cancelled ? <span className="badge danger" style={{marginLeft:8}}>Cancelled</span> : null}
        {showUser && booking.user && (
          <span style={{marginLeft:8, fontStyle:'italic'}}>User: {booking.user}</span>
        )}
      </div>
      {booking.cancelled && onRebook && (
        <button className="btn ghost" onClick={() => onRebook(booking.id)}>
          Rebook
        </button>
      )}
    </div>
  );
};

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
);

export const HistoryPage: React.FC<HistoryPageProps> = ({
  currentUser,
}) => {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const {
    history: userHistory,
    loading,
    error,
    fetchHistory,
    cancelBooking,
    allBookings = [],
    fetchAllBookings
  } = useBookingHistory(currentUser.id) as {
    history: UiBooking[],
    loading: boolean,
    error: string | null,
    fetchHistory: () => Promise<void>,
    cancelBooking: (id: string) => Promise<void>,
    allBookings: UiBooking[],
    fetchAllBookings: () => Promise<void>
  }

  useEffect(() => {
    void fetchHistory()
    if (currentUser?.role === UserRole.REGISTRAR || currentUser?.role === UserRole.ADMIN) {
      void fetchAllBookings()
    }
  }, [fetchHistory, fetchAllBookings, currentUser])

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id)
      await fetchHistory()
      if (currentUser?.role === UserRole.REGISTRAR || currentUser?.role === UserRole.ADMIN) {
        await fetchAllBookings()
      }
    } catch {
      // Error already set by hook
    }
  }

  const handleRebook = async (id: string) => {
    const booking = allBookings.find(b => b.id === id) ?? userHistory.find(b => b.id === id)
    if (!booking) {return}

    // PATCH the booking to reactivate it
    const response = await fetch(`http://localhost:3000/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: 'Active'
      }),
    })
    if (response.ok) {
      setMessage({ text: 'Rebooking successful!', type: 'success' })
      await fetchHistory()
      if (currentUser?.role === UserRole.REGISTRAR || currentUser?.role === UserRole.ADMIN) {
        await fetchAllBookings()
      }
    }
    else {
      setMessage({ text: 'Failed to rebook. Please try again later.', type: 'error' })
    }
  }

  if (loading) {
    return (
      <section className="panel" aria-labelledby="history-loading">
        <div className="empty">Loading your bookings…</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="panel" aria-labelledby="history-error">
        <div className="empty">Error: {error}</div>
      </section>
    )
  }

  // Only show active (non-cancelled) bookings for all users
  // const activeAllBookings = allBookings.filter(b => !b.cancelled)

  return (
    <div>
      {message && (
        <div className="toast" style={{
          background: message.type === 'success' ? '#22c55e' : '#ef4444',
          marginBottom: '1rem'
        }}>
          {message.text}
        </div>
      )}
      <section className="panel" aria-labelledby="history-label">
        <h2 id="history-label" style={{marginTop:0}}>My Bookings</h2>
        {userHistory.length === 0 ? (
          <div className="empty">You have no bookings yet.</div>
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
      {(currentUser.role === UserRole.REGISTRAR || currentUser.role === UserRole.ADMIN) && (
        <section className="panel" aria-labelledby="global-label">
          <h2 id="global-label" style={{marginTop:0}}>All User Bookings</h2>
          {allBookings.length === 0 ? (
            <div className="empty">There are no current bookings.</div>
          ) : (
            <div className="grid">
              {allBookings.map(booking => (
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
      )}
    </div>
  )
}
