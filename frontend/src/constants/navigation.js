import { ROUTE_PATHS } from "@/app/router/route-paths";
import { PRODUCT_MENU_GROUPS } from "@/constants/product-taxonomy";

export const PUBLIC_NAVIGATION = Object.freeze([
  { label: "Sản phẩm", shortLabel: "Sản phẩm", href: ROUTE_PATHS.products, menuId: "all" },
  ...PRODUCT_MENU_GROUPS.map((group) => ({ label: group.label, shortLabel: group.shortLabel, href: group.href, menuId: group.id })),
  { label: "Tạp chí Midi", shortLabel: "Tạp chí", href: ROUTE_PATHS.blog },
  { label: "Về MIDI", shortLabel: "Về MIDI", href: ROUTE_PATHS.about },
]);

export const MOBILE_SECONDARY_NAVIGATION = Object.freeze([
  { label: "Tất cả sản phẩm", href: ROUTE_PATHS.products },
  { label: "Collections", href: ROUTE_PATHS.collections },
  { label: "Tạp chí Midi", href: ROUTE_PATHS.blog },
  { label: "Về MIDI", href: ROUTE_PATHS.about },
  { label: "Liên hệ", href: ROUTE_PATHS.contact },
]);

export const ADMIN_NAVIGATION = Object.freeze([
  { section: "Tổng quan", label: "Bảng điều khiển", href: ROUTE_PATHS.adminDashboard },
  { section: "Tổng quan", label: "Mức độ quan tâm", href: ROUTE_PATHS.adminInterestAnalytics },
  { section: "Catalog", label: "Sản phẩm", href: ROUTE_PATHS.adminProducts },
  { section: "Catalog", label: "Danh mục & thương hiệu", href: ROUTE_PATHS.adminTaxonomies },
  { section: "Catalog", label: "Collections", href: ROUTE_PATHS.adminCollections },
  { section: "Catalog", label: "Thư viện ảnh", href: ROUTE_PATHS.adminMedia },
  { section: "Phiếu yêu cầu", label: "Danh sách phiếu", href: ROUTE_PATHS.adminQuotes },
  { section: "Nội dung", label: "Trang chủ", href: ROUTE_PATHS.adminHomeSettings },
  { section: "Nội dung", label: "Bài viết", href: ROUTE_PATHS.adminPosts },
  { section: "Dữ liệu & hệ thống", label: "Import Excel", href: ROUTE_PATHS.adminImport },
  { section: "Dữ liệu & hệ thống", label: "Email thông báo", href: ROUTE_PATHS.adminNotificationRecipients },
  { section: "Dữ liệu & hệ thống", label: "Nhật ký email", href: ROUTE_PATHS.adminEmailLogs },
  { section: "Dữ liệu & hệ thống", label: "Nhật ký thao tác", href: ROUTE_PATHS.adminAuditLogs },
  { section: "Dữ liệu & hệ thống", label: "Tài khoản", href: ROUTE_PATHS.adminProfile },
]);


export const SOCIAL_LINKS = Object.freeze([
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61580016268412&locale=vi_VN",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/midicosmetic/",
  },
]);

export const CONTACT_PHONE = Object.freeze({
  label: "0368214676",
  href: "tel:0368214676",
});

export const SHOP_ADDRESS = "Bãi Chạo, Mường Động, Phú Thọ";
