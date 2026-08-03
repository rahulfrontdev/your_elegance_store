import { PRODUCTION_SERVER_ORIGIN } from './api.js'

export const SITE_NAME = 'Your Elegance Store'
export const SITE_TAGLINE = 'Where Style Meets Sophistication'
export const SITE_DESCRIPTION =
  'Shop elegant jewellery, bags, and curated fashion at Your Elegance Store. Discover timeless pieces with free shipping on orders above ₹999.'
export const SITE_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`
export const SITE_URL = PRODUCTION_SERVER_ORIGIN
export const SITE_OG_IMAGE = '/Themed_Logo.png'

const ROUTE_TITLES = {
  '/': SITE_TITLE,
  '/products': `Shop Products | ${SITE_NAME}`,
  '/cart': `Shopping Cart | ${SITE_NAME}`,
  '/checkout': `Checkout | ${SITE_NAME}`,
  '/checkout/success': `Order Confirmed | ${SITE_NAME}`,
  '/wishlist': `Wishlist | ${SITE_NAME}`,
  '/about': `About Us | ${SITE_NAME}`,
  '/terms': `Terms & Conditions | ${SITE_NAME}`,
  '/privacy-policy': `Privacy Policy | ${SITE_NAME}`,
  '/return-policy': `Return & Refund Policy | ${SITE_NAME}`,
  '/shipping-policy': `Shipping Policy | ${SITE_NAME}`,
  '/login': `Sign In | ${SITE_NAME}`,
  '/register': `Create Account | ${SITE_NAME}`,
  '/account': `My Account | ${SITE_NAME}`,
  '/account/orders': `My Orders | ${SITE_NAME}`,
  '/account/wishlist': `My Wishlist | ${SITE_NAME}`,
  '/account/profile': `My Profile | ${SITE_NAME}`,
  '/account/my-address': `My Addresses | ${SITE_NAME}`,
}

export function getPageTitle(pathname) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/products/')) return `Product Details | ${SITE_NAME}`
  if (pathname.startsWith('/category/')) return `Category | ${SITE_NAME}`
  if (pathname.startsWith('/account/orders/')) return `Order Details | ${SITE_NAME}`
  if (pathname.startsWith('/admin')) return `Admin | ${SITE_NAME}`
  return SITE_NAME
}
