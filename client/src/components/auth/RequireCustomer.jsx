import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { clearAuthStorage } from '../../utils/authStorage'

const RequireCustomer = ({ children }) => {
  const { isAdmin } = useAuth()
  const location = useLocation()

  if (isAdmin) {
    clearAuthStorage()
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default RequireCustomer
