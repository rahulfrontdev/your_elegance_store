import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { requestPasswordReset } from '../api/authApi'

const ForgotPasswordPage = () => {
  const location = useLocation()
  const loginPath = location.state?.from === '/admin/login' ? '/admin/login' : '/login'
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }

    try {
      setSubmitting(true)
      const { data } = await requestPasswordReset(trimmed)
      setMessage(
        data?.message ||
          'If an account exists for that email, a password reset link has been sent.'
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Could not send reset email.'
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
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Forgot password</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Enter your account email and we&apos;ll send a reset link.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-neutral-800">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                placeholder="you@example.com"
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
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-600">
            Remember your password?{' '}
            <Link to={loginPath} className="font-semibold text-blue-600 hover:text-blue-700">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
