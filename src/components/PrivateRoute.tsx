import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { authService } from '@/lib/auth'

interface PrivateRouteProps {
  children: React.ReactNode
  roles?: string[]
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const location = useLocation()
  const isAuthed = authService.isAuthenticated()
  
  if (!isAuthed) {
    return <Navigate to={`/?from=${encodeURIComponent(location.pathname)}`} replace />
  }
  if (roles && roles.length > 0 && !authService.hasAnyRole(roles)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default PrivateRoute


