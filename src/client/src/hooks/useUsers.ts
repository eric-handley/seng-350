import { useCallback, useEffect, useState } from 'react'
import { User, UserRole } from '../types'

interface UseUsersOptions {
  autoLoad?: boolean
}

export const useUsers = ({ autoLoad = true }: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [addingUser, setAddingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await fetch('http://localhost:3000/users', { credentials: 'include' })
      if (!response.ok) {
        throw new Error(`Failed to load users (status ${response.status})`)
      }
      const data: User[] = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoLoad) {
      void fetchUsers()
    }
  }, [autoLoad, fetchUsers])

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

  const handleAddUser = (currentUser: User) => {
    // Only allow admin to create registrar/admin, registrar can only create staff
    setAddingUser({
      id: '',
      email: '',
      first_name: '',
      last_name: '',
      role: UserRole.STAFF,
    })
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
        setError(null)
      } else {
        setError('Failed to add user')
      }
    } catch (error) {
      setError('Error adding user')
    }
  }

  const handleBlockUser = async (user: User) => {
    try {
      const response = await fetch(`/users/${user.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== user.id))
        setError(null)
      } else {
        setLoadError('Failed to remove user')
      }
    } catch (error) {
      setLoadError('Error removing user')
    }
  }

  return {
    users,
    editingUser,
    addingUser,
    isLoading,
    loadError,
    error,
    refreshUsers: fetchUsers,
    handleEditUser,
    handleSaveUser,
    handleAddUser,
    handleSaveNewUser,
    handleBlockUser,
    setEditingUser,
    setAddingUser,
  }
}
