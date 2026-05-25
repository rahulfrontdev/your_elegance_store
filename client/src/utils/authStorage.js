const AUTH_STORAGE_KEYS = ['token', 'auth_user', 'checkout_auth_user']

export function clearAuthStorage() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}
