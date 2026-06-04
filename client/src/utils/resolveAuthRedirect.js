/** Turn react-router `location.state.from` into a path string for post-login redirect. */
export function resolveAuthRedirect(from, fallback = '/account') {
  if (!from) return fallback
  if (typeof from === 'string') return from
  if (typeof from === 'object' && from.pathname) {
    return `${from.pathname}${from.search || ''}`
  }
  return fallback
}
