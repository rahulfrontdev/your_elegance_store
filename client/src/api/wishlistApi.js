import axiosInstance from './axiosInstance'

export const toggleWishlistItem = (productId) =>
  axiosInstance.post(`/wishlist/toggle/${productId}`)

export const fetchWishlistStatus = (productId) =>
  axiosInstance.get(`/wishlist/${productId}/status`)

export const fetchWishlist = () => axiosInstance.get('/wishlist')

export const deleteWishlistItem = (productId) =>
  axiosInstance.delete(`/wishlist/${productId}`)

export const clearWishlist = () => axiosInstance.delete('/wishlist')
