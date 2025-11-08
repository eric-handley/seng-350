import React, { useState } from 'react';
import '../styles/recurring-booking.css';

export interface RecurringBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringBookingFormData) => void;
  initialRoomId: string;
  initialStartTime: string;
  initialEndTime: string;
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
}) => {
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [seriesEndDate, setSeriesEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Always use the room_id from props, just like regular booking uses room.id
      await onSubmit({
        room_id: initialRoomId,
        start_time: initialStartTime,
        end_time: initialEndTime,
        recurrence_type: recurrenceType,
        series_end_date: seriesEndDate,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message ?? 'Failed to create recurring booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Book Recurring</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Recurrence:</label>
            <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly')}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label>Until (last date):</label>
            <input
              type="date"
              value={seriesEndDate}
              onChange={e => setSeriesEndDate(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" disabled={submitting}>Book Recurring</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringBookingModal;
