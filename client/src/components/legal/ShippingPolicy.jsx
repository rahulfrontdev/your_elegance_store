import { Link } from 'react-router-dom'
import { STORE_EMAIL, STORE_PHONE, STORE_PHONE_TEL } from '../../config/siteMeta'

const ShippingPolicy = () => {
  return (
    <section className="bg-gradient-to-b from-neutral-50 to-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Your Elegance Store
          </p>
          <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-4xl">Shipping Policy</h1>
          <p className="mt-2 text-sm text-neutral-600">Effective Date: 1 July 2024</p>
        </div>

        <div className="mt-10 space-y-6 text-neutral-700">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">1. Processing Time</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              All orders are processed within 1–2 business days. Orders are not shipped on weekends
              or holidays. If we experience a high volume of orders, processing may be delayed. We
              will notify you via email if there is a significant delay in the shipment of your
              order.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">2. Shipping Rates</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              Shipping costs are calculated at checkout based on the weight of your order and the
              shipping city. We offer free shipping on orders over ₹1499.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">3. Delivery Times</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              Delivery times vary based on the shipping method selected and your location.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">4. Order Tracking</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              Once your order has shipped, you will receive a confirmation email with a tracking
              number. You can use this number to track your order&apos;s progress online.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">5. Lost or Damaged Packages</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              If your package is lost or damaged during transit, please contact us at{' '}
              <a href={`mailto:${STORE_EMAIL}`} className="font-medium text-neutral-900 underline">
                {STORE_EMAIL}
              </a>{' '}
              within 14 days of the order being placed. We will work with you to resolve the issue.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">6. Returns and Exchanges</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              For information on our return and exchange policy, please refer to our{' '}
              <Link to="/return-policy" className="font-medium text-neutral-900 underline">
                returns and exchange policy
              </Link>
              .
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">7. Contact Us</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              If you have any questions about our shipping policy, please contact us at{' '}
              <a href={`tel:${STORE_PHONE_TEL}`} className="font-medium text-neutral-900 underline">
                {STORE_PHONE}
              </a>{' '}
              or{' '}
              <a href={`mailto:${STORE_EMAIL}`} className="font-medium text-neutral-900 underline">
                {STORE_EMAIL}
              </a>
              .
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default ShippingPolicy
