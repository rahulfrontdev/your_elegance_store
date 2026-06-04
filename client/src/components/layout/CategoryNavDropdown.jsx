import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createPortal } from 'react-dom'
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
  const { scrollNavVisible } = useNavDropdown()
  const isScroll = variant === 'scroll'
  /* Only one navbar shows the menu — avoids duplicate panels (main + scroll) */
  const showMenuPanel =
    isOpen && (isScroll ? scrollNavVisible : !scrollNavVisible)
  const triggerRef = useRef(null)
  const [portalPos, setPortalPos] = useState(null)

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

  const updatePortalPos = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerOnDesktop = window.innerWidth >= 768
    setPortalPos({
      top: rect.bottom,
      left: centerOnDesktop ? rect.left + rect.width / 2 : rect.left,
      transform: centerOnDesktop ? 'translateX(-50%)' : 'none',
    })
  }, [])

  useEffect(() => {
    if (!isScroll || !showMenuPanel) return
    updatePortalPos()
    window.addEventListener('scroll', updatePortalPos, true)
    window.addEventListener('resize', updatePortalPos)
    return () => {
      window.removeEventListener('scroll', updatePortalPos, true)
      window.removeEventListener('resize', updatePortalPos)
    }
  }, [isScroll, showMenuPanel, updatePortalPos])

  const handleEnter = () => {
    if (isScroll) updatePortalPos()
    onMouseEnter()
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

  const scrollPortal =
    isScroll &&
    showMenuPanel &&
    portalPos &&
    createPortal(
      <div
        className="scroll-primary-nav__dropdown-panel scroll-primary-nav__dropdown-panel--portal nav-dropdown--open"
        style={{
          position: 'fixed',
          top: portalPos.top,
          left: portalPos.left,
          transform: portalPos.transform,
          zIndex: 5110,
        }}
        role="menu"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {panelInner}
      </div>,
      document.body
    )

  return (
    <>
      <div
        ref={triggerRef}
        className={`${wrapClass}${isOpen ? ' nav-dropdown--open' : ''}`}
        onMouseEnter={handleEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          type="button"
          className={triggerClass}
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={onTriggerClick}
        >
          {category.name} ▾
        </button>
        {!isScroll && showMenuPanel && (
          <div className={panelClass} role="menu">
            {panelInner}
          </div>
        )}
      </div>
      {scrollPortal}
    </>
  )
}

export default CategoryNavDropdown
