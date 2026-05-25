import { useCallback, useState } from 'react'
import {
  createAddressRequest,
  deleteAddressRequest,
  getAddressByIdRequest,
  getAddressesRequest,
  pickAddressApiError,
  pickAddressFieldErrors,
  setDefaultAddressRequest,
  updateAddressRequest,
} from '../api/addressApi'

const DEFAULT_QUERY = { page: 1, limit: 10 }

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries({ ...DEFAULT_QUERY, ...params }).filter(([, value]) => {
      if (value == null) return false
      if (typeof value === 'string') return value.trim() !== ''
      return true
    })
  )
}

function hasFilter(params) {
  return Boolean(params.city || params.state || params.search)
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function pickPayload(data) {
  return data?.data ?? data
}

function extractAddressList(data) {
  const payload = pickPayload(data)
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.addresses)) return payload.addresses
  if (Array.isArray(payload?.docs)) return payload.docs
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(data?.addresses)) return data.addresses
  return []
}

function extractAddress(data) {
  const payload = pickPayload(data)
  return payload?.address || payload || data?.address || null
}

function extractMeta(data, fallbackCount = 0) {
  const payload = pickPayload(data)
  const pagination = payload?.pagination || payload?.meta || data?.pagination || data?.meta || {}
  const total =
    pagination.total ??
    pagination.totalDocs ??
    pagination.count ??
    payload?.total ??
    payload?.count ??
    data?.total ??
    data?.count ??
    fallbackCount

  return {
    ...pagination,
    total: Number(total) || fallbackCount,
  }
}

function addressId(address) {
  return address?._id || address?.id
}

export function useAddresses() {
  const [addresses, setAddresses] = useState([])
  const [totalAddressCount, setTotalAddressCount] = useState(0)
  const [meta, setMeta] = useState({ total: 0 })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [currentQuery, setCurrentQuery] = useState(DEFAULT_QUERY)

  const refreshAddressCount = useCallback(async () => {
    const { data } = await getAddressesRequest(DEFAULT_QUERY)
    const list = extractAddressList(data)
    const nextMeta = extractMeta(data, list.length)
    setTotalAddressCount(nextMeta.total || list.length)
    return nextMeta.total || list.length
  }, [])

  const fetchAddresses = useCallback(async (query = {}) => {
    const params = cleanParams(query)
    setCurrentQuery(params)
    setLoading(true)
    setError('')

    try {
      const { data } = await getAddressesRequest(params)
      const list = extractAddressList(data)
      const nextMeta = extractMeta(data, list.length)
      setAddresses(asArray(list))
      setMeta(nextMeta)
      if (!hasFilter(params)) setTotalAddressCount(nextMeta.total || list.length)
      return { ok: true, addresses: list, meta: nextMeta }
    } catch (requestError) {
      const message = pickAddressApiError(requestError, 'Failed to load addresses')
      setError(message)
      return {
        ok: false,
        message,
        fieldErrors: pickAddressFieldErrors(requestError),
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const viewAddress = useCallback(async (addressIdValue) => {
    setActionLoading(`view:${addressIdValue}`)
    try {
      const { data } = await getAddressByIdRequest(addressIdValue)
      return { ok: true, address: extractAddress(data) }
    } catch (requestError) {
      return {
        ok: false,
        message: pickAddressApiError(requestError, 'Failed to load address'),
        fieldErrors: pickAddressFieldErrors(requestError),
      }
    } finally {
      setActionLoading('')
    }
  }, [])

  const createAddress = useCallback(
    async (body) => {
      if (totalAddressCount >= 3) {
        return { ok: false, message: 'You can save a maximum of 3 addresses.' }
      }

      setActionLoading('create')
      try {
        const { data } = await createAddressRequest(body)
        await fetchAddresses(currentQuery)
        await refreshAddressCount().catch(() => undefined)
        return { ok: true, address: extractAddress(data) }
      } catch (requestError) {
        return {
          ok: false,
          message: pickAddressApiError(requestError, 'Failed to add address'),
          fieldErrors: pickAddressFieldErrors(requestError),
        }
      } finally {
        setActionLoading('')
      }
    },
    [currentQuery, fetchAddresses, refreshAddressCount, totalAddressCount]
  )

  const updateAddress = useCallback(
    async (addressIdValue, body) => {
      setActionLoading(`update:${addressIdValue}`)
      try {
        const { data } = await updateAddressRequest(addressIdValue, body)
        await fetchAddresses(currentQuery)
        await refreshAddressCount().catch(() => undefined)
        return { ok: true, address: extractAddress(data) }
      } catch (requestError) {
        return {
          ok: false,
          message: pickAddressApiError(requestError, 'Failed to update address'),
          fieldErrors: pickAddressFieldErrors(requestError),
        }
      } finally {
        setActionLoading('')
      }
    },
    [currentQuery, fetchAddresses, refreshAddressCount]
  )

  const deleteAddress = useCallback(
    async (addressIdValue) => {
      setActionLoading(`delete:${addressIdValue}`)
      try {
        await deleteAddressRequest(addressIdValue)
        await fetchAddresses(currentQuery)
        await refreshAddressCount().catch(() => undefined)
        return { ok: true }
      } catch (requestError) {
        return {
          ok: false,
          message: pickAddressApiError(requestError, 'Failed to delete address'),
          fieldErrors: pickAddressFieldErrors(requestError),
        }
      } finally {
        setActionLoading('')
      }
    },
    [currentQuery, fetchAddresses, refreshAddressCount]
  )

  const setDefaultAddress = useCallback(
    async (addressIdValue) => {
      const previous = addresses
      setAddresses((current) =>
        current.map((address) => ({
          ...address,
          isDefault: String(addressId(address)) === String(addressIdValue),
        }))
      )
      setActionLoading(`default:${addressIdValue}`)

      try {
        const { data } = await setDefaultAddressRequest(addressIdValue)
        await fetchAddresses(currentQuery)
        return { ok: true, address: extractAddress(data) }
      } catch (requestError) {
        setAddresses(previous)
        return {
          ok: false,
          message: pickAddressApiError(requestError, 'Failed to set default address'),
          fieldErrors: pickAddressFieldErrors(requestError),
        }
      } finally {
        setActionLoading('')
      }
    },
    [addresses, currentQuery, fetchAddresses]
  )

  return {
    addresses,
    totalAddressCount,
    meta,
    loading,
    actionLoading,
    error,
    fetchAddresses,
    refreshAddressCount,
    viewAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  }
}

export default useAddresses
