import { lazy, Suspense } from 'react'
import CategoryCards from '../../components/categories/CategoryCards'
import LazyWhenVisible from '../../components/common/LazyWhenVisible'

const Promotional = lazy(() => import('../../components/Promotional'))
const NewArrivalProduct = lazy(() => import('../../components/NewArrivalProduct/NewArrivalProduct'))
const BestDeal = lazy(() => import('../../components/BestDeal/BestDeal'))
const ReelsSection = lazy(() => import('../../components/InstagramEmbadded/Insta'))

const HeroFallback = () => (
  <div className="w-full home-hero" aria-hidden>
    <div className="home-hero__slide home-hero__slide--loading" />
  </div>
)

const SectionFallback = ({ label }) => (
  <div className="py-8 text-center text-sm text-neutral-500">{label}</div>
)

const HomePage = () => {
  return (
    <section className="w-full max-w-full overflow-x-hidden">
      <Suspense fallback={<HeroFallback />}>
        <Promotional />
      </Suspense>
      <CategoryCards />
      <LazyWhenVisible minHeight={280}>
        <Suspense fallback={<SectionFallback label="Loading new arrivals…" />}>
          <NewArrivalProduct />
        </Suspense>
      </LazyWhenVisible>
      <LazyWhenVisible minHeight={320}>
        <Suspense fallback={<SectionFallback label="Loading best deals…" />}>
          <BestDeal />
        </Suspense>
      </LazyWhenVisible>
      <LazyWhenVisible minHeight={360}>
        <Suspense fallback={<SectionFallback label="Loading reels…" />}>
          <ReelsSection />
        </Suspense>
      </LazyWhenVisible>
    </section>
  )
}

export default HomePage
