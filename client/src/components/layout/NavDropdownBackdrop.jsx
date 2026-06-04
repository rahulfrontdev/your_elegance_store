import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** Dim overlay for touch devices only — one per navbar, hides when menu closes */
const NavDropdownBackdrop = ({ open, onClose }) => {
  const [showOnTouch, setShowOnTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setShowOnTouch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!open || !showOnTouch) return null

  return createPortal(
    <button
      type="button"
      className="nav-dropdown-backdrop nav-dropdown-backdrop--menu"
      aria-label="Close menu"
      onMouseDown={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={onClose}
    />,
    document.body
  )
}

export default NavDropdownBackdrop
