import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="p-8 font-body text-ink">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <div className="p-8 font-body text-ink">Setting up your profile…</div>

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
