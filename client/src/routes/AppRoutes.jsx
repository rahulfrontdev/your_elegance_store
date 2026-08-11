import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import HomePage from '../pages/home/HomePage'
import RequireAdmin from '../components/admin/RequireAdmin'
import RequireAuth from '../components/auth/RequireAuth'
import RequireCustomer from '../components/auth/RequireCustomer'
import AdminLayout from '../layouts/AdminLayout'
import PageLoader from '../components/common/PageLoader'

const Register = lazy(() => import('../pages/Register'))
const Login = lazy(() => import('../pages/Login'))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'))
const AboutPage = lazy(() => import('../pages/about/AboutPage'))
const TermsPage = lazy(() => import('../pages/legal/TermsPage'))
const ReturnPolicyPage = lazy(() => import('../pages/legal/ReturnPolicyPage'))
const ShippingPolicyPage = lazy(() => import('../pages/legal/ShippingPolicyPage'))
const PrivacyPolicyPage = lazy(() => import('../pages/legal/PrivacyPolicyPage'))
const ProductDetailPage = lazy(() => import('../pages/product-detail/ProductDetailPage'))
const ProductsPage = lazy(() => import('../pages/products/ProductsPage'))
const CategoryPage = lazy(() => import('../pages/category/CategoryPage'))
const CartPage = lazy(() => import('../pages/cart/CartPage'))
const CheckoutPage = lazy(() => import('../pages/checkout/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('../pages/checkout/OrderSuccessPage'))
const WishlistPage = lazy(() => import('../pages/wishlist/WishlistPage'))
const AccountPage = lazy(() => import('../pages/account/AccountPage'))
const AccountOrdersPage = lazy(() => import('../pages/account/AccountOrdersPage'))
const AccountOrderDetailsPage = lazy(() => import('../pages/account/AccountOrderDetailsPage'))
const AccountWishlistPage = lazy(() => import('../pages/account/AccountWishlistPage'))
const AccountProfilePage = lazy(() => import('../pages/account/AccountProfilePage'))
const AccountMyAddressPage = lazy(() => import('../pages/account/AccountMyAddressPage'))
const ModernCartPage = lazy(() => import('../pages/modern/ModernCartPage'))
const ModernCheckoutPage = lazy(() => import('../pages/modern/ModernCheckoutPage'))
const ModernAuthPage = lazy(() => import('../pages/modern/ModernAuthPage'))
const ModernOrderSuccessPage = lazy(() => import('../pages/modern/ModernOrderSuccessPage'))

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'))
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminCarousel = lazy(() => import('../pages/admin/AdminCarousel'))
const AdminDiscounts = lazy(() => import('../pages/admin/AdminDiscounts'))
const AdminSpecialDiscounts = lazy(() => import('../pages/admin/AdminSpecialDiscounts'))
const AdminCatalogs = lazy(() => import('../pages/admin/AdminCatalogs'))
const AdminReels = lazy(() => import('../pages/admin/AdminReels'))
const AdminReports = lazy(() => import('../pages/admin/AdminReports'))
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'))

const AdminRouteFallback = () => <PageLoader label="Loading admin…" />

const withSuspense = (element, label = 'Loading…') => (
  <Suspense fallback={<PageLoader label={label} />}>{element}</Suspense>
)

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/register" element={withSuspense(<Register />, 'Loading…')} />
      <Route
        path="/login"
        element={withSuspense(<Login roleMode="customer" />, 'Loading…')}
      />
      <Route path="/forgot-password" element={withSuspense(<ForgotPasswordPage />)} />
      <Route path="/reset-password" element={withSuspense(<ResetPasswordPage />)} />
      <Route
        path="/admin/login"
        element={withSuspense(<Login roleMode="admin" />, 'Loading…')}
      />
      <Route path="/modern/cart" element={withSuspense(<ModernCartPage />)} />
      <Route path="/modern/checkout" element={withSuspense(<ModernCheckoutPage />)} />
      <Route path="/modern/login" element={withSuspense(<ModernAuthPage />)} />
      <Route path="/modern/order-success" element={withSuspense(<ModernOrderSuccessPage />)} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={withSuspense(<AdminDashboard />, 'Loading admin…')} />
        <Route path="categories" element={withSuspense(<AdminCategories />, 'Loading admin…')} />
        <Route path="products" element={withSuspense(<AdminProducts />, 'Loading admin…')} />
        <Route path="users" element={withSuspense(<AdminUsers />, 'Loading admin…')} />
        <Route path="reviews" element={withSuspense(<AdminReviews />, 'Loading admin…')} />
        <Route path="carousel" element={withSuspense(<AdminCarousel />, 'Loading admin…')} />
        <Route path="reels" element={withSuspense(<AdminReels />, 'Loading admin…')} />
        <Route path="discounts" element={withSuspense(<AdminDiscounts />, 'Loading admin…')} />
        <Route
          path="special-discounts"
          element={withSuspense(<AdminSpecialDiscounts />, 'Loading admin…')}
        />
        <Route path="catalogs" element={withSuspense(<AdminCatalogs />, 'Loading admin…')} />
        <Route path="reports" element={withSuspense(<AdminReports />, 'Loading admin…')} />
      </Route>
      <Route
        element={
          <RequireCustomer>
            <MainLayout />
          </RequireCustomer>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="about" element={withSuspense(<AboutPage />)} />
        <Route path="terms" element={withSuspense(<TermsPage />)} />
        <Route path="return-policy" element={withSuspense(<ReturnPolicyPage />)} />
        <Route path="shipping-policy" element={withSuspense(<ShippingPolicyPage />)} />
        <Route path="privacy-policy" element={withSuspense(<PrivacyPolicyPage />)} />
        <Route path="products" element={withSuspense(<ProductsPage />, 'Loading products…')} />
        <Route path="products/:productId" element={withSuspense(<ProductDetailPage />)} />
        <Route path="category/:categoryId" element={withSuspense(<CategoryPage />)} />
        <Route path="cart" element={withSuspense(<CartPage />)} />
        <Route path="checkout" element={withSuspense(<CheckoutPage />)} />
        <Route path="checkout/success" element={withSuspense(<OrderSuccessPage />)} />
        <Route element={<RequireAuth />}>
          <Route path="account" element={withSuspense(<AccountPage />)}>
            <Route index element={withSuspense(<AccountOrdersPage />)} />
            <Route path="orders" element={withSuspense(<AccountOrdersPage />)} />
            <Route path="orders/:orderId" element={withSuspense(<AccountOrderDetailsPage />)} />
            <Route path="wishlist" element={withSuspense(<AccountWishlistPage />)} />
            <Route path="profile" element={withSuspense(<AccountProfilePage />)} />
            <Route path="my-address" element={withSuspense(<AccountMyAddressPage />)} />
          </Route>
          <Route path="wishlist" element={withSuspense(<WishlistPage />)} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
