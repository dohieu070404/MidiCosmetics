import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, Star } from 'lucide-react';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { validateLocalImageFiles } from '@/lib/media';
import { adminApi } from '@/lib/api/admin-api';
import { ActionButton, AdminTable, FileInput, Notice, NumberInput, PageHeader, SecondaryButton, SectionCard, StatusBadge, TextArea, TextInput } from './admin-shared';

const SECTION_LABELS = {
  HERO: 'Hero banner',
  FEATURED_PRODUCTS: 'Sản phẩm nổi bật',
  FEATURED_POSTS: 'Bài viết nổi bật',
  FEATURED_CATEGORIES: 'Danh mục nổi bật',
  BRAND_INTRO: 'Giới thiệu thương hiệu',
  CUSTOM_TEXT: 'Nội dung ngắn',
};

const cloneSection = (section) => ({ ...section, config: { ...(section.config || {}) } });
const productImage = (product) => product?.images?.[0]?.mediaAsset?.secureUrl || product?.mainImage || '';
const postImage = (post) => post?.featuredImage?.secureUrl || post?.image || '';

function MiniProductCard({ product }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <ImageWithFallback src={productImage(product)} alt={product?.name || 'Sản phẩm'} className="aspect-[4/3] w-full object-cover" />
      <div className="p-3">
        <p className="truncate text-xs uppercase tracking-[0.16em] text-primary/80">{product?.category?.name || product?.brand?.name || 'Midi'}</p>
        <p className="mt-1 line-clamp-2 font-medium leading-snug">{product?.name || 'Sản phẩm nổi bật'}</p>
      </div>
    </div>
  );
}

function MiniPostCard({ post }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      {postImage(post) ? <ImageWithFallback src={postImage(post)} alt={post?.title || 'Bài viết'} className="aspect-[16/9] w-full object-cover" /> : <div className="aspect-[16/9] bg-secondary" />}
      <div className="p-3">
        <p className="truncate text-xs uppercase tracking-[0.16em] text-primary/80">{post?.category?.name || 'Blog'}</p>
        <p className="mt-1 line-clamp-2 font-medium leading-snug">{post?.title || 'Bài viết nổi bật'}</p>
      </div>
    </div>
  );
}

function VisualSectionPreview({ section, index, total, products, posts, isActive, onEdit, onMove, onToggle }) {
  const config = section.config || {};
  const featuredProducts = products.filter((product) => product.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0)).slice(0, Number(config.limit || 4));
  const featuredPosts = posts.filter((post) => post.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0)).slice(0, Number(config.limit || 3));
  const heroProduct = featuredProducts[0] || products[0];
  const heroImage = config.imageUrl || productImage(heroProduct);

  return (
    <section className={`rounded-[2rem] border p-4 transition ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background'} ${section.isEnabled ? '' : 'opacity-60'}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{SECTION_LABELS[section.type] || section.type}</span>
            <StatusBadge>{section.isEnabled ? 'ACTIVE' : 'INACTIVE'}</StatusBadge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">ID: {section.id} · Thứ tự: {section.sortOrder}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton type="button" onClick={() => onMove(section, -1)} disabled={index === 0}><ArrowUp className="mr-1 size-4" /> Lên</SecondaryButton>
          <SecondaryButton type="button" onClick={() => onMove(section, 1)} disabled={index === total - 1}><ArrowDown className="mr-1 size-4" /> Xuống</SecondaryButton>
          <SecondaryButton type="button" onClick={() => onToggle(section)}>{section.isEnabled ? 'Tắt section' : 'Bật section'}</SecondaryButton>
          <ActionButton type="button" onClick={() => onEdit(section.id)}>Sửa</ActionButton>
        </div>
      </div>

      {!section.isEnabled ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          Section này đang tắt nên sẽ không hiển thị trên homepage public.
        </div>
      ) : <>
      {section.type === 'HERO' ? (
        <div className="grid gap-4 rounded-[1.75rem] bg-gradient-to-br from-secondary/80 to-background p-4 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{section.title || 'Hero title'}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{section.subtitle || 'Hero subtitle'}</p>
            <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">{config.ctaLabel || 'Xem sản phẩm'}</span><span className="rounded-2xl border border-border bg-background px-4 py-2 text-sm">{config.secondaryLabel || 'Đọc blog'}</span></div>
          </div>
          <ImageWithFallback src={heroImage} alt={section.title} className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" />
        </div>
      ) : null}

      {section.type === 'FEATURED_PRODUCTS' ? (
        <div className="rounded-[1.75rem] bg-secondary/30 p-4">
          <h2 className="text-center font-display text-2xl font-semibold">{section.title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">{section.subtitle}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(featuredProducts.length ? featuredProducts : products.slice(0, 4)).map((product) => <MiniProductCard key={product.uuid || product.id} product={product} />)}</div>
        </div>
      ) : null}

      {section.type === 'FEATURED_POSTS' ? (
        <div className="rounded-[1.75rem] bg-secondary/30 p-4">
          <h2 className="text-center font-display text-2xl font-semibold">{section.title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground">{section.subtitle}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(featuredPosts.length ? featuredPosts : posts.slice(0, 3)).map((post) => <MiniPostCard key={post.uuid || post.id} post={post} />)}</div>
        </div>
      ) : null}

      {section.type === 'FEATURED_CATEGORIES' ? (
        <div className="rounded-[1.75rem] bg-secondary/30 p-4 text-center">
          <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{section.subtitle}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{['Skincare', 'Makeup', 'Body care', 'Fragrance'].slice(0, Number(config.limit || 4)).map((name) => <div key={name} className="rounded-2xl border border-border bg-background p-4 text-left"><p className="text-xs uppercase tracking-[0.18em] text-primary/80">Danh mục</p><p className="mt-2 font-display text-xl font-semibold">{name}</p></div>)}</div>
        </div>
      ) : null}

      {section.type === 'BRAND_INTRO' ? (
        <div className="grid gap-4 rounded-[1.75rem] bg-secondary/30 p-4 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          {config.imageUrl ? <ImageWithFallback src={config.imageUrl} alt={section.title} className="aspect-[4/3] rounded-[1.5rem] object-cover" /> : <div className="aspect-[4/3] rounded-[1.5rem] bg-background" />}
          <div><h2 className="font-display text-2xl font-semibold">{section.title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{section.subtitle}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-7">{config.body || 'Nội dung giới thiệu thương hiệu.'}</p></div>
        </div>
      ) : null}

      {section.type === 'CUSTOM_TEXT' ? (
        <div className="rounded-[1.75rem] bg-secondary/30 p-5 text-center"><h2 className="font-display text-2xl font-semibold">{section.title}</h2>{section.subtitle ? <p className="mt-2 text-sm text-muted-foreground">{section.subtitle}</p> : null}<p className="mx-auto mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7">{config.body || 'Nội dung ngắn hiển thị tại đây.'}</p></div>
      ) : null}
      </>}
    </section>
  );
}

export function AdminHomepagePage() {
  const [sections, setSections] = useState([]);
  const [forms, setForms] = useState({});
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState({});

  const sortedSections = useMemo(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder), [sections]);
  const visualSections = useMemo(() => sortedSections.map((section) => ({ ...section, ...(forms[section.id] || {}), config: { ...(section.config || {}), ...((forms[section.id] || {}).config || {}) } })), [sortedSections, forms]);
  const activeSection = visualSections.find((section) => section.id === activeSectionId) || visualSections[0];
  const featuredProductSection = sortedSections.find((section) => section.type === 'FEATURED_PRODUCTS');
  const featuredPostSection = sortedSections.find((section) => section.type === 'FEATURED_POSTS');

  const syncForms = (nextSections) => setForms(Object.fromEntries((nextSections || []).map((section) => [section.id, cloneSection(section)])));

  const load = useCallback(async () => {
    const [home, productRes, postRes] = await Promise.all([
      adminApi.getHomepageSettings(),
      adminApi.listProducts({ limit: 100 }),
      adminApi.listBlogPosts({ limit: 100 }),
    ]);
    const nextSections = home.data.sections || [];
    setSections(nextSections);
    syncForms(nextSections);
    setActiveSectionId((current) => current || nextSections[0]?.id || '');
    setProducts(productRes.data.products || []);
    setPosts(postRes.data.posts || []);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => load())
      .catch((err) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [load]);

  const setSectionField = (id, field, value) => setForms((current) => ({
    ...current,
    [id]: { ...(current[id] || {}), [field]: value },
  }));

  const setConfigField = (id, field, value) => setForms((current) => ({
    ...current,
    [id]: { ...(current[id] || {}), config: { ...((current[id] || {}).config || {}), [field]: value } },
  }));

  const uploadSectionImage = async (id) => {
    const file = imageFiles[id];
    if (!file) return forms[id]?.config?.imageUrl || '';
    const fileError = validateLocalImageFiles([file], 'Ảnh section');
    if (fileError) throw new Error(fileError);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('altText', forms[id]?.title || 'Homepage image');
    const res = await adminApi.uploadImage(fd);
    return res.data.media.secureUrl;
  };

  const saveSection = async (id) => {
    setError(''); setOk(''); setLoading(true);
    try {
      const form = cloneSection(forms[id]);
      const imageUrl = await uploadSectionImage(id);
      if (imageUrl) form.config = { ...(form.config || {}), imageUrl };
      const payload = {
        title: form.title || '',
        subtitle: form.subtitle || '',
        isEnabled: Boolean(form.isEnabled),
        sortOrder: Number(form.sortOrder || 0),
        config: form.config || {},
      };
      await adminApi.updateHomepageSection(id, payload);
      setOk('Đã lưu section trang chủ. Preview bên trái đã cập nhật theo cấu hình mới.');
      setImageFiles((current) => ({ ...current, [id]: null }));
      await load();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const toggleSection = async (section) => {
    setError(''); setOk('');
    try {
      await adminApi.toggleHomepageSection(section.id, { isEnabled: !section.isEnabled });
      setOk(!section.isEnabled ? 'Đã bật section.' : 'Đã tắt section.');
      await load();
    } catch (err) { setError(err.message); }
  };

  const moveSection = async (section, direction) => {
    const current = sortedSections;
    const index = current.findIndex((item) => item.id === section.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const next = [...current];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const payload = { sections: next.map((item, idx) => ({ id: item.id, sortOrder: (idx + 1) * 10 })) };
    setError(''); setOk('');
    try {
      await adminApi.reorderHomepageSections(payload);
      setOk('Đã đổi thứ tự section.');
      await load();
    } catch (err) { setError(err.message); }
  };

  const toggleFeaturedProduct = async (product) => {
    setError(''); setOk('');
    try {
      if (!product.isFeatured) await adminApi.addHomepageFeaturedItem(featuredProductSection?.id || 'featured-products', { entityType: 'PRODUCT', entityUuid: product.uuid, sortOrder: product.featuredOrder || 0 });
      else await adminApi.removeHomepageFeaturedItem(featuredProductSection?.id || 'featured-products', product.uuid);
      setOk(!product.isFeatured ? 'Đã chọn sản phẩm nổi bật.' : 'Đã bỏ sản phẩm khỏi trang chủ.');
      await load();
    } catch (err) { setError(err.message); }
  };

  const toggleFeaturedPost = async (post) => {
    setError(''); setOk('');
    try {
      if (!post.isFeatured) await adminApi.addHomepageFeaturedItem(featuredPostSection?.id || 'featured-posts', { entityType: 'POST', entityUuid: post.uuid, sortOrder: post.featuredOrder || 0 });
      else await adminApi.removeHomepageFeaturedItem(featuredPostSection?.id || 'featured-posts', post.uuid);
      setOk(!post.isFeatured ? 'Đã chọn bài viết nổi bật.' : 'Đã bỏ bài viết khỏi trang chủ.');
      await load();
    } catch (err) { setError(err.message); }
  };

  const renderConfigFields = (section) => {
    const form = forms[section.id] || section;
    const config = form.config || {};
    if (section.type === 'HERO') {
      return <>
        <TextInput label="Nhãn nút chính" value={config.ctaLabel || ''} onChange={(e) => setConfigField(section.id, 'ctaLabel', e.target.value)} />
        <TextInput label="Link nút chính" value={config.ctaHref || ''} onChange={(e) => setConfigField(section.id, 'ctaHref', e.target.value)} hint="Chỉ dùng /products, /blog hoặc /about." />
        <TextInput label="Nhãn nút phụ" value={config.secondaryLabel || ''} onChange={(e) => setConfigField(section.id, 'secondaryLabel', e.target.value)} />
        <TextInput label="Link nút phụ" value={config.secondaryHref || ''} onChange={(e) => setConfigField(section.id, 'secondaryHref', e.target.value)} hint="Chỉ dùng /products, /blog hoặc /about." />
        <TextInput label="URL ảnh hero" value={config.imageUrl || ''} onChange={(e) => setConfigField(section.id, 'imageUrl', e.target.value)} hint="Có thể dùng /uploads hoặc URL https hợp lệ." />
        <FileInput label="Upload ảnh hero" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImageFiles((current) => ({ ...current, [section.id]: e.target.files?.[0] || null }))} />
      </>;
    }
    if (['BRAND_INTRO', 'CUSTOM_TEXT'].includes(section.type)) {
      return <>
        <TextArea label="Nội dung" value={config.body || ''} onChange={(e) => setConfigField(section.id, 'body', e.target.value)} hint="Chỉ nhập text, không nhập HTML/JS." />
        {section.type === 'BRAND_INTRO' ? <TextInput label="URL ảnh giới thiệu" value={config.imageUrl || ''} onChange={(e) => setConfigField(section.id, 'imageUrl', e.target.value)} /> : null}
      </>;
    }
    if (['FEATURED_PRODUCTS', 'FEATURED_POSTS', 'FEATURED_CATEGORIES'].includes(section.type)) {
      return <NumberInput label="Số item hiển thị tối đa" value={config.limit || ''} onChange={(e) => setConfigField(section.id, 'limit', e.target.value)} hint="Từ 1 đến 12 item." />;
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Giao diện trang chủ"
        description="Visual editor giới hạn: bên trái là preview gần giống homepage public, bên phải là panel chỉnh section đang chọn. Không nhập HTML/CSS/JS raw."
        actions={<SecondaryButton as="a"><Link to={ROUTE_PATHS.home} className="inline-flex items-center gap-2"><Eye className="size-4" /> Xem trang chủ</Link></SecondaryButton>}
      />
      <Notice>{error}</Notice>
      <Notice type="success">{ok}</Notice>
      {loading && !sections.length ? <div className="h-48 animate-pulse rounded-3xl bg-secondary" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <SectionCard title="Preview homepage" description="Bấm Sửa trên từng section để chỉnh ngay. Preview này dùng widget cố định, không cho phá layout public.">
          <div className="grid gap-5">
            {visualSections.map((section, index) => (
              <VisualSectionPreview
                key={section.id}
                section={section}
                index={index}
                total={visualSections.length}
                products={products}
                posts={posts}
                isActive={activeSection?.id === section.id}
                onEdit={setActiveSectionId}
                onMove={moveSection}
                onToggle={toggleSection}
              />
            ))}
          </div>
        </SectionCard>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            title={activeSection ? `Chỉnh: ${SECTION_LABELS[activeSection.type] || activeSection.type}` : 'Chỉnh section'}
            description={activeSection ? `ID: ${activeSection.id}. Các input được sanitize ở backend, CTA chỉ trỏ tới route public an toàn.` : 'Chọn một section ở preview để chỉnh.'}
            actions={activeSection ? <ActionButton type="button" onClick={() => saveSection(activeSection.id)} disabled={loading}>Lưu section</ActionButton> : null}
          >
            {activeSection ? <div className="grid gap-4">
              <TextInput label="Tiêu đề" value={forms[activeSection.id]?.title || ''} onChange={(e) => setSectionField(activeSection.id, 'title', e.target.value)} />
              <TextArea label="Mô tả ngắn" value={forms[activeSection.id]?.subtitle || ''} onChange={(e) => setSectionField(activeSection.id, 'subtitle', e.target.value)} />
              <NumberInput label="Thứ tự" value={forms[activeSection.id]?.sortOrder || 0} onChange={(e) => setSectionField(activeSection.id, 'sortOrder', e.target.value)} />
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(forms[activeSection.id]?.isEnabled)} onChange={(e) => setSectionField(activeSection.id, 'isEnabled', e.target.checked)} /> Hiển thị section</label>
              {renderConfigFields(activeSection)}
              <div className="grid gap-2 rounded-2xl bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">
                <p>Giới hạn an toàn: không nhận script, event handler, CSS toàn site hoặc link ngoài không hợp lệ.</p>
                <p>Sản phẩm/bài viết nổi bật được chọn ở bảng bên dưới.</p>
              </div>
              <div className="flex flex-wrap gap-2"><SecondaryButton type="button" onClick={() => toggleSection(activeSection)}>{activeSection.isEnabled ? 'Tắt section' : 'Bật section'}</SecondaryButton><ActionButton type="button" onClick={() => saveSection(activeSection.id)} disabled={loading}>Lưu section</ActionButton></div>
            </div> : <p className="text-sm text-muted-foreground">Chưa có section.</p>}
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Chọn sản phẩm nổi bật" description="Bật/tắt sản phẩm hiển thị trên trang chủ. Sản phẩm bị ẩn sẽ không hiển thị public dù đang được chọn.">
          <AdminTable
            columns={[
              { key: 'image', label: 'Ảnh', render: (r) => <ImageWithFallback src={productImage(r)} alt={r.name} className="h-14 w-14 rounded-xl object-cover" /> },
              { key: 'name', label: 'Sản phẩm', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.sku || 'Chưa có mã hàng'}</p></div> },
              { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> },
              { key: 'isFeatured', label: 'Đề xuất', render: (r) => r.isFeatured ? <span className="inline-flex items-center gap-1 text-primary"><Star className="size-4 fill-current" /> Có</span> : 'Không' },
            ]}
            rows={products}
            actions={(r) => <SecondaryButton type="button" onClick={() => toggleFeaturedProduct(r)}>{r.isFeatured ? 'Bỏ đề xuất' : 'Đề xuất'}</SecondaryButton>}
            empty="Chưa có sản phẩm."
          />
        </SectionCard>

        <SectionCard title="Chọn bài viết nổi bật" description="Bật/tắt bài viết hiển thị trên trang chủ. Bài nháp sẽ không hiển thị public.">
          <AdminTable
            columns={[
              { key: 'title', label: 'Bài viết', render: (r) => <div><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.category?.name || 'Chưa phân loại'}</p></div> },
              { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> },
              { key: 'isFeatured', label: 'Đề xuất', render: (r) => r.isFeatured ? <span className="inline-flex items-center gap-1 text-primary"><Star className="size-4 fill-current" /> Có</span> : 'Không' },
            ]}
            rows={posts}
            actions={(r) => <SecondaryButton type="button" onClick={() => toggleFeaturedPost(r)}>{r.isFeatured ? 'Bỏ đề xuất' : 'Đề xuất'}</SecondaryButton>}
            empty="Chưa có bài viết."
          />
        </SectionCard>
      </div>
    </div>
  );
}
