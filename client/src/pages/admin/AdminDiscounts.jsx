import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminCreateDiscount,
  adminDeleteDiscount,
  adminGetDiscount,
  adminListDiscounts,
  adminPatchDiscountStatus,
  adminUpdateDiscount,
} from '../../api/discountsAdminApi'
import { adminFetchProducts } from '../../api/adminApi'

const APPLICABLE_ON_OPTIONS = [
  { value: 'order', label: 'Order total' },
  { value: 'cart', label: 'Cart' },
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'catalog', label: 'Catalog' },
  { value: 'all', label: 'All / store-wide' },
]

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed amount (₹)' },
]

const emptyCreateForm = () => ({
  discountName: '',
  discountType: 'percentage',
  discountValue: '',
  startDate: '',
  endDate: '',
  applicableOn: 'order',
  selectedProducts: [],
  categoryIdsRaw: '',
  catalogIdsRaw: '',
  discountCode: '',
  description: '',
  minimumOrderAmount: '0',
  priority: '0',
  status: 'active',
})

function normalizeDiscountList(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.discounts)) return root.discounts
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.items)) return root.items
  return []
}

function pickId(row) {
  return row?._id || row?.id || ''
}

function pickLabel(row) {
  return (
    row?.discountName ||
    row?.discountCode ||
    row?.couponCode ||
    row?.code ||
    row?.name ||
    row?.title ||
    pickId(row) ||
    'Discount'
  )
}

function pickStatus(row) {
  return String(row?.status || row?.state || '—')
}

/** `type="date"` → ISO start of local day */
function dateInputToIsoStart(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

function dateInputToIsoEnd(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T23:59:59.999`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

const HEX24 = /^[a-fA-F0-9]{24}$/

/** Comma- or newline-separated MongoDB ObjectId strings */
function parseHex24List(raw, fieldLabel) {
  if (!raw || typeof raw !== 'string') return { ok: true, ids: [] }
  const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return { ok: true, ids: [] }
  const bad = parts.find((id) => !HEX24.test(id))
  if (bad) {
    return {
      ok: false,
      error: `Invalid ${fieldLabel} id "${bad}". Each must be exactly 24 hex characters (MongoDB ObjectId).`,
    }
  }
  return { ok: true, ids: [...new Set(parts)] }
}

function pickCreateApiError(err) {
  const d = err?.response?.data
  if (typeof d?.message === 'string' && d.message.trim()) return d.message.trim()
  const details = d?.errors ?? d?.details
  if (Array.isArray(details)) {
    const parts = details
      .map((e) => e?.message || e?.msg || e?.context?.message)
      .filter((s) => typeof s === 'string' && s.trim())
    if (parts.length) return parts.join(' ')
  }
  if (typeof d?.error === 'string' && d.error.trim()) return d.error.trim()
  return err?.message || 'Create failed.'
}

function normalizeProductsResponse(data) {
  const root = data?.data ?? data
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.products)) return root.products
  if (Array.isArray(root?.items)) return root.items
  return []
}

function toPickerProduct(p) {
  const id = String(p?._id || p?.id || '')
  return {
    id,
    name: p?.name || 'Unnamed product',
    image: p?.imageUrl || p?.image || (Array.isArray(p?.images) ? p.images[0] : '') || '',
  }
}

function isoToDateInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function extractDiscountFromResponse(data) {
  return data?.data?.discount ?? data?.discount ?? data?.data ?? data ?? null
}

function mapDiscountToForm(d, pickerList = []) {
  const applicableOnRaw = String(d?.applicableOn || 'order').toLowerCase()
  const applicableOn = APPLICABLE_ON_OPTIONS.some((o) => o.value === applicableOnRaw) ? applicableOnRaw : 'order'
  const pickerMap = new Map(pickerList.map((p) => [p.id, p]))

  let selectedProducts = []
  if (applicableOn === 'product' && Array.isArray(d.productIds)) {
    selectedProducts = d.productIds.map((pid) => {
      const id = String(pid)
      const pick = pickerMap.get(id)
      return { id, name: pick?.name || `Product ${id.slice(-6)}` }
    })
  }

  const categoryIds = Array.isArray(d.categoryIds) ? d.categoryIds : []
  const catalogIds = Array.isArray(d.catalogIds) ? d.catalogIds : []

  return {
    discountName: String(d?.discountName ?? ''),
    discountType: String(d?.discountType ?? 'percentage'),
    discountValue: d?.discountValue != null && d?.discountValue !== '' ? String(d.discountValue) : '',
    startDate: isoToDateInputValue(d?.startDate),
    endDate: isoToDateInputValue(d?.endDate),
    applicableOn,
    selectedProducts,
    categoryIdsRaw: categoryIds.map(String).join('\n'),
    catalogIdsRaw: catalogIds.map(String).join('\n'),
    discountCode: String(d?.discountCode ?? ''),
    description: String(d?.description ?? ''),
    minimumOrderAmount: String(d?.minimumOrderAmount ?? 0),
    priority: String(d?.priority ?? 0),
    status: String(d?.status ?? 'active'),
  }
}

const AdminDiscounts = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingDiscountId, setEditingDiscountId] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [pickerProducts, setPickerProducts] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await adminListDiscounts()
      setRows(normalizeDiscountList(data))
    } catch (e) {
      setRows([])
      setError(e?.response?.data?.message || e?.message || 'Failed to load discounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (createForm.applicableOn !== 'product') {
      setPickerProducts([])
      setPickerError('')
      setProductSearchQuery('')
      return
    }
    let cancelled = false
    const run = async () => {
      setPickerLoading(true)
      setPickerError('')
      try {
        const { data } = await adminFetchProducts()
        if (cancelled) return
        const list = normalizeProductsResponse(data).map(toPickerProduct).filter((p) => p.id && HEX24.test(p.id))
        setPickerProducts(list)
      } catch (e) {
        if (!cancelled) {
          setPickerProducts([])
          setPickerError(e?.response?.data?.message || e?.message || 'Could not load products.')
        }
      } finally {
        if (!cancelled) setPickerLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [createForm.applicableOn])

  const filteredPickerProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase()
    if (!q) return pickerProducts
    return pickerProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    )
  }, [pickerProducts, productSearchQuery])

  const selectedProductIdSet = useMemo(
    () => new Set((createForm.selectedProducts || []).map((p) => p.id)),
    [createForm.selectedProducts]
  )

  const appendPickerProduct = useCallback((product) => {
    if (!product?.id || !HEX24.test(product.id)) return
    setCreateForm((f) => {
      const list = f.selectedProducts || []
      if (list.some((x) => x.id === product.id)) return f
      return {
        ...f,
        selectedProducts: [...list, { id: product.id, name: product.name || 'Product' }],
      }
    })
  }, [])

  const removeSelectedProduct = useCallback((productId) => {
    setCreateForm((f) => ({
      ...f,
      selectedProducts: (f.selectedProducts || []).filter((p) => p.id !== productId),
    }))
  }, [])

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        String(pickLabel(a)).localeCompare(String(pickLabel(b)), undefined, { sensitivity: 'base' })
      ),
    [rows]
  )

  const onToggleStatus = async (row) => {
    const id = pickId(row)
    if (!id) return
    const next = pickStatus(row).toLowerCase() === 'active' ? 'inactive' : 'active'
    setBusyId(id)
    try {
      await adminPatchDiscountStatus(id, { status: next })
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Could not update status.')
    } finally {
      setBusyId('')
    }
  }

  const onDelete = async (row) => {
    const id = pickId(row)
    if (!id) return
    if (!window.confirm(`Delete discount "${pickLabel(row)}"?`)) return
    setBusyId(id)
    try {
      await adminDeleteDiscount(id)
      if (editingDiscountId === id) {
        setEditingDiscountId(null)
        setCreateForm(emptyCreateForm())
      }
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Could not delete.')
    } finally {
      setBusyId('')
    }
  }

  const loadDiscountFormData = useCallback(async (discountId) => {
    const { data } = await adminGetDiscount(discountId)
    const d = extractDiscountFromResponse(data)
    if (!d || typeof d !== 'object') {
      throw new Error('Discount not found in API response.')
    }
    let picker = []
    if (String(d.applicableOn || '').toLowerCase() === 'product') {
      const { data: pd } = await adminFetchProducts()
      picker = normalizeProductsResponse(pd).map(toPickerProduct).filter((p) => p.id && HEX24.test(p.id))
    }
    return mapDiscountToForm(d, picker)
  }, [])

  const handleEditDiscount = async (row) => {
    const id = pickId(row)
    if (!id) return
    setCreateError('')
    setEditLoading(true)
    setBusyId(id)
    try {
      const form = await loadDiscountFormData(id)
      setCreateForm(form)
      setEditingDiscountId(id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setCreateError(e?.response?.data?.message || e?.message || 'Could not load discount for editing.')
    } finally {
      setEditLoading(false)
      setBusyId('')
    }
  }

  const handleDuplicateDiscount = async (row) => {
    const id = pickId(row)
    if (!id) return
    setCreateError('')
    setEditLoading(true)
    setBusyId(id)
    try {
      const form = await loadDiscountFormData(id)
      const baseName = form.discountName?.trim() || pickLabel(row) || 'Discount'
      setCreateForm({
        ...form,
        discountName: `${baseName} (copy)`,
      })
      setEditingDiscountId(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setCreateError(e?.response?.data?.message || e?.message || 'Could not load discount to duplicate.')
    } finally {
      setEditLoading(false)
      setBusyId('')
    }
  }

  const onSaveDiscount = async (e) => {
    e.preventDefault()
    setCreateError('')

    const name = createForm.discountName.trim()
    const rawVal = createForm.discountValue
    const discountValue = typeof rawVal === 'string' ? Number(rawVal.trim()) : Number(rawVal)

    if (!name) {
      setCreateError('Discount name is required.')
      return
    }
    const discountType = String(createForm.discountType || '').trim()
    if (!discountType) {
      setCreateError('Discount type is required.')
      return
    }
    if (rawVal === '' || rawVal === null || Number.isNaN(discountValue)) {
      setCreateError('Discount value is required and must be a number.')
      return
    }
    if (!createForm.startDate) {
      setCreateError('Start date is required.')
      return
    }
    if (!createForm.endDate) {
      setCreateError('End date is required.')
      return
    }
    const applicableOn = String(createForm.applicableOn || '').trim()
    if (!applicableOn) {
      setCreateError('Applicable on is required.')
      return
    }

    const startIso = dateInputToIsoStart(createForm.startDate)
    const endIso = dateInputToIsoEnd(createForm.endDate)
    if (!startIso || !endIso) {
      setCreateError('Invalid start or end date.')
      return
    }
    if (createForm.endDate < createForm.startDate) {
      setCreateError('End date must be on or after start date.')
      return
    }

    const minOrder = Number(createForm.minimumOrderAmount)
    const priority = Number(createForm.priority)
    if (Number.isNaN(minOrder) || minOrder < 0) {
      setCreateError('Minimum order amount must be a number ≥ 0.')
      return
    }
    if (Number.isNaN(priority)) {
      setCreateError('Priority must be a number.')
      return
    }

    let productIds = []
    let categoryIds = []
    let catalogIds = []

    if (applicableOn === 'product') {
      const list = createForm.selectedProducts || []
      if (list.length === 0) {
        setCreateError('For “Applicable on: product”, add at least one product from the list below.')
        return
      }
      const bad = list.find((p) => !p?.id || !HEX24.test(p.id))
      if (bad) {
        setCreateError(`Invalid product id for “${bad.name || 'product'}”.`)
        return
      }
      productIds = [...new Set(list.map((p) => p.id))]
    } else if (applicableOn === 'category') {
      const parsed = parseHex24List(createForm.categoryIdsRaw, 'category')
      if (!parsed.ok) {
        setCreateError(parsed.error)
        return
      }
      if (parsed.ids.length === 0) {
        setCreateError('For “Applicable on: category”, add at least one category _id (24 hex chars each).')
        return
      }
      categoryIds = parsed.ids
    } else if (applicableOn === 'catalog') {
      const parsed = parseHex24List(createForm.catalogIdsRaw, 'catalog')
      if (!parsed.ok) {
        setCreateError(parsed.error)
        return
      }
      if (parsed.ids.length === 0) {
        setCreateError('For “Applicable on: catalog”, add at least one catalog _id (24 hex chars each).')
        return
      }
      catalogIds = parsed.ids
    }

    const body = {
      discountName: name,
      discountType,
      discountValue,
      startDate: startIso,
      endDate: endIso,
      applicableOn,
      discountCode: createForm.discountCode.trim(),
      status: createForm.status.trim() || 'active',
      minimumOrderAmount: minOrder,
      priority,
    }
    if (createForm.description.trim()) body.description = createForm.description.trim()
    if (productIds.length) body.productIds = productIds
    if (categoryIds.length) body.categoryIds = categoryIds
    if (catalogIds.length) body.catalogIds = catalogIds

    setCreating(true)
    try {
      if (editingDiscountId) {
        await adminUpdateDiscount(editingDiscountId, body)
        setEditingDiscountId(null)
      } else {
        await adminCreateDiscount(body)
      }
      setCreateForm(emptyCreateForm())
      await load()
    } catch (err) {
      setCreateError(pickCreateApiError(err))
    } finally {
      setCreating(false)
    }
  }

  const cancelEdit = () => {
    setEditingDiscountId(null)
    setCreateForm(emptyCreateForm())
    setCreateError('')
  }

  const fieldClass =
    'mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <div className="space-y-6 p-2 text-neutral-900 lg:p-4">
      <div>
        <h1 className="text-xl font-bold">Discounts</h1>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              {editingDiscountId ? 'Edit discount' : 'Create discount'}
            </h2>
            {editingDiscountId && (
              <p className="mt-1 text-xs text-neutral-500">
                Updating <span className="font-mono">{editingDiscountId}</span>. Change products or any field, then save.
              </p>
            )}
          </div>
          {editingDiscountId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Cancel edit
            </button>
          )}
        </div>


        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onSaveDiscount}>
          {editLoading && (
            <p className="sm:col-span-2 text-sm text-neutral-600">Loading discount…</p>
          )}
          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-neutral-700">Discount name</span>
            <input
              required
              value={createForm.discountName}
              onChange={(e) => setCreateForm((f) => ({ ...f, discountName: e.target.value }))}
              className={fieldClass}
              placeholder="e.g. Monsoon sale"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Discount type</span>
            <select
              required
              value={createForm.discountType}
              onChange={(e) => setCreateForm((f) => ({ ...f, discountType: e.target.value }))}
              className={fieldClass}
            >
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Discount value</span>
            <input
              required
              type="number"
              step="any"
              min="0"
              value={createForm.discountValue}
              onChange={(e) => setCreateForm((f) => ({ ...f, discountValue: e.target.value }))}
              className={fieldClass}
              placeholder="e.g. 10 (percent or fixed per your API)"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-neutral-700">Applicable on</span>
            <select
              required
              value={createForm.applicableOn}
              onChange={(e) => {
                const v = e.target.value
                setCreateForm((f) => ({
                  ...f,
                  applicableOn: v,
                  selectedProducts: v === 'product' ? f.selectedProducts || [] : [],
                }))
              }}
              className={fieldClass}
            >
              {APPLICABLE_ON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </label>

          {createForm.applicableOn === 'product' && (
            <div className="text-sm sm:col-span-2">
              <span className="font-medium text-neutral-700">Selected products (required)</span>
              <div
                className={`${fieldClass} mt-1 min-h-[5.5rem] max-h-48 overflow-y-auto space-y-1 bg-neutral-50 p-2`}
                role="list"
                aria-label="Selected products by name"
              >
                {(createForm.selectedProducts || []).length === 0 ? (
                  <p className="px-1 py-2 text-xs text-neutral-500">
                    No products yet. Use <strong>Add</strong> in the list below — names appear here;{' '}
                    <span className="font-mono text-[11px]">productIds</span> are sent to the API.
                  </p>
                ) : (
                  (createForm.selectedProducts || []).map((p) => (
                    <div
                      key={p.id}
                      role="listitem"
                      className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium text-neutral-900">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedProduct(p.id)}
                        className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        aria-label={`Remove ${p.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
              <span className="mt-1 block text-xs text-neutral-500">
                Only product names are shown here. Ids are stored for submit.
              </span>
            </div>
          )}

          {createForm.applicableOn === 'product' && (
            <div className="sm:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h3 className="text-sm font-semibold text-neutral-900">All products</h3>
                <span className="text-xs text-neutral-500">
                  {pickerLoading ? 'Loading…' : `${pickerProducts.length} loaded`}
                </span>
              </div>
              <input
                type="search"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by name or _id…"
                className={`${fieldClass} mt-2`}
              />
              {pickerError && (
                <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                  {pickerError}
                </p>
              )}
              {!pickerLoading && !pickerError && pickerProducts.length === 0 && (
                <p className="mt-2 text-xs text-neutral-600">No products returned from the API.</p>
              )}
              <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1">
                {pickerLoading && (
                  <li className="px-3 py-6 text-center text-xs text-neutral-500">Loading products…</li>
                )}
                {!pickerLoading &&
                  filteredPickerProducts.map((p) => {
                    const added = selectedProductIdSet.has(p.id)
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                          {p.image ? (
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-neutral-900">{p.name}</p>
                          <p className="truncate font-mono text-[11px] text-neutral-500">{p.id}</p>
                        </div>
                        <button
                          type="button"
                          disabled={added}
                          onClick={() => appendPickerProduct(p)}
                          className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${added
                            ? 'cursor-default border border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100'
                            }`}
                        >
                          {added ? 'Added' : 'Add'}
                        </button>
                      </li>
                    )
                  })}
                {!pickerLoading && !pickerError && filteredPickerProducts.length === 0 && pickerProducts.length > 0 && (
                  <li className="px-3 py-4 text-center text-xs text-neutral-500">No products match your search.</li>
                )}
              </ul>
            </div>
          )}

          {createForm.applicableOn === 'category' && (
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-neutral-700">Category IDs (required)</span>
              <textarea
                value={createForm.categoryIdsRaw}
                onChange={(e) => setCreateForm((f) => ({ ...f, categoryIdsRaw: e.target.value }))}
                rows={3}
                className={`${fieldClass} font-mono text-xs`}
                placeholder="24-hex MongoDB category _id(s)"
                spellCheck={false}
              />
            </label>
          )}

          {createForm.applicableOn === 'catalog' && (
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-neutral-700">Catalog IDs (required)</span>
              <textarea
                value={createForm.catalogIdsRaw}
                onChange={(e) => setCreateForm((f) => ({ ...f, catalogIdsRaw: e.target.value }))}
                rows={3}
                className={`${fieldClass} font-mono text-xs`}
                placeholder="24-hex MongoDB catalog _id(s) from /api/catalogs"
                spellCheck={false}
              />
            </label>
          )}

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Start date</span>
            <input
              required
              type="date"
              value={createForm.startDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">End date</span>
            <input
              required
              type="date"
              value={createForm.endDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Discount code</span>
            <input
              value={createForm.discountCode}
              onChange={(e) => setCreateForm((f) => ({ ...f, discountCode: e.target.value }))}
              className={fieldClass}
              placeholder="SAVE10 or leave empty"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Status</span>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
              className={fieldClass}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="draft">draft</option>
            </select>
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-neutral-700">Description (optional)</span>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className={fieldClass}
              placeholder="Shown internally or in admin"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Minimum order amount</span>
            <input
              type="number"
              min="0"
              step="any"
              value={createForm.minimumOrderAmount}
              onChange={(e) => setCreateForm((f) => ({ ...f, minimumOrderAmount: e.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-neutral-700">Priority</span>
            <input
              type="number"
              step="1"
              value={createForm.priority}
              onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value }))}
              className={fieldClass}
            />

          </label>

          {createError && (
            <p className="sm:col-span-2 text-sm font-medium text-red-600" role="alert">
              {createError}
            </p>
          )}

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={creating || editLoading}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {creating
                ? editingDiscountId
                  ? 'Saving…'
                  : 'Creating…'
                : editingDiscountId
                  ? 'Update discount'
                  : 'Create discount'}
            </button>
            <button
              type="button"
              onClick={() => {
                cancelEdit()
              }}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              {editingDiscountId ? 'Discard changes' : 'Reset form'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">All discounts</p>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
        <div className="max-h-[min(70vh,640px)] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Id</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    No discounts yet. Create one above, or refresh after adding data on the server.
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const id = pickId(row)
                  const busy = busyId === id
                  return (
                    <tr key={id || JSON.stringify(row)} className="hover:bg-neutral-50/80">
                      <td className="px-4 py-2 font-medium">{pickLabel(row)}</td>
                      <td className="px-4 py-2 text-xs capitalize">{pickStatus(row)}</td>
                      <td className="px-4 py-2 font-mono text-[11px] text-neutral-500 break-all">{id || '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={!id || busy || editLoading}
                            onClick={() => handleEditDiscount(row)}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={!id || busy || editLoading}
                            onClick={() => handleDuplicateDiscount(row)}
                            className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            disabled={!id || busy}
                            onClick={() => onToggleStatus(row)}
                            className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-semibold hover:bg-neutral-100 disabled:opacity-50"
                          >
                            Toggle status
                          </button>
                          <button
                            type="button"
                            disabled={!id || busy}
                            onClick={() => onDelete(row)}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminDiscounts
