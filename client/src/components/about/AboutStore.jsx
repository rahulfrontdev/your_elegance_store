import { STORE_EMAIL, STORE_PHONE, STORE_PHONE_TEL } from '../../config/siteMeta'

const AboutStore = () => {
  return (
    <section className="relative overflow-x-clip px-4 py-12 sm:px-6 sm:py-16">
      <img
        src="/background_image.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="low"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/30" aria-hidden />

      <article className="relative z-10 mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-10">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            About Us
          </p>
          <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-4xl">
            Welcome to Your Elegance Store
          </h1>
        </header>

        <div className="space-y-6 text-sm leading-[1.9] text-neutral-700 sm:text-base">
          <p>
            Welcome to Your Elegance Store, where elegance meets everyday fashion. We believe that
            the perfect accessory does more than complete an outfit—it expresses your personality,
            confidence, and unique style. Our thoughtfully curated collection of fashion accessories,
            handbags, and hair accessories is designed for modern women who appreciate quality, style,
            and affordability. Whether you&apos;re dressing for work, a celebration, or everyday
            moments, Your Elegance Store offers timeless pieces that help you look and feel your
            best.
          </p>

          <p>
            <strong className="text-neutral-900">Our Story.</strong> Your Elegance Store was born
            from a passion for fashion and a vision to make premium accessories accessible to
            everyone. Every product in our collection is carefully selected with attention to
            quality, craftsmanship, and current trends. We combine timeless elegance with
            contemporary designs to create accessories that are fashionable, versatile, and made to
            last. From elegant jewellery and stylish handbags to trendy hair accessories, our
            collections are created to complement every occasion and every personality.
          </p>

          <p>
            <strong className="text-neutral-900">Our Vision.</strong> Our vision is to become one
            of India&apos;s most trusted fashion accessory brands by delivering products that
            inspire confidence, celebrate individuality, and bring affordable luxury to everyday
            life. We strive to create a shopping experience where every customer discovers
            accessories that perfectly reflect their personal style.
          </p>

          <p>
            <strong className="text-neutral-900">Meet the Founder.</strong> Your Elegance Store is
            the vision of Eshita Gupta, whose passion for fashion and creativity inspired the
            brand&apos;s journey. Driven by an eye for design and a commitment to quality, Eshita
            set out to create a brand that celebrates individuality through beautifully crafted
            accessories. Inspired by global fashion trends, diverse cultures, and everyday
            elegance, she believes that the right accessory has the power to transform not only an
            outfit but also the confidence of the person wearing it. Her dedication continues to
            shape every collection, ensuring that each piece reflects style, quality, and timeless
            elegance.
          </p>

          <p>
            <strong className="text-neutral-900">What We Offer.</strong> At Your Elegance Store, we
            offer a carefully curated range of fashion accessories, including premium fashion
            jewellery, elegant handbags, hair accessories, belts, wallets &amp; purses, everyday
            fashion essentials, and trendy seasonal collections. Every product is selected with a
            focus on quality, comfort, durability, and contemporary style.
          </p>

          <p>
            <strong className="text-neutral-900">Our Promise.</strong> At Your Elegance Store,
            customer satisfaction is at the heart of everything we do. We are committed to premium
            quality products, affordable luxury, trend-driven collections, reliable customer
            service, a secure shopping experience, and continuous innovation. Every purchase
            represents our commitment to helping you express your unique style with confidence.
          </p>

          <p>
            <strong className="text-neutral-900">Our Philosophy.</strong> Fashion is more than what
            you wear—it&apos;s how you express yourself. At Your Elegance Store, we celebrate
            individuality, confidence, and timeless elegance through accessories that make every
            moment a little more beautiful. Wear Confidence. Wear Elegance.
          </p>

          <p className="border-t border-neutral-200 pt-6 text-center text-neutral-800">
            <span className="block font-semibold text-neutral-900">Get in touch</span>
            <a href={`tel:${STORE_PHONE_TEL}`} className="mt-2 inline-block hover:text-neutral-950">
              {STORE_PHONE}
            </a>
            <span className="mx-2 text-neutral-400">·</span>
            <a
              href={`mailto:${STORE_EMAIL}`}
              className="inline-block hover:text-neutral-950"
            >
              {STORE_EMAIL}
            </a>
          </p>
        </div>
      </article>
    </section>
  )
}

export default AboutStore
