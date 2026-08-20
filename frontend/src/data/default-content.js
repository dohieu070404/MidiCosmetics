export const DEFAULT_HERO_SCENES = Object.freeze([
  { id: "skincare", kicker: "Nghi thức phục hồi · 01", title: "Chăm sóc da", subtitle: "Công thức tinh giản cho làn da khỏe và ổn định mỗi ngày.", image: "/images/editorial/hero-skincare-2026.webp", mobilePosition: "68% center", href: "/products?group=skincare" },
  { id: "makeup", kicker: "Sắc độ mới · 02", title: "Trang điểm", subtitle: "Màu sắc tôn làn da châu Á, tự nhiên từ sáng đến tối.", image: "/images/editorial/hero-makeup-2026.webp", mobilePosition: "65% center", href: "/products?group=makeup" },
  { id: "body-hair", kicker: "Chăm sóc toàn thân · 03", title: "Cơ thể & tóc", subtitle: "Những nghi thức dịu nhẹ cho cơ thể, da đầu và mái tóc.", image: "/images/editorial/hero-body-hair-2026.webp", mobilePosition: "69% center", href: "/products?group=body-hair" },
  { id: "fragrance", kicker: "Dấu ấn hương thơm · 04", title: "Nước hoa", subtitle: "Tìm tầng hương khiến bạn nhận ra chính mình.", image: "/images/editorial/editorial-perfume-2026.webp", mobilePosition: "39% center", href: "/products?group=fragrance" },
]);

export const DEFAULT_HOME_EDITORIAL = Object.freeze({
  eyebrow: "Tạp chí Midi · Nghệ thuật mùi hương",
  title: "Hương thơm là cách ký ức ở lại.",
  subtitle: "Từ hương sạch ban ngày đến những tầng hổ phách sâu hơn khi đêm xuống—hãy chọn mùi hương khiến bạn nhận ra chính mình.",
  imageUrl: "/images/editorial/editorial-perfume-2026.webp",
  ctaLabel: "Khám phá nước hoa",
  ctaHref: "/products?group=fragrance",
});

export const DEFAULT_HOME_SKINCARE_EDITORIAL = Object.freeze({
  eyebrow: "Nghi thức chăm da · Dùng đúng, đủ và đều",
  title: "Làn da đẹp bắt đầu từ một nhịp chăm sóc vừa đủ.",
  subtitle: "Từ làm sạch dịu nhẹ đến phục hồi hàng rào bảo vệ—hãy xây một chu trình phù hợp với làn da và khí hậu Việt Nam.",
  imageUrl: "/images/editorial/editorial-skincare-2026.webp",
  ctaLabel: "Khám phá chăm sóc da",
  ctaHref: "/products?group=skincare",
});

export const DEFAULT_COLLECTIONS = Object.freeze([
  { uuid: "collection-daily-ritual", slug: "daily-ritual", name: "Daily Ritual", description: "Những món chăm sóc đủ dịu nhẹ để trở thành thói quen mỗi ngày.", coverImage: "/images/editorial/hero-skincare-2026.webp" },
  { uuid: "collection-soft-colour", slug: "soft-colour", name: "Soft Colour", description: "Màu sắc trong trẻo, dễ dùng và tôn sắc da tự nhiên.", coverImage: "/images/editorial/hero-makeup-2026.webp" },
]);
