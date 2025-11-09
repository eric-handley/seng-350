import React, { useMemo, useState } from 'react'
import { Equipment, Room } from '../types'
import { formatTimeForDisplay } from '../utils/time'
import RecurringBookingModal, { RecurringBookingFormData } from './RecurringBookingModal'
import { useEquipment } from '../hooks/useEquipment'

interface RoomCardProps {
  room: Room & { room_id?: string }
  date: string
  start: string
  end: string
  onBook: (room: Room) => void
  isReserved?: boolean
  onBookRecurring?: (data: RecurringBookingFormData) => Promise<void>
}

type EquipmentModalProps = {
  open: boolean
  equipment: Equipment[]
  onClose: () => void
  roomName: string
}

const EquipmentDetailsModal: React.FC<EquipmentModalProps> = ({ open, equipment, onClose, roomName }) => {
  if (!open) { return null }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`${roomName} equipment`}>
      <div className="modal equipment-modal">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{roomName} equipment</h3>
        </div>
        <div className="modal-body">
          {equipment.length === 0 ? (
            <p className="equipment-modal-empty">No equipment is associated with this room.</p>
          ) : (
            <ul className="equipment-modal-list">
              {equipment.map(item => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  date,
  start,
  end,
  onBook,
  isReserved = false,
  onBookRecurring,
}) => {
  const [showRecurring, setShowRecurring] = useState(false)
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)

  const { equipment, loading: equipmentLoading, error: equipmentError } = useEquipment(room.id)

  const handleBookRecurring = async (data: RecurringBookingFormData) => {
    if (!onBookRecurring) { return }
    try {
      await onBookRecurring(data)
      setShowRecurring(false)
    } catch {
      // Error handled by modal via setError
    }
  }

  const cardClassName = useMemo(() => (
    ['card', isReserved ? 'reserved' : ''].filter(Boolean).join(' ')
  ), [isReserved])

  const timeRange = `${formatTimeForDisplay(start)}–${formatTimeForDisplay(end)}`
  const hasEquipment = equipment.length > 0

  return (
    <article className={cardClassName}>
      <div className="row">
        <div>
          <h3>{room.name}</h3>
          <div className="meta">
            <span>Building: <strong>{room.building}</strong></span>
            <span>ID: {room.id}</span>
          </div>
        </div>
        <div className="badges-row">
          <span className="badge kv">{room.capacity} ppl</span>
          {isReserved && <span className="badge danger">Reserved</span>}
        </div>
      </div>

      <div className="subheader">
        <div className="meta" style={{ marginTop: 8 }}>
          <span>{date || 'Select a date'}</span>
          <span>{timeRange}</span>
        </div>
        {equipmentLoading && <div className="meta">Loading equipment…</div>}
        {equipmentError && <div className="meta">Equipment error: {equipmentError}</div>}
        {!equipmentLoading && !equipmentError && hasEquipment && (
          <button
            type="button"
            className="btn secondary compact"
            style={{ alignSelf: 'flex-start', marginTop: 4 }}
            onClick={() => setShowEquipmentModal(true)}
          >
            View equipment
          </button>
        )}
      </div>

      <div className="card-actions">
        <button
          className="btn primary"
          onClick={() => onBook(room)}
          disabled={isReserved}
        >
          {isReserved ? 'Reserved' : 'Book room'}
        </button>

        {onBookRecurring && (
          <button
            className="btn primary alt"
            onClick={() => setShowRecurring(true)}
            disabled={isReserved}
          >
            Book recurring
          </button>
        )}
      </div>

      {showRecurring && (
        <RecurringBookingModal
          open={showRecurring}
          onClose={() => setShowRecurring(false)}
          onSubmit={handleBookRecurring}
          initialRoomId={room.room_id ?? room.id}
          initialStartTime={date ? `${date}T${start}:00Z` : ''}
          initialEndTime={date ? `${date}T${end}:00Z` : ''}
          roomName={room.name}
          building={room.building}
          capacity={room.capacity}
          date={date}
        />
      )}

      <EquipmentDetailsModal
        open={showEquipmentModal}
        equipment={equipment}
        onClose={() => setShowEquipmentModal(false)}
        roomName={room.name}
      />
    </article>
  )
}

export default RoomCard
