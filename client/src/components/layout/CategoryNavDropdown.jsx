import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavDropdown } from '../../context/NavDropdownContext'
import CategoryNavCascade from './CategoryNavCascade'

const CategoryNavDropdown = ({
  category,
  variant = 'primary',
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onTriggerClick,
  onNavigate,
}) => {
  const { scrollNavVisible, prefersClickNav, open, scheduleClose } = useNavDropdown()
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

  const keepOpen = useCallback(() => {
    open(category.id)
  }, [open, category.id])

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
          <div className={`${panelInnerClass} category-nav-cascade-shell`}>
            <CategoryNavCascade
              nodes={category.children}
              rootLabel={category.name}
              rootTo={category.to}
              onMenuLinkActivate={closeMenu}
              onKeepOpen={keepOpen}
              onRequestClose={scheduleClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryNavDropdown
