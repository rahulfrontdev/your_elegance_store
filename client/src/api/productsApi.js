import { axiosInstance } from './axiosInstance'

export const fetchProducts = (params = {}) => axiosInstance.get('/products', { params })

export const fetchProductById = (productId) => axiosInstance.get(`/products/${productId}`)

export const fetchProductsByCategory = (category) =>
  axiosInstance.get('/products', { params: { category } })

export const fetchLatestProducts = (limit = 10) =>
  axiosInstance.get('/products/latest', { params: { limit } })

/** Real offers: specialOfferPrice < price, sorted by best discount. Params: limit (max 50), minDiscountPercent */
export const fetchBestDealProducts = (params = {}) =>
  axiosInstance.get('/products/best-deals', { params })
