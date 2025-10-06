import React, { useEffect } from 'react'
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
  const { history: userHistory, loading, error, fetchHistory, cancelBooking, fetchAllBookings, allBookings } = useBookingHistory(currentUser.id)

  useEffect(() => {
    void fetchHistory();
    // Fetch all bookings for admin/registrar
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR) {
      void fetchAllBookings();
    }
  }, [fetchHistory, fetchAllBookings, currentUser.role]);

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id);
    } catch {
      // Error already set by hook
    }
  }

  const handleRebook = async (id: string) => {
    const booking = userHistory.find(b => b.id === id)
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
      // eslint-disable-next-line no-alert
      window.alert('Rebooking successful!')
      await fetchHistory()
    }
    else {
      // eslint-disable-next-line no-alert
      window.alert('Failed to rebook. Please try again later.')
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
  const activeAllBookings = allBookings.filter(b => !b.cancelled)

  return (
    <div>
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
      )}
    </div>
  )
}
