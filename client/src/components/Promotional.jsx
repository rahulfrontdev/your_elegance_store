import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchPublicCarouselSlides()
        if (cancelled) return
        const slides = normalizeCarouselSlideList(res.data).filter(
          (s) => s.isActive !== false && s.image
        )
        setBanners(slides.length ? slides : defaultBanners)
      } catch {
        if (!cancelled) setBanners(defaultBanners)
      } finally {
        if (!cancelled) setLoading(false)
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

  if (loading) {
    return (
      <div className="w-full home-hero">
        <div className="home-hero__slide home-hero__slide--loading" aria-hidden />
      </div>
    )
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
      >
        {banners.map((item) => (
          <div key={String(item.id)} className="home-hero__slide">
            <img
              src={item.image}
              alt={item.alt}
              className="home-hero__image"
              loading="eager"
              decoding="async"
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
