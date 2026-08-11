import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import OptimizedImage from './common/OptimizedImage'
import { fetchPublicCarouselSlides } from '../api/carouselApi'
import { normalizeCarouselSlideList } from '../utils/carouselMedia'

const defaultBanners = [
  {
    id: 'default-1',
    image: '/pink-handbags.jpg',
    alt: 'Pink Handbags',
    linkUrl: '/products',
  },
  {
    id: 'default-2',
    image: '/close-up-elegant-bag.jpg',
    alt: 'Elegant Bag',
    linkUrl: '/products',
  },
  {
    id: 'default-3',
    image: '/your Elegance Store (16).png',
    alt: 'Your Elegance Store',
    linkUrl: '/',
  },
]

const Promotional = () => {
  const navigate = useNavigate()
  const [banners, setBanners] = useState(defaultBanners)

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
    return () => window.cancelAnimationFrame(id)
  }, [banners.length])

  useEffect(() => {
    const refreshCarouselLayout = () => {
      window.dispatchEvent(new Event('resize'))
    }
    window.addEventListener('orientationchange', refreshCarouselLayout)
    window.visualViewport?.addEventListener('resize', refreshCarouselLayout)
    return () => {
      window.removeEventListener('orientationchange', refreshCarouselLayout)
      window.visualViewport?.removeEventListener('resize', refreshCarouselLayout)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetchPublicCarouselSlides()
        if (cancelled) return
        const slides = normalizeCarouselSlideList(res.data).filter(
          (s) => s.isActive !== false && s.image
        )
        if (slides.length) setBanners(slides)
      } catch {
        /* keep default banners */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleBannerClick = (linkUrl) => {
    if (!linkUrl) return
    if (linkUrl.startsWith('/')) {
      navigate(linkUrl)
      return
    }
    window.open(linkUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full home-hero">
      <Carousel
        showThumbs={false}
        showStatus={false}
        infiniteLoop
        autoPlay
        interval={4000}
        swipeable
        emulateTouch
        showIndicators
        stopOnHover
        dynamicHeight={false}
        width="100%"
      >
        {banners.map((item) => (
          <div key={String(item.id)} className="home-hero__slide">
            <OptimizedImage
              src={item.image}
              alt={item.alt}
              preset="hero"
              loading="eager"
              fetchPriority="high"
              className="home-hero__image"
              onClick={() => handleBannerClick(item.linkUrl)}
              onKeyDown={(e) => {
                if (item.linkUrl && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleBannerClick(item.linkUrl)
                }
              }}
              role={item.linkUrl ? 'button' : undefined}
              tabIndex={item.linkUrl ? 0 : undefined}
              style={item.linkUrl ? { cursor: 'pointer' } : undefined}
              onError={(e) => {
                const img = e.currentTarget
                if (img.dataset.fallbackApplied === 'true') return
                img.dataset.fallbackApplied = 'true'
                const fallbacks = defaultBanners.map((b) => b.image)
                const idx = banners.findIndex((b) => String(b.id) === String(item.id))
                img.src = fallbacks[idx % fallbacks.length] || '/Logo2.png'
              }}
            />
          </div>
        ))}
      </Carousel>
    </div>
  )
}

export default Promotional
