import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    // Redirect to appropriate page based on role
    if (currentUser.role === UserRole.ADMIN) {
      return <Navigate to="/admin-panel" replace />
    } else {
      return <Navigate to="/home" replace />
    }
  }

  return <>{children}</>
}
