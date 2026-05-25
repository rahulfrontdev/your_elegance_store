import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBestDealProducts, fetchProducts } from '../../api/productsApi'

const isActiveDiscount = (value) => value === true || value === 'true' || value === 1 || value === '1'

function normalizeBestDealList(payload) {
  const root = payload?.data
  const list =
    (Array.isArray(root) && root) ||
    (Array.isArray(root?.data) && root.data) ||
    (Array.isArray(root?.products) && root.products) ||
    (Array.isArray(root?.items) && root.items) ||
    (Array.isArray(payload?.products) && payload.products) ||
    (Array.isArray(payload?.items) && payload.items) ||
    (Array.isArray(payload) && payload) ||
    []
  return list.map((p) => {
    const id = p?._id || p?.id
    const name = p?.name || 'Product'
    const image = p?.imageUrl || p?.image || ''
    const originalPrice = Number(p?.originalPrice ?? p?.price ?? 0)
    const discountedPrice = Number(p?.discountedPrice ?? p?.price ?? 0)
    const discountAmount = Number(p?.discountAmount ?? 0)
    const discountPercent = Number(p?.discountPercentage ?? 0)
    const campaignLabel = p?.appliedDiscount?.discountName || p?.appliedDiscount?.name || ''
    return {
      id,
      name,
      image,
      originalPrice,
      discountedPrice,
      discountPercent,
      discountAmount,
      campaignLabel,
      raw: p,
    }
  })
}

function mergeById(...lists) {
  const map = new Map()
  lists.flat().forEach((item) => {
    if (!item?.id) return
    map.set(String(item.id), { ...(map.get(String(item.id)) || {}), ...item })
  })
  return Array.from(map.values())
}

const BestDeal = () => {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setError('')
      try {
        const [dealRes, allProductRes] = await Promise.allSettled([
          fetchBestDealProducts(),
          fetchProducts(),
        ])

        const bestDealItems =
          dealRes.status === 'fulfilled' ? normalizeBestDealList(dealRes.value.data) : []
        const activeProducts =
          allProductRes.status === 'fulfilled'
            ? normalizeBestDealList(allProductRes.value.data).filter((item) =>
                isActiveDiscount(item.raw?.hasActiveDiscount)
              )
            : []

        setItems(mergeById(bestDealItems, activeProducts))
        setStatus('succeeded')
      } catch (e) {
        setStatus('failed')
        setError(e?.response?.data?.message || 'Could not load best deals.')
        setItems([])
      }
    }
    load()
  }, [])

  return (
    <section className="bg-gradient-to-b from-neutral-100 to-neutral-50 px-3 py-8 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Best deals</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Top offers: highest % off first
              {/* <code className="rounded bg-white/80 px-1 text-xs">GET /products/best-deals</code> */}
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all products →
          </Link>
        </div>

        {status === 'loading' && (
          <p className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
            Loading best deals…
          </p>
        )}

        {status === 'failed' && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</p>
        )}

        {status === 'succeeded' && items.length === 0 && (
          <p className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
            No deals match right now. Try lowering filters or check back later.
          </p>
        )}

        {status === 'succeeded' && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">No Image</div>
                  )}
                  {item.discountPercent > 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white">
                      {item.discountPercent.toFixed(0)}% OFF
                    </span>
                  )}
                  {item.campaignLabel && (
                    <span className="absolute right-2 top-2 rounded-md bg-emerald-700 px-2 py-1 text-[9px] font-semibold text-white">
                      {item.campaignLabel}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-neutral-900">
                    {item.name}
                  </h3>
                  <div className="mt-auto">
                    <p className="text-base font-bold text-neutral-900">
                      ₹{item.discountedPrice.toLocaleString('en-IN')}
                    </p>
                    {item.originalPrice > 0 && (
                      <p className="text-xs text-neutral-500 line-through">
                        ₹{item.originalPrice.toLocaleString('en-IN')}
                      </p>
                    )}
                    {item.discountAmount > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-emerald-700">
                        Save ₹{item.discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    )}
                    {item.campaignLabel && (
                      <p className="mt-1 text-[10px] font-medium text-emerald-800 line-clamp-1">
                        {item.campaignLabel}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default BestDeal
