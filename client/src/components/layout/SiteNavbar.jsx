import { Link } from 'react-router-dom'
import { useNavDropdown } from '../../context/NavDropdownContext'
import useCategoryNavigation from '../../hooks/useCategoryNavigation'
import CategoryNavDropdown from './CategoryNavDropdown'

const SiteNavbar = () => {
  const categoryNavigation = useCategoryNavigation()
  const { openId, open, scheduleClose, close, toggle } = useNavDropdown()

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
            <CategoryNavDropdown
              key={category.id}
              category={category}
              variant="primary"
              isOpen={openId === String(category.id)}
              onMouseEnter={() => open(category.id)}
              onMouseLeave={scheduleClose}
              onTriggerClick={() => toggle(category.id)}
              onNavigate={close}
            />
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
