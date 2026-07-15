import { Link } from 'react-router-dom'
import { stringifyEntityId } from '../../utils/discountPreview'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const isActiveDiscount = (value) => value === true || value === 'true' || value === 1 || value === '1'

const ProductCard = ({ product, returnPath = '/products' }) => {
  const productId = stringifyEntityId(product?._id ?? product?.id)
  const imageSrc = resolveMediaUrl(product?.imageUrl || product?.image)
  const brandLabel =
    product?.brand || (typeof product?.category === 'object' ? product?.category?.name : '')
  const discountPercent = Number(product?.discountPercentage ?? 0)
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
  const campaignLabel = product?.appliedDiscount?.discountName || product?.appliedDiscount?.name || ''
  const averageRating = Number(product?.averageRating || product?.rating || product?.ratingsAverage || 0)
  const reviewCount = Number(product?.reviewCount || product?.ratingsCount || product?.numReviews || 0)
  const roundedRating = Math.round(averageRating)

  return (
    <Link
      to={`/products/${productId}`}
      state={{ from: returnPath }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product?.name || 'Product'}
            className="h-full w-full object-contain object-center transition duration-500 group-hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling
              if (fallback) fallback.hidden = false
            }}
          />
        ) : null}
        <div
          hidden={Boolean(imageSrc)}
          className="flex h-full w-full items-center justify-center text-xs text-neutral-400"
        >
          No Image
        </div>
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white">
            {discountPercent}% OFF
          </span>
        )}
        {hasDiscount && campaignLabel && (
          <span className="absolute right-2 top-2 rounded-md bg-emerald-700 px-2 py-1 text-[9px] font-semibold text-white">
            {campaignLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          {brandLabel}
        </p>
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-neutral-900">
          {product?.name}
        </h3>
        <p className="mb-2 text-xs text-neutral-600">
          <span className="text-amber-600" aria-hidden>
            {'★'.repeat(Math.max(0, Math.min(5, roundedRating)))}
            {'☆'.repeat(5 - Math.max(0, Math.min(5, roundedRating)))}
          </span>{' '}
          {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'} ({reviewCount})
        </p>
        <div className="mt-auto">
          <p className="text-base font-bold text-neutral-900">
            ₹{sellingPrice.toLocaleString('en-IN')}
          </p>
          {hasDiscount && originalPrice > 0 && (
            <p className="text-xs text-neutral-500 line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </p>
          )}
          {hasDiscount && discountAmount > 0 && (
            <p className="mt-1 text-[11px] font-medium text-emerald-700">
              Save ₹{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          )}
          {hasDiscount && campaignLabel && (
            <p className="mt-1 text-[10px] font-medium text-emerald-800 line-clamp-1">
              {campaignLabel}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
