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

  const handleSaveUser = async (updatedUser: User) => {
    try {
      const response = await fetch(`/users/${updatedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.role,
          isBlocked: updatedUser.isBlocked ?? false,
        }),
      })
      if (response.ok) {
        const savedUser = await response.json()
        setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u))
        setEditingUser(null)
      } else {
        console.error('Failed to save user')
      }
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleAddUser = () => {
    setAddingUser({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      role: 'staff',
      isBlocked: false,
    } as User)
  }

  const handleSaveNewUser = async (newUser: User) => {
    try {
      const response = await fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      if (response.ok) {
        const createdUser = await response.json()
        setUsers(prev => [...prev, createdUser])
        setAddingUser(null)
      } else {
        console.error('Failed to add user')
      }
    } catch (error) {
      console.error('Error adding user:', error)
    }
  }

  const handleBlockUser = async (userId: string) => {
    try {
      const response = await fetch(`/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: true }),
      })
      if (response.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === userId ? { ...u, isBlocked: true } : u
          )
        )
      } else {
        console.error('Failed to block user')
      }
    } catch (error) {
      console.error('Error blocking user:', error)
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