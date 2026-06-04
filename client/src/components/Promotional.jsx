import React, { useEffect, useState } from 'react'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import { fetchPublicCarouselSlides } from '../api/carouselApi'
import { normalizeCarouselSlideList } from '../utils/carouselMedia'

const HERO_SLIDE_HEIGHT =
  'h-[440px] min-h-[440px] sm:h-[520px] sm:min-h-[520px] lg:h-[680px] lg:min-h-[680px]'

const defaultBanners = [
    {
        id: 'default-1',
        image: 'https://blog.tanishq.co.in/wp-content/uploads/2023/11/Clip-path-group-1.png',
        alt: 'Elegant Bag',
    },
    {
        id: 'default-2',
        image: 'https://muesa.fr/cdn/shop/files/cabas-xl-en-coton-334057.jpg?v=1721220431',
        alt: 'Pink Handbag',
    },
    {
        id: 'default-3',
        image: 'https://blog.tanishq.co.in/wp-content/uploads/2025/08/Clip-path-group-8-1.png',
        alt: 'Leather Bag',
    },
]

const Promotional = () => {
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

    if (loading) {
        return (
            <div className="w-full home-hero">
                <div className={`${HERO_SLIDE_HEIGHT} animate-pulse bg-gray-200`} aria-hidden />
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
                interval={3000}
                swipeable
                emulateTouch
            >

                {banners.map((item) => (

                    <div
                        key={String(item.id)}
                        className={`${HERO_SLIDE_HEIGHT} bg-white flex items-center justify-center overflow-hidden`}
                    >

                        <img
                            src={item.image}
                            alt={item.alt}
                            className="h-full w-full object-cover object-center"
                        />

                    </div>

                ))}

            </Carousel>
        </div>
    )
}

export default Promotional
