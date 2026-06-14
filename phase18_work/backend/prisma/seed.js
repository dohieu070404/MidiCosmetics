import bcrypt from 'bcryptjs';
import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const defaultDevAdminEmail = 'admin@midicosmetics.local';
const defaultDevAdminPassword = 'Admin@123456';
const parseBoolean = (value) => ['true', '1', 'yes', 'y'].includes(String(value || '').toLowerCase());
const allowAdminSeed = parseBoolean(process.env.ALLOW_ADMIN_SEED);
const devAdminEmail = (process.env.DEV_ADMIN_EMAIL || defaultDevAdminEmail).toLowerCase();
const devAdminPassword = process.env.DEV_ADMIN_PASSWORD || defaultDevAdminPassword;
const devAdminFullName = process.env.DEV_ADMIN_FULL_NAME || 'Midi Admin';
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const hash = (password) => bcrypt.hash(password, bcryptSaltRounds);

const seedUsers = async () => {
  if (isProduction) {
    console.log('Production admin seed skipped. Create the first admin with POST /api/v1/admin/bootstrap.');
    return;
  }

  if (!allowAdminSeed) {
    console.log('Development admin seed skipped because ALLOW_ADMIN_SEED is not true.');
    return;
  }

  const passwordHash = await hash(devAdminPassword);
  await prisma.user.upsert({
    where: { email: devAdminEmail },
    update: { passwordHash, fullName: devAdminFullName, role: 'ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date(), passwordChangedAt: new Date(), deletedAt: null },
    create: { email: devAdminEmail, passwordHash, fullName: devAdminFullName, role: 'ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date(), passwordChangedAt: new Date() },
  });
};

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
    { name: 'Skincare', slug: 'skincare', description: 'Sản phẩm chăm sóc da.', sortOrder: 10 },
    { name: 'Hair', slug: 'hair', description: 'Sản phẩm chăm sóc tóc.', sortOrder: 20 },
    { name: 'Body', slug: 'body', description: 'Sản phẩm chăm sóc cơ thể.', sortOrder: 30 },
    { name: 'Perfume', slug: 'perfume', description: 'Nước hoa và xịt thơm.', sortOrder: 40 },
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
  const productCategory = await prisma.productCategory.findFirst({ where: { slug: 'skincare' } });

  if (author && category) {
    await prisma.blogPost.upsert({
      where: { slug: 'routine-cham-soc-da-don-gian' },
      update: {},
      create: {
        authorId: author.id,
        categoryId: category.id,
        title: 'Routine chăm sóc da đơn giản',
        slug: 'routine-cham-soc-da-don-gian',
        excerpt: 'Một routine dễ bắt đầu cho làn da khỏe và đủ ẩm.',
        content: '<p>Bắt đầu với làm sạch dịu nhẹ, sau đó dùng serum cấp ẩm, kem dưỡng và chống nắng vào buổi sáng.</p>',
        status: 'PUBLISHED',
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
  await seedUsers();
  await seedBlogTaxonomy();
  await seedProductTaxonomy();
  await seedSampleContent();
  await seedSettings();
  console.log('Seed completed.');
  console.table([
    { role: 'ADMIN', email: isProduction || !allowAdminSeed ? 'not seeded' : devAdminEmail },
  ]);
};

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
