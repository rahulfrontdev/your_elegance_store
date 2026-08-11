import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminFetchUserById, adminFetchUsers, adminUpdateUser } from '../../api/adminApi'
import { fetchSpecialDiscountCategories } from '../../api/specialDiscountApi'
import { Loader2, Search, X } from 'lucide-react'

function normalizeList(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.users)) return root.users
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

function formatAddress(address) {
  if (!address) return ''
  return [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')
}

const AdminUsers = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('customer')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [discountCategories, setDiscountCategories] = useState([])
  const [updatingUserId, setUpdatingUserId] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setLoading(true)
      const params = {}
      if (roleFilter && roleFilter !== 'all') params.role = roleFilter
      if (query.trim()) params.q = query.trim()
      const { data } = await adminFetchUsers(params)
      setList(normalizeList(data))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load customers.')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [roleFilter, query])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await fetchSpecialDiscountCategories()
        const rows = data?.data?.data || data?.data || []
        setDiscountCategories(Array.isArray(rows) ? rows : [])
      } catch {
        setDiscountCategories([])
      }
    }
    loadCategories()
  }, [])

  const updateUserDiscountCategory = async (userId, specialDiscountCategoryId) => {
    setUpdatingUserId(userId)
    setError('')
    try {
      await adminUpdateUser(userId, { specialDiscountCategoryId })
      await load()
      if (selectedId === userId) {
        const { data } = await adminFetchUserById(userId)
        setDetail(data?.data ?? data)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update discount category.')
    } finally {
      setUpdatingUserId('')
    }
  }

  const openDetail = async (id) => {
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    setError('')
    try {
      const { data } = await adminFetchUserById(id)
      setDetail(data?.data ?? data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load customer detail.')
      setSelectedId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setSelectedId(null)
    setDetail(null)
  }

  const customerCount = useMemo(
    () => list.filter((u) => String(u.role || '').toLowerCase() === 'customer').length,
    [list]
  )

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-600">
            View details of people who registered on the website.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800">{list.length}</span>
          {roleFilter === 'customer' ? ` customer${list.length === 1 ? '' : 's'}` : ' accounts'}
          {roleFilter === 'all' ? ` (${customerCount} customers)` : ''}
        </p>
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
            placeholder="Search name, mobile, or email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
        >
          <option value="customer">Customers only</option>
          <option value="admin">Admins only</option>
          <option value="all">All accounts</option>
        </select>
        <button
          type="button"
          onClick={() => setQuery(search)}
          className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Search
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Discount category</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Registered</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No registered customers found.
                  </td>
                </tr>
              ) : (
                list.map((u) => {
                  const id = u._id ?? u.id
                  const isCustomer = String(u.role || '').toLowerCase() === 'customer'
                  const categoryId =
                    u.specialDiscountCategory?._id || u.specialDiscountCategory?.id || ''
                  return (
                    <tr key={id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{u.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.mobile || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        {isCustomer ? (
                          <select
                            value={categoryId}
                            onChange={(e) => updateUserDiscountCategory(id, e.target.value)}
                            disabled={updatingUserId === id || discountCategories.length === 0}
                            className="min-w-[140px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-slate-400 disabled:opacity-60"
                          >
                            {discountCategories.map((cat) => {
                              const catId = cat._id || cat.id
                              return (
                                <option key={catId} value={catId}>
                                  {cat.name} ({Number(cat.discountPercentage ?? 0)}%)
                                </option>
                              )
                            })}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            String(u.role || '').toLowerCase() === 'admin'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role || 'customer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(id)}
                          className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
        {error && <p className="border-t border-slate-200 px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>

      {(selectedId || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Customer details</h2>
              <button
                type="button"
                onClick={closeDetail}
                className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading || !detail ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <div className="space-y-5 px-5 py-5">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{detail.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Mobile</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{detail.mobile || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{detail.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Discount category</dt>
                    <dd className="mt-0.5">
                      {String(detail.role || '').toLowerCase() === 'customer' ? (
                        <select
                          value={
                            detail.specialDiscountCategory?._id ||
                            detail.specialDiscountCategory?.id ||
                            ''
                          }
                          onChange={(e) =>
                            updateUserDiscountCategory(
                              detail._id || detail.id,
                              e.target.value
                            )
                          }
                          disabled={updatingUserId === (detail._id || detail.id)}
                          className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-400"
                        >
                          {discountCategories.map((cat) => {
                            const catId = cat._id || cat.id
                            return (
                              <option key={catId} value={catId}>
                                {cat.name} ({Number(cat.discountPercentage ?? 0)}%)
                              </option>
                            )
                          })}
                        </select>
                      ) : (
                        <span className="font-medium text-slate-900">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Role</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{detail.role || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Registered</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{formatDate(detail.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Last updated</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{formatDate(detail.updatedAt)}</dd>
                  </div>
                </dl>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Saved addresses</h3>
                  {!detail.addresses?.length ? (
                    <p className="mt-2 text-sm text-slate-500">No addresses saved yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {detail.addresses.map((address) => (
                        <li
                          key={address._id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{address.fullName}</p>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {address.addressType || 'Address'}
                            </span>
                            {address.isDefault ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-slate-600">{address.mobileNumber}</p>
                          <p className="mt-1 text-slate-700">{formatAddress(address)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
