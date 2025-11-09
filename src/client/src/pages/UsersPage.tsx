import React from 'react'
import { User, UserRole } from '../types'
import UsersTab from '../components/UserTab'
import EditUser from '../components/EditUser'
import AddUser from '../components/AddUser'

/**
 * UsersPage
 *
 * Responsibilities:
 * - Gate access: visible only to Admin and Registrar roles
 * - Display the user management table with actions (edit, add, block)
 * - Show contextual editors (EditUser/AddUser) when invoked
 * - Surface any upstream error message from user operations
 */
interface UsersPageProps {
  // Full list of users to manage
  users: User[]
  // The currently authenticated user (used for role gating and permissions)
  currentUser: User
  // When set, render the EditUser panel for this user
  editingUser: User | null
  // When set, render the AddUser panel with a prefilled draft user
  addingUser: User | null
  // Optional error string to show in the UsersTab
  error: string | null

  // Callbacks for user actions triggered from the UI
  onEditUser: (user: User) => void
  onSaveUser: (user: User) => void
  onAddUser: () => void
  onSaveNewUser: (user: User) => void
  onBlockUser: (user: User) => void
  onCancelEdit: () => void
  onCancelAdd: () => void
}

export const UsersPage: React.FC<UsersPageProps> = ({
  users,
  currentUser,
  editingUser,
  addingUser,
  error,
  onEditUser,
  onSaveUser,
  onAddUser,
  onSaveNewUser,
  onBlockUser,
  onCancelEdit,
  onCancelAdd
}) => {
  // Role gate: only Admin and Registrar can access user management
  if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.REGISTRAR) {
    return null
  }

  return (
    // Vertical stack layout for the tab + optional editors
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Main user table with actions (edit/add/block). Error is displayed within the tab. */}
      <UsersTab
        users={users}
        currentUser={currentUser}
        error={error}
        handleEditUser={onEditUser}
        handleAddUser={onAddUser}
        handleBlockUser={onBlockUser}
      />

      {/* Inline editor for updating an existing user. Shown when editingUser is set. */}
      {editingUser && (
        <EditUser
          user={editingUser}
          currentUser={currentUser}
          onSave={onSaveUser}
          onCancel={onCancelEdit}
        />
      )}

      {/* Inline form for creating a new user. Shown when addingUser is set. */}
      {addingUser && (
        <AddUser
          user={addingUser}
          currentUser={currentUser}
          onSave={onSaveNewUser}
          onCancel={onCancelAdd}
        />
      )}
    </div>
  )
}