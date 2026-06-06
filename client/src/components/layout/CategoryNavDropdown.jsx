import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNavDropdown } from '../../context/NavDropdownContext'
import CategoryNavTree from './CategoryNavTree'

const CategoryNavDropdown = ({
  category,
  variant = 'primary',
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onTriggerClick,
  onNavigate,
}) => {
  const navigate = useNavigate()
  const { scrollNavVisible, prefersClickNav } = useNavDropdown()
  const isScroll = variant === 'scroll'
  const isActiveNav = isScroll ? scrollNavVisible : !scrollNavVisible
  const showDesktopPanel = isOpen && isActiveNav && !prefersClickNav

  const wrapClass = isScroll
    ? 'scroll-primary-nav__details nav-dropdown'
    : 'site-navbar-primary__details nav-dropdown'
  const triggerClass = isScroll ? 'scroll-primary-nav__summary' : 'site-navbar-primary__summary'
  const panelClass = isScroll ? 'scroll-primary-nav__dropdown-panel' : 'site-navbar-primary__panel'
  const panelInnerClass = isScroll
    ? 'scroll-primary-nav__dropdown-panel-inner'
    : 'site-navbar-primary__panel-inner'

  const closeMenu = useCallback(() => {
    flushSync(() => onNavigate?.())
  }, [onNavigate])

  const activateMenuLink = useCallback(
    (to) => (event) => {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      navigate(to)
    },
    [closeMenu, navigate]
  )

  const handleTriggerClick = (event) => {
    event.stopPropagation()
    if (!isActiveNav) return
    onTriggerClick()
  }

  const handleEnter = () => {
    if (prefersClickNav || !isActiveNav) return
    onMouseEnter()
  }

  const handleLeave = () => {
    if (prefersClickNav) return
    onMouseLeave()
  }

  const panelInner = (
    <div className={panelInnerClass}>
      <a
        href={category.to}
        className="category-nav-tree__link"
        onClick={activateMenuLink(category.to)}
      >
        All {category.name}
      </a>
      <CategoryNavTree nodes={category.children} onMenuLinkActivate={closeMenu} />
    </div>
  )

  return (
    <div
      className={`${wrapClass}${isOpen && isActiveNav ? ' nav-dropdown--open' : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="true"
        aria-expanded={isOpen && isActiveNav}
        onClick={handleTriggerClick}
      >
        {category.name} ▾
      </button>
      {showDesktopPanel && (
        <div className={panelClass} role="menu">
          {panelInner}
        </div>
      )}
    </div>
  )
}

export default CategoryNavDropdown
