import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, MapPin, Package, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import OptimizedImage from '../../components/common/OptimizedImage'
import { useAuth } from '../../context/AuthContext.jsx'
import { cancelOrderRequest, getUserOrdersRequest } from '../../api/orderApi'
import { resolveOrderLifecycle } from '../../utils/orderLifecycle'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

function canCancelOrder(status) {
  const normalized = String(status || '').trim().toLowerCase()
  return normalized === 'pending' || normalized === 'confirmed'
}

function pickApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
}

/** API may send `address` as a string or the same shape as `shippingAddress` (object). */
function formatOrderAddressLine(order) {
  const raw = order?.address
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  const addr = typeof raw === 'object' && raw !== null ? raw : order?.shippingAddress
  if (!addr || typeof addr !== 'object') return ''
  return [
    addr.fullName,
    addr.mobile,
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ')
}

const AccountOrdersPage = () => {
  const { user } = useAuth()
  const [apiOrders, setApiOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('Ordered by mistake')
  const [cancelingId, setCancelingId] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const loadOrders = useCallback(async () => {
    const userId = user?._id || user?.id
    if (!userId || !localStorage.getItem('token')) {
      setApiOrders([])
      return
    }

    setIsLoading(true)
    try {
      const params = debouncedSearch ? { q: debouncedSearch } : {}
      const { data } = await getUserOrdersRequest(userId, params)

      const list =
        (Array.isArray(data?.data) && data.data) ||
        data?.data?.orders ||
        data?.orders ||
        data?.data ||
        []

      const normalized = (Array.isArray(list) ? list : []).map((order) => {
        const lifecycle = resolveOrderLifecycle(order)
        return {
          id: order?._id || order?.id,
          orderId: order?.orderId || order?.id || order?._id,
          items: Array.isArray(order?.items) ? order.items : [],
          total: Number(
            order?.totalAmount ?? order?.total ?? order?.grandTotal ?? order?.pricing?.grandTotal ?? 0
          ),
          address: formatOrderAddressLine(order),
          placedAt: order?.placedAt || order?.createdAt,
          paymentStatus: lifecycle.paymentStatus,
          orderStatus: lifecycle.orderStatus,
          thumb:
            order?.items?.[0]?.imageUrl ||
            order?.items?.[0]?.image ||
            order?.items?.[0]?.product?.imageUrl ||
            order?.items?.[0]?.product?.images?.[0] ||
            '',
        }
      })
      setApiOrders(normalized.filter((order) => order.id))
    } catch {
      setApiOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [user?._id, user?.id, debouncedSearch])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const sortedOrders = useMemo(
    () => [...apiOrders].sort((a, b) => (b.placedAt ?? '').localeCompare(a.placedAt ?? '')),
    [apiOrders]
  )

  const openCancelModal = (order) => {
    setCancelTarget(order)
    setCancelReason('Ordered by mistake')
    setFeedback(null)
  }

  const closeCancelModal = () => {
    if (cancelingId) return
    setCancelTarget(null)
    setCancelReason('Ordered by mistake')
  }

  const submitCancelOrder = async () => {
    if (!cancelTarget || cancelingId) return
    const reason = cancelReason.trim()
    if (!reason) {
      setFeedback({ type: 'error', message: 'Please enter a cancellation reason.' })
      return
    }

    setCancelingId(cancelTarget.id)
    setFeedback(null)
    try {
      await cancelOrderRequest(cancelTarget.id, { reason })
      setFeedback({ type: 'success', message: 'Order cancelled successfully.' })
      setCancelTarget(null)
      setCancelReason('Ordered by mistake')
      await loadOrders()
    } catch (error) {
      setFeedback({ type: 'error', message: pickApiMessage(error, 'Could not cancel order.') })
    } finally {
      setCancelingId('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">My Orders</h2>
          <p className="mt-1 text-sm text-neutral-600">Your recent purchases placed from the cart.</p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search orders</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by order ID or product…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
          />
        </label>
      </div>

      {feedback?.message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-green-100 bg-green-50 text-green-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
          role="status"
        >
          {feedback.message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-neutral-600">Loading your orders...</p>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto mb-3 text-neutral-400" size={26} />
          <p className="text-sm font-medium text-neutral-700">
            {debouncedSearch ? 'No orders match your search.' : 'No orders yet.'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {debouncedSearch ? 'Try a different order ID or product name.' : 'Place an order to see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map((o) => {
            const firstItem = o.items?.[0]
            return (
              <div
                key={o.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    {o.thumb ? (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <OptimizedImage src={o.thumb} alt="" preset="thumb" variant="thumb" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{o.id}</p>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 capitalize">
                        {String(o.orderStatus || 'Placed').toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Order No: {o.orderId || o.id}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                      {firstItem
                        ? `${firstItem.name || firstItem.product?.name || 'Item'}${o.items.length > 1 ? ` + ${o.items.length - 1} more` : ''}`
                        : 'Order items'}
                    </p>
                  </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end">
                    <p className="text-sm text-neutral-500">Total</p>
                    <p className="text-lg font-bold text-neutral-900">₹{Number(o.total).toLocaleString('en-IN')}</p>
                  </div>
                </div>


                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Calendar size={16} className="text-neutral-400" />
                    <span>{formatDate(o.placedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <MapPin size={16} className="text-neutral-400" />
                    <span className="line-clamp-1">{o.address}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/account/orders/${o.id}`}
                    className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    View details
                  </Link>
                  {canCancelOrder(o.orderStatus) && (
                    <button
                      type="button"
                      onClick={() => openCancelModal(o)}
                      disabled={cancelingId === o.id}
                      className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelingId === o.id ? 'Cancelling...' : 'Cancel order'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-neutral-950">Cancel order?</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Order No: <span className="font-semibold text-neutral-900">{cancelTarget.orderId || cancelTarget.id}</span>
            </p>
            {feedback?.type === 'error' && (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {feedback.message}
              </p>
            )}
            <label className="mt-4 block text-sm">
              <span className="font-medium text-neutral-700">Cancellation reason</span>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={3}
                className="mt-1 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                placeholder="Ordered by mistake"
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={Boolean(cancelingId)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={submitCancelOrder}
                disabled={Boolean(cancelingId)}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelingId ? 'Cancelling...' : 'Cancel order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountOrdersPage

