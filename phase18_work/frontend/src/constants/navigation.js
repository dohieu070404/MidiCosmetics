import { ROUTE_PATHS } from "@/app/router/route-paths";

export const PUBLIC_NAVIGATION = Object.freeze([
  { label: "Blog", href: ROUTE_PATHS.blog },
  { label: "Sản phẩm", href: ROUTE_PATHS.products },
  { label: "Về chúng tôi", href: ROUTE_PATHS.about },
]);

export const ADMIN_NAVIGATION = Object.freeze([
  { label: "Tổng quan", href: ROUTE_PATHS.adminDashboard },
  { label: "Sản phẩm", href: ROUTE_PATHS.adminProducts },
  { label: "Bài viết", href: ROUTE_PATHS.adminPosts },
  { label: "Import Excel", href: ROUTE_PATHS.adminImport },
  { label: "Giao diện trang chủ", href: ROUTE_PATHS.adminHomeSettings },
  { label: "Email thông báo", href: ROUTE_PATHS.adminNotificationRecipients },
  { label: "Tài khoản", href: ROUTE_PATHS.adminProfile },
]);

export const SOCIAL_LINKS = Object.freeze([
  { label: "Facebook", href: "https://facebook.com/midicosmetics" },
  { label: "Instagram", href: "https://instagram.com/midicosmetics" },
  { label: "TikTok", href: "https://tiktok.com/@midicosmetics" },
]);

export const CONTACT_PHONE = Object.freeze({ label: "0900 123 456", href: "tel:0900123456" });
export const SHOP_ADDRESS = "Địa chỉ shop: đang cập nhật";
