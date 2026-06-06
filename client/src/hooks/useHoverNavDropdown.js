import { useCallback, useEffect, useRef, useState } from 'react'

const CLOSE_DELAY_MS = 120

/**
 * One open nav dropdown at a time; opens on hover (desktop), tap (mobile).
 */
export default function useHoverNavDropdown(closeOnLocationKey) {
  const [openId, setOpenId] = useState(null)
  const closeTimer = useRef(null)
  const ignoreOutsideUntil = useRef(0)

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const open = useCallback(
    (id) => {
      clearCloseTimer()
      ignoreOutsideUntil.current = Date.now() + 250
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
      setOpenId((prev) => {
        const next = prev === key ? null : key
        if (next) ignoreOutsideUntil.current = Date.now() + 250
        return next
      })
    },
    [clearCloseTimer]
  )

  useEffect(() => {
    close()
  }, [closeOnLocationKey, close])

  /* Desktop only — mobile uses backdrop tap to close */
  useEffect(() => {
    if (!openId) return

    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (isTouch) return

    const menuLinkSelector =
      '.site-navbar-primary__panel-inner a, .scroll-primary-nav__dropdown-panel-inner a'

    const onOutside = (event) => {
      if (Date.now() < ignoreOutsideUntil.current) return

      const target = event.target
      if (!(target instanceof Element)) return

      if (target.closest(menuLinkSelector)) return
      if (target.closest('.nav-dropdown')) return

      close()
    }

    document.addEventListener('mousedown', onOutside, true)
    return () => document.removeEventListener('mousedown', onOutside, true)
  }, [openId, close])

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  return { openId, open, scheduleClose, close, toggle }
}
