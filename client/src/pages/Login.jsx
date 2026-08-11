import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../api/axiosInstance'
import { useCart } from '../context/CartContext.jsx'
import { isAdminRole, isCustomerRole, useAuth } from '../context/AuthContext.jsx'
import { clearAuthStorage } from '../utils/authStorage'
import { resolveAuthRedirect } from '../utils/resolveAuthRedirect'

const initialForm = { email: '', password: '' }

const Login = ({ roleMode = 'customer' }) => {
    const location = useLocation()
    const registeredEmail = location.state?.registeredEmail || ''
    const [form, setForm] = useState(() => ({
        ...initialForm,
        email: registeredEmail,
    }))
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { mergeGuestCart } = useCart()
    const { setUser, isAdmin, isCustomer } = useAuth()
    const redirectTo = resolveAuthRedirect(location.state?.from, '/account')
    const registeredMobile = location.state?.registeredMobile || ''
    const isAdminLogin = roleMode === 'admin'
    const hasWrongStoredRole = (isAdminLogin && isCustomer) || (!isAdminLogin && isAdmin)

    useEffect(() => {
        if (!hasWrongStoredRole) return
        clearAuthStorage()
        setUser(null)
    }, [hasWrongStoredRole, setUser])

    if (isAdminLogin && isAdmin && !submitting) {
        return <Navigate to="/admin" replace />
    }
    if (!isAdminLogin && isCustomer && !submitting) {
        return <Navigate to={redirectTo} replace />
    }
    if (hasWrongStoredRole) {
        return null
    }

    const onChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.email.trim() || !form.password) {
            setError('Please enter email and password.')
            return
        }

        try {
            setSubmitting(true)
            clearAuthStorage()
            setUser(null)
            const { data } = await axiosInstance.post('/auth/login', {
                email: form.email.trim().toLowerCase(),
                password: form.password,
            })

            if (data?.token) {
                localStorage.setItem('token', data.token)
            }

            const email = (data?.user?.email || data?.email || form.email).trim().toLowerCase()
            const roleFromUser = data?.user?.role
            const roleTopLevel = data?.role
            const resolvedRole = roleFromUser ?? roleTopLevel ?? 'customer'
            const isResolvedAdmin = isAdminRole(resolvedRole)

            if (isAdminLogin && !isResolvedAdmin) {
                clearAuthStorage()
                setError('Admin access only. Please login with an admin account.')
                return
            }

            if (!isAdminLogin && !isCustomerRole(resolvedRole)) {
                clearAuthStorage()
                setError('Please use the admin login for admin accounts.')
                return
            }

            const nameFromResponse = data?.user?.name || data?.name || data?.fullName || ''
            const idFromResponse = data?.user?._id || data?._id || data?.user?.id || data?.id

            let storedMobile = ''
            try {
                const existingUser = JSON.parse(localStorage.getItem('auth_user') || 'null')
                storedMobile = existingUser?.mobile || existingUser?.phone || ''
            } catch {
                storedMobile = ''
            }
            const mobileFromResponse = data?.user?.mobile || data?.mobile || data?.phone || ''
            const resolvedMobile = mobileFromResponse || registeredMobile || storedMobile

            const nextUser = data?.user
                ? {
                    ...data.user,
                    role: resolvedRole,
                    name: data.user.name || nameFromResponse,
                    ...(resolvedMobile ? { mobile: resolvedMobile } : {}),
                }
                : {
                    _id: idFromResponse,
                    name: nameFromResponse,
                    email,
                    role: resolvedRole,
                    ...(resolvedMobile ? { mobile: resolvedMobile } : {}),
                }

            setUser(nextUser)

            if (isResolvedAdmin) {
                navigate('/admin', { replace: true })
            } else {
                const mergeResult = await mergeGuestCart()
                if (!mergeResult.ok) {
                    clearAuthStorage()
                    setUser(null)
                    setError(mergeResult.message || 'Could not merge guest cart. Please try again.')
                    return
                }
                navigate(redirectTo, { replace: true })
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Login failed.'
            setError(String(msg))
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
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                        {isAdminLogin ? 'Admin login' : 'Welcome back'}
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600">
                        {isAdminLogin ? 'Sign in to manage the admin panel.' : 'Sign in to view your orders and account.'}
                    </p>
                </div>

                <div>
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
                                value={form.email}
                                onChange={onChange}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <label htmlFor="password" className="block text-xs font-medium text-neutral-800">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    state={isAdminLogin ? { from: '/admin/login' } : undefined}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={onChange}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                                placeholder="Your password"
                            />
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
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    {isAdminLogin ? (
                        <p className="mt-4 text-center text-xs text-neutral-600">
                            Customer?{' '}
                            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                                Go to user login
                            </Link>
                        </p>
                    ) : (
                        <p className="mt-4 text-center text-xs text-neutral-600">
                            New here?{' '}
                            <Link to="/register" state={{ from: redirectTo }} className="font-semibold text-blue-600 hover:text-blue-700">
                                Create an account
                            </Link>
                        </p>
                    )}
                </div>
                </div>
            </div>
        </div>
    )
}

export default Login
