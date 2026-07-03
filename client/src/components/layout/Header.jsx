import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useCategoryNavigation from '../../hooks/useCategoryNavigation'
import { SCROLL_NAV_LOGO_SRC, STORE_LOGO_SRC, applyStoreLogoFallback } from '../../config/brandLogo'
import { useNavDropdown } from '../../context/NavDropdownContext'
import CategoryNavDropdown from './CategoryNavDropdown'

const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

/** Show compact bar after this scroll distance (px). */
const SCROLL_SECONDARY_SHOW_PX = 100
/** Hide slightly earlier when scrolling back up (reduces flicker). */
const SCROLL_SECONDARY_HIDE_PX = 60

const scrollNavLinkClass = ({ isActive }) =>
  `scroll-primary-nav__link whitespace-nowrap px-2 py-1 text-sm hover:opacity-90${
    isActive ? ' scroll-primary-nav__link--active' : ' text-slate-900'
  }`

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [draftQuery, setDraftQuery] = useState('')

  const onProducts = location.pathname === '/products'
  const qFromUrl = searchParams.get('q') ?? ''
  const searchValue = onProducts ? qFromUrl : draftQuery

  const setSearchValue = (v) => {
    if (onProducts) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const trimmed = v.trim()
          if (trimmed) next.set('q', trimmed)
          else next.delete('q')
          return next
        },
        { replace: true }
      )
    } else {
      setDraftQuery(v)
    }
  }

  const { cartCount } = useCart()
  const { isAdmin, isAuthenticated, user, logout } = useAuth()
  const [showScrollNav, setShowScrollNav] = useState(false)
  const categoryNavigation = useCategoryNavigation()
  const { openId, open, scheduleClose, close, toggle, setScrollNavVisible } = useNavDropdown()

  useEffect(() => {
    setScrollNavVisible(showScrollNav)
  }, [showScrollNav, setScrollNavVisible])

  useEffect(() => {
    document.body.classList.toggle('scroll-nav-visible', showScrollNav)
    return () => document.body.classList.remove('scroll-nav-visible')
  }, [showScrollNav])

  useEffect(() => {
    if (!showScrollNav) close()
  }, [showScrollNav, close])

  useEffect(() => {
    const getScrollTop = () => {
      const main = document.querySelector('.app-layout__main')
      return Math.max(
        window.scrollY ?? 0,
        window.pageYOffset ?? 0,
        document.documentElement?.scrollTop ?? 0,
        document.body?.scrollTop ?? 0,
        main?.scrollTop ?? 0
      )
    }

    const onScroll = () => {
      const y = getScrollTop()
      setShowScrollNav((prev) => {
        if (prev) return y > SCROLL_SECONDARY_HIDE_PX
        return y > SCROLL_SECONDARY_SHOW_PX
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll)

    const mainEl = document.querySelector('.app-layout__main')
    mainEl?.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      mainEl?.removeEventListener('scroll', onScroll)
    }
  }, [location.pathname])

  const onSearch = (e) => {
    e.preventDefault()
    const q = searchValue.trim()
    if (onProducts) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (q) next.set('q', q)
          else next.delete('q')
          return next
        },
        { replace: true }
      )
    } else if (q) {
      navigate(`/products?q=${encodeURIComponent(q)}`)
    } else {
      navigate('/products')
    }
  }

  const onLogoutClick = () => {
    const shouldLogout = window.confirm('Are you sure you want to logout?')
    if (!shouldLogout) return
    logout()
    navigate('/login', { replace: true })
  }

  const searchForm = (
    <form className="site-header__search" onSubmit={onSearch} role="search">
      <input
        type="search"
        name="q"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search products…"
        className="site-header__search-input"
        autoComplete="off"
      />
      <button type="submit" className="site-header__search-submit" aria-label="Search">
        <IconSearch />
      </button>
    </form>
  )

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="site-header__logo" aria-label="Your Elegance Store home">
            <img
              src={STORE_LOGO_SRC}
              alt="Your Elegance Store"
              className="site-header__logo-img"
              onError={applyStoreLogoFallback}
            />
          </Link>

          <div className="site-header__search-wrap ">
            {searchForm}
          </div>

          <div className="site-header__actions">
            {user && (
              <div className="hidden md:flex items-center gap-2 mr-1">
                <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                  Hi, {user?.name || 'User'}
                </span>
                <button
                  type="button"
                  onClick={onLogoutClick}
                  className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            )}
            {isAdmin && (
              <Link to="/admin" className="site-header__icon-link" aria-label="Admin dashboard" title="Admin">
                <LayoutDashboard size={20} strokeWidth={1.75} />
              </Link>
            )}
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              state={isAuthenticated ? undefined : { from: { pathname: '/account' } }}
              className="site-header__icon-link"
              aria-label={isAuthenticated ? 'Account' : 'Sign in'}
            >
              <IconUser />
            </Link>
            <Link
              to={isAuthenticated ? '/wishlist' : '/login'}
              state={isAuthenticated ? undefined : { from: { pathname: '/wishlist' } }}
              className="site-header__icon-link"
              aria-label={isAuthenticated ? 'Wishlist' : 'Sign in to view wishlist'}
            >
              <IconHeart />
            </Link>
            <Link to="/cart" className="site-header__icon-link site-header__cart-link" aria-label="Shopping cart">
              <IconCart />
              {cartCount > 0 && (
                <span className="site-header__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Portal + z-index from .scroll-primary-nav (5000) so this bar is never under .site-header (1100). */}
      {createPortal(
        <nav
          className={`scroll-primary-nav${showScrollNav ? ' scroll-primary-nav--visible' : ''}`}
          aria-label="Quick navigation"
        >
          <div className="scroll-primary-nav__inner">
            <div className="scroll-primary-nav__brand">
              <Link to="/" aria-label="Home">
                <img src={SCROLL_NAV_LOGO_SRC} alt="" className="scroll-primary-nav__logo" />
              </Link>
            </div>

            <div className="scroll-primary-nav__search">{searchForm}</div>

            <div className="scroll-primary-nav__links">
              <NavLink to="/" end className={scrollNavLinkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={scrollNavLinkClass}>
                Products
              </NavLink>

              {categoryNavigation.map((category) =>
                category.children.length > 0 ? (
                  <CategoryNavDropdown
                    key={category.id}
                    category={category}
                    variant="scroll"
                    isOpen={openId === String(category.id)}
                    onMouseEnter={() => open(category.id)}
                    onMouseLeave={scheduleClose}
                    onTriggerClick={() => toggle(category.id)}
                    onNavigate={close}
                  />
                ) : (
                  <NavLink key={category.id} to={category.to} className={scrollNavLinkClass}>
                    {category.name}
                  </NavLink>
                )
              )}
            </div>

            <div className="scroll-primary-nav__actions">
              {user && (
                <div className="hidden md:flex items-center gap-2 mr-1">
                  <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                    {user?.name || user?.fullName || 'User'}
                  </span>
                  <button
                    type="button"
                    onClick={onLogoutClick}
                    className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="site-header__icon-link scroll-primary-nav__icon"
                  aria-label="Admin dashboard"
                  title="Admin"
                >
                  <LayoutDashboard size={20} strokeWidth={1.75} />
                </Link>
              )}
              <Link
                to={isAuthenticated ? '/account' : '/login'}
                state={isAuthenticated ? undefined : { from: { pathname: '/account' } }}
                className="site-header__icon-link scroll-primary-nav__icon"
                aria-label={isAuthenticated ? 'Account' : 'Sign in'}
              >
                <IconUser />
              </Link>
              <Link
                to={isAuthenticated ? '/wishlist' : '/login'}
                state={isAuthenticated ? undefined : { from: { pathname: '/wishlist' } }}
                className="site-header__icon-link scroll-primary-nav__icon"
                aria-label={isAuthenticated ? 'Wishlist' : 'Sign in to view wishlist'}
              >
                <IconHeart />
              </Link>
              <Link
                to="/cart"
                className="site-header__icon-link scroll-primary-nav__icon site-header__cart-link"
                aria-label="Shopping cart"
              >
                <IconCart />
                {cartCount > 0 && (
                  <span className="site-header__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </Link>
            </div>
          </div>
        </nav>,
        document.body
      )}

    </>
  )
}

export default Header
