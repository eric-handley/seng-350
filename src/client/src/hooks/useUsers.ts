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

  const handleSaveUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    setEditingUser(null)
  }

  const handleAddUser = () => {
    setAddingUser({
      id: '',
      email: '',
      first_name: '',
      last_name: '',
      role: UserRole.STAFF,
    })
  }

  const handleSaveNewUser = (newUser: User) => {
    const userWithId = {
      ...newUser,
      id: newUser.id || `usr-${Math.random().toString(36).slice(2, 10)}`,
    }
    setUsers(prev => [...prev, userWithId])
    setAddingUser(null)
  }

  const handleBlockUser = () => {
    // TODO: integrate with API once blocking is supported
  }

  return {
    users,
    editingUser,
    addingUser,
    isLoading,
    loadError,
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
