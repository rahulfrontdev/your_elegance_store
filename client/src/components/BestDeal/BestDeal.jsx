import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HomeSectionProductCard from '../products/HomeSectionProductCard'
import { fetchBestDealProducts } from '../../api/productsApi'

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
    const image = p?.imageUrl || p?.image || p?.images?.[0] || ''
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

const BestDeal = () => {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setError('')
      try {
        const dealRes = await fetchBestDealProducts({ limit: 8 })
        setItems(normalizeBestDealList(dealRes.data))
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
    <section className="px-1 py-5 sm:px-2 sm:py-6 lg:px-2">
      <div className="mx-auto max-w-8xl lg:ml-2">
        <div className="mb-4 sm:mb-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Best deals</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Top offers: highest % off first
            </p>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              to="/products"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              View all products →
            </Link>
          </div>
        </div>

        {status === 'loading' && (
          <p className="rounded-2xl border border-neutral-200/80 bg-white/90 p-8 text-center text-sm text-neutral-600 shadow-sm backdrop-blur-sm">
            Loading best deals…
          </p>
        )}

        {status === 'failed' && (
          <p className="rounded-2xl border border-red-200 bg-red-50/95 p-6 text-center text-sm text-red-700 shadow-sm backdrop-blur-sm">
            {error}
          </p>
        )}

        {status === 'succeeded' && items.length === 0 && (
          <p className="rounded-2xl border border-neutral-200/80 bg-white/90 p-8 text-center text-sm text-neutral-600 shadow-sm backdrop-blur-sm">
            No deals match right now. Try lowering filters or check back later.
          </p>
        )}

        {status === 'succeeded' && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {items.map((item) => (
              <HomeSectionProductCard
                key={item.id}
                product={{
                  _id: item.id,
                  name: item.name,
                  imageUrl: item.image,
                  price: item.originalPrice,
                  originalPrice: item.originalPrice,
                  discountedPrice: item.discountedPrice,
                  discountPercentage: item.discountPercent,
                  discountAmount: item.discountAmount,
                  hasActiveDiscount: item.discountPercent > 0 || item.discountAmount > 0,
                  appliedDiscount: item.campaignLabel ? { discountName: item.campaignLabel } : null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default BestDeal
