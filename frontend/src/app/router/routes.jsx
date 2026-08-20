import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminLayout } from '@/app/layouts/admin-layout';
import { MarketingLayout } from '@/app/layouts/marketing-layout';
import { RootLayout } from '@/app/layouts/root-layout';
import { RouteErrorBoundary } from '@/components/common/route-error-boundary';
import { RouteLoading } from '@/components/common/route-loading';
import { ROUTE_PATHS, routePathToRouterPath } from '@/app/router/route-paths';

const AdminDashboardPage = lazy(() => import('@/pages/admin/admin-dashboard-page').then((m) => ({ default: m.AdminDashboardPage })));
const AdminPostsPage = lazy(() => import('@/pages/admin/admin-posts-page').then((m) => ({ default: m.AdminPostsPage })));
const AdminProductsPage = lazy(() => import('@/pages/admin/admin-products-page').then((m) => ({ default: m.AdminProductsPage })));
const AdminProductImportPage = lazy(() => import('@/pages/admin/admin-products-page').then((m) => ({ default: m.AdminProductImportPage })));
const AdminProfilePage = lazy(() => import('@/pages/admin/admin-profile-page').then((m) => ({ default: m.AdminProfilePage })));
const AdminNotificationRecipientsPage = lazy(() => import('@/pages/admin/admin-notification-recipients-page').then((m) => ({ default: m.AdminNotificationRecipientsPage }))); 
const AdminTaxonomiesPage = lazy(() => import('@/pages/admin/admin-taxonomies-page').then((m) => ({ default: m.AdminTaxonomiesPage })));
const AdminHomepagePage = lazy(() => import('@/pages/admin/admin-homepage-page').then((m) => ({ default: m.AdminHomepagePage })));
const AdminCollectionsPage = lazy(() => import('@/pages/admin/admin-operations-pages').then((m) => ({ default: m.AdminCollectionsPage })));
const AdminMediaPage = lazy(() => import('@/pages/admin/admin-operations-pages').then((m) => ({ default: m.AdminMediaPage })));
const AdminQuotesPage = lazy(() => import('@/pages/admin/admin-operations-pages').then((m) => ({ default: m.AdminQuotesPage })));
const AdminInterestAnalyticsPage = lazy(() => import('@/pages/admin/admin-operations-pages').then((m) => ({ default: m.AdminInterestAnalyticsPage })));
const AdminEmailLogsPage = lazy(() => import('@/pages/admin/admin-operations-pages').then((m) => ({ default: m.AdminEmailLogsPage })));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/admin-operations-pages').then((m) => ({ default: m.AdminAuditLogsPage })));
const AboutPage = lazy(() => import('@/pages/public/about-page').then((m) => ({ default: m.AboutPage })));
const BlogIndexPage = lazy(() => import('@/pages/public/blog-index-page').then((m) => ({ default: m.BlogIndexPage })));
const BlogDetailPage = lazy(() => import('@/pages/public/blog-detail-page').then((m) => ({ default: m.BlogDetailPage })));
const LoginPage = lazy(() => import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })));
const HomePage = lazy(() => import('@/pages/public/home-page').then((m) => ({ default: m.HomePage })));
const NotFoundPage = lazy(() => import('@/pages/public/not-found-page').then((m) => ({ default: m.NotFoundPage })));
const ProductCatalogPage = lazy(() => import('@/pages/public/product-catalog-page').then((m) => ({ default: m.ProductCatalogPage })));
const ProductDetailPage = lazy(() => import('@/pages/public/product-detail-page').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('@/pages/public/cart-page').then((m) => ({ default: m.CartPage })));
const QuotePage = lazy(() => import('@/pages/public/quote-page').then((m) => ({ default: m.QuotePage })));
const CollectionsPage = lazy(() => import('@/pages/public/collections-page').then((m) => ({ default: m.CollectionsPage })));
const CollectionDetailPage = lazy(() => import('@/pages/public/collections-page').then((m) => ({ default: m.CollectionDetailPage })));
const ContactPage = lazy(() => import('@/pages/public/contact-page').then((m) => ({ default: m.ContactPage })));

const withLoading = (Component) => <Suspense fallback={<RouteLoading />}><Component /></Suspense>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          { index: true, element: withLoading(HomePage) },
          { path: 'blog', element: withLoading(BlogIndexPage) },
          { path: 'blog/:slug', element: withLoading(BlogDetailPage) },
          { path: 'products', element: withLoading(ProductCatalogPage) },
          { path: 'products/:slug', element: withLoading(ProductDetailPage) },
          { path: 'collections', element: withLoading(CollectionsPage) },
          { path: 'collections/:slug', element: withLoading(CollectionDetailPage) },
          { path: 'cart', element: withLoading(CartPage) },
          { path: 'quote/:token', element: withLoading(QuotePage) },
          { path: 'about', element: withLoading(AboutPage) },
          { path: 'contact', element: withLoading(ContactPage) },
        ],
      },
      { path: routePathToRouterPath(ROUTE_PATHS.adminLogin), element: withLoading(LoginPage) },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: withLoading(AdminDashboardPage) },
          { path: 'posts', element: withLoading(AdminPostsPage) },
          { path: 'products', element: withLoading(AdminProductsPage) },
          { path: 'import', element: withLoading(AdminProductImportPage) },
          { path: 'taxonomies', element: withLoading(AdminTaxonomiesPage) },
          { path: 'collections', element: withLoading(AdminCollectionsPage) },
          { path: 'media', element: withLoading(AdminMediaPage) },
          { path: 'quotes', element: withLoading(AdminQuotesPage) },
          { path: 'interest-analytics', element: withLoading(AdminInterestAnalyticsPage) },
          { path: 'email-logs', element: withLoading(AdminEmailLogsPage) },
          { path: 'audit-logs', element: withLoading(AdminAuditLogsPage) },
          { path: 'settings', element: <Navigate to="../dashboard" replace /> },
          { path: 'profile', element: withLoading(AdminProfilePage) },
          { path: 'notification-recipients', element: withLoading(AdminNotificationRecipientsPage) },
          { path: 'homepage', element: withLoading(AdminHomepagePage) },
        ],
      },
      { path: '*', element: withLoading(NotFoundPage) },
    ],
  },
]);
