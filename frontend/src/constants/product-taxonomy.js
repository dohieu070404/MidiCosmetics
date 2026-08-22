import { ROUTE_PATHS } from '@/app/router/route-paths';

const category = (label, slug) => Object.freeze({ label, slug });
const column = (title, items) => Object.freeze({ title, items: Object.freeze(items) });

const groupHref = (group) => `${ROUTE_PATHS.products}?group=${encodeURIComponent(group)}`;
const categoryHref = (group, slug) => `${groupHref(group)}&category=${encodeURIComponent(slug)}`;

export const PRODUCT_MENU_GROUPS = Object.freeze([
  Object.freeze({
    id: 'skincare',
    label: 'Chăm sóc da',
    shortLabel: 'Chăm sóc da',
    description: 'Làm sạch, cân bằng, phục hồi và nuôi dưỡng theo từng nhu cầu da.',
    image: '/images/editorial/hero-skincare-2026.webp',
    mobilePosition: '68% center',
    href: groupHref('skincare'),
    columns: Object.freeze([
      column('Làm sạch', [
        category('Tẩy trang', 'tay-trang'),
        category('Sữa rửa mặt', 'sua-rua-mat'),
        category('Toner', 'toner'),
      ]),
      column('Phục hồi & dưỡng', [
        category('Serum', 'serum'),
        category('Kem dưỡng', 'kem-duong'),
        category('Mặt nạ', 'mat-na'),
        category('Dán mụn', 'dan-mun'),
      ]),
      column('Làm mới & bảo vệ', [
        category('Xịt khoáng', 'xit-khoang'),
        category('Tẩy da chết', 'tay-da-chet'),
        category('Kem chống nắng', 'kem-chong-nang'),
      ]),
    ]),
  }),
  Object.freeze({
    id: 'makeup',
    label: 'Make up',
    shortLabel: 'Make up',
    description: 'Lớp nền trong trẻo, sắc môi hài hòa.',
    image: '/images/editorial/hero-makeup-2026.webp',
    mobilePosition: '65% center',
    href: groupHref('makeup'),
    columns: Object.freeze([
      column('Môi', [category('Son', 'son')]),
      column('Lớp nền', [
        category('Cushion', 'cushion'),
        category('Kem nền', 'kem-nen'),
        category('Kem lót', 'kem-lot'),
        category('Che khuyết điểm', 'che-khuyet-diem'),
        category('Phấn phủ', 'phan-phu'),
        category('Xịt khóa nền', 'xit-khoa-nen'),
      ]),
      column('Mắt & chân mày', [
        category('Mascara', 'mascara'),
        category('Kẻ mắt', 'ke-mat'),
        category('Kẻ mày', 'ke-may'),
      ]),
      column('Màu sắc & tạo khối', [
        category('Phấn mắt, má', 'phan-mat-ma'),
        category('Khối & highlight', 'khoi-highlihght'),
      ]),
    ]),
  }),
  Object.freeze({
    id: 'body-hair',
    label: 'body & hair',
    shortLabel: 'body & hair',
    description: 'Chăm sóc cơ thể, da đầu và mái tóc bằng những bước dễ duy trì.',
    image: '/images/editorial/hero-body-hair-2026.webp',
    mobilePosition: '69% center',
    href: groupHref('body-hair'),
    columns: Object.freeze([
      column('Chăm sóc cơ thể', [
        category('Kem body', 'kem-body'),
        category('Sữa tắm', 'sua-tam'),
        category('Tẩy da chết body', 'tay-da-chet-body'),
        category('Tẩy lông', 'tay-long'),
      ]),
      column('Chăm sóc cá nhân', [
        category('Body mist', 'body-mist'),
        category('Lăn nách', 'lan-nach'),
        category('Dung dịch vệ sinh', 'ddvs'),
        category('Kem đánh răng', 'kem-danh-rang'),
      ]),
      column('Tóc & da đầu', [
        category('Dầu gội', 'dau-goi'),
        category('Chăm sóc da đầu', 'da-dau'),
      ]),
    ]),
  }),
  Object.freeze({
    id: 'fragrance',
    label: 'Nước hoa',
    shortLabel: 'Nước hoa',
    description: 'Những tầng hương được chọn để lưu lại dấu ấn riêng của bạn.',
    image: '/images/editorial/editorial-perfume-2026.webp',
    mobilePosition: '39% center',
    href: groupHref('fragrance'),
    columns: Object.freeze([column('Nước hoa', [category('Tất cả nước hoa', 'nuoc-hoa')])]),
  }),
  Object.freeze({
    id: 'accessories',
    label: 'Phụ kiện',
    shortLabel: 'Phụ kiện',
    description: 'Dụng cụ và phụ kiện nhỏ giúp mỗi bước làm đẹp gọn gàng hơn.',
    image: '/images/editorial/hero-makeup-2026.webp',
    mobilePosition: '48% center',
    href: groupHref('accessories'),
    columns: Object.freeze([
      column('Dụng cụ trang điểm', [
        category('Phụ kiện', 'phu-kien'),
        category('Mút trang điểm', 'mut-trang-diem'),
        category('Kẹp mi', 'kep-mi'),
        category('Kích mí', 'kich-mi'),
      ]),
      column('Làm sạch', [category('Bông tẩy trang', 'bong-tay-trang')]),
    ]),
  }),
]);

export const HERO_PRODUCT_GROUPS = Object.freeze(PRODUCT_MENU_GROUPS.slice(0, 4));

export const PRODUCT_GROUP_BY_ID = Object.freeze(
  Object.fromEntries(PRODUCT_MENU_GROUPS.map((group) => [group.id, group])),
);

export const productCategoryHref = categoryHref;

export const getProductGroupCategorySlugs = (group) => {
  const selected = PRODUCT_GROUP_BY_ID[group];
  if (!selected) return [];
  return [...new Set(selected.columns.flatMap((item) => item.items.map((entry) => entry.slug)))];
};
