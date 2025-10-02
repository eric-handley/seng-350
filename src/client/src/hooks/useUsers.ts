import { useState } from 'react'
import { User } from '../types'
import { INITIAL_USERS } from '../constants'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [addingUser, setAddingUser] = useState<User | null>(null)

  const handleEditUser = (user: User) => {
    setEditingUser(user)
  }

  const handleSaveUser = (updated: User) => {
    //TODO: interact with database
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    )
    setEditingUser(null)
  }

  const handleAddUser = (user: User) => {
    setAddingUser(user)
  }

  const handleSaveNewUser = (newUser: User) => {
    //TODO: interact with database
    setUsers((prev) => [
      ...prev,
      {
        ...newUser,
        id: Math.random().toString(36).slice(2, 9), // generate unique ID
      },
    ])
    setAddingUser(null)
  }

  const handleBlockUser = (user: User) => {
    //TODO: interact with database
    //TODO: delete all booking associated with user?
    //TODO: prevent blocking self?
    //TODO: save history of blocked users?
    if (window.confirm(`Are you sure you want to block ${user.name}? This action will remove them from the system, cancel any active bookings, and cannot be undone.`)) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    }
  }

  return {
    users,
    editingUser,
    addingUser,
    handleEditUser,
    handleSaveUser,
    handleAddUser,
    handleSaveNewUser,
    handleBlockUser,
    setEditingUser,
    setAddingUser,
  }
}