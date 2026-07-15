import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navLinkClass = ({ isActive }) =>
  `block cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
    ? 'bg-white text-black shadow-sm'
    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
  }`

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-gray-800 bg-black text-white">

        {/* Profile */}
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Admin Panel
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {user?.name ?? user?.email ?? 'Admin'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 p-4">
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
          <NavLink to="/admin/catalogs" className={navLinkClass}>
            Catalogs
          </NavLink>
          <NavLink to="/admin/reports" className={navLinkClass}>
            Reports
          </NavLink>
        </nav>

        {/* Bottom */}
        <div className="p-4 space-y-3 border-t border-gray-800">

          {/* 1 */}

          <button
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="w-full cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen min-w-0 pl-64">
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