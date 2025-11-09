import React from 'react'
import { formatTimeForDisplay } from '../utils/time'
import type { UiBooking } from '../types'

type Props = {
  bookings: UiBooking[]
  onCancelSeries: (seriesId: string) => void
  onRebook?: (id: string) => void
  showUser?: boolean
}

/**
 * RecurringBookingGroup
 *
 * Displays a single card representing a series of recurring bookings.
 * Shows summary info like date range, time, and booking count.
 */
export const RecurringBookingGroup: React.FC<Props> = ({
  bookings,
  onCancelSeries,
  showUser = false
}) => {
  if (bookings.length === 0) return null

  // Sort bookings by date
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = a.date ?? ''
    const dateB = b.date ?? ''
    return dateA.localeCompare(dateB)
  })

  const firstBooking = sortedBookings[0]
  const lastBooking = sortedBookings[sortedBookings.length - 1]

  const roomId = firstBooking.roomId ?? firstBooking.room_id ?? firstBooking.room?.id ?? ''
  const roomName = firstBooking.name ?? firstBooking.roomName ?? firstBooking.room?.name ?? roomId ?? 'Room'

  const startDate = firstBooking.date
  const endDate = lastBooking.date
  const count = bookings.length

  // Use time from first booking
  const startRaw = firstBooking.start ?? ''
  const endRaw = firstBooking.end ?? ''
  const start = formatTimeForDisplay(startRaw.slice(0, 5))
  const end = formatTimeForDisplay(endRaw.slice(0, 5))

  // Check if all cancelled
  const allCancelled = bookings.every(b => b.cancelled)

  const seriesId = firstBooking.booking_series_id ?? ''

  // Optional user details from first booking
  const userName = firstBooking.user_name ??
    (firstBooking.user?.first_name && firstBooking.user?.last_name
      ? `${firstBooking.user.first_name} ${firstBooking.user.last_name}`
      : undefined)
  const userEmail = firstBooking.user_email ?? firstBooking.user?.email
  const userRole = firstBooking.user_role ?? firstBooking.user?.role

  return (
    <article className="card">
      {/* Title and badges */}
      <div className="card-title" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>{roomName}</span>
        <span className="badge secondary">
          Recurring ({count} booking{count !== 1 ? 's' : ''})
        </span>
        {allCancelled && <span className="badge danger">Cancelled</span>}
      </div>

      {/* Date range and time */}
      <div className="card-meta" style={{ marginTop: 6 }}>
        <span>{startDate} to {endDate} · {start} → {end}</span>
      </div>

      {/* Optional user block */}
      {showUser && (userName ?? userEmail ?? userRole) && (
        <div className="card-meta" style={{ marginTop: 8, fontSize: '0.9em', opacity: 0.9 }}>
          {userName && <div><strong>User:</strong> {userName}</div>}
          {userEmail && <div><strong>Email:</strong> {userEmail}</div>}
          {userRole && <div><strong>Role:</strong> {userRole}</div>}
        </div>
      )}

      {/* Actions */}
      {!allCancelled && (
        <div style={{ marginTop: 10 }}>
          <button className="btn danger" onClick={() => onCancelSeries(seriesId)}>
            Cancel Series
          </button>
        </div>
      )}
    </article>
  )
}

export default RecurringBookingGroup
