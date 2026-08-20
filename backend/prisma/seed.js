import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;

const prisma = new PrismaClient();

const seedBlogTaxonomy = async () => {
  const blogCategories = [
    { name: 'Chăm sóc da', slug: 'cham-soc-da', description: 'Kiến thức chăm sóc da.', sortOrder: 10 },
    { name: 'Trang điểm', slug: 'trang-diem', description: 'Gợi ý trang điểm.', sortOrder: 20 },
    { name: 'Nước hoa', slug: 'nuoc-hoa', description: 'Cảm hứng mùi hương.', sortOrder: 30 },
  ];
  for (const category of blogCategories) await prisma.blogCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
  for (const name of ['Routine', 'Da nhạy cảm', 'Làm đẹp']) {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    await prisma.blogTag.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  }
};

const seedProductTaxonomy = async () => {
  const productCategories = [
    { name: 'Tẩy trang', slug: 'tay-trang', description: 'Làm sạch lớp trang điểm, kem chống nắng và bụi bẩn.', sortOrder: 10 },
    { name: 'Sữa rửa mặt', slug: 'sua-rua-mat', description: 'Làm sạch da mặt hằng ngày.', sortOrder: 20 },
    { name: 'Toner', slug: 'toner', description: 'Cân bằng và chuẩn bị da cho các bước dưỡng.', sortOrder: 30 },
    { name: 'Serum', slug: 'serum', description: 'Tinh chất chăm sóc theo nhu cầu da.', sortOrder: 40 },
    { name: 'Kem dưỡng', slug: 'kem-duong', description: 'Dưỡng ẩm và hỗ trợ hàng rào bảo vệ da.', sortOrder: 50 },
    { name: 'Mặt nạ', slug: 'mat-na', description: 'Bổ sung bước chăm sóc chuyên sâu.', sortOrder: 60 },
    { name: 'Xịt khoáng', slug: 'xit-khoang', description: 'Làm dịu và cấp ẩm nhanh.', sortOrder: 70 },
    { name: 'Tẩy da chết', slug: 'tay-da-chet', description: 'Làm mới bề mặt da.', sortOrder: 80 },
    { name: 'Dán mụn', slug: 'dan-mun', description: 'Miếng dán hỗ trợ chăm sóc nốt mụn.', sortOrder: 90 },
    { name: 'Kem chống nắng', slug: 'kem-chong-nang', description: 'Bảo vệ da trước tia UV.', sortOrder: 100 },
    { name: 'Son', slug: 'son', description: 'Son màu và son dưỡng môi.', sortOrder: 110 },
    { name: 'Cushion', slug: 'cushion', description: 'Phấn nước và cushion nền.', sortOrder: 120 },
    { name: 'Kem nền', slug: 'kem-nen', description: 'Sản phẩm nền dạng kem hoặc lỏng.', sortOrder: 130 },
    { name: 'Kem lót', slug: 'kem-lot', description: 'Chuẩn bị bề mặt da trước lớp nền.', sortOrder: 140 },
    { name: 'Che khuyết điểm', slug: 'che-khuyet-diem', description: 'Che phủ vùng cần hiệu chỉnh.', sortOrder: 150 },
    { name: 'Phấn phủ', slug: 'phan-phu', description: 'Cố định và hoàn thiện lớp nền.', sortOrder: 160 },
    { name: 'Xịt khóa nền', slug: 'xit-khoa-nen', description: 'Hỗ trợ lớp trang điểm bền hơn.', sortOrder: 170 },
    { name: 'Phấn mắt, má', slug: 'phan-mat-ma', description: 'Màu mắt và má hồng.', sortOrder: 180 },
    { name: 'Khối & highlight', slug: 'khoi-highlihght', description: 'Tạo khối và bắt sáng.', sortOrder: 190 },
    { name: 'Mascara', slug: 'mascara', description: 'Chuốt mi và định hình hàng mi.', sortOrder: 200 },
    { name: 'Kẻ mắt', slug: 'ke-mat', description: 'Sản phẩm kẻ viền mắt.', sortOrder: 210 },
    { name: 'Kẻ mày', slug: 'ke-may', description: 'Sản phẩm tạo dáng chân mày.', sortOrder: 220 },
    { name: 'Kích mí', slug: 'kich-mi', description: 'Phụ kiện hỗ trợ tạo nếp mí.', sortOrder: 230 },
    { name: 'Kẹp mi', slug: 'kep-mi', description: 'Dụng cụ uốn cong hàng mi.', sortOrder: 240 },
    { name: 'Kem body', slug: 'kem-body', description: 'Kem dưỡng thể và sản phẩm dưỡng da cơ thể.', sortOrder: 250 },
    { name: 'Sữa tắm', slug: 'sua-tam', description: 'Làm sạch da cơ thể.', sortOrder: 260 },
    { name: 'Tẩy da chết body', slug: 'tay-da-chet-body', description: 'Làm mới bề mặt da cơ thể.', sortOrder: 270 },
    { name: 'Tẩy lông', slug: 'tay-long', description: 'Sản phẩm hỗ trợ loại bỏ lông cơ thể.', sortOrder: 280 },
    { name: 'Body mist', slug: 'body-mist', description: 'Xịt thơm nhẹ cho cơ thể.', sortOrder: 290 },
    { name: 'Lăn nách', slug: 'lan-nach', description: 'Sản phẩm chăm sóc vùng dưới cánh tay.', sortOrder: 300 },
    { name: 'Dung dịch vệ sinh', slug: 'ddvs', description: 'Sản phẩm vệ sinh dịu nhẹ vùng ngoài.', sortOrder: 310 },
    { name: 'Dầu gội', slug: 'dau-goi', description: 'Làm sạch và chăm sóc tóc.', sortOrder: 320 },
    { name: 'Chăm sóc da đầu', slug: 'da-dau', description: 'Sản phẩm chuyên biệt cho da đầu.', sortOrder: 330 },
    { name: 'Nước hoa', slug: 'nuoc-hoa', description: 'Nước hoa và hương thơm cá nhân.', sortOrder: 340 },
    { name: 'Phụ kiện', slug: 'phu-kien', description: 'Dụng cụ và phụ kiện làm đẹp.', sortOrder: 350 },
    { name: 'Mút trang điểm', slug: 'mut-trang-diem', description: 'Mút và bông dặm nền.', sortOrder: 360 },
    { name: 'Bông tẩy trang', slug: 'bong-tay-trang', description: 'Bông dùng trong bước làm sạch và chăm sóc da.', sortOrder: 370 },
    { name: 'Kem đánh răng', slug: 'kem-danh-rang', description: 'Chăm sóc răng miệng hằng ngày.', sortOrder: 380 },
  ];
  for (const category of productCategories) await prisma.productCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
  const brands = [
    { name: 'Midi Cosmetics', slug: 'midi-cosmetics', country: 'Vietnam', description: 'Thương hiệu làm đẹp Midi.', sortOrder: 10 },
    { name: 'Aurea Skin', slug: 'aurea-skin', country: 'Korea', description: 'Skincare nhẹ dịu.', sortOrder: 20 },
  ];
  for (const brand of brands) await prisma.productBrand.upsert({ where: { slug: brand.slug }, update: brand, create: brand });
};

const seedSampleContent = async () => {
  const author = await prisma.user.findFirst({ where: { role: 'ADMIN', deletedAt: null } });
  const category = await prisma.blogCategory.findFirst({ where: { slug: 'cham-soc-da' } });
  const brand = await prisma.productBrand.findFirst({ where: { slug: 'midi-cosmetics' } });
  const productCategory = await prisma.productCategory.findFirst({ where: { slug: 'serum' } });

  if (author && category) {
    await prisma.blogPost.upsert({
      where: { slug: 'routine-cham-soc-da-don-gian' },
      update: { isFeatured: true, featuredOrder: 0 },
      create: {
        authorId: author.id,
        categoryId: category.id,
        title: 'Routine chăm sóc da đơn giản',
        slug: 'routine-cham-soc-da-don-gian',
        excerpt: 'Một routine dễ bắt đầu cho làn da khỏe và đủ ẩm.',
        content: '<p>Bắt đầu với làm sạch dịu nhẹ, sau đó dùng serum cấp ẩm, kem dưỡng và chống nắng vào buổi sáng.</p>',
        status: 'PUBLISHED',
        isFeatured: true,
        featuredOrder: 0,
        readingMinutes: 1,
        publishedAt: new Date(),
      },
    });
  }

  if (brand && productCategory) {
    await prisma.product.upsert({
      where: { slug: 'midi-radiance-serum' },
      update: {},
      create: {
        categoryId: productCategory.id,
        brandId: brand.id,
        name: 'Midi Radiance Serum',
        slug: 'midi-radiance-serum',
        sku: 'MIDI-SERUM-001',
        barcode: '8930000000012',
        stock: 12,
        unit: 'chai',
        shortDescription: 'Serum dưỡng sáng và cấp ẩm.',
        description: 'Phù hợp dùng hằng ngày, kết cấu nhẹ.',
        skinType: 'Mọi loại da',
        ingredients: 'Niacinamide, Hyaluronic Acid, Peptide',
        howToUse: 'Dùng sau toner, trước kem dưỡng.',
        price: '1250000',
        compareAtPrice: '1490000',
        currency: 'VND',
        status: 'ACTIVE',
        isFeatured: true,
        publishedAt: new Date(),
      },
    });
  }
};

const seedSettings = async () => {
  const settings = [
    { key: 'site.name', value: 'Midi Cosmetics', type: 'STRING', group: 'general', description: 'Site name', isPublic: true },
    { key: 'auth.registration_enabled', value: false, type: 'BOOLEAN', group: 'auth', description: 'Public registration disabled', isPublic: false },
    { key: 'catalog.currency', value: 'VND', type: 'STRING', group: 'catalog', description: 'Default currency', isPublic: true },
  ];
  for (const setting of settings) await prisma.siteSetting.upsert({ where: { key: setting.key }, update: setting, create: setting });
};

const main = async () => {
  await seedBlogTaxonomy();
  await seedProductTaxonomy();
  await seedSampleContent();
  await seedSettings();
  console.log('Seed completed without creating or changing any admin account.');
};

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
