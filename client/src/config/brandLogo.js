/** Main header + splash */
export const STORE_LOGO_SRC = '/your Elegance Store (16).png'
export const STORE_LOGO_FALLBACK = '/Logo2.png'

/** Sticky bar after scroll — unchanged from original */
export const SCROLL_NAV_LOGO_SRC = '/Logo2.png'

export function applyStoreLogoFallback(event) {
  const img = event?.currentTarget
  if (!img || img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = STORE_LOGO_FALLBACK
}
