import { useState } from 'react'
import { User } from '../types'

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const login = (user: User) => {
    setCurrentUser(user)
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const isAuthenticated = !!currentUser

  return {
    currentUser,
    login,
    logout,
    isAuthenticated,
  }
}