import { useCallback, useEffect, useRef, useState } from 'react'

const CLOSE_DELAY_MS = 120

/**
 * One open nav dropdown at a time; opens on hover, closes shortly after pointer leaves.
 */
export default function useHoverNavDropdown(closeOnLocationKey) {
  const [openId, setOpenId] = useState(null)
  const closeTimer = useRef(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const open = useCallback(
    (id) => {
      clearCloseTimer()
      setOpenId(String(id))
    },
    [clearCloseTimer]
  )

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }, [clearCloseTimer])

  const close = useCallback(() => {
    clearCloseTimer()
    setOpenId(null)
  }, [clearCloseTimer])

  const toggle = useCallback(
    (id) => {
      clearCloseTimer()
      const key = String(id)
      setOpenId((prev) => (prev === key ? null : key))
    },
    [clearCloseTimer]
  )

  useEffect(() => {
    close()
  }, [closeOnLocationKey, close])

  /* Close on outside tap or when any menu child link is tapped */
  useEffect(() => {
    if (!openId) return

    const menuLinkSelector =
      '.site-navbar-primary__panel-inner a, .scroll-primary-nav__dropdown-panel-inner a'

    const onPointerDown = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      if (target.closest('.nav-dropdown-backdrop')) {
        close()
        return
      }

      /* Let menu links handle close + navigate on click (avoid unmount before tap) */
      if (target.closest(menuLinkSelector)) return

      if (target.closest('.nav-dropdown')) return
      if (target.closest('.scroll-primary-nav__dropdown-panel--portal')) return

      close()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [openId, close])

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  return { openId, open, scheduleClose, close, toggle }
}
