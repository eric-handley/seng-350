import { useState, useEffect } from 'react'
import { User } from '../types'
import { INITIAL_USERS } from '../constants'

export const useUsers = (currentUser: User) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [addingUser, setAddingUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleEditUser = (user: User) => setEditingUser(user)

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
        setError(null)
      } else {
        setError('Failed to save user')
      }
    } catch (err) {
      setError(`Error saving user: ${String(err)}`)
    }
  }

  const handleAddUser = () => {
    const tempUser: User = {
      id: crypto.randomUUID(),
      first_name: '',
      last_name: '',
      email: '',
      role: 'staff',
      isBlocked: false,
    }
    setAddingUser(tempUser);
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
      setError('Failed to add user')
    }
  } catch (error) {
    setError('Error adding user')
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
        setError(null)
      } else {
        setError('Failed to block user')
      }
    } catch (err) {
      setError(`Error blocking user: ${String(err)}`)
    }
  }

  return {
    users,
    editingUser,
    addingUser,
    error,
    handleEditUser,
    handleSaveUser,
    handleAddUser,
    handleSaveNewUser,
    handleBlockUser,
    setEditingUser,
    setAddingUser,
  }
}