import { axiosInstance } from './axiosInstance'

export const fetchSpecialDiscountCategories = () =>
  axiosInstance.get('/special-discount-categories')

export const createSpecialDiscountCategory = (body) =>
  axiosInstance.post('/special-discount-categories', body)

export const updateSpecialDiscountCategory = (id, body) =>
  axiosInstance.patch(`/special-discount-categories/${id}`, body)

export const deleteSpecialDiscountCategory = (id) =>
  axiosInstance.delete(`/special-discount-categories/${id}`)
