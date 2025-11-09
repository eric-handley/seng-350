import React, { useEffect, useState } from 'react'
import { formatTimeForDisplay } from '../utils/time'
import '../styles/recurring-booking.css'

export interface RecurringBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringBookingFormData) => void;
  initialRoomId: string;
  initialStartTime: string;
  initialEndTime: string;
  roomName?: string;
  building?: string;
  capacity?: number;
  date?: string;
}

export interface RecurringBookingFormData {
  room_id: string;
  start_time: string;
  end_time: string;
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  series_end_date: string; // ISO date string
}

const RecurringBookingModal: React.FC<RecurringBookingModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialRoomId,
  initialStartTime,
  initialEndTime,
  roomName,
  building,
  capacity,
  date,
}) => {
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const startDate = initialStartTime?.split('T')?.[0] ?? ''
  const [seriesEndDate, setSeriesEndDate] = useState(startDate)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSeriesEndDate(startDate)
  }, [startDate])

  if (!open) { return null }

  const startDisplay = formatTimeForDisplay(initialStartTime?.split('T')?.[1]?.slice(0, 5) ?? '')
  const endDisplay = formatTimeForDisplay(initialEndTime?.split('T')?.[1]?.slice(0, 5) ?? '')
  const bookingDate = date?.trim() ? date : startDate
  const formattedDate = bookingDate
    ? new Date(`${bookingDate}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Select a date first'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!seriesEndDate) {
      setError('Pick an end date for the series')
      setSubmitting(false)
      return
    }

    try {
      await onSubmit({
        room_id: initialRoomId,
        start_time: initialStartTime,
        end_time: initialEndTime,
        recurrence_type: recurrenceType,
        series_end_date: seriesEndDate,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create recurring booking'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="recurring-modal-overlay" role="dialog" aria-modal="true">
      <div className="recurring-modal">
        <button className="recurring-modal-close" type="button" onClick={onClose} aria-label="Close recurring booking dialog">
          &times;
        </button>
        <h2>Schedule recurring booking</h2>
        <p className="recurring-modal-intro">
          We will reserve the same room and time on a repeating schedule until the date you choose below.
        </p>

        <div className="recurring-modal-summary">
          <div className="entry">
            <span className="recurring-modal-summary-label">Room</span>
            <span className="recurring-modal-summary-value">{roomName ?? initialRoomId}</span>
          </div>
          <div className="entry">
            <span className="recurring-modal-summary-label">Building</span>
            <span className="recurring-modal-summary-value">{building ?? '—'}</span>
          </div>
          <div className="entry">
            <span className="recurring-modal-summary-label">Capacity</span>
            <span className="recurring-modal-summary-value">{capacity ? `${capacity} people` : '—'}</span>
          </div>
          <div className="entry">
            <span className="recurring-modal-summary-label">Date</span>
            <span className="recurring-modal-summary-value">{formattedDate}</span>
          </div>
          <div className="entry">
            <span className="recurring-modal-summary-label">Time</span>
            <span className="recurring-modal-summary-value">{startDisplay} – {endDisplay}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="recurring-modal-form">
          <label htmlFor="recurrence">Recurrence pattern</label>
          <select
            id="recurrence"
            value={recurrenceType}
            onChange={e => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly')}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <label htmlFor="series-end">Repeat until</label>
          <input
            id="series-end"
            type="date"
            value={seriesEndDate}
            min={startDate || undefined}
            onChange={e => setSeriesEndDate(e.target.value)}
            required
          />

          {error && <div className="recurring-modal-error">{error}</div>}

          <div className="recurring-modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting || !seriesEndDate}>
              {submitting ? 'Booking…' : 'Book series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
};

export default RecurringBookingModal;
