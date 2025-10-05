import React from 'react'
import { User } from '../types'
import UsersTab from '../components/UserTab'
import EditUser from '../components/EditUser'
import AddUser from '../components/AddUser'
import { error } from 'console'

interface UsersPageProps {
  users: User[]
  currentUser: User
  editingUser: User | null
  addingUser: User | null
  error: string | null
  onEditUser: (user: User) => void
  onSaveUser: (user: User) => void
  onAddUser: (user: User) => void
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
  if (currentUser.role !== 'admin' && currentUser.role !== 'registrar') {
    return null
  }

  return (
    <>
      <UsersTab
        users={users}
        currentUser={currentUser}
        error={error}
        handleEditUser={onEditUser}
        handleAddUser={onAddUser}
        handleBlockUser={onBlockUser}
      />
      {editingUser && (
        <EditUser
          user={editingUser}
          onSave={onSaveUser}
          onCancel={onCancelEdit}
        />
      )}
      {addingUser && (
        <AddUser
          user={addingUser}
          currentUser={currentUser} // <-- this must be present!
          onSave={onSaveNewUser}
          onCancel={onCancelAdd}
        />
      )}
    </>
  )
}
