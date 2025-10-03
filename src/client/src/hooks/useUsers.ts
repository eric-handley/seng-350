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

  const handleSaveUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    setEditingUser(null)
  }

  const handleAddUser = () => {
    setAddingUser({
      id: '',
      name: '',
      email: '',
      role: 'staff',
    })
  }

  const handleSaveNewUser = (newUser: User) => {
    const userWithId = { ...newUser, id: `usr-${Math.random().toString(36).slice(2, 8)}` }
    setUsers(prev => [...prev, userWithId])
    setAddingUser(null)
  }

  const handleBlockUser = (userId: string) => {
    // ???
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