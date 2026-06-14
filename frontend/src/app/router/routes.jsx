import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

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
const AdminPlaceholderPage = lazy(() => import('@/pages/admin/admin-placeholder-page').then((m) => ({ default: m.AdminPlaceholderPage })));
const AdminHomepagePage = lazy(() => import('@/pages/admin/admin-homepage-page').then((m) => ({ default: m.AdminHomepagePage })));
const AboutPage = lazy(() => import('@/pages/public/about-page').then((m) => ({ default: m.AboutPage })));
const AdminComingSoonPage = lazy(() => import('@/pages/public/admin-coming-soon-page').then((m) => ({ default: m.AdminComingSoonPage })));
const BlogIndexPage = lazy(() => import('@/pages/public/blog-index-page').then((m) => ({ default: m.BlogIndexPage })));
const BlogDetailPage = lazy(() => import('@/pages/public/blog-detail-page').then((m) => ({ default: m.BlogDetailPage })));
const LoginPage = lazy(() => import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })));
const HomePage = lazy(() => import('@/pages/public/home-page').then((m) => ({ default: m.HomePage })));
const NotFoundPage = lazy(() => import('@/pages/public/not-found-page').then((m) => ({ default: m.NotFoundPage })));
const ProductCatalogPage = lazy(() => import('@/pages/public/product-catalog-page').then((m) => ({ default: m.ProductCatalogPage })));
const ProductDetailPage = lazy(() => import('@/pages/public/product-detail-page').then((m) => ({ default: m.ProductDetailPage })));

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
          { path: 'about', element: withLoading(AboutPage) },
          { path: 'admin', element: withLoading(AdminComingSoonPage) },
          { path: routePathToRouterPath(ROUTE_PATHS.adminLogin), element: withLoading(LoginPage) },
        ],
      },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { path: 'dashboard', element: withLoading(AdminDashboardPage) },
          { path: 'posts', element: withLoading(AdminPostsPage) },
          { path: 'products', element: withLoading(AdminProductsPage) },
          { path: 'import', element: withLoading(AdminProductImportPage) },
          { path: 'taxonomies', element: withLoading(AdminTaxonomiesPage) },
          { path: 'profile', element: withLoading(AdminProfilePage) },
          { path: 'notification-recipients', element: withLoading(AdminNotificationRecipientsPage) },
          { path: 'homepage', element: withLoading(AdminHomepagePage) },
        ],
      },
      { path: '*', element: withLoading(NotFoundPage) },
    ],
  },
]);
