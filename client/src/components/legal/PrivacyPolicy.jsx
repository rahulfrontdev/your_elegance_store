const sectionClass =
  'scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8'

const listClass = 'mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed sm:text-base'

const PrivacyPolicy = () => {
  return (
    <section className="bg-gradient-to-b from-neutral-50 to-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Your Elegance Store
          </p>
          <h1 className="mt-3 text-2xl font-bold text-neutral-950 sm:text-4xl">Privacy Policy</h1>
        </div>

        <div className="mt-10 space-y-8 text-neutral-700">
          <article className={sectionClass}>
            <p className="text-sm leading-relaxed sm:text-base">
              This Privacy Policy describes how{' '}
              <a
                href="https://www.yourelegancestore.in"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-neutral-900 underline"
              >
                www.yourelegancestore.in
              </a>{' '}
              (the &quot;Site&quot; or &quot;we&quot;) collects, uses, and discloses your Personal
              Information when you visit or make a purchase from the Site. We may change this policy
              from time to time by updating this page.
            </p>
          </article>

          <article className={sectionClass}>
            <h2 className="text-lg font-semibold text-neutral-900">What information we collect</h2>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">Order information</h3>
            <ul className={listClass}>
              <li>
                <strong>Examples of Personal Information collected:</strong> name, billing address,
                shipping address, payment information (including credit card numbers), email
                address, and phone number.
              </li>
              <li>
                <strong>Purpose of collection:</strong> to provide products or services to you to
                fulfill our contract, to process your payment information, arrange for shipping, and
                provide you with invoices and/or order confirmations, communicate with you, screen our
                orders for potential risk or fraud, and when in line with the preferences you have
                shared with us, provide you with information or advertising relating to our products
                or services.
              </li>
              <li>
                <strong>Source of collection:</strong> collected from you.
              </li>
              <li>
                <strong>Disclosure for a business purpose:</strong> shared with our processor REDCAP
                Digital Solutions Pvt Ltd [ADD ANY OTHER VENDORS WITH WHOM YOU SHARE THIS
                INFORMATION. FOR EXAMPLE, SALES CHANNELS, PAYMENT GATEWAYS, SHIPPING AND FULFILLMENT
                APPS].
              </li>
            </ul>
          </article>

          <article className={sectionClass}>
            <h2 className="text-lg font-semibold text-neutral-900">
              What we do with the information we gather
            </h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              We require this information to understand your needs and provide you with a better
              service, and for the following reasons:
            </p>
            <ul className={listClass}>
              <li>Internal record keeping.</li>
              <li>We may use the information to improve our products and services.</li>
              <li>
                We may periodically send promotional emails about new products, special offers or
                other information which we think you may find interesting using the email address
                which you have provided.
              </li>
              <li>
                From time to time, we may also use your information to contact you for market
                research purposes.
              </li>
              <li>We may contact you via e-mail, phone, fax or mail.</li>
              <li>
                We may use the information to customise the website according to your interests.
              </li>
            </ul>
          </article>

          <article className={sectionClass}>
            <h2 className="text-lg font-semibold text-neutral-900">Security</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              We are committed to ensuring that your information is secure. To prevent unauthorised
              access or disclosure we have put in place suitable physical, electronic and
              managerial procedures to safeguard and secure the information we collect online.
            </p>
          </article>

          <article className={sectionClass}>
            <h2 className="text-lg font-semibold text-neutral-900">How we use cookies</h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              A cookie is a small file which asks permission to be placed on your computer&apos;s
              hard drive. Once you agree, the file is added, and the cookie helps analyse web
              traffic or lets you know when you visit a particular site. Cookies allow web
              applications to respond to you as an individual. The web application can tailor its
              operations to your needs, likes and dislikes by gathering and remembering information
              about your preferences.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              We use traffic log cookies to identify which pages are being used. This helps us
              analyse data about webpage traffic and improve our website to tailor it to customer
              needs. We only use this information for statistical analysis purposes and then the
              data is removed from the system.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              Overall, cookies help us provide you with a better website, by enabling us to monitor
              which pages you find useful and which you do not. A cookie in no way gives us access
              to your computer or any information about you, other than the data you choose to share
              with us.
            </p>
            <p className="mt-3 text-sm leading-relaxed sm:text-base">
              You can choose to accept or decline cookies. Most web browsers automatically accept
              cookies, but you can usually modify your browser setting to decline cookies if you
              prefer. This may prevent you from taking full advantage of the website.
            </p>
          </article>

          <article className={sectionClass}>
            <h2 className="text-lg font-semibold text-neutral-900">
              Controlling your personal information
            </h2>
            <ul className={listClass}>
              <li>
                If you have previously agreed to us using your personal information for direct
                marketing purposes, you may change your mind at any time by writing to or emailing
                us at{' '}
                <a
                  href="mailto:yes.yourelegancestore@gmail.com"
                  className="font-medium text-neutral-900 underline"
                >
                  yes.yourelegancestore@gmail.com
                </a>
                .
              </li>
              <li>
                We will not sell, distribute or lease your personal information to third parties
                unless we have your permission or are required by law to do so. We may use your
                personal information to send you promotional information about third parties which
                we think you may find interesting if you tell us that you wish this to happen.
              </li>
              <li>
                You may request details of personal information which we hold about you under the
                Data Protection Act 1998. A small fee will be payable. If you would like a copy of
                the information held on you, please write to us.
              </li>
              <li>
                If you believe that any information we are holding on you is incorrect or
                incomplete, please write to or email us as soon as possible, at the above address.
                We will promptly correct any information found to be incorrect.
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}

export default PrivacyPolicy
