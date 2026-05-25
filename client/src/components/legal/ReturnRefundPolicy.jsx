const ReturnRefundPolicy = () => {
  return (
    <section className="bg-gradient-to-b from-neutral-50 to-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Your Elegance Store
          </p>
          <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-4xl">
            Return&apos;s &amp; Refund
          </h1>
        </div>

        <div className="mt-10 space-y-8 text-neutral-700">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">Return &amp; refund policy</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              We have no refund and return policy. If you want to claim any damage, wrong item, or
              lost product in your order, an unboxing video is needed. No action will be taken if you
              do not have any unboxing video.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">Unboxing video requirements</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed sm:text-base">
              <li>The video should be from the start with package outer packaging.</li>
              <li>The video must be without any edit and cuts.</li>
              <li>Unboxing video needs to be shared within 24 hours of delivery.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">Contact us</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              You can always contact us for any return question at{' '}
              <a href="tel:+919009488488" className="font-medium text-neutral-900 underline">
                +91 9009488488
              </a>{' '}
              or{' '}
              <a href="mailto:info@yes.com" className="font-medium text-neutral-900 underline">
                info@yes.com
              </a>
              .
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default ReturnRefundPolicy
