import { NavLink } from 'react-router-dom'
import { useNavDropdown } from '../../context/NavDropdownContext'
import useCategoryNavigation from '../../hooks/useCategoryNavigation'
import CategoryNavDropdown from './CategoryNavDropdown'

const primaryNavLinkClass = ({ isActive }) =>
  `site-navbar-primary__link${isActive ? ' site-navbar-primary__link--active' : ''}`

const SiteNavbar = () => {
  const categoryNavigation = useCategoryNavigation()
  const { openId, open, scheduleClose, close, toggle } = useNavDropdown()

  return (
    <nav className="site-navbar-primary" aria-label="Primary navigation">
      <div className="site-navbar-primary__inner">
        <NavLink to="/" end className={primaryNavLinkClass}>
          Home
        </NavLink>

        <NavLink to="/products" className={primaryNavLinkClass}>
          Products
        </NavLink>

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
            <NavLink key={category.id} to={category.to} className={primaryNavLinkClass}>
              {category.name}
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}

export default SiteNavbar
