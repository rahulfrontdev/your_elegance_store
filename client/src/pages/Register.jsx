import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../api/axiosInstance'

const initialForm = { name: '', mobile: '', email: '', password: '', confirmPassword: '' }

const Register = () => {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/checkout'

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.mobile.trim() || !form.password) {
      setError('Please fill in full name, mobile number and password.')
      return
    }
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address or leave it empty.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
      }
      if (form.email.trim()) {
        payload.email = form.email.trim().toLowerCase()
      }

      await axiosInstance.post('/auth/register', payload)
      navigate('/login', {
        replace: true,
        state: { from: redirectTo, registeredMobile: form.mobile.trim() },
      })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed.'
      setError(String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip px-4 py-6">
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
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Create account</h1>
            <p className="mt-2 text-sm text-neutral-600">Join us to explore products and offers.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-neutral-800">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={onChange}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                placeholder="Your full name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mobile" className="mb-1 block text-xs font-medium text-neutral-800">
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  value={form.mobile}
                  onChange={onChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-neutral-800">
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-neutral-800">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-neutral-800">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" state={{ from: redirectTo }} className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
