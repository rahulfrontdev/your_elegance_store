import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navLinkClass = ({ isActive }) =>
  `block cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
    ? 'bg-white text-black shadow-sm'
    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
  }`

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col overflow-hidden border-r border-gray-800 bg-black text-white">

        {/* Profile */}
        <div className="shrink-0 border-b border-gray-800 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Admin Panel
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {user?.name ?? user?.email ?? 'Admin'}
          </p>
        </div>

        {/* Navigation — scrolls when menu is taller than the viewport */}
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
          <NavLink to="/admin" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/categories" className={navLinkClass}>
            Categories
          </NavLink>
          <NavLink to="/admin/products" className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            Customers
          </NavLink>
          <NavLink to="/admin/reviews" className={navLinkClass}>
            Reviews
          </NavLink>
          <NavLink to="/admin/carousel" className={navLinkClass}>
            Home Promotional
          </NavLink>
          <NavLink to="/admin/reels" className={navLinkClass}>
            Reels
          </NavLink>
          <NavLink to="/admin/discounts" className={navLinkClass}>
            Discounts
          </NavLink>
          <NavLink to="/admin/special-discounts" className={navLinkClass}>
            Special Discounts
          </NavLink>
          <NavLink to="/admin/catalogs" className={navLinkClass}>
            Catalogs
          </NavLink>
          <NavLink to="/admin/reports" className={navLinkClass}>
            Reports
          </NavLink>
        </nav>

        {/* Bottom — always pinned below the scrollable nav */}
        <div className="shrink-0 border-t border-gray-800 bg-black p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen min-w-0 pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-end border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:px-6">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </header>
        <div className="p-2 lg:p-2">
          <div className="rounded shadow-sm  text-black p-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout