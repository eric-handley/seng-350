import React from 'react'

// Simple confirmation dialog rendered via a modal overlay.
// Intended for destructive actions (use isDanger=true) or generic confirms.
interface ConfirmModalProps {
  // Controls visibility; when false, nothing is rendered.
  isOpen: boolean
  // label for title prop.
  title: string
  // Main message/body shown in the modal.
  message: string
  // Label for the confirm action button.
  confirmText?: string
  // Label for the cancel action button.
  cancelText?: string
  // Called when the user confirms.
  onConfirm: () => void
  // Called when the user cancels or dismisses.
  onCancel: () => void
  // When true, styles the confirm button as a destructive action.
  isDanger?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
  // ...existing code...
}) => {
  // Fast escape: do not render any DOM when closed.
  if (!isOpen) { return null }

  return (
    // Overlay blocks interaction with background content.
    <div className="modal-overlay">
      {/* Modal container for the dialog content.*/}
      <div className="modal">
        {/* Main message/body of the confirmation dialog */}
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        {/* Action row: primary (or danger) confirm and neutral cancel */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            // When destructive, use "danger" styling; otherwise use "primary"
            className={`btn ${isDanger ? 'danger' : 'primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            // Secondary action to dismiss without side effects
            className="btn"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}