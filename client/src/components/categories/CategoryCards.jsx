import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRootCategories } from '../../api/categoriesApi'

const CategoryCards = () => {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const loadRootCategories = async () => {
      try {
        const response = await fetchRootCategories()
        setCategories(response?.data?.data || [])
      } catch (error) {
        console.error('Error loading home categories:', error)
        setCategories([])
      }
    }

    loadRootCategories()
  }, [])

  return (
    <section className=" lg:mt-2 mb-2 w-full px-0">
      <div className="mb-2 lg:mb-1">
        <h2 className="text-xl text-center font-bold text-neutral-900 sm:text-2xl">Shop by Category</h2>

      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 lg:p-3">
        {categories.map((cat) => (
          <Link
            key={cat._id || cat.id}
            to={`/products?category=${encodeURIComponent(cat.name)}`}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg"
          >
            <div className="relative h-44 bg-gradient-to-br from-neutral-50 to-neutral-100 p-2 sm:h-44 sm:p-3">
              <img
                src={cat.image}
                alt={cat.name}
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="px-2 py-2 text-center sm:px-3">
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
    </section>
  )
}

export default CategoryCards