import { env, normalizeAppPath } from "@/config/env";

const adminLoginPath = normalizeAppPath(env.ADMIN_LOGIN_PATH, "/quan-tri-midi-secure-2026");

export const ROUTE_PATHS = Object.freeze({
  home: "/",
  blog: "/blog",
  blogDetail: (slug) => `/blog/${slug}`,
  products: "/products",
  productDetail: (slug) => `/products/${slug}`,
  about: "/about",
  adminComingSoon: "/admin",
  adminLogin: adminLoginPath,
  adminDashboard: "/admin/dashboard",
  admin: "/admin/dashboard",
  adminPosts: "/admin/posts",
  adminProducts: "/admin/products",
  adminImport: "/admin/import",
  adminProfile: "/admin/profile",
  adminNotificationRecipients: "/admin/notification-recipients",
  adminHomeSettings: "/admin/homepage",
  adminTaxonomies: "/admin/taxonomies",
});

export const routePathToRouterPath = (path) => String(path || "").replace(/^\/+/, "");
