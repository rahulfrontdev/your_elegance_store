import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLatestProducts } from '../../api/productsApi'

const isActiveDiscount = (value) => value === true || value === 'true' || value === 1 || value === '1'

const NewArrivalProduct = () => {
  const scrollRef = useRef(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLatest = async () => {
      try {
        setLoading(true)
        const response = await fetchLatestProducts(10)
        const root = response?.data
        const list = Array.isArray(root?.data) ? root.data : Array.isArray(root) ? root : []
        setProducts(list)
      } catch (error) {
        console.error('Error loading latest products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadLatest()
  }, [])

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -240 : 240,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="mt-8 px-4 relative">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">New Arrivals</h2>

      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border rounded-full px-2 py-1 shadow z-10"
        aria-label="Scroll left"
      >
        ◀
      </button>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-2">
        {loading ? (
          <p className="text-sm text-gray-500">Loading latest products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">No new arrivals found.</p>
        ) : (
          products.map((item) => {
            const id = item?._id || item?.id
            const image = item?.imageUrl || item?.images?.[0] || ''
            const discountPercentage = Number(item?.discountPercentage ?? 0)
            const discountAmount = Number(item?.discountAmount ?? 0)
            const hasDiscount =
              isActiveDiscount(item?.hasActiveDiscount) ||
              item?.discountedPrice != null ||
              discountPercentage > 0 ||
              discountAmount > 0
            const originalPrice = Number(item?.originalPrice ?? item?.price ?? 0)
            const sellingPrice = hasDiscount
              ? Number(item?.discountedPrice ?? item?.price ?? 0)
              : Number(item?.price ?? 0)
            const campaignLabel = item?.appliedDiscount?.discountName || item?.appliedDiscount?.name || ''

            return (
              <Link
                key={id}
                to={`/products/${id}`}
                className="min-w-[170px] rounded-lg p-2 bg-white hover:shadow border border-gray-100"
              >
                <div className="relative w-full h-32 rounded bg-gray-50 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={item?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No Image
                    </div>
                  )}
                  {hasDiscount && discountPercentage > 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </div>

                <h3 className="text-sm mt-2 font-medium line-clamp-2">{item?.name}</h3>
                <p className="text-sm font-semibold text-gray-900">₹{sellingPrice.toLocaleString('en-IN')}</p>
                {hasDiscount && originalPrice > 0 && (
                  <p className="text-xs text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</p>
                )}
                {hasDiscount && discountAmount > 0 && (
                  <p className="text-[11px] font-medium text-emerald-700">
                    Save ₹{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                )}
                {hasDiscount && campaignLabel && (
                  <p className="text-[10px] font-medium text-emerald-800 line-clamp-1">{campaignLabel}</p>
                )}
              </Link>
            )
          })
        )}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border rounded-full px-2 py-1 shadow z-10"
        aria-label="Scroll right"
      >
        ▶
      </button>
    </section>
  )
}

export default NewArrivalProduct