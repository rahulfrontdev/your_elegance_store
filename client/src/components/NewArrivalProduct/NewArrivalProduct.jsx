import { useEffect, useRef, useState } from 'react'
import HomeSectionProductCard from '../products/HomeSectionProductCard'
import { fetchLatestProducts } from '../../api/productsApi'

/** Mobile: same 2-col width as Shop by Category / Best Deal (gap-3) */
const ARRIVAL_CARD_CLASS =
  'flex-shrink-0 snap-start w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3.75rem)/4)]'

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
    const el = scrollRef.current
    if (!el) return
    const firstCard = el.querySelector('[data-arrival-card]')
    const step = firstCard ? firstCard.getBoundingClientRect().width + 12 : 280
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mt-4 px-1 sm:mt-5 sm:px-2 lg:px-2">
      <div className="relative mx-auto max-w-8xl lg:ml-2">
        <h2 className="mb-3 text-center text-lg font-semibold sm:mb-4 sm:text-xl">New Arrivals</h2>

        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-[calc(50%+0.75rem)] z-10 -translate-y-1/2 rounded-full border bg-white px-2 py-1 shadow"
          aria-label="Scroll left"
        >
          ◀
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory sm:gap-4 lg:gap-5"
        >
          {loading ? (
            <p className="w-full text-center text-sm text-neutral-500">Loading latest products...</p>
          ) : products.length === 0 ? (
            <p className="w-full text-center text-sm text-neutral-500">No new arrivals found.</p>
          ) : (
            products.map((item) => (
              <div key={item?._id || item?.id} data-arrival-card className={ARRIVAL_CARD_CLASS}>
                <HomeSectionProductCard product={item} className="h-full" />
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-[calc(50%+0.75rem)] z-10 -translate-y-1/2 rounded-full border bg-white px-2 py-1 shadow"
          aria-label="Scroll right"
        >
          ▶
        </button>
      </div>
    </section>
  )
}

export default NewArrivalProduct
