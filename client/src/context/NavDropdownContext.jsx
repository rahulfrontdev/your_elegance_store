import { createContext, useContext, useMemo, useState } from 'react'
import useCategoryNavigation from '../hooks/useCategoryNavigation'
import useHoverNavDropdown from '../hooks/useHoverNavDropdown'
import usePrefersClickNav from '../hooks/usePrefersClickNav'
import CategoryMobileMenu from '../components/layout/CategoryMobileMenu'
import NavDropdownBackdrop from '../components/layout/NavDropdownBackdrop'

const NavDropdownContext = createContext(null)

export function NavDropdownProvider({ locationKey, children }) {
  const navDropdown = useHoverNavDropdown(locationKey)
  const categoryNavigation = useCategoryNavigation()
  const prefersClickNav = usePrefersClickNav()
  const [scrollNavVisible, setScrollNavVisible] = useState(false)

  const openCategory = useMemo(
    () => categoryNavigation.find((category) => String(category.id) === navDropdown.openId) ?? null,
    [categoryNavigation, navDropdown.openId]
  )

  const value = useMemo(
    () => ({
      ...navDropdown,
      scrollNavVisible,
      setScrollNavVisible,
      prefersClickNav,
    }),
    [navDropdown, scrollNavVisible, prefersClickNav]
  )

  return (
    <NavDropdownContext.Provider value={value}>
      <NavDropdownBackdrop open={Boolean(navDropdown.openId)} onClose={navDropdown.close} />
      {prefersClickNav && (
        <CategoryMobileMenu
          category={openCategory}
          open={Boolean(openCategory)}
          onClose={navDropdown.close}
        />
      )}
      {children}
    </NavDropdownContext.Provider>
  )
}

export function useNavDropdown() {
  const value = useContext(NavDropdownContext)
  if (!value) {
    throw new Error('useNavDropdown must be used within NavDropdownProvider')
  }
  return value
}

export default NavDropdownContext
