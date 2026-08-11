import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordWithToken } from '../api/authApi'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams])
  const loginPath = searchParams.get('from') === 'admin' ? '/admin/login' : '/login'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Invalid reset link. Please request a new password reset email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      const { data } = await resetPasswordWithToken({ token, password })
      setMessage(data?.message || 'Password updated successfully.')
      window.setTimeout(() => navigate(loginPath, { replace: true }), 1800)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Could not reset password.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip px-4">
      <img
        src="/background_image.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="low"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">New password</h1>
            <p className="mt-2 text-sm text-neutral-600">Choose a new password for your account.</p>
          </div>

          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-rose-600" role="alert">
                This reset link is invalid or missing.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-neutral-800">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-xs font-medium text-neutral-800"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  placeholder="Repeat password"
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-xs font-medium text-emerald-700" role="status">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-neutral-600">
            <Link to={loginPath} className="font-semibold text-blue-600 hover:text-blue-700">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
