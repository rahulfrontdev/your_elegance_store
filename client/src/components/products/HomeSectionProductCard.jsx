import { Link } from 'react-router-dom'
import OptimizedImage from '../common/OptimizedImage'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const isActiveDiscount = (value) => value === true || value === 'true' || value === 1 || value === '1'

/** Shared card style for Best Deals grid and New Arrivals carousel */
const HomeSectionProductCard = ({ product, className = '' }) => {
  const id = product?._id || product?.id
  const image = resolveMediaUrl(product?.imageUrl || product?.image || product?.images?.[0] || '')
  const name = product?.name || 'Product'
  const discountPercent = Number(product?.discountPercentage ?? product?.discountPercent ?? 0)
  const discountAmount = Number(product?.discountAmount ?? 0)
  const hasDiscount =
    isActiveDiscount(product?.hasActiveDiscount) ||
    product?.discountedPrice != null ||
    discountPercent > 0 ||
    discountAmount > 0
  const originalPrice = Number(product?.originalPrice ?? product?.price ?? 0)
  const sellingPrice = hasDiscount
    ? Number(product?.discountedPrice ?? product?.price ?? 0)
    : Number(product?.price ?? 0)
  const campaignLabel = product?.appliedDiscount?.discountName || product?.appliedDiscount?.name || product?.campaignLabel || ''

  return (
    <Link
      to={`/products/${id}`}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg ${className}`}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-neutral-50">
        {image ? (
          <OptimizedImage
            src={image}
            alt={name}
            preset="card"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling
              if (fallback) fallback.hidden = false
            }}
          />
        ) : null}
        <div
          hidden={Boolean(image)}
          className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400"
        >
          No Image
        </div>
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[10px]">
            {discountPercent.toFixed(0)}% OFF
          </span>
        )}
        {hasDiscount && campaignLabel && (
          <span className="absolute right-1.5 top-1.5 max-w-[45%] truncate rounded-md bg-emerald-700 px-1.5 py-0.5 text-[8px] font-semibold text-white sm:right-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[9px]">
            {campaignLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 py-1.5 sm:px-2 sm:py-2 lg:px-1.5 lg:py-1.5">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-neutral-800 lg:mb-0.5 lg:text-[13px] lg:leading-snug">
          {name}
        </h3>
        <div className="mt-auto">
          <p className="text-sm font-bold text-neutral-900 lg:text-[13px]">₹{sellingPrice.toLocaleString('en-IN')}</p>
          {hasDiscount && originalPrice > 0 && (
            <p className="text-xs text-neutral-500 line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </p>
          )}
          {hasDiscount && discountAmount > 0 && (
            <p className="mt-0.5 text-[11px] font-medium text-emerald-700 lg:mt-0 lg:text-[10px]">
              Save ₹{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          )}
          {hasDiscount && campaignLabel && (
            <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-emerald-800 lg:hidden">{campaignLabel}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default HomeSectionProductCard
