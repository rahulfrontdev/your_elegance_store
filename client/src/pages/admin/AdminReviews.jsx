import { useCallback, useEffect, useState } from 'react'
import { adminFetchReviews, adminModerateReview } from '../../api/adminApi'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import { Loader2, Search } from 'lucide-react'

function normalizeList(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.reviews)) return root.reviews
  return []
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
}

const AdminReviews = () => {
  const [list, setList] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [busyKey, setBusyKey] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setLoading(true)
      const params = { status: statusFilter }
      if (query.trim()) params.q = query.trim()
      const { data } = await adminFetchReviews(params)
      setList(normalizeList(data))
      setCounts(data?.counts || { pending: 0, approved: 0, rejected: 0 })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load reviews.')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, query])

  useEffect(() => {
    load()
  }, [load])

  const moderate = async (review, status) => {
    const productId = review?.productId
    const reviewId = review?._id
    if (!productId || !reviewId) return

    const key = `${productId}-${reviewId}-${status}`
    setBusyKey(key)
    setError('')
    setMessage('')
    try {
      await adminModerateReview(productId, reviewId, { status })
      setMessage(
        status === 'approved'
          ? 'Review enabled. It is now visible on the website.'
          : 'Review disabled. It is hidden from the website.'
      )
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update review.')
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="mt-1 text-sm text-slate-600">
            Approve or reject customer reviews. Only approved reviews appear on the website.
            You can Enable a rejected review again, or Disable an approved one anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">
            Pending {counts.pending || 0}
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
            Approved {counts.approved || 0}
          </span>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-800">
            Rejected {counts.rejected || 0}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setQuery(search)
            }}
            placeholder="Search product, customer, or comment"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <button
          type="button"
          onClick={() => setQuery(search)}
          className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Search
        </button>
      </div>

      {(error || message) && (
        <p className={`mt-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700'}`}>
          {error || message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Review</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No reviews found for this filter.
                  </td>
                </tr>
              ) : (
                list.map((review) => {
                  const productId = review.productId
                  const reviewId = review._id
                  const approveKey = `${productId}-${reviewId}-approved`
                  const rejectKey = `${productId}-${reviewId}-rejected`
                  const image = resolveMediaUrl(review.productImage)
                  const status = String(review.status || 'pending').toLowerCase()

                  return (
                    <tr key={`${productId}-${reviewId}`} className="border-b border-slate-100 align-top last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                            {image ? (
                              <img src={image} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{review.productName || 'Product'}</p>
                            {review.productSku ? (
                              <p className="text-xs text-slate-500">SKU: {review.productSku}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{review.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-600" aria-label={`${review.rating} stars`}>
                          {stars(review.rating)}
                        </span>
                        <p className="text-xs text-slate-500">{Number(review.rating || 0)}/5</p>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">
                        <p className="whitespace-pre-wrap break-words">{review.comment || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            statusStyles[status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(review.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {status !== 'approved' && (
                            <button
                              type="button"
                              disabled={Boolean(busyKey)}
                              onClick={() => moderate(review, 'approved')}
                              className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyKey === approveKey
                                ? 'Saving…'
                                : status === 'rejected'
                                  ? 'Enable'
                                  : 'Approve'}
                            </button>
                          )}
                          {status !== 'rejected' && (
                            <button
                              type="button"
                              disabled={Boolean(busyKey)}
                              onClick={() => moderate(review, 'rejected')}
                              className="cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyKey === rejectKey
                                ? 'Saving…'
                                : status === 'approved'
                                  ? 'Disable'
                                  : 'Reject'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminReviews
