import React, { useState } from 'react'
import { User, UserRole } from '../types'
import UsersTab from '../components/UserTab'
import EditUser from '../components/EditUser'
import AddUser from '../components/AddUser'

interface UsersPageProps {
  users: User[]
  currentUser: User
  editingUser: User | null
  addingUser: User | null
  error: string | null
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
  const [editingRoleUser, setEditingRoleUser] = useState<User | null>(null)

  if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.REGISTRAR) {
    return null
  }

  const handleEditRole = (user: User) => {
    setEditingRoleUser(user)
  }

  const handleSaveRole = (updatedUser: User) => {
    onSaveUser(updatedUser)
    setEditingRoleUser(null)
  }

  const handleCancelRoleEdit = () => {
    setEditingRoleUser(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <UsersTab
        users={users}
        currentUser={currentUser}
        error={error}
        handleEditUser={onEditUser}
        handleAddUser={onAddUser}
        handleBlockUser={onBlockUser}
        handleEditRole={handleEditRole} // <-- Pass the handler
      />
      {editingUser && (
        <EditUser
          user={editingUser}
          currentUser={currentUser}
          onSave={onSaveUser}
          onCancel={onCancelEdit}
        />
      )}
      {editingRoleUser && (
        <EditUser
          user={editingRoleUser}
          currentUser={currentUser}
          onSave={handleSaveRole}
          onCancel={handleCancelRoleEdit}
        />
      )}
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
