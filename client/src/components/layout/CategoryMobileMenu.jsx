import { useCallback, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNavDropdown } from '../../context/NavDropdownContext'
import CategoryNavTree from './CategoryNavTree'

function measureMenuTop(scrollNavVisible) {
  const scrollNav = document.querySelector('.scroll-primary-nav--visible')
  const primaryNav = document.querySelector('.site-navbar-primary')
  const header = document.querySelector('.site-header')

  if (scrollNavVisible && scrollNav) {
    return scrollNav.getBoundingClientRect().bottom + 4
  }

  if (primaryNav) {
    return primaryNav.getBoundingClientRect().bottom + 4
  }

  if (header) {
    return header.getBoundingClientRect().bottom + 4
  }

  return 120
}

const CategoryMobileMenu = ({ category, open, onClose }) => {
  const navigate = useNavigate()
  const { scrollNavVisible } = useNavDropdown()
  const [menuTop, setMenuTop] = useState(120)

  useLayoutEffect(() => {
    if (!open) return

    const updateTop = () => {
      setMenuTop(measureMenuTop(scrollNavVisible))
    }

    updateTop()
    window.addEventListener('resize', updateTop)
    window.addEventListener('scroll', updateTop, true)
    window.visualViewport?.addEventListener('resize', updateTop)

    return () => {
      window.removeEventListener('resize', updateTop)
      window.removeEventListener('scroll', updateTop, true)
      window.visualViewport?.removeEventListener('resize', updateTop)
    }
  }, [open, scrollNavVisible])

  const activateMenuLink = useCallback(
    (to) => (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      navigate(to)
    },
    [navigate, onClose]
  )

  if (!open || !category) return null

  const maxHeight = Math.max(160, (window.visualViewport?.height ?? window.innerHeight) - menuTop - 12)

  return createPortal(
    <div
      className="category-mobile-menu"
      role="menu"
      aria-label={`${category.name} categories`}
      style={{ top: menuTop, maxHeight }}
    >
      <div className="category-mobile-menu__inner">
        <a
          href={category.to}
          className="category-nav-tree__link category-mobile-menu__all"
          onClick={activateMenuLink(category.to)}
        >
          All {category.name}
        </a>
        <CategoryNavTree nodes={category.children} onMenuLinkActivate={onClose} />
      </div>
    </div>,
    document.body
  )
}

export default CategoryMobileMenu
