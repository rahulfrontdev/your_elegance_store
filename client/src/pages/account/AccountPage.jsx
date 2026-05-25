import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: 'orders', label: 'My Orders' },
  { to: 'wishlist', label: 'Wishlist' },
  { to: 'profile', label: 'Profile' },
  { to: 'my-address', label: 'My Address' },
]

const AccountPage = () => {
  const linkClass = ({ isActive }) =>
    `block rounded-xl px-3 py-2 text-sm transition ${isActive
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-neutral-700 hover:bg-neutral-100'
    }`

  return (
    <div className="mx-auto max-w-8xl px-2 py-1.5">
      <header className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">My Account</h1>
        <p className="mt-1 text-sm text-neutral-600">Manage orders, wishlist, and profile.</p>
      </header>

      <div className="sticky top-0 z-20 -mx-2 mb-3 border-y border-neutral-200 bg-white/95 px-2 py-1.5 backdrop-blur lg:hidden">
        <nav aria-label="Account navigation tabs" className="flex gap-1.5 overflow-x-auto pb-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="hidden rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm lg:block">
          <nav aria-label="Account navigation" className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

export default AccountPage
