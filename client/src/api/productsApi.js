import { publicAxiosInstance } from './axiosInstance'

export const fetchProducts = (params = {}) => publicAxiosInstance.get('/products', { params })

export const fetchProductById = (productId) =>
  publicAxiosInstance.get(`/products/${productId}`)

export const fetchProductsByCategory = (category) =>
  publicAxiosInstance.get('/products', { params: { category } })

export const fetchLatestProducts = (limit = 10) =>
  publicAxiosInstance.get('/products/latest', { params: { limit } })

/** Real offers: specialOfferPrice < price, sorted by best discount. Params: limit (max 50), minDiscountPercent */
export const fetchBestDealProducts = (params = {}) =>
  publicAxiosInstance.get('/products/best-deals', { params })
