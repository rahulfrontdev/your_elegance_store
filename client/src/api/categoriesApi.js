import { publicAxiosInstance } from './axiosInstance'

export const fetchCategories = () => publicAxiosInstance.get('/categories')
export const fetchCategoryTree = (options = {}) =>
  publicAxiosInstance.get('/categories/tree', { params: options })
export const fetchRootCategories = (options = {}) =>
  publicAxiosInstance.get('/categories/getRoot', { params: options })

export const fetchCategoryById = (categoryId) =>
  publicAxiosInstance.get(`/categories/${categoryId}`)

export const fetchCategoryChildren = (categoryId, options = {}) =>
  publicAxiosInstance.get(`/categories/${categoryId}/children`, { params: options })
