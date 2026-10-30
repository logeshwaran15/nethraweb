import { Routes, Route, Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ShopProvider } from "@/lib/shop-store";
import { CatalogProvider } from "@/lib/catalog-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { AdminProvider } from "@/lib/admin-store";
import { ToastHost } from "@/lib/toast";
import { ConfirmHost } from "@/lib/confirm";
import { SeoHead } from "@/components/shop/SeoHead";

import IndexPage from "./routes/index";
import AboutPage from "./routes/about";
import TermsPage from "./routes/terms";
import ContactPage from "./routes/contact";
import AccountPage from "./routes/account";
import CartPage from "./routes/cart";
import ForgotPasswordPage from "./routes/forgot-password";
import ResetPasswordPage from "./routes/reset-password";
import CategoriesPage from "./routes/categories";
import CategoryPage from "./routes/category.$slug";
import CheckoutPage from "./routes/checkout";
import OrderSuccessPage from "./routes/order-success";
import OrdersPage from "./routes/orders";
import PaymentPage from "./routes/payment";
import ProductPage from "./routes/product.$id";
import TrackPage from "./routes/track";
import WishlistPage from "./routes/wishlist";

import AdminIndexPage from "./routes/admin.index";
import AdminAnnouncementsPage from "./routes/admin.announcements";
import AdminBannersPage from "./routes/admin.banners";
import AdminCategoriesPage from "./routes/admin.categories";
import AdminCouponsPage from "./routes/admin.coupons";
import AdminCustomersPage from "./routes/admin.customers";
import AdminDeliveryPage from "./routes/admin.delivery";
import AdminInventoryPage from "./routes/admin.inventory";
import AdminOrdersPage from "./routes/admin.orders";
import AdminProductsPage from "./routes/admin.products";
import AdminReportsPage from "./routes/admin.reports";
import AdminSettingsPage from "./routes/admin.settings";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Router doesn't reset scroll position between page navigations on its own —
// without this, clicking into a product from a scrolled-down list (e.g. search
// results) lands on the new page already scrolled partway down.
function ScrollToTop() {
  // location.key changes on every navigation, including clicking a link to the page you're already on.
  const { key } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);

  return null;
}

function AdminLayoutRoute() {
  const { user } = useAuth();

  if (!user || user.Role !== "Admin") {
    return <Navigate to="/account" replace />;
  }

  return (
    <AdminProvider>
      <Outlet />
    </AdminProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <ShopProvider>
          <ScrollToTop />
          <SeoHead />
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />

            <Route path="/admin" element={<AdminLayoutRoute />}>
              <Route index element={<AdminIndexPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route path="banners" element={<AdminBannersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="delivery" element={<AdminDeliveryPage />} />
              <Route path="inventory" element={<AdminInventoryPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <ToastHost />
          <ConfirmHost />
        </ShopProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
