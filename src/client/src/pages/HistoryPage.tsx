import React, { useEffect, useState } from 'react'
import { User, UserRole } from '../types'
import { BookingCard } from '../components/BookingCard'
import type { UiBooking } from '../types'
import { useBookingHistory } from '../hooks/useBookingHistory'

/**
 * HistoryPage
 *
 * Responsibilities:
 * - Fetch and display the current user's booking history
 * - For Admin/Registrar: also fetch and display all user bookings
 * - Allow cancel and rebook actions, then refresh lists accordingly
 * - Be resilient: a broken BookingCard should not crash the page (Error Boundary)
 */
interface HistoryPageProps {
  currentUser: User
}

/**
 * Lightweight error boundary for individual booking tiles.
 * Ensures a single faulty card does not break the whole grid.
 */
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
    // Switch to fallback UI when a child throws
    return { hasError: true };
  }
  componentDidCatch() {
    // Swallow the error (could log to telemetry here)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * Fallback tile UI used when BookingCard fails to render.
 * Shows key booking info and optional Rebook action.
 */
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
        <button className="btn secondary" onClick={() => onRebook(booking.id)}>
          Rebook
        </button>
      )}
    </div>
  );
};

/**
 * Wrapper that guards BookingCard with CardBoundary and provides a graceful fallback.
 */
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
  // Transient UX message (toast) for rebook success/failure
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  /**
   * Booking history hook
   * - Provides user-specific history and cancel action
   * - For privileged users, also exposes allBookings with a fetch method
   */
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
    // On mount: always load current user's history
    void fetchHistory()
    // Admin/Registrar additionally loads all user bookings
    if (currentUser?.role === UserRole.REGISTRAR || currentUser?.role === UserRole.ADMIN) {
      void fetchAllBookings()
    }
  }, [fetchHistory, fetchAllBookings, currentUser])

  /**
   * Cancel a booking then refresh the relevant lists.
   * Errors are handled by the hook and surfaced via `error`.
   */
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

  /**
   * Rebook (reactivate) a cancelled booking via API PATCH.
   * Shows a toast and refreshes user and (if applicable) global lists.
   */
  const handleRebook = async (id: string) => {
    // Look up the booking in either global or user lists
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

  // Loading state: show a friendly placeholder while data is fetched
  if (loading) {
    return (
      <section className="panel" aria-labelledby="history-loading">
        <div className="empty">Loading your bookings…</div>
      </section>
    )
  }

  // Error state: surface hook-provided error
  if (error) {
    return (
      <section className="panel" aria-labelledby="history-error">
        <div className="empty">Error: {error}</div>
      </section>
    )
  }

  // Render user section and, for privileged roles, a global section
  return (
    <div>
      {/* Toast message for rebook outcomes */}
      {message && (
        <div className={`toast ${message.type}`} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      {/* User's own bookings */}
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

      {/* Admin/Registrar-only: all user bookings */}
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
