import axiosInstance from './axiosInstance'

const ADDRESS_BASE = '/address'

export const getAddressesRequest = (params = {}) =>
  axiosInstance.get(ADDRESS_BASE, { params })

export const getAddressByIdRequest = (addressId) =>
  axiosInstance.get(`${ADDRESS_BASE}/${addressId}`)

export const createAddressRequest = (body) =>
  axiosInstance.post(ADDRESS_BASE, body)

export const updateAddressRequest = (addressId, body) =>
  axiosInstance.put(`${ADDRESS_BASE}/${addressId}`, body)

export const deleteAddressRequest = (addressId) =>
  axiosInstance.delete(`${ADDRESS_BASE}/${addressId}`)

export const setDefaultAddressRequest = (addressId) =>
  axiosInstance.patch(`${ADDRESS_BASE}/${addressId}/default`)

export function pickAddressApiError(error, fallback = 'Address request failed') {
  const data = error?.response?.data
  if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim()
  if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim()
  if (Array.isArray(data?.errors)) {
    const messages = data.errors
      .map((entry) => entry?.msg || entry?.message)
      .filter(Boolean)
    if (messages.length) return messages.join(', ')
  }
  return error?.message || fallback
}

export function pickAddressFieldErrors(error) {
  const data = error?.response?.data
  const fieldErrors = {}

  if (Array.isArray(data?.errors)) {
    data.errors.forEach((entry) => {
      const field = entry?.path || entry?.param || entry?.field
      const message = entry?.msg || entry?.message
      if (field && message) fieldErrors[field] = message
    })
  }

  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    Object.entries(data.errors).forEach(([field, value]) => {
      if (Array.isArray(value)) fieldErrors[field] = value.filter(Boolean).join(', ')
      else if (typeof value === 'string') fieldErrors[field] = value
      else if (typeof value?.message === 'string') fieldErrors[field] = value.message
    })
  }

  return fieldErrors
}
