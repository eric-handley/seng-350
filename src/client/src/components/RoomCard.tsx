import React, { useState } from 'react'
import { Room } from '../types'
import { formatTimeForDisplay } from '../utils/time'
import RecurringBookingModal, { RecurringBookingFormData } from './RecurringBookingModal'
import { useEquipment } from '../hooks/useEquipment'



interface RoomCardProps {
  room: Room & { room_id?: string };
  date: string;
  start: string;
  end: string;
  onBook: (room: Room) => void;
  isReserved?: boolean;
  onBookRecurring?: (data: RecurringBookingFormData) => Promise<void>;
}


const RoomCard: React.FC<RoomCardProps> = ({ room, date, start, end, onBook, isReserved = false, onBookRecurring }) => {
  const [showRecurring, setShowRecurring] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  const { equipment, loading: equipmentLoading, error: equipmentError } = useEquipment(room.id);

  const handleBookRecurring = async (data: RecurringBookingFormData) => {
    if (!onBookRecurring) {return;}
    try {
      await onBookRecurring(data);
      setShowRecurring(false); // Close modal immediately after success
    } catch {
      // Error handled by modal
    }
  };

  return (
    <article className="card">
      <div className="row">
        <h3>{room.name}</h3>
        <span className="kv">{room.capacity} ppl</span>
      </div>
      <div className="meta">
        <span>Building: <strong>{room.building}</strong></span>
        <span>ID: {room.id}</span>
      </div>
      {equipment.length > 0 && (
        <div className="meta">
          <button
            onClick={() => setShowEquipment(!showEquipment)}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showEquipment ? 'Hide Equipment' : 'Show Equipment'}
          </button>
          {showEquipment && (
            <div style={{ marginTop: '4px' }}>
              Equipment: {equipment.map(e => e.name).join(', ')}
            </div>
          )}
        </div>
      )}
      {equipmentLoading && <div className="meta">Loading equipment...</div>}
      {equipmentError && <div className="meta error">Equipment error: {equipmentError}</div>}
      <div className="row" style={{ marginTop: 12 }}>
        <div className="meta">
          <span>{date}</span>
          <span>{formatTimeForDisplay(start)}–{formatTimeForDisplay(end)}</span>
        </div>
        <button
          className="btn primary"
          onClick={() => onBook(room)}
          disabled={isReserved}
          style={isReserved ? { opacity: 0.5, cursor: 'not-allowed', background: 'grey' } : {}}
        >
          {isReserved ? 'Reserved' : 'Book'}
        </button>
        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={() => setShowRecurring(true)}
          disabled={isReserved}
        >
          Book Recurring
        </button>
      </div>
      {showRecurring && (
        <RecurringBookingModal
          open={showRecurring}
          onClose={() => setShowRecurring(false)}
          onSubmit={handleBookRecurring}
          initialRoomId={room.room_id ?? room.id}
          initialStartTime={date ? `${date}T${start}:00Z` : ''}
          initialEndTime={date ? `${date}T${end}:00Z` : ''}
        />
      )}
    </article>
  );
};

export default RoomCard;
