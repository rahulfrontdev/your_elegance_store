import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { clearAuthStorage } from '../../utils/authStorage'

/**
 * Renders children only when the logged-in user has role "admin".
 * Expects login API to return `{ token, user: { ..., role: "admin" | "customer" } }`.
 */
const RequireAdmin = ({ children }) => {
  const { isAdmin, user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  if (!isAdmin) {
    clearAuthStorage()
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default RequireAdmin
