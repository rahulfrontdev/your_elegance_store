import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

/** Dim overlay for touch devices only — one per navbar, hides when menu closes */
const NavDropdownBackdrop = ({ open, onClose }) => {
  const [showOnTouch, setShowOnTouch] = useState(isTouchDevice)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setShowOnTouch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!open || !showOnTouch) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open, showOnTouch])

  if (!open || !showOnTouch) return null

  return createPortal(
    <button
      type="button"
      className="nav-dropdown-backdrop nav-dropdown-backdrop--menu"
      aria-label="Close menu"
      onClick={onClose}
    />,
    document.body
  )
}

export default NavDropdownBackdrop
