import React from 'react'
import { User } from '../types'
import UsersTab from '../components/UserTab'
import EditUser from '../components/EditUser'
import AddUser from '../components/AddUser'

interface UsersPageProps {
  users: User[]
  currentUser: User
  editingUser: User | null
  addingUser: User | null
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
          onSave={onSaveNewUser}
          onCancel={onCancelAdd}
        />
      )}
    </>
  )
}
