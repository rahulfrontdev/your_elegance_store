import axiosInstance from './axiosInstance'

const AUTH_USER_KEY = 'auth_user'

/** Cart schema often requires `user`; some backends omit it from JWT-only flows. */
function authUserIdForCart() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw)
    const id = u?._id ?? u?.id
    if (id == null || id === '') return null
    return String(id).trim()
  } catch {
    return null
  }
}

function withCartUser(body) {
  const uid = authUserIdForCart()
  if (!uid) return body
  return { ...body, user: uid }
}

export const fetchCart = () => axiosInstance.get('/cart/get')

export const mergeCartRequest = (body) => axiosInstance.post('/cart/merge', body)
export const addCartItem = (body) => axiosInstance.post('/cart/add', withCartUser(body))
export const updateCartItemQty = (body) => axiosInstance.put('/cart/update', withCartUser(body))
export const clearCartRequest = () => axiosInstance.delete('/cart/clear')
export const removeCartItem = (productId) => axiosInstance.delete(`/cart/remove/${productId}`)

