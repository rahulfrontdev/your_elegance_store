import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OptimizedImage from '../common/OptimizedImage'
import { loadNavigationCategories } from '../../hooks/useCategoryNavigation'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const CategoryCards = () => {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false

    loadNavigationCategories()
      .then((list) => {
        if (!cancelled) setCategories(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="px-2 py-3 sm:px-4 sm:py-4 lg:px-4">
      <div className="mx-auto w-full max-w-8xl">
        <h2 className="mb-3 text-center text-xl font-bold text-neutral-900 sm:mb-4 sm:text-2xl">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat._id || cat.id}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg"
            >
              <div className="relative h-52 w-full bg-gradient-to-br from-neutral-50 to-neutral-100 p-1 sm:h-56 sm:p-1.5 lg:h-64 xl:h-72">
                <OptimizedImage
                  src={resolveMediaUrl(cat.image)}
                  alt={cat.name}
                  preset="category"
                  className="h-full w-full object-contain object-center bg-white transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              <div className="px-1.5 py-1.5 text-center sm:px-2 sm:py-2">
                <p className="line-clamp-1 text-sm font-semibold text-neutral-800 sm:text-base">
                  {cat.name}
                </p>
                <p className="mt-1 text-[11px] font-medium text-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Explore now
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryCards
