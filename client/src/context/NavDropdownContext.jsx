import { createContext, useContext, useMemo, useState } from 'react'
import useHoverNavDropdown from '../hooks/useHoverNavDropdown'
import NavDropdownBackdrop from '../components/layout/NavDropdownBackdrop'

const NavDropdownContext = createContext(null)

export function NavDropdownProvider({ locationKey, children }) {
  const navDropdown = useHoverNavDropdown(locationKey)
  const [scrollNavVisible, setScrollNavVisible] = useState(false)

  const value = useMemo(
    () => ({
      ...navDropdown,
      scrollNavVisible,
      setScrollNavVisible,
    }),
    [navDropdown, scrollNavVisible]
  )

  return (
    <NavDropdownContext.Provider value={value}>
      <NavDropdownBackdrop open={Boolean(navDropdown.openId)} onClose={navDropdown.close} />
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
