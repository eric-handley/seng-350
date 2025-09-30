import React, { createContext, useContext, useState, ReactNode } from 'react'
import { User } from '../types'

interface AuthContextType {
  currentUser: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const login = (user: User) => {
    setCurrentUser(user)
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const isAuthenticated = !!currentUser

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated,
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