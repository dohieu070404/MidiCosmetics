import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AdminLayout } from '@/app/layouts/admin-layout';
import { MarketingLayout } from '@/app/layouts/marketing-layout';
import { RootLayout } from '@/app/layouts/root-layout';
import { RouteErrorBoundary } from '@/components/common/route-error-boundary';
import { RouteLoading } from '@/components/common/route-loading';
import { ROUTE_PATHS, routePathToRouterPath } from '@/app/router/route-paths';

const lazyNamed = (importModule, exportName) =>
  lazy(() => importModule().then((module) => ({ default: module[exportName] })));

const AdminDashboardPage = lazyNamed(
  () => import('@/pages/admin/admin-dashboard-page'),
  'AdminDashboardPage',
);
const AdminPostsPage = lazyNamed(() => import('@/pages/admin/admin-posts-page'), 'AdminPostsPage');
const AdminProductsPage = lazyNamed(
  () => import('@/pages/admin/admin-products-page'),
  'AdminProductsPage',
);
const AdminProductImportPage = lazyNamed(
  () => import('@/pages/admin/admin-products-page'),
  'AdminProductImportPage',
);
const AdminProfilePage = lazyNamed(
  () => import('@/pages/admin/admin-profile-page'),
  'AdminProfilePage',
);
const AdminNotificationRecipientsPage = lazyNamed(
  () => import('@/pages/admin/admin-notification-recipients-page'),
  'AdminNotificationRecipientsPage',
);
const AdminTaxonomiesPage = lazyNamed(
  () => import('@/pages/admin/admin-taxonomies-page'),
  'AdminTaxonomiesPage',
);
const AdminHomepagePage = lazyNamed(
  () => import('@/pages/admin/admin-homepage-page'),
  'AdminHomepagePage',
);

const AdminCollectionsPage = lazyNamed(
  () => import('@/pages/admin/admin-operations-pages'),
  'AdminCollectionsPage',
);
const AdminMediaPage = lazyNamed(
  () => import('@/pages/admin/admin-operations-pages'),
  'AdminMediaPage',
);
const AdminQuotesPage = lazyNamed(
  () => import('@/pages/admin/admin-operations-pages'),
  'AdminQuotesPage',
);
const AdminInterestAnalyticsPage = lazyNamed(
  () => import('@/pages/admin/admin-operations-pages'),
  'AdminInterestAnalyticsPage',
);
const AdminEmailLogsPage = lazyNamed(
  () => import('@/pages/admin/admin-operations-pages'),
  'AdminEmailLogsPage',
);
const AdminAuditLogsPage = lazyNamed(
  () => import('@/pages/admin/admin-operations-pages'),
  'AdminAuditLogsPage',
);

const AboutPage = lazyNamed(() => import('@/pages/public/about-page'), 'AboutPage');
const BlogIndexPage = lazyNamed(() => import('@/pages/public/blog-index-page'), 'BlogIndexPage');
const BlogDetailPage = lazyNamed(() => import('@/pages/public/blog-detail-page'), 'BlogDetailPage');
const LoginPage = lazyNamed(() => import('@/pages/auth/login-page'), 'LoginPage');
const HomePage = lazyNamed(() => import('@/pages/public/home-page'), 'HomePage');
const NotFoundPage = lazyNamed(() => import('@/pages/public/not-found-page'), 'NotFoundPage');
const ProductCatalogPage = lazyNamed(
  () => import('@/pages/public/product-catalog-page'),
  'ProductCatalogPage',
);
const ProductDetailPage = lazyNamed(
  () => import('@/pages/public/product-detail-page'),
  'ProductDetailPage',
);
const CartPage = lazyNamed(() => import('@/pages/public/cart-page'), 'CartPage');
const QuotePage = lazyNamed(() => import('@/pages/public/quote-page'), 'QuotePage');
const CollectionsPage = lazyNamed(
  () => import('@/pages/public/collections-page'),
  'CollectionsPage',
);
const CollectionDetailPage = lazyNamed(
  () => import('@/pages/public/collections-page'),
  'CollectionDetailPage',
);
const ContactPage = lazyNamed(() => import('@/pages/public/contact-page'), 'ContactPage');

const withLoading = (Component) => (
  <Suspense fallback={<RouteLoading />}>
    <Component />
  </Suspense>
);

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
          {
            path: 'notification-recipients',
            element: withLoading(AdminNotificationRecipientsPage),
          },
          { path: 'homepage', element: withLoading(AdminHomepagePage) },
        ],
      },
      { path: '*', element: withLoading(NotFoundPage) },
    ],
  },
]);
