import axiosInstance, { publicAxiosInstance } from './axiosInstance'

/**
 * Admin: Bearer JWT via axiosInstance.
 * Public home carousel: GET /carousel (active slides; adjust if your backend uses e.g. /carousel/active).
 */

export const adminFetchAllCarouselSlides = () =>
  axiosInstance.get('/carousel/admin/all')

export const adminFetchCarouselSlideById = (id) =>
  axiosInstance.get(`/carousel/admin/${id}`)

/** @param {FormData} formData — must include `image` (File) for create */
export const adminCreateCarouselSlide = (formData) =>
  axiosInstance.post('/carousel', formData, {
    headers: formData instanceof FormData ? { 'Content-Type': false } : undefined,
  })

/** @param {string} id @param {FormData} formData — optional `image` (File) */
export const adminUpdateCarouselSlide = (id, formData) =>
  axiosInstance.put(`/carousel/${id}`, formData, {
    headers: formData instanceof FormData ? { 'Content-Type': false } : undefined,
  })

export const adminDeleteCarouselSlide = (id) =>
  axiosInstance.delete(`/carousel/${id}`)

/** Storefront: no auth. Default `GET /carousel` (under `VITE_API_BASE_URL`). Override with `VITE_PUBLIC_CAROUSEL_PATH` e.g. `carousel/active`. */
const publicCarouselPath = (
  import.meta.env.VITE_PUBLIC_CAROUSEL_PATH || 'carousel'
).replace(/^\/+/, '')

export const fetchPublicCarouselSlides = () =>
  publicAxiosInstance.get(publicCarouselPath)
