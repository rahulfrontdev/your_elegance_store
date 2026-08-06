import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdminAllOrdersRequest, updateAdminOrderStatusRequest } from '../../api/orderApi'
import { resolveOrderLifecycle } from '../../utils/orderLifecycle'

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All payment statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Failed', label: 'Failed' },
]

const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'canceled', label: 'Canceled' },
]

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All order statuses' },
  ...ADMIN_ORDER_STATUS_OPTIONS,
]

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

function resolveLineProductId(line) {
  const raw = line?.productId ?? line?.product
  if (!raw) return ''
  if (typeof raw === 'object' && raw !== null) {
    return String(raw._id || raw.id || '').trim()
  }
  return String(raw).trim()
}

function findSnapshotLine(order, line) {
  const snapshotLines = order?.appliedDiscountSnapshot?.lines
  if (!Array.isArray(snapshotLines)) return null
  const productId = resolveLineProductId(line)
  if (!productId) return null
  return snapshotLines.find((snapLine) => resolveLineProductId(snapLine) === productId) || null
}

function normalizeOrderLines(items, order) {
  const list = Array.isArray(items) ? items : []
  return list
    .filter((line) => line != null && typeof line === 'object')
    .map((line, idx) => {
      const populated =
        (line.productId && typeof line.productId === 'object' && !Array.isArray(line.productId)
          ? line.productId
          : null) ||
        (line.product && typeof line.product === 'object' && !Array.isArray(line.product)
          ? line.product
          : null)
      const snapshotLine = findSnapshotLine(order, line)
      const raw =
        line.price ??
        line.unitPrice ??
        line.amount ??
        populated?.price ??
        populated?.specialOfferPrice
      const fromTotal =
        line.lineFinalTotal != null && (line.quantity ?? line.qty)
          ? Number(line.lineFinalTotal) / Math.max(1, Number(line.quantity ?? line.qty))
          : null
      const price = Number(
        fromTotal != null && Number.isFinite(fromTotal) ? fromTotal : raw ?? 0
      )
      return {
        key: resolveLineProductId(line) || line._id || idx,
        name: line.name || populated?.name || snapshotLine?.name || 'Item',
        sku: String(line.sku || populated?.sku || snapshotLine?.sku || '').trim(),
        qty: Number(line.quantity ?? line.qty ?? snapshotLine?.quantity ?? 1),
        price: Number.isFinite(price) ? price : 0,
      }
    })
}

function formatShippingAddressMultiline(addr) {
  if (!addr || typeof addr !== 'object') return '—'
  const lines = []
  if (addr.fullName) lines.push(String(addr.fullName))
  if (addr.mobile) lines.push(`Phone: ${addr.mobile}`)
  const street = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')
  if (street) lines.push(street)
  const cityLine = [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
  if (cityLine) lines.push(cityLine)
  if (addr.country) lines.push(String(addr.country))
  return lines.length ? lines.join('\n') : '—'
}

function formatAddressPreview(addr) {
  if (!addr || typeof addr !== 'object') return '—'
  const parts = [addr.city, addr.state, addr.pincode].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return addr.addressLine1 ? String(addr.addressLine1).slice(0, 32) + (addr.addressLine1.length > 32 ? '…' : '') : '—'
}

function formatLineSummary(line) {
  return `${line.name} ×${line.qty}`
}

function compactItemsSummary(items, order) {
  const list = normalizeOrderLines(items, order)
  if (list.length === 0) return { label: '—', totalQty: 0, lines: [] }
  const totalQty = list.reduce((s, it) => s + it.qty, 0)
  if (list.length === 1) {
    return { label: formatLineSummary(list[0]), totalQty, lines: list }
  }
  return {
    label: `${formatLineSummary(list[0])} +${list.length - 1} more`,
    totalQty,
    lines: list,
  }
}

function formatItemsSkuCell(lines = []) {
  const withSku = lines.filter((line) => String(line.sku || '').trim())
  if (withSku.length === 0) return null
  return withSku
}

function normalizeOrderStatusValue(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'cancelled' || value === 'canceled') return 'canceled'
  if (value === 'confirmed') return 'Confirmed'
  if (value === 'shipped') return 'shipped'
  if (value === 'delivered') return 'delivered'
  return 'pending'
}

const DISPATCH_STATUSES_REQUIRING_PAYMENT = new Set(['shipped', 'delivered'])

function isPaymentPendingStatus(status) {
  return String(status || '').trim().toLowerCase() === 'pending'
}

function requiresManualPaymentConfirmation(row, nextStatus) {
  const nextKey = normalizeOrderStatusValue(nextStatus)
  return isPaymentPendingStatus(row?.paymentStatus) && DISPATCH_STATUSES_REQUIRING_PAYMENT.has(nextKey)
}

function pickApiError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
}

/**
 * Admin GET /orders/admin/all body shape:
 * { success, count, total, page, limit, pages, data: Order[] }
 */
function normalizeOrdersPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { list: [], total: 0, page: 1, limit: 50, totalPages: 1 }
  }

  // Primary: paginated envelope with `data` as the orders array
  if (Array.isArray(payload.data) && (payload.total != null || payload.pages != null || payload.page != null)) {
    const list = payload.data
    const total = Number(payload.total ?? payload.count ?? list.length) || list.length
    const page = Number(payload.page ?? 1) || 1
    const limit = Number(payload.limit ?? 50) || 50
    const totalPages = Number(payload.pages) > 0 ? Number(payload.pages) : Math.max(1, Math.ceil(total / limit))
    return { list, total, page, limit, totalPages }
  }

  // Nested: { data: { data: [], total, page, limit, pages } }
  const inner = payload.data
  if (inner && typeof inner === 'object' && !Array.isArray(inner) && Array.isArray(inner.data)) {
    const list = inner.data
    const total = Number(inner.total ?? inner.count ?? payload.total ?? list.length) || list.length
    const page = Number(inner.page ?? payload.page ?? 1) || 1
    const limit = Number(inner.limit ?? payload.limit ?? 50) || 50
    const totalPages =
      Number(inner.pages ?? payload.pages) > 0
        ? Number(inner.pages ?? payload.pages)
        : Math.max(1, Math.ceil(total / limit))
    return { list, total, page, limit, totalPages }
  }

  // Plain array or legacy shapes
  const root = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : payload
  const list =
    (Array.isArray(payload.data) && payload.data) ||
    (Array.isArray(root?.orders) && root.orders) ||
    (Array.isArray(root?.data) && root.data) ||
    (Array.isArray(root?.items) && root.items) ||
    (Array.isArray(payload.orders) && payload.orders) ||
    []
  const total = Number(root?.total ?? root?.totalCount ?? root?.count ?? payload?.total ?? list.length) || list.length
  const page = Number(root?.page ?? root?.currentPage ?? payload?.page ?? 1) || 1
  const limit = Number(root?.limit ?? root?.pageSize ?? payload?.limit ?? 50) || 50
  const totalPages =
    Number(root?.pages ?? root?.totalPages ?? payload?.pages) > 0
      ? Number(root.pages ?? root.totalPages ?? payload.pages)
      : Math.max(1, Math.ceil(total / limit))

  return { list, total, page, limit, totalPages }
}

function currentMonthBounds() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const start = new Date(y, m, 1, 0, 0, 0, 0)
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
  const label = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  return { start, end, label }
}

function isOrderInRange(order, start, end) {
  const raw = order?.createdAt || order?.placedAt
  if (!raw) return false
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return false
  return d >= start && d <= end
}

async function fetchAllOrdersUnfiltered(maxPages = 80) {
  const limit = 100
  let page = 1
  let totalPages = 1
  const all = []
  while (page <= totalPages && page <= maxPages) {
    const { data } = await getAdminAllOrdersRequest({ page, limit })
    const { list, totalPages: tp } = normalizeOrdersPayload(data)
    all.push(...list)
    totalPages = tp || 1
    if (!list.length) break
    page += 1
  }
  return all
}

const TABS = [
  { id: 'orders', label: 'Orders' },
  { id: 'sales', label: 'Sales (this month)' },
]

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [detailRow, setDetailRow] = useState(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState('')
  const [statusFeedback, setStatusFeedback] = useState(null)
  const [paymentConfirm, setPaymentConfirm] = useState(null)

  const [salesLoading, setSalesLoading] = useState(false)
  const [salesError, setSalesError] = useState('')
  const [salesStats, setSalesStats] = useState(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (paymentStatus) params.paymentStatus = paymentStatus
      if (orderStatus) params.orderStatus = orderStatus
      if (debouncedSearch) params.q = debouncedSearch

      const { data } = await getAdminAllOrdersRequest(params)
      const { list, total, totalPages } = normalizeOrdersPayload(data)
      setOrders(list)
      setMeta({ total, totalPages })
    } catch (e) {
      const msg =
        e?.response?.status === 403
          ? e?.response?.data?.message || 'Admin access only.'
          : e?.response?.data?.message || e?.message || 'Failed to load orders.'
      setError(msg)
      setOrders([])
      setMeta({ total: 0, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }, [page, limit, paymentStatus, orderStatus, debouncedSearch])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    if (activeTab !== 'orders') return
    loadOrders()
  }, [activeTab, loadOrders])

  const handleOrderStatusChange = async (row, nextStatus, options = {}) => {
    if (!row?.id || !nextStatus || statusUpdatingId) return

    if (!options.skipPaymentCheck && requiresManualPaymentConfirmation(row, nextStatus)) {
      setPaymentConfirm({ row, nextStatus })
      return
    }

    const payload = { orderStatus: nextStatus }
    if (options.paymentCollectedManually) {
      payload.confirmManualPayment = true
    }
    if (normalizeOrderStatusValue(nextStatus) === 'canceled') {
      const reason = window.prompt('Reason for cancelling this order?', 'Cancelled by admin')
      if (reason == null) return
      payload.reason = reason.trim() || 'Cancelled by admin'
    }

    setStatusUpdatingId(row.id)
    setStatusFeedback(null)
    try {
      await updateAdminOrderStatusRequest(row.id, payload)
      setStatusFeedback({ type: 'success', message: `Order ${row.orderId || row.id} status updated.` })
      await loadOrders()
    } catch (e) {
      setStatusFeedback({ type: 'error', message: pickApiError(e, 'Could not update order status.') })
    } finally {
      setStatusUpdatingId('')
    }
  }

  const closePaymentConfirm = () => {
    if (statusUpdatingId) return
    setPaymentConfirm(null)
  }

  const confirmManualPaymentDispatch = async () => {
    if (!paymentConfirm || statusUpdatingId) return
    const { row, nextStatus } = paymentConfirm
    setPaymentConfirm(null)
    await handleOrderStatusChange(row, nextStatus, {
      skipPaymentCheck: true,
      paymentCollectedManually: true,
    })
  }

  const loadMonthlySales = useCallback(async () => {
    setSalesLoading(true)
    setSalesError('')
    try {
      const all = await fetchAllOrdersUnfiltered()
      const { start, end, label } = currentMonthBounds()
      const inMonth = all.filter((o) => isOrderInRange(o, start, end))
      let gross = 0
      let paid = 0
      let pendingPay = 0
      for (const o of inMonth) {
        const amt = Number(o?.totalAmount ?? o?.total ?? 0)
        gross += amt
        const ps = String(o?.paymentStatus || '')
        if (ps === 'Paid') paid += amt
        else if (ps === 'Pending') pendingPay += amt
      }
      setSalesStats({
        monthLabel: label,
        orderCount: inMonth.length,
        gross,
        paid,
        pendingPay,
        ordersScanned: all.length,
      })
    } catch (e) {
      const msg =
        e?.response?.status === 403
          ? e?.response?.data?.message || 'Admin access only.'
          : e?.response?.data?.message || e?.message || 'Failed to load sales data.'
      setSalesError(msg)
      setSalesStats(null)
    } finally {
      setSalesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'sales') return
    loadMonthlySales()
  }, [activeTab, loadMonthlySales])

  useEffect(() => {
    if (!detailRow) return
    const onKey = (e) => {
      if (e.key === 'Escape') setDetailRow(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailRow])

  const rows = useMemo(
    () =>
      orders.map((o) => {
        const items = normalizeOrderLines(o?.items, o)
        const { label: itemsCompact, totalQty, lines: itemLines } = compactItemsSummary(o?.items, o)
        const lifecycle = resolveOrderLifecycle(o)
        return {
          id: o?._id || o?.id,
          orderId: o?.orderId || o?._id || o?.id,
          customer:
            o?.user?.name ||
            o?.user?.email ||
            o?.user?.mobile ||
            o?.shippingAddress?.fullName ||
            o?.customerName ||
            '—',
          items,
          itemsCompact,
          itemLines,
          skuLines: formatItemsSkuCell(itemLines),
          totalQty,
          addressText: formatShippingAddressMultiline(o?.shippingAddress),
          addressPreview: formatAddressPreview(o?.shippingAddress),
          total: Number(o?.totalAmount ?? o?.total ?? o?.grandTotal ?? 0),
          paymentMethod: lifecycle.paymentMethod || '—',
          paymentStatus: lifecycle.paymentStatus,
          orderStatus: lifecycle.orderStatus,
          placedAt: o?.createdAt || o?.placedAt,
        }
      }),
    [orders]
  )

  return (
    <div className="space-y-4 p-2 text-neutral-900 lg:p-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">Manage orders and view this month&apos;s sales summary.</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 sm:inline-flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-4">
          {salesError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {salesError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              Totals are based on orders with <strong>order date</strong> in{' '}
              <strong>{salesStats?.monthLabel ?? 'this month'}</strong>. All pages are loaded (up to a safe cap) for
              accuracy.
            </p>
            <button
              type="button"
              onClick={() => loadMonthlySales()}
              disabled={salesLoading}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total sales (paid)</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {salesLoading ? '…' : `₹${(salesStats?.paid ?? 0).toLocaleString('en-IN')}`}
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">Payment status: Paid</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">All order value (month)</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">
                {salesLoading ? '…' : `₹${(salesStats?.gross ?? 0).toLocaleString('en-IN')}`}
              </p>
              <p className="mt-1 text-xs text-neutral-500">Sum of order totals placed this month</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Orders this month</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{salesLoading ? '…' : (salesStats?.orderCount ?? 0)}</p>
              <p className="mt-1 text-xs text-neutral-500">Count of orders in date range</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Pending payment (month)</p>
              <p className="mt-2 text-2xl font-bold text-amber-900">
                {salesLoading ? '…' : `₹${(salesStats?.pendingPay ?? 0).toLocaleString('en-IN')}`}
              </p>
              <p className="mt-1 text-xs text-amber-900/80">Payment status: Pending</p>
            </div>
          </div>

          {!salesLoading && salesStats && (
            <p className="text-xs text-neutral-500">
              Scanned <strong>{salesStats.ordersScanned}</strong> order record(s) from the admin list API for this
              calculation.
            </p>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-500">Search orders</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order ID, customer, email, SKU…"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/15"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-500">Payment status</span>
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value)
              setPage(1)
            }}
            className="min-w-[180px] rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-500">Order status</span>
          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value)
              setPage(1)
            }}
            className="min-w-[180px] rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => loadOrders()}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {statusFeedback?.message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            statusFeedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="status"
        >
          {statusFeedback.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
          <p className="text-sm text-neutral-600">
            {loading ? 'Loading…' : `${meta.total} order(s) total`}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-neutral-600">
              Page {page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="max-h-[min(70vh,720px)] w-full overflow-auto overscroll-contain">
          <table className="min-w-max w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 shadow-[0_1px_0_0_rgb(229_229_229)]">
              <tr>
                <th className="whitespace-nowrap px-3 py-2">Order</th>
                <th className="whitespace-nowrap px-3 py-2">Customer</th>
                <th className="max-w-[200px] px-3 py-2">Items</th>
                <th className="whitespace-nowrap px-3 py-2">SKU</th>
                <th className="whitespace-nowrap px-3 py-2">Total</th>
                <th className="whitespace-nowrap px-3 py-2">Payment</th>
                <th className="whitespace-nowrap px-3 py-2">Pay status</th>
                <th className="whitespace-nowrap px-3 py-2">Order status</th>
                <th className="whitespace-nowrap px-3 py-2">Date</th>
                <th className="whitespace-nowrap px-3 py-2">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-neutral-500">
                    Loading orders…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-neutral-500">
                    {debouncedSearch ? 'No orders match your search.' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/80">
                    <td className="max-w-[140px] px-3 py-2 align-middle font-mono text-[11px] text-neutral-800 break-all" title={row.id}>
                      <span className="font-medium">{row.orderId}</span>
                    </td>
                    <td className="max-w-[120px] px-3 py-2 align-middle text-xs text-neutral-700 break-words">{row.customer}</td>
                    <td className="max-w-[200px] px-3 py-2 align-middle text-xs text-neutral-800">
                      <p className="line-clamp-2 leading-snug">{row.itemsCompact}</p>
                      {row.totalQty > 0 && (
                        <p className="mt-0.5 text-[10px] text-neutral-500">{row.totalQty} pc(s)</p>
                      )}
                    </td>
                    <td className="max-w-[120px] px-3 py-2 align-middle text-xs text-neutral-700">
                      {row.skuLines?.length ? (
                        <div className="space-y-1">
                          {row.skuLines.map((line) => (
                            <p key={`${row.id}-${line.key}-${line.sku}`} className="font-mono text-[11px] leading-snug break-all">
                              {line.sku}
                            </p>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-xs font-medium">₹{row.total.toLocaleString('en-IN')}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-xs text-neutral-600">{row.paymentMethod}</td>
                    <td className="px-3 py-2 align-middle">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium capitalize">
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <select
                        value={normalizeOrderStatusValue(row.orderStatus)}
                        onChange={(e) => handleOrderStatusChange(row, e.target.value)}
                        disabled={loading || statusUpdatingId === row.id}
                        className="min-w-[118px] rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-800 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Update status for order ${row.orderId}`}
                      >
                        {ADMIN_ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-[11px] text-neutral-500">{formatDate(row.placedAt)}</td>
                    <td className="max-w-[160px] px-3 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-left text-xs text-neutral-800 transition hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <span className="line-clamp-1 text-[11px] text-neutral-600">{row.addressPreview}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-blue-600">View details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeTab === 'orders' && paymentConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-confirm-title"
          onClick={closePaymentConfirm}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="payment-confirm-title" className="text-lg font-semibold text-neutral-950">
              Payment not received
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Payment has not been received. Are you sure payment has been collected manually?
            </p>
            <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Order <span className="font-semibold">{paymentConfirm.row.orderId || paymentConfirm.row.id}</span> will
              be marked as{' '}
              <span className="font-semibold capitalize">{normalizeOrderStatusValue(paymentConfirm.nextStatus)}</span>.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePaymentConfirm}
                disabled={Boolean(statusUpdatingId)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmManualPaymentDispatch}
                disabled={Boolean(statusUpdatingId)}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusUpdatingId ? 'Updating…' : 'Confirm (Payment Collected Manually)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && detailRow && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-detail-title"
          onClick={() => setDetailRow(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h2 id="admin-order-detail-title" className="text-lg font-bold text-neutral-900">
                  Order details
                </h2>
                <p className="mt-0.5 font-mono text-xs text-neutral-600">{detailRow.orderId}</p>
                <p className="text-xs text-neutral-500">{detailRow.customer}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-lg border border-neutral-200 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <section className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Items & quantities</h3>
              {detailRow.items.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">No line items.</p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">SKU</th>
                        <th className="px-3 py-2 font-medium">Qty</th>
                        <th className="px-3 py-2 font-medium">Unit</th>
                        <th className="px-3 py-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {detailRow.items.map((it, idx) => (
                        <tr key={`modal-${detailRow.id}-${idx}-${it.key}`}>
                          <td className="px-3 py-2 font-medium text-neutral-900">{it.name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-600">{it.sku || '—'}</td>
                          <td className="px-3 py-2 text-neutral-700">{it.qty}</td>
                          <td className="px-3 py-2 text-neutral-600">₹{Number(it?.price ?? 0).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 font-medium text-neutral-900">
                            ₹{(Number(it?.qty ?? 0) * Number(it?.price ?? 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-neutral-200 bg-neutral-50 text-sm font-semibold">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-neutral-600">
                          Total qty: {detailRow.totalQty}
                        </td>
                        <td className="px-3 py-2">₹{detailRow.total.toLocaleString('en-IN')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Shipping address</h3>
              <p className="mt-2 whitespace-pre-line rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-800">
                {detailRow.addressText}
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
