import axiosInstance, { publicAxiosInstance } from './axiosInstance'

const REELS_BASE = '/reels'

export const fetchReels = (params = {}) =>
  publicAxiosInstance.get(REELS_BASE, { params })

export const fetchReelById = (reelId) =>
  publicAxiosInstance.get(`${REELS_BASE}/${reelId}`)

export const adminFetchReels = (params = { all: true }) =>
  axiosInstance.get(REELS_BASE, { params })

export const adminFetchReelById = (reelId) =>
  axiosInstance.get(`${REELS_BASE}/${reelId}`)

export const adminCreateReel = (body) =>
  axiosInstance.post(REELS_BASE, body)

export const adminUpdateReel = (reelId, body) =>
  axiosInstance.put(`${REELS_BASE}/${reelId}`, body)

export const adminDeleteReel = (reelId) =>
  axiosInstance.delete(`${REELS_BASE}/${reelId}`)
