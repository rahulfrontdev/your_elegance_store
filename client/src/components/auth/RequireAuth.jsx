import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/** Customer must be signed in (wishlist, account, checkout account areas). */
const RequireAuth = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

export default RequireAuth
