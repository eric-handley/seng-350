import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { User } from '../types'

interface AuthContextType {
  currentUser: User | null
  login: (user: User) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/auth/session', {
        credentials: 'include',
      })

      if (response.ok) {
        const data: { user: User } = await response.json()
        setCurrentUser(data.user)
      } else if (response.status === 401) {
        setCurrentUser(null)
      } else {
        console.error('Unexpected session response', response.status)
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Failed to restore session', error)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  const login = (user: User) => {
    setCurrentUser(user)
  }

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok && response.status !== 401) {
        console.error('Failed to log out', response.status)
      }
    } catch (error) {
      console.error('Failed to log out', error)
    } finally {
      setCurrentUser(null)
    }
  }

  const isAuthenticated = !!currentUser

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated,
      isLoading,
      refreshSession: fetchSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
