import React from 'react'
import { Navigate } from 'react-router-dom'

import { authService } from '@/lib/auth'

interface PrivateRouteProps {
  children: React.ReactNode
  roles?: string[]
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const isAuthed = authService.isAuthenticated()
  if (!isAuthed) {
    return <Navigate to="/" replace />
  }
  if (roles && roles.length > 0 && !authService.hasAnyRole(roles)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default PrivateRoute


