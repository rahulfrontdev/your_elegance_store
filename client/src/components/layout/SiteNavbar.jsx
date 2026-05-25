import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CategoryNavTree from './CategoryNavTree'
import useCategoryNavigation from '../../hooks/useCategoryNavigation'

const SiteNavbar = () => {
  const location = useLocation()
  const detailsRefs = useRef({})
  const categoryNavigation = useCategoryNavigation()

  useEffect(() => {
    Object.values(detailsRefs.current).forEach((el) => {
      if (el) el.open = false
    })
  }, [location.pathname, location.search])

  return (
    <nav className="site-navbar-primary" aria-label="Primary navigation">
      <div className="site-navbar-primary__inner">
        <Link to="/" className="site-navbar-primary__link">
          Home
        </Link>

        <Link to="/products" className="site-navbar-primary__link">
          Products
        </Link>

        {categoryNavigation.map((category) =>
          category.children.length > 0 ? (
            <details
              key={category.id}
              ref={(el) => {
                detailsRefs.current[category.id] = el
              }}
              className="site-navbar-primary__details"
            >
              <summary className="site-navbar-primary__summary">{category.name} ▾</summary>
              <div className="site-navbar-primary__panel">
                <Link to={category.to}>All {category.name}</Link>
                <CategoryNavTree nodes={category.children} />
              </div>
            </details>
          ) : (
            <Link key={category.id} to={category.to} className="site-navbar-primary__link">
              {category.name}
            </Link>
          )
        )}
      </div>
    </nav>
  )
}

export default SiteNavbar
