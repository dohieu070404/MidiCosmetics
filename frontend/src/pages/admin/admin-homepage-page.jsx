import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, ImageIcon, LockKeyhole, Save, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { AdminModal } from '@/components/admin/admin-modal';
import { MediaPicker } from '@/components/admin/media-picker';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { DEFAULT_HERO_SCENES } from '@/data/default-content';
import { adminApi } from '@/lib/api/admin-api';
import { validateLocalImageFiles } from '@/lib/media';
import {
  ActionButton,
  AdminTable,
  FileInput,
  Notice,
  NumberInput,
  PageHeader,
  SecondaryButton,
  SectionCard,
  StatusBadge,
  TextArea,
  TextInput,
} from './admin-shared';

const CURRENT_SECTION_IDS = [
  'hero',
  'featured-products',
  'custom-text',
  'skincare-editorial',
  'featured-posts',
];
const SECTION_META = Object.freeze({
  hero: {
    label: 'Hero 4 danh mục',
    description:
      'Bốn ảnh Chăm sóc da, Trang điểm, Cơ thể & tóc và Nước hoa đang hiển thị thật trên đầu trang.',
  },
  'featured-products': {
    label: 'Sản phẩm được quan tâm',
    description: 'Một hàng sản phẩm cuộn ngang trên desktop và mobile.',
  },
  'custom-text': {
    label: 'Editorial nước hoa',
    description: 'Khối ảnh và nội dung nền đỏ ở giữa trang.',
  },
  'skincare-editorial': {
    label: 'Editorial skincare',
    description: 'Khối nội dung chăm sóc da nền kem, nằm ngay trước Tạp chí Midi.',
  },
  'featured-posts': {
    label: 'Tạp chí Midi',
    description: 'Tiêu đề và danh sách bài viết nổi bật.',
  },
});

const DEFAULT_ABOUT_CONTENT = Object.freeze({
  eyebrow: 'Về Midi Cosmetics',
  title: 'Vẻ đẹp nên nhẹ nhàng, tinh tế và dễ duy trì.',
  intro:
    'Midi Cosmetics xây dựng một không gian tuyển chọn mỹ phẩm, chăm sóc cá nhân và hương thơm chính hãng dành cho người Việt.',
  imageUrl: '/images/products/midi-body-cream.svg',
  sectionEyebrow: 'Cách MIDI lựa chọn',
  sectionTitle: 'Ít hơn, nhưng đúng hơn.',
  paragraphOne:
    'Mỗi sản phẩm được cân nhắc dựa trên công thức, trải nghiệm sử dụng, nguồn gốc và khả năng phù hợp với khí hậu Việt Nam.',
  paragraphTwo:
    'Chúng tôi không yêu cầu bạn tạo tài khoản hay đi qua một quy trình mua hàng dài. Bạn chỉ cần chọn sản phẩm, tạo phiếu và trò chuyện trực tiếp với cửa hàng để xác nhận.',
});

const productImage = (product) =>
  product?.images?.[0]?.mediaAsset?.secureUrl || product?.mainImage || '';
const postImage = (post) => post?.featuredImage?.secureUrl || post?.image || '';
const defaultSlides = () =>
  DEFAULT_HERO_SCENES.map((slide) => ({ ...slide, imageUrl: slide.image }));

const cloneSection = (section) => ({
  ...section,
  config: {
    ...(section.config || {}),
    ...(section.type === 'HERO'
      ? {
          slides: (section.config?.slides?.length ? section.config.slides : defaultSlides()).map(
            (slide) => ({ ...slide }),
          ),
        }
      : {}),
  },
});

function MiniProductCard({ product }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/15 bg-white/85 text-foreground shadow-sm">
      <ImageWithFallback
        src={productImage(product)}
        alt={product?.name || 'Sản phẩm'}
        className="aspect-[4/3] w-full bg-secondary object-cover"
      />
      <div className="p-3">
        <p className="truncate text-xs uppercase tracking-[0.12em] text-primary/80">
          {product?.category?.name || product?.brand?.name || 'Midi'}
        </p>
        <p className="mt-1 line-clamp-2 font-display text-lg leading-snug">
          {product?.name || 'Sản phẩm nổi bật'}
        </p>
      </div>
    </div>
  );
}

function MiniPostCard({ post }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-background">
      <ImageWithFallback
        src={postImage(post)}
        alt={post?.title || 'Bài viết'}
        className="aspect-[16/10] w-full bg-secondary object-cover"
      />
      <div className="p-3">
        <p className="text-xs uppercase tracking-[0.12em] text-primary/80">
          {post?.category?.name || 'Tạp chí Midi'}
        </p>
        <p className="mt-1 line-clamp-2 font-display text-lg leading-snug">
          {post?.title || 'Bài viết nổi bật'}
        </p>
      </div>
    </div>
  );
}

function PreviewBlock({ section, products, posts, active, onSelect }) {
  const config = section.config || {};
  const enabled = section.type === 'HERO' || section.isEnabled;
  const slides = config.slides?.length ? config.slides : defaultSlides();
  const hero = slides[0];
  const selectedProducts = products
    .filter((item) => item.isFeatured)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, Number(config.limit || 8));
  const selectedPosts = posts
    .filter((item) => item.isFeatured)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
    .slice(0, Number(config.limit || 3));

  return (
    <section
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${active ? 'border-primary shadow-lg ring-2 ring-primary/10' : 'border-border hover:border-primary/40'} ${enabled ? '' : 'opacity-55'}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 text-left"
      >
        <span>
          <strong className="font-display text-xl font-normal">
            {SECTION_META[section.id]?.label}
          </strong>
          <span className="mt-1 block text-xs text-muted-foreground">
            {enabled ? 'Đang hiển thị' : 'Đang ẩn'} · Bấm để chỉnh
          </span>
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-500/10 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}
        >
          {enabled ? 'ON' : 'OFF'}
        </span>
      </button>

      {section.type === 'HERO' ? (
        <div className="relative min-h-80 overflow-hidden bg-[#33231c] text-white">
          <ImageWithFallback
            src={hero?.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: hero?.mobilePosition }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/75" />
          <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`rounded-xl border p-3 backdrop-blur-sm ${index === 0 ? 'border-white/40 bg-black/45' : 'border-white/15 bg-black/20'}`}
              >
                <p className="text-xs font-semibold uppercase">{slide.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/70">{slide.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {section.type === 'FEATURED_PRODUCTS' ? (
        <div className="bg-[#fbf8f2] p-5">
          <p className="midi-eyebrow">{config.eyebrow || 'Được quan tâm'}</p>
          <h3 className="mt-3 font-display text-3xl font-normal">{section.title}</h3>
          {section.subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{section.subtitle}</p>
          ) : null}
          <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">
            {(selectedProducts.length ? selectedProducts : products.slice(0, 5))
              .slice(0, 5)
              .map((product) => (
                <div
                  key={product.uuid || product.id}
                  className="min-w-[85%] snap-start sm:min-w-[13rem]"
                >
                  <MiniProductCard product={product} />
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {section.type === 'CUSTOM_TEXT' ? (
        <div
          className={`grid min-h-80 md:grid-cols-[58%_42%] ${section.id === 'skincare-editorial' ? 'bg-[#eee4d4] text-[#34251e]' : 'bg-[#581d28] text-[#fff7ee]'}`}
        >
          <ImageWithFallback
            src={config.imageUrl}
            alt=""
            className={`h-full min-h-60 w-full object-cover ${section.id === 'skincare-editorial' ? 'md:order-2' : ''}`}
          />
          <div
            className={`flex flex-col justify-center p-6 ${section.id === 'skincare-editorial' ? 'md:order-1' : ''}`}
          >
            <p
              className={`midi-eyebrow ${section.id === 'skincare-editorial' ? 'text-[#6f5548]' : 'text-white/65'}`}
            >
              {config.eyebrow || 'Tạp chí Midi · Editorial'}
            </p>
            <h3 className="mt-3 font-display text-3xl font-normal leading-none">{section.title}</h3>
            <p
              className={`mt-4 text-sm leading-6 ${section.id === 'skincare-editorial' ? 'text-[#5f493e]' : 'text-white/75'}`}
            >
              {section.subtitle || config.body}
            </p>
            <span
              className={`mt-5 w-fit rounded-lg border px-4 py-2 text-xs font-semibold uppercase ${section.id === 'skincare-editorial' ? 'border-[#6f5548]/40' : 'border-white/40'}`}
            >
              {config.ctaLabel || 'Khám phá'}
            </span>
          </div>
        </div>
      ) : null}

      {section.type === 'FEATURED_POSTS' ? (
        <div className="bg-[#fbf8f2] p-5">
          <p className="midi-eyebrow">{config.eyebrow || 'Cẩm nang'}</p>
          <h3 className="mt-3 font-display text-3xl font-normal">{section.title}</h3>
          {section.subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{section.subtitle}</p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(selectedPosts.length ? selectedPosts : posts.slice(0, 3)).slice(0, 3).map((post) => (
              <MiniPostCard key={post.uuid || post.id} post={post} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function AdminHomepagePage() {
  const [sections, setSections] = useState([]);
  const [forms, setForms] = useState({});
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeId, setActiveId] = useState('hero');
  const [editorOpen, setEditorOpen] = useState(false);
  const [aboutEditorOpen, setAboutEditorOpen] = useState(false);
  const [aboutForm, setAboutForm] = useState(DEFAULT_ABOUT_CONTENT);
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [activeSlideId, setActiveSlideId] = useState('skincare');
  const [imageFiles, setImageFiles] = useState({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(true);

  const syncForms = (nextSections) =>
    setForms(
      Object.fromEntries(
        (nextSections || []).map((section) => [section.id, cloneSection(section)]),
      ),
    );
  const load = useCallback(async () => {
    const [home, productRes, postRes, aboutRes] = await Promise.all([
      adminApi.getHomepageSettings(),
      adminApi.listProducts({ limit: 100 }),
      adminApi.listBlogPosts({ limit: 100 }),
      adminApi.listSettings({ group: 'about' }),
    ]);
    const nextSections = home.data.sections || [];
    setSections(nextSections);
    syncForms(nextSections);
    setProducts(productRes.data.products || []);
    setPosts(postRes.data.posts || []);
    const aboutSetting = (aboutRes.data.settings || []).find(
      (setting) => setting.key === 'about.page',
    );
    setAboutForm({ ...DEFAULT_ABOUT_CONTENT, ...(aboutSetting?.value || {}) });
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => load())
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [load]);

  const previewSections = useMemo(
    () =>
      CURRENT_SECTION_IDS.map((id) => {
        const section = sections.find((item) => item.id === id);
        if (!section) return null;
        const form = forms[section.id] || section;
        return {
          ...section,
          ...form,
          config: { ...(section.config || {}), ...(form.config || {}) },
        };
      }).filter(Boolean),
    [forms, sections],
  );
  const activeSection =
    previewSections.find((section) => section.id === activeId) || previewSections[0];
  const legacySections = useMemo(
    () => sections.filter((section) => !CURRENT_SECTION_IDS.includes(section.id)),
    [sections],
  );
  const activeForm = activeSection ? forms[activeSection.id] || activeSection : null;
  const heroSlides =
    activeForm?.type === 'HERO'
      ? activeForm.config?.slides?.length
        ? activeForm.config.slides
        : defaultSlides()
      : [];
  const activeSlide = heroSlides.find((slide) => slide.id === activeSlideId) || heroSlides[0];
  const featuredProductSection = sections.find((section) => section.type === 'FEATURED_PRODUCTS');
  const featuredPostSection = sections.find((section) => section.type === 'FEATURED_POSTS');
  const openEditor = (id) => {
    setActiveId(id);
    setEditorOpen(true);
  };

  const setSectionField = (id, field, value) =>
    setForms((current) => ({ ...current, [id]: { ...(current[id] || {}), [field]: value } }));
  const setConfigField = (id, field, value) =>
    setForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        config: { ...((current[id] || {}).config || {}), [field]: value },
      },
    }));
  const setSlideField = (id, slideId, field, value) =>
    setForms((current) => {
      const form = current[id] || {};
      const config = form.config || {};
      const slides = (config.slides?.length ? config.slides : defaultSlides()).map((slide) =>
        slide.id === slideId ? { ...slide, [field]: value } : slide,
      );
      return { ...current, [id]: { ...form, config: { ...config, slides } } };
    });

  const uploadImage = async (file, altText) => {
    const fileError = validateLocalImageFiles([file], 'Ảnh trang chủ');
    if (fileError) throw new Error(fileError);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText || 'Homepage image');
    const response = await adminApi.uploadImage(formData);
    return response.data.media.secureUrl;
  };

  const prepareConfig = async (section) => {
    const config = { ...(section.config || {}) };
    if (section.type === 'HERO') {
      const slides = (config.slides?.length ? config.slides : defaultSlides()).map((slide) => ({
        ...slide,
      }));
      for (const slide of slides) {
        const file = imageFiles[`hero:${slide.id}`];
        if (file) slide.imageUrl = await uploadImage(file, `Hero ${slide.title}`);
      }
      return { ...config, slides };
    }
    const file = imageFiles[section.id];
    if (file) config.imageUrl = await uploadImage(file, section.title);
    return config;
  };

  const saveSection = async () => {
    if (!activeForm) return;
    setError('');
    setOk('');
    setLoading(true);
    try {
      const config = await prepareConfig(activeForm);
      const payload = {
        title: activeForm.title || '',
        subtitle: activeForm.subtitle || '',
        isEnabled: activeForm.type === 'HERO' ? true : Boolean(activeForm.isEnabled),
        sortOrder: Number(activeForm.sortOrder || 0),
        config,
      };
      await adminApi.updateHomepageSection(activeForm.id, payload);
      setImageFiles((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([key]) =>
              key !== activeForm.id &&
              !key.startsWith(`${activeForm.id}:`) &&
              !key.startsWith('hero:'),
          ),
        ),
      );
      await load();
      setEditorOpen(false);
      setOk(
        `Đã lưu ${SECTION_META[activeForm.id]?.label}. Nội dung public và preview admin đang dùng cùng cấu hình.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAbout = async () => {
    setError('');
    setOk('');
    setLoading(true);
    try {
      let imageUrl = aboutForm.imageUrl;
      if (aboutImageFile) imageUrl = await uploadImage(aboutImageFile, 'Về Midi Cosmetics');
      await adminApi.upsertSetting({
        key: 'about.page',
        value: { ...aboutForm, imageUrl },
        type: 'JSON',
        group: 'about',
        description: 'Nội dung trang Về chúng tôi',
        isPublic: true,
      });
      setAboutForm((current) => ({ ...current, imageUrl }));
      setAboutImageFile(null);
      setAboutEditorOpen(false);
      setOk('Đã cập nhật nội dung trang Về chúng tôi.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeaturedProduct = async (product) => {
    setError('');
    setOk('');
    try {
      const response = product.isFeatured
        ? await adminApi.removeHomepageFeaturedItem(
            featuredProductSection?.id || 'featured-products',
            product.uuid,
          )
        : await adminApi.addHomepageFeaturedItem(
            featuredProductSection?.id || 'featured-products',
            {
              entityType: 'PRODUCT',
              entityUuid: product.uuid,
              sortOrder: product.featuredOrder || 0,
            },
          );
      const updated = response.data.item;
      setProducts((current) =>
        current.map((item) => (item.uuid === updated.uuid ? updated : item)),
      );
      setOk(
        product.isFeatured
          ? 'Đã bỏ sản phẩm khỏi trang chủ; dữ liệu sản phẩm vẫn được giữ nguyên.'
          : 'Đã thêm sản phẩm vào trang chủ.',
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleFeaturedPost = async (post) => {
    setError('');
    setOk('');
    try {
      const response = post.isFeatured
        ? await adminApi.removeHomepageFeaturedItem(
            featuredPostSection?.id || 'featured-posts',
            post.uuid,
          )
        : await adminApi.addHomepageFeaturedItem(featuredPostSection?.id || 'featured-posts', {
            entityType: 'POST',
            entityUuid: post.uuid,
            sortOrder: post.featuredOrder || 0,
          });
      const updated = response.data.item;
      setPosts((current) => current.map((item) => (item.uuid === updated.uuid ? updated : item)));
      setOk(
        post.isFeatured
          ? 'Đã bỏ bài viết khỏi trang chủ; bài viết vẫn được giữ nguyên.'
          : 'Đã thêm bài viết vào trang chủ.',
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const renderEditor = () => {
    if (!activeForm)
      return <p className="text-sm text-muted-foreground">Chưa có cấu hình trang chủ.</p>;
    const config = activeForm.config || {};
    if (activeForm.type === 'HERO')
      return (
        <div className="grid gap-4">
          <Notice type="info">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="size-4" /> Hero luôn hiển thị để trang chủ không bị trống. Mỗi
              slide liên kết đúng một nhóm sản phẩm.
            </span>
          </Notice>
          <div className="grid grid-cols-2 gap-2">
            {heroSlides.map((slide) => (
              <button
                type="button"
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition ${activeSlide?.id === slide.id ? 'border-primary bg-primary/8 text-primary' : 'border-border hover:border-primary/40'}`}
              >
                <strong className="block">{slide.title}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{slide.id}</span>
              </button>
            ))}
          </div>
          {activeSlide ? (
            <>
              <TextInput
                label="Dòng dẫn"
                value={activeSlide.kicker || ''}
                onChange={(event) =>
                  setSlideField(activeForm.id, activeSlide.id, 'kicker', event.target.value)
                }
              />
              <TextInput
                label="Tên danh mục"
                value={activeSlide.title || ''}
                onChange={(event) =>
                  setSlideField(activeForm.id, activeSlide.id, 'title', event.target.value)
                }
              />
              <TextArea
                label="Mô tả"
                value={activeSlide.subtitle || ''}
                onChange={(event) =>
                  setSlideField(activeForm.id, activeSlide.id, 'subtitle', event.target.value)
                }
              />
              <TextInput
                label="Link khi chọn"
                value={activeSlide.href || ''}
                onChange={(event) =>
                  setSlideField(activeForm.id, activeSlide.id, 'href', event.target.value)
                }
                hint="Ví dụ: /products?group=skincare"
              />
              <TextInput
                label="Vị trí crop mobile"
                value={activeSlide.mobilePosition || ''}
                onChange={(event) =>
                  setSlideField(activeForm.id, activeSlide.id, 'mobilePosition', event.target.value)
                }
                hint="Ví dụ: 68% center"
              />
              <TextInput
                label="URL ảnh"
                value={activeSlide.imageUrl || ''}
                onChange={(event) =>
                  setSlideField(activeForm.id, activeSlide.id, 'imageUrl', event.target.value)
                }
              />
              <FileInput
                label="Upload ảnh mới"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setImageFiles((current) => ({
                    ...current,
                    [`hero:${activeSlide.id}`]: event.target.files?.[0] || null,
                  }))
                }
              />
              <MediaPicker
                label="Chọn ảnh từ thư viện"
                onSelect={(media) => {
                  setImageFiles((current) => ({ ...current, [`hero:${activeSlide.id}`]: null }));
                  setSlideField(activeForm.id, activeSlide.id, 'imageUrl', media.secureUrl);
                }}
              />
            </>
          ) : null}
        </div>
      );

    return (
      <div className="grid gap-4">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/35 p-3 text-sm font-medium">
          <span>Hiển thị khối này trên trang chủ</span>
          <input
            type="checkbox"
            checked={Boolean(activeForm.isEnabled)}
            onChange={(event) => setSectionField(activeForm.id, 'isEnabled', event.target.checked)}
            className="size-5 accent-[var(--primary)]"
          />
        </label>
        <TextInput
          label="Dòng dẫn nhỏ"
          value={config.eyebrow || ''}
          onChange={(event) => setConfigField(activeForm.id, 'eyebrow', event.target.value)}
        />
        <TextInput
          label="Tiêu đề"
          value={activeForm.title || ''}
          onChange={(event) => setSectionField(activeForm.id, 'title', event.target.value)}
        />
        <TextArea
          label="Mô tả"
          value={activeForm.subtitle || ''}
          onChange={(event) => setSectionField(activeForm.id, 'subtitle', event.target.value)}
        />
        {['FEATURED_PRODUCTS', 'FEATURED_POSTS'].includes(activeForm.type) ? (
          <NumberInput
            label="Số nội dung tối đa"
            value={config.limit || ''}
            onChange={(event) => setConfigField(activeForm.id, 'limit', event.target.value)}
            hint="Từ 1 đến 12."
          />
        ) : null}
        {activeForm.type === 'CUSTOM_TEXT' ? (
          <>
            <TextInput
              label="Nhãn nút"
              value={config.ctaLabel || ''}
              onChange={(event) => setConfigField(activeForm.id, 'ctaLabel', event.target.value)}
            />
            <TextInput
              label="Link nút"
              value={config.ctaHref || ''}
              onChange={(event) => setConfigField(activeForm.id, 'ctaHref', event.target.value)}
              hint="Chỉ dùng route /products, /blog hoặc /about."
            />
            <TextInput
              label="URL ảnh editorial"
              value={config.imageUrl || ''}
              onChange={(event) => setConfigField(activeForm.id, 'imageUrl', event.target.value)}
            />
            <FileInput
              label="Upload ảnh editorial"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setImageFiles((current) => ({
                  ...current,
                  [activeForm.id]: event.target.files?.[0] || null,
                }))
              }
            />
            <MediaPicker
              label="Chọn ảnh editorial từ thư viện"
              onSelect={(media) => {
                setImageFiles((current) => ({ ...current, [activeForm.id]: null }));
                setConfigField(activeForm.id, 'imageUrl', media.secureUrl);
              }}
            />
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Nội dung trang chủ hiện tại"
        description="Editor này dùng cùng cấu trúc và cùng dữ liệu với trang chủ public. Thứ tự khối được khóa theo thiết kế để tránh lệch bố cục."
        actions={
          <Link
            to={ROUTE_PATHS.home}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition hover:border-primary hover:text-primary"
          >
            <Eye className="size-4" /> Xem trang chủ
          </Link>
        }
      />
      <Notice>{error}</Notice>
      <Notice type="success">{ok}</Notice>
      <Notice type="info">
        Không có thao tác xóa dữ liệu trong màn hình này. Tắt một khối hoặc bỏ đề xuất chỉ thay đổi
        khả năng hiển thị; sản phẩm, bài viết, media và cấu hình cũ vẫn còn nguyên.
      </Notice>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-secondary/30 p-2">
        {previewSections.map((section) => (
          <button
            type="button"
            key={section.id}
            onClick={() => openEditor(section.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${activeId === section.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background hover:text-primary'}`}
          >
            {SECTION_META[section.id]?.label}
          </button>
        ))}
      </div>
      {loading && !sections.length ? (
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      ) : null}

      <SectionCard
        title="Preview đúng thứ tự trang chủ"
        description="Bấm vào khối cần sửa; trình chỉnh sửa sẽ mở ở giữa màn hình để dễ tập trung và không làm xô lệch preview."
      >
        <div className="grid gap-5">
          {previewSections.map((section) => (
            <PreviewBlock
              key={section.id}
              section={section}
              products={products}
              posts={posts}
              active={activeSection?.id === section.id}
              onSelect={() => openEditor(section.id)}
            />
          ))}
          <div className="grid rounded-2xl bg-secondary p-5 sm:grid-cols-3">
            {['Tư vấn thật lòng', 'Tuyển chọn có chủ đích', 'Tạo phiếu nhanh'].map(
              (title, index) => (
                <div
                  key={title}
                  className="rounded-xl border border-border/70 bg-background/45 p-4"
                >
                  <span className="text-xs text-primary">0{index + 1}</span>
                  <p className="mt-2 font-display text-xl">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Khối dịch vụ cố định theo chức năng hệ thống.
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </SectionCard>

      <AdminModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={activeSection ? `Chỉnh: ${SECTION_META[activeSection.id]?.label}` : 'Chỉnh nội dung'}
        description={
          activeSection
            ? SECTION_META[activeSection.id]?.description
            : 'Chọn một khối trong preview.'
        }
        footer={
          activeSection ? (
            <>
              <SecondaryButton type="button" onClick={() => setEditorOpen(false)}>
                Hủy
              </SecondaryButton>
              <ActionButton type="button" onClick={saveSection} disabled={loading}>
                <Save className="mr-2 size-4" />
                {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </ActionButton>
            </>
          ) : null
        }
      >
        {renderEditor()}
      </AdminModal>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Sản phẩm được quan tâm"
          description="Bảng được giới hạn chiều cao; cuộn bên trong để trang quản trị luôn gọn."
        >
          <div className="max-h-[34rem] overflow-auto rounded-xl">
            <AdminTable
              columns={[
                {
                  key: 'image',
                  label: 'Ảnh',
                  render: (row) => (
                    <ImageWithFallback
                      src={productImage(row)}
                      alt={row.name}
                      className="h-14 w-14 rounded-xl bg-secondary object-contain p-1"
                    />
                  ),
                },
                {
                  key: 'name',
                  label: 'Sản phẩm',
                  render: (row) => (
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.sku || 'Chưa có mã hàng'}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  render: (row) => <StatusBadge>{row.status}</StatusBadge>,
                },
                {
                  key: 'isFeatured',
                  label: 'Trang chủ',
                  render: (row) =>
                    row.isFeatured ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="size-4 fill-current" /> Có
                      </span>
                    ) : (
                      'Không'
                    ),
                },
              ]}
              rows={products}
              actions={(row) => (
                <SecondaryButton type="button" onClick={() => toggleFeaturedProduct(row)}>
                  {row.isFeatured ? 'Bỏ khỏi trang chủ' : 'Đưa lên trang chủ'}
                </SecondaryButton>
              )}
              empty="Chưa có sản phẩm."
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Bài viết Tạp chí Midi"
          description="Danh sách cuộn độc lập; bỏ đề xuất không xóa bài viết."
        >
          <div className="max-h-[34rem] overflow-auto rounded-xl">
            <AdminTable
              columns={[
                {
                  key: 'title',
                  label: 'Bài viết',
                  render: (row) => (
                    <div>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.category?.name || 'Chưa phân loại'}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  render: (row) => <StatusBadge>{row.status}</StatusBadge>,
                },
                {
                  key: 'isFeatured',
                  label: 'Trang chủ',
                  render: (row) =>
                    row.isFeatured ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="size-4 fill-current" /> Có
                      </span>
                    ) : (
                      'Không'
                    ),
                },
              ]}
              rows={posts}
              actions={(row) => (
                <SecondaryButton type="button" onClick={() => toggleFeaturedPost(row)}>
                  {row.isFeatured ? 'Bỏ khỏi trang chủ' : 'Đưa lên trang chủ'}
                </SecondaryButton>
              )}
              empty="Chưa có bài viết."
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Trang Về chúng tôi"
        description="Nội dung đang dùng trực tiếp tại /about; bấm chỉnh để mở popup."
        actions={
          <ActionButton type="button" onClick={() => setAboutEditorOpen(true)}>
            Chỉnh nội dung
          </ActionButton>
        }
      >
        <div className="grid overflow-hidden rounded-2xl bg-secondary lg:grid-cols-2">
          <div className="flex flex-col justify-center p-7">
            <p className="midi-eyebrow">{aboutForm.eyebrow}</p>
            <h3 className="mt-4 font-display text-4xl font-normal leading-none">
              {aboutForm.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{aboutForm.intro}</p>
          </div>
          <ImageWithFallback
            src={aboutForm.imageUrl}
            alt="Preview trang Về chúng tôi"
            className="min-h-72 h-full w-full object-cover"
          />
        </div>
      </SectionCard>

      <AdminModal
        open={aboutEditorOpen}
        onClose={() => setAboutEditorOpen(false)}
        title="Chỉnh trang Về chúng tôi"
        description="Các thay đổi được áp dụng cho trang /about."
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setAboutEditorOpen(false)}>
              Hủy
            </SecondaryButton>
            <ActionButton type="button" onClick={saveAbout} disabled={loading}>
              <Save className="mr-2 size-4" />
              {loading ? 'Đang lưu…' : 'Lưu nội dung'}
            </ActionButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Dòng dẫn hero"
            value={aboutForm.eyebrow}
            onChange={(event) => setAboutForm({ ...aboutForm, eyebrow: event.target.value })}
          />
          <TextInput
            label="Dòng dẫn nội dung"
            value={aboutForm.sectionEyebrow}
            onChange={(event) => setAboutForm({ ...aboutForm, sectionEyebrow: event.target.value })}
          />
          <TextArea
            label="Tiêu đề hero"
            value={aboutForm.title}
            onChange={(event) => setAboutForm({ ...aboutForm, title: event.target.value })}
            className="sm:col-span-2"
          />
          <TextArea
            label="Giới thiệu"
            value={aboutForm.intro}
            onChange={(event) => setAboutForm({ ...aboutForm, intro: event.target.value })}
            className="sm:col-span-2"
          />
          <TextInput
            label="Tiêu đề nội dung"
            value={aboutForm.sectionTitle}
            onChange={(event) => setAboutForm({ ...aboutForm, sectionTitle: event.target.value })}
            className="sm:col-span-2"
          />
          <TextArea
            label="Đoạn 1"
            value={aboutForm.paragraphOne}
            onChange={(event) => setAboutForm({ ...aboutForm, paragraphOne: event.target.value })}
          />
          <TextArea
            label="Đoạn 2"
            value={aboutForm.paragraphTwo}
            onChange={(event) => setAboutForm({ ...aboutForm, paragraphTwo: event.target.value })}
          />
          <TextInput
            label="URL ảnh"
            value={aboutForm.imageUrl}
            onChange={(event) => setAboutForm({ ...aboutForm, imageUrl: event.target.value })}
            className="sm:col-span-2"
          />
          <FileInput
            label="Upload ảnh mới"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setAboutImageFile(event.target.files?.[0] || null)}
          />
          <MediaPicker
            label="Chọn ảnh từ thư viện"
            onSelect={(media) => {
              setAboutImageFile(null);
              setAboutForm((current) => ({ ...current, imageUrl: media.secureUrl }));
            }}
          />
        </div>
      </AdminModal>

      {legacySections.length ? (
        <SectionCard
          title="Dữ liệu cấu hình cũ đã được bảo toàn"
          description="Các giao diện cũ không còn xuất hiện trong editor/public, nhưng dữ liệu vẫn được giữ trong SiteSetting để có thể khôi phục khi cần."
        >
          <div className="grid gap-2">
            {legacySections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary/25 p-3 text-sm"
              >
                <span>
                  <strong>{section.id}</strong>
                  <span className="ml-2 text-muted-foreground">{section.type}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <LockKeyhole className="size-3.5" /> Chỉ lưu trữ
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
        <ImageIcon className="size-4 text-primary" /> Ảnh mới được lưu vào Media Library trước khi
        gắn vào trang chủ; ảnh cũ không bị xóa.
      </div>
    </div>
  );
}
