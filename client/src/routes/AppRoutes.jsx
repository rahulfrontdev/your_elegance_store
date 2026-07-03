import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import AccountPage from '../pages/account/AccountPage'
import CategoryPage from '../pages/category/CategoryPage'
import HomePage from '../pages/home/HomePage'
import AboutPage from '../pages/about/AboutPage'
import TermsPage from '../pages/legal/TermsPage'
import ReturnPolicyPage from '../pages/legal/ReturnPolicyPage'
import ShippingPolicyPage from '../pages/legal/ShippingPolicyPage'
import PrivacyPolicyPage from '../pages/legal/PrivacyPolicyPage'
import ProductDetailPage from '../pages/product-detail/ProductDetailPage'
import ProductsPage from '../pages/products/ProductsPage'
import CartPage from '../pages/cart/CartPage'
import CheckoutPage from '../pages/checkout/CheckoutPage'
import OrderSuccessPage from '../pages/checkout/OrderSuccessPage'
import WishlistPage from '../pages/wishlist/WishlistPage'
import AccountOrdersPage from '../pages/account/AccountOrdersPage'
import AccountOrderDetailsPage from '../pages/account/AccountOrderDetailsPage'
import AccountWishlistPage from '../pages/account/AccountWishlistPage'
import AccountProfilePage from '../pages/account/AccountProfilePage'
import AccountMyAddressPage from '../pages/account/AccountMyAddressPage'
import Register from '../pages/Register'
import Login from '../pages/Login'
import RequireAdmin from '../components/admin/RequireAdmin'
import RequireAuth from '../components/auth/RequireAuth'
import RequireCustomer from '../components/auth/RequireCustomer'
import AdminLayout from '../layouts/AdminLayout'

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'))
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminCarousel = lazy(() => import('../pages/admin/AdminCarousel'))
const AdminDiscounts = lazy(() => import('../pages/admin/AdminDiscounts'))
const AdminCatalogs = lazy(() => import('../pages/admin/AdminCatalogs'))
const AdminReels = lazy(() => import('../pages/admin/AdminReels'))
const AdminReports = lazy(() => import('../pages/admin/AdminReports'))

const AdminRouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-600">Loading admin…</div>
)
import ModernCartPage from '../pages/modern/ModernCartPage'
import ModernCheckoutPage from '../pages/modern/ModernCheckoutPage'
import ModernAuthPage from '../pages/modern/ModernAuthPage'
import ModernOrderSuccessPage from '../pages/modern/ModernOrderSuccessPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login roleMode="customer" />} />
      <Route path="/admin/login" element={<Login roleMode="admin" />} />
      <Route path="/modern/cart" element={<ModernCartPage />} />
      <Route path="/modern/checkout" element={<ModernCheckoutPage />} />
      <Route path="/modern/login" element={<ModernAuthPage />} />
      <Route path="/modern/order-success" element={<ModernOrderSuccessPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route
          path="categories"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminCategories />
            </Suspense>
          }
        />
        <Route
          path="products"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminProducts />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminUsers />
            </Suspense>
          }
        />
        <Route
          path="carousel"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminCarousel />
            </Suspense>
          }
        />
        <Route
          path="reels"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminReels />
            </Suspense>
          }
        />
        <Route
          path="discounts"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminDiscounts />
            </Suspense>
          }
        />
        <Route
          path="catalogs"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminCatalogs />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminReports />
            </Suspense>
          }
        />
      </Route>
      <Route
        element={
          <RequireCustomer>
            <MainLayout />
          </RequireCustomer>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="return-policy" element={<ReturnPolicyPage />} />
        <Route path="shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<OrderSuccessPage />} />
        <Route element={<RequireAuth />}>
          <Route path="account" element={<AccountPage />}>
            <Route index element={<AccountOrdersPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:orderId" element={<AccountOrderDetailsPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="profile" element={<AccountProfilePage />} />
            <Route path="my-address" element={<AccountMyAddressPage />} />
          </Route>
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
