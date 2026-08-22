import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Grid2X2,
  ImagePlus,
  List,
  MessageCircle,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { MediaPicker } from '@/components/admin/media-picker';
import { AdminModal } from '@/components/admin/admin-modal';
import { adminApi } from '@/lib/api/admin-api';
import { validateLocalImageFiles } from '@/lib/media';
import { env } from '@/config/env';
import {
  ActionButton,
  AdminTable,
  DangerButton,
  Notice,
  NumberInput,
  PageHeader,
  SecondaryButton,
  SectionCard,
  SelectInput,
  StatusBadge,
  TextArea,
  TextInput,
  Toolbar,
  formatDate,
  formatMoney,
} from './admin-shared';

const emptyCollection = {
  name: '',
  description: '',
  coverImageUrl: '',
  seoTitle: '',
  seoDescription: '',
  sortOrder: '0',
  isActive: true,
};

export function AdminCollectionsPage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [form, setForm] = useState(emptyCollection);
  const [editing, setEditing] = useState('');
  const [search, setSearch] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    const [response, productResponse] = await Promise.all([
      adminApi.listProductCollections({ limit: 100, search }),
      adminApi.listProducts({ limit: 100 }),
    ]);
    setItems(response.data.collections || []);
    setProducts(productResponse.data.products || []);
  }, [search]);

  useEffect(() => {
    Promise.resolve()
      .then(() => load())
      .catch((err) => setError(err.message));
  }, [load]);

  const reset = () => {
    setForm(emptyCollection);
    setEditing('');
    setImageFile(null);
    setSelectedProducts([]);
    setProductSearch('');
  };

  const startEdit = async (item) => {
    setError('');
    const response = await adminApi.getProductCollection(item.uuid);
    const detail = response.data.collection;
    setEditing(item.uuid);
    setForm({
      name: item.name || '',
      description: item.description || '',
      coverImageUrl: item.coverImageUrl || '',
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
      sortOrder: String(item.sortOrder || 0),
      isActive: Boolean(item.isActive),
    });
    setImageFile(null);
    setSelectedProducts((detail.products || []).map((entry) => entry.product).filter(Boolean));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      let coverImageUrl = form.coverImageUrl || null;
      if (imageFile) {
        const validationError = validateLocalImageFiles([imageFile], 'Ảnh bìa');
        if (validationError) throw new Error(validationError);
        const body = new FormData();
        body.append('file', imageFile);
        body.append('altText', form.name);
        const uploaded = await adminApi.uploadImage(body);
        coverImageUrl = uploaded.data.media.secureUrl;
      }
      const payload = {
        ...form,
        coverImageUrl,
        description: form.description || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        sortOrder: Number(form.sortOrder || 0),
      };
      const response = editing
        ? await adminApi.updateProductCollection(editing, payload)
        : await adminApi.createProductCollection(payload);
      const collectionUuid = response.data.collection.uuid;
      await adminApi.updateProductCollectionItems(
        collectionUuid,
        selectedProducts.map((product, index) => ({
          productUuid: product.uuid,
          sortOrder: index * 10,
        })),
      );
      setOk(editing ? 'Đã cập nhật collection.' : 'Đã tạo collection mới.');
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleProduct = (product) =>
    setSelectedProducts((current) =>
      current.some((item) => item.uuid === product.uuid)
        ? current.filter((item) => item.uuid !== product.uuid)
        : [...current, product],
    );
  const moveProduct = (index, direction) =>
    setSelectedProducts((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const matchingProducts = products.filter(
    (product) =>
      !productSearch ||
      `${product.name} ${product.sku || ''}`.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const remove = async (uuid) => {
    if (!window.confirm('Xóa collection này? Sản phẩm bên trong không bị xóa.')) return;
    setError('');
    try {
      await adminApi.deleteProductCollection(uuid);
      await load();
      setOk('Đã xóa collection.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Collections"
        description="Nhóm sản phẩm thành các câu chuyện mua sắm; ảnh bìa và SEO được dùng trên trang công khai."
      />
      <Notice>{error}</Notice>
      <Notice type="success">{ok}</Notice>
      <div className="grid min-w-0 gap-6">
        <SectionCard
          title={editing ? 'Sửa collection' : 'Collection mới'}
          className="min-w-0 xl:max-w-3xl"
        >
          <form onSubmit={submit} className="grid gap-4">
            <TextInput
              label="Tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextArea
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <label className="grid gap-2 text-sm font-medium">
              Ảnh bìa
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="min-w-0 w-full rounded-lg border border-dashed border-input bg-background p-4 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2"
              />
            </label>
            <MediaPicker
              onSelect={(media) => {
                setImageFile(null);
                setForm((current) => ({ ...current, coverImageUrl: media.secureUrl }));
              }}
            />
            {form.coverImageUrl ? (
              <ImageWithFallback
                src={form.coverImageUrl}
                alt="Ảnh bìa hiện tại"
                className="aspect-[16/9] w-full object-cover"
              />
            ) : null}
            <TextInput
              label="SEO title"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            />
            <TextArea
              label="SEO description"
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            />
            <NumberInput
              label="Thứ tự"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />{' '}
              Hiển thị collection
            </label>
            <div className="border-t border-border pt-4">
              <TextInput
                label="Tìm sản phẩm để thêm"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tên hoặc SKU"
              />
              <div className="mt-3 max-h-52 overflow-y-auto border border-border bg-secondary/20 p-2">
                {matchingProducts.map((product) => (
                  <label
                    key={product.uuid}
                    className="flex min-h-10 items-center gap-3 border-b border-border px-2 text-sm last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.some((item) => item.uuid === product.uuid)}
                      onChange={() => toggleProduct(product)}
                    />
                    <span className="min-w-0 flex-1 truncate">{product.name}</span>
                    <span className="text-[10px] text-muted-foreground">{product.sku}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedProducts.length} sản phẩm đã chọn. Dùng nút lên/xuống để sắp xếp.
              </p>
              <div className="mt-2 grid gap-1">
                {selectedProducts.map((product, index) => (
                  <div
                    key={product.uuid}
                    className="flex items-center gap-2 border border-border bg-background px-2 py-2 text-xs"
                  >
                    <span className="w-5 text-muted-foreground">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{product.name}</span>
                    <button
                      type="button"
                      onClick={() => moveProduct(index, -1)}
                      disabled={index === 0}
                      aria-label="Đưa lên"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(index, 1)}
                      disabled={index === selectedProducts.length - 1}
                      aria-label="Đưa xuống"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className="text-destructive"
                      aria-label="Bỏ sản phẩm"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy}>
                {busy ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo mới'}
              </ActionButton>
              {editing ? (
                <SecondaryButton type="button" onClick={reset}>
                  Hủy
                </SecondaryButton>
              ) : null}
            </div>
          </form>
        </SectionCard>
        <SectionCard
          title="Danh sách collection"
          className="min-w-0"
          actions={
            <TextInput
              aria-label="Tìm collection"
              placeholder="Tìm collection…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
        >
          <AdminTable
            columns={[
              {
                key: 'coverImageUrl',
                label: 'Ảnh',
                render: (row) =>
                  row.coverImageUrl ? (
                    <ImageWithFallback
                      src={row.coverImageUrl}
                      alt=""
                      className="size-16 object-cover"
                    />
                  ) : (
                    <div className="size-16 bg-secondary" />
                  ),
              },
              { key: 'name', label: 'Tên' },
              { key: 'slug', label: 'Slug' },
              {
                key: 'productCount',
                label: 'Sản phẩm',
                render: (row) => row._count?.products || 0,
              },
              {
                key: 'isActive',
                label: 'Hiển thị',
                render: (row) => <StatusBadge>{row.isActive ? 'ACTIVE' : 'INACTIVE'}</StatusBadge>,
              },
            ]}
            rows={items}
            actions={(row) => (
              <div className="flex gap-2">
                <a
                  href={`/collections/${row.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center border border-border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition hover:border-primary hover:text-primary"
                >
                  <ExternalLink className="mr-1 size-4" />
                  Preview
                </a>
                <SecondaryButton
                  type="button"
                  onClick={() => startEdit(row).catch((err) => setError(err.message))}
                >
                  Sửa
                </SecondaryButton>
                <DangerButton type="button" onClick={() => remove(row.uuid)}>
                  Xóa
                </DangerButton>
              </div>
            )}
          />
        </SectionCard>
      </div>
    </div>
  );
}

const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const mediaUsageCount = (item) =>
  (item._count?.productImages || 0) + (item._count?.featuredPosts || 0);

export function AdminMediaPage() {
  const [items, setItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [altText, setAltText] = useState('');
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    provider: '',
    mimeType: '',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.listMedia({ limit: 24, page, ...filters });
      const media = response.data.media || [];
      setItems(media);
      setMeta(response.meta || { page, totalPages: 1, total: media.length });
      setDrafts((current) => ({
        ...current,
        ...Object.fromEntries(
          media.map((item) => [item.uuid, current[item.uuid] ?? item.altText ?? '']),
        ),
      }));
      setSelected((current) =>
        current ? media.find((item) => item.uuid === current.uuid) || current : null,
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page]);
  useEffect(() => {
    Promise.resolve()
      .then(() => load())
      .catch((err) => setError(err.message));
  }, [load]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const chooseFiles = (nextFiles) => {
    const selectedFiles = Array.from(nextFiles || []);
    const validationError = validateLocalImageFiles(selectedFiles, 'Ảnh');
    if (validationError) {
      setFiles([]);
      setError(validationError);
      return;
    }
    setError('');
    setFiles(selectedFiles);
  };

  const upload = async () => {
    setError('');
    setOk('');
    const validationError = validateLocalImageFiles(files, 'Ảnh');
    if (!files.length || validationError) {
      setError(validationError || 'Hãy chọn ít nhất một ảnh.');
      return;
    }
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    try {
      for (let index = 0; index < files.length; index += 1) {
        const body = new FormData();
        body.append('file', files[index]);
        body.append(
          'altText',
          files.length === 1 ? altText : altText || files[index].name.replace(/\.[^.]+$/, ''),
        );
        await adminApi.uploadImage(body);
        setProgress({ done: index + 1, total: files.length });
      }
      setFiles([]);
      setAltText('');
      setOk(`Đã tải lên ${files.length} ảnh.`);
      if (page === 1) await load();
      else setPage(1);
    } catch (err) {
      setError(`${err.message} (${progress.done}/${files.length} ảnh hoàn tất)`);
    } finally {
      setBusy(false);
    }
  };

  const saveAlt = async (item) => {
    setError('');
    setOk('');
    try {
      const response = await adminApi.updateMedia(item.uuid, {
        altText: drafts[item.uuid] || null,
      });
      const updated = { ...item, ...response.data.media };
      setSelected((current) => (current?.uuid === item.uuid ? updated : current));
      setOk('Đã lưu mô tả ảnh.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (item) => {
    const usage = mediaUsageCount(item);
    if (usage) {
      setError(`Ảnh đang được dùng ở ${usage} vị trí. Hãy thay ảnh trong nội dung trước khi xóa.`);
      return;
    }
    if (!window.confirm('Xóa ảnh này khỏi thư viện? Thao tác sẽ xóa cả tệp lưu trữ.')) return;
    setError('');
    setOk('');
    try {
      await adminApi.deleteMedia(item.uuid);
      setSelected(null);
      setOk('Đã xóa ảnh.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setOk('Đã sao chép URL ảnh.');
    } catch {
      setError('Trình duyệt đã chặn clipboard. Hãy mở chi tiết và sao chép URL thủ công.');
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    chooseFiles(event.dataTransfer.files);
  };
  const mediaColumns = [
    {
      key: 'preview',
      label: 'Ảnh',
      render: (item) => (
        <ImageWithFallback
          src={item.secureUrl}
          alt={item.altText || item.originalName}
          className="size-14 object-cover"
        />
      ),
    },
    { key: 'originalName', label: 'Tên file' },
    { key: 'mimeType', label: 'Loại' },
    { key: 'sizeBytes', label: 'Dung lượng', render: (item) => formatBytes(item.sizeBytes) },
    {
      key: 'dimensions',
      label: 'Kích thước',
      render: (item) => (item.width && item.height ? `${item.width}×${item.height}` : 'Chưa có'),
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (item) => <StatusBadge>{item.provider}</StatusBadge>,
    },
    { key: 'usage', label: 'Đang dùng', render: (item) => mediaUsageCount(item) },
  ];

  const mediaActions = (item) => (
    <div className="flex gap-2">
      <SecondaryButton type="button" onClick={() => setSelected(item)}>
        <Eye className="mr-1 size-4" />
        Xem
      </SecondaryButton>
      <SecondaryButton type="button" onClick={() => copy(item.secureUrl)}>
        <Copy className="size-4" />
      </SecondaryButton>
    </div>
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Thư viện ảnh"
        description="Tải nhiều ảnh, tìm kiếm, xem thông số và tái sử dụng nhất quán trong sản phẩm, blog hoặc collection."
      />
      <Notice>{error}</Notice>
      <Notice type="success">{ok}</Notice>
      <SectionCard title="Tải ảnh mới" description="PNG, JPEG hoặc WebP; tối đa 5 MB mỗi tệp.">
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex min-h-44 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20 hover:bg-secondary/40'}`}
          >
            <UploadCloud className="mb-3 size-7" />
            <span className="font-medium">Kéo một hoặc nhiều ảnh vào đây</span>
            <span className="mt-1 text-xs text-muted-foreground">Hoặc bấm để chọn từ máy</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => chooseFiles(event.target.files)}
            />
            {files.length ? (
              <span className="mt-3 text-sm text-primary">
                Đã chọn {files.length} ảnh · {files.map((file) => file.name).join(', ')}
              </span>
            ) : null}
          </label>
          <div className="grid content-start gap-3">
            <TextInput
              label="Alt text chung"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              hint="Với nhiều ảnh, để trống sẽ dùng tên file làm mô tả tạm."
            />
            <ActionButton type="button" onClick={upload} disabled={busy || !files.length}>
              <ImagePlus className="mr-2 size-4" />
              {busy ? `Đang tải ${progress.done}/${progress.total}…` : 'Tải ảnh'}
            </ActionButton>
            {busy ? (
              <div className="h-2 overflow-hidden bg-secondary">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>
      <Toolbar>
        <TextInput
          label="Tìm ảnh"
          placeholder="Tên file hoặc alt text"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <SelectInput
          label="Provider"
          value={filters.provider}
          onChange={(event) => updateFilter('provider', event.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="LOCAL">Local</option>
          <option value="CLOUDINARY">Cloudinary</option>
        </SelectInput>
        <SelectInput
          label="Loại file"
          value={filters.mimeType}
          onChange={(event) => updateFilter('mimeType', event.target.value)}
        >
          <option value="">Tất cả ảnh</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
        </SelectInput>
        <TextInput
          label="Từ ngày"
          type="date"
          value={filters.from}
          onChange={(event) => updateFilter('from', event.target.value)}
        />
        <TextInput
          label="Đến ngày"
          type="date"
          value={filters.to}
          onChange={(event) => updateFilter('to', event.target.value)}
        />
        <div className="flex items-end justify-between gap-2">
          <p className="pb-3 text-xs text-muted-foreground">{meta.total || 0} ảnh</p>
          <div className="flex pb-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`grid size-11 place-items-center border ${viewMode === 'grid' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
              aria-label="Xem dạng lưới"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid2X2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`grid size-11 place-items-center border ${viewMode === 'list' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
              aria-label="Xem dạng danh sách"
              aria-pressed={viewMode === 'list'}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </Toolbar>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse bg-secondary" />
          ))}
        </div>
      ) : null}
      {!loading && viewMode === 'list' ? (
        <AdminTable
          columns={mediaColumns}
          rows={items}
          actions={mediaActions}
          empty="Chưa có ảnh phù hợp."
        />
      ) : null}
      {!loading && viewMode === 'grid' ? (
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article key={item.uuid} className="group bg-background p-3">
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="relative block w-full overflow-hidden bg-secondary text-left"
              >
                <ImageWithFallback
                  src={item.secureUrl}
                  alt={item.altText || item.originalName}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-background/95 p-2 text-xs transition-transform group-hover:translate-y-0">
                  Xem thông tin ảnh
                </span>
              </button>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.originalName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBytes(item.sizeBytes)} ·{' '}
                    {item.width && item.height ? `${item.width}×${item.height}` : item.mimeType}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đang dùng: {mediaUsageCount(item)} vị trí
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(item.secureUrl)}
                  className="grid size-10 shrink-0 place-items-center border border-border transition hover:border-primary hover:text-primary"
                  aria-label="Sao chép URL"
                >
                  <Copy className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {!loading && !items.length ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Chưa có ảnh phù hợp bộ lọc.
        </p>
      ) : null}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Trang {meta.page || page} / {meta.totalPages || 1}
        </p>
        <div className="flex gap-2">
          <SecondaryButton
            type="button"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trang trước
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={!meta.hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Trang sau
          </SecondaryButton>
        </div>
      </div>
      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Chi tiết ảnh"
        description="Xem thông tin, cập nhật alt text hoặc sao chép đường dẫn ảnh."
        size="2xl"
      >
        {selected ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <ImageWithFallback
                src={selected.secureUrl}
                alt={selected.altText || selected.originalName}
                className="max-h-[34rem] w-full bg-secondary object-contain"
              />
              <div className="grid content-start gap-4">
                <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Tên file</dt>
                  <dd className="break-all">{selected.originalName}</dd>
                  <dt className="text-muted-foreground">Kích thước</dt>
                  <dd>
                    {selected.width && selected.height
                      ? `${selected.width} × ${selected.height} px`
                      : 'Chưa có metadata'}
                  </dd>
                  <dt className="text-muted-foreground">Dung lượng</dt>
                  <dd>{formatBytes(selected.sizeBytes)}</dd>
                  <dt className="text-muted-foreground">MIME</dt>
                  <dd>{selected.mimeType}</dd>
                  <dt className="text-muted-foreground">Provider</dt>
                  <dd>{selected.provider}</dd>
                  <dt className="text-muted-foreground">Người tải</dt>
                  <dd>{selected.uploader?.fullName || selected.uploader?.email || '—'}</dd>
                  <dt className="text-muted-foreground">Ngày tải</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                  <dt className="text-muted-foreground">Đang dùng</dt>
                  <dd>
                    {selected._count?.productImages || 0} ảnh sản phẩm ·{' '}
                    {selected._count?.featuredPosts || 0} cover blog
                  </dd>
                </dl>
                <TextInput
                  label="Alt text"
                  value={drafts[selected.uuid] ?? ''}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [selected.uuid]: event.target.value }))
                  }
                />
                <label className="grid gap-2 text-sm font-medium">
                  URL
                  <input
                    readOnly
                    value={selected.secureUrl}
                    className="min-h-11 w-full border border-input bg-secondary/30 px-3 text-xs"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <ActionButton type="button" onClick={() => saveAlt(selected)}>
                    <Check className="mr-2 size-4" />
                    Lưu alt text
                  </ActionButton>
                  <SecondaryButton type="button" onClick={() => copy(selected.secureUrl)}>
                    <Copy className="mr-2 size-4" />
                    Sao chép URL
                  </SecondaryButton>
                  <DangerButton
                    type="button"
                    disabled={mediaUsageCount(selected) > 0}
                    onClick={() => remove(selected)}
                    title={
                      mediaUsageCount(selected) > 0 ? 'Ảnh đang được sử dụng nên chưa thể xóa' : ''
                    }
                  >
                    <Trash2 className="mr-2 size-4" />
                    Xóa ảnh
                  </DangerButton>
                </div>
                {mediaUsageCount(selected) > 0 ? (
                  <Notice type="info">
                    Ảnh đang được dùng. Hãy thay ảnh tại sản phẩm hoặc bài viết trước khi xóa.
                  </Notice>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </AdminModal>
    </div>
  );
}

const quoteStatuses = ['CREATED', 'MESSENGER_OPENED', 'PROCESSED', 'EXPIRED'];

export function AdminQuotesPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    archived: 'active',
    from: '',
    to: '',
  });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await adminApi.listQuotes({ limit: 100, ...filters });
    setItems(response.data.quotes || []);
    setSelectedIds([]);
  }, [filters]);
  useEffect(() => {
    Promise.resolve()
      .then(() => load())
      .catch((err) => setError(err.message));
  }, [load]);

  const open = async (uuid) => {
    setError('');
    try {
      const response = await adminApi.getQuote(uuid);
      setSelected(response.data.quote);
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (status) => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const response = await adminApi.updateQuoteStatus(selected.uuid, status);
      setSelected({ ...selected, ...response.data.quote });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const selectableItems = items.filter(
    (item) => filters.archived === 'archived' || item.status !== 'PROCESSED',
  );
  const allSelected =
    selectableItems.length > 0 && selectableItems.every((item) => selectedIds.includes(item.uuid));
  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : selectableItems.map((item) => item.uuid));
  const toggleSelected = (uuid) =>
    setSelectedIds((current) =>
      current.includes(uuid) ? current.filter((item) => item !== uuid) : [...current, uuid],
    );
  const archiveSelected = async () => {
    if (
      !selectedIds.length ||
      !window.confirm(
        `Chuyển ${selectedIds.length} phiếu vào lưu trữ? Phiếu đã xử lý sẽ luôn được giữ lại.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const response = await adminApi.archiveQuotes({ mode: 'SELECTED', uuids: selectedIds });
      setOk(
        `Đã lưu trữ ${response.data.archivedCount || 0} phiếu. ${response.data.protectedProcessed ? `${response.data.protectedProcessed} phiếu đã xử lý được bảo vệ.` : ''}`,
      );
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const cleanupUnopened = async () => {
    if (
      !window.confirm(
        'Lưu trữ toàn bộ phiếu cũ chưa từng mở Messenger và phiếu hết hạn? Phiếu đã xử lý không bị ảnh hưởng.',
      )
    )
      return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const response = await adminApi.archiveQuotes({ mode: 'UNOPENED', uuids: [] });
      setOk(`Đã dọn ${response.data.archivedCount || 0} phiếu chưa mở Messenger.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const restoreSelected = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const response = await adminApi.restoreQuotes({ uuids: selectedIds });
      setOk(`Đã khôi phục ${response.data.restoredCount || 0} phiếu.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const quotePublicUrl =
    selected?.publicUrl ||
    (selected?.publicPath ? new URL(selected.publicPath, window.location.origin).toString() : '');
  const copyPublicUrl = async () => {
    if (!quotePublicUrl) return;
    try {
      await navigator.clipboard.writeText(quotePublicUrl);
    } catch {
      window.prompt('Sao chép link phiếu:', quotePublicUrl);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Báo giá & yêu cầu tư vấn"
        description="Phiếu được ghi nhận sau khi khách mở Messenger; CAPTCHA được bật hoặc tắt theo môi trường. Dùng lưu trữ mềm để dọn spam mà không làm thất thoát dữ liệu."
      />
      <Notice>{error}</Notice>
      {ok ? <Notice type="success">{ok}</Notice> : null}
      <Toolbar>
        <TextInput
          label="Tìm mã báo giá"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <SelectInput
          label="Trạng thái"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Tất cả</option>
          {quoteStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </SelectInput>
        <SelectInput
          label="Kho phiếu"
          value={filters.archived}
          onChange={(e) => setFilters({ ...filters, archived: e.target.value })}
        >
          <option value="active">Đang hoạt động</option>
          <option value="archived">Đã lưu trữ</option>
        </SelectInput>
        <TextInput
          label="Từ ngày"
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <TextInput
          label="Đến ngày"
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
      </Toolbar>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <SectionCard
          title={filters.archived === 'archived' ? 'Phiếu đã lưu trữ' : 'Danh sách phiếu'}
          actions={
            <div className="flex flex-wrap gap-2">
              {filters.archived === 'archived' ? (
                <SecondaryButton
                  type="button"
                  disabled={!selectedIds.length || busy}
                  onClick={restoreSelected}
                >
                  Khôi phục ({selectedIds.length})
                </SecondaryButton>
              ) : (
                <>
                  <DangerButton
                    type="button"
                    disabled={!selectedIds.length || busy}
                    onClick={archiveSelected}
                  >
                    Lưu trữ đã chọn ({selectedIds.length})
                  </DangerButton>
                  <SecondaryButton type="button" disabled={busy} onClick={cleanupUnopened}>
                    Dọn phiếu chưa mở
                  </SecondaryButton>
                </>
              )}
            </div>
          }
        >
          <AdminTable
            columns={[
              {
                key: 'select',
                label: (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Chọn tất cả phiếu có thể thao tác"
                  />
                ),
                render: (row) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.uuid)}
                    disabled={filters.archived !== 'archived' && row.status === 'PROCESSED'}
                    onChange={() => toggleSelected(row.uuid)}
                    aria-label={`Chọn phiếu ${row.code}`}
                  />
                ),
              },
              { key: 'code', label: 'Mã' },
              { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(row.createdAt) },
              { key: 'itemCount', label: 'Mục' },
              {
                key: 'snapshotTotal',
                label: 'Tạm tính',
                render: (row) => formatMoney(row.snapshotTotal, row.currency),
              },
              {
                key: 'messengerOpenedAt',
                label: 'Messenger',
                render: (row) =>
                  row.messengerOpenedAt ? formatDate(row.messengerOpenedAt) : 'Chưa mở',
              },
              {
                key: 'status',
                label: 'Trạng thái',
                render: (row) => <StatusBadge>{row.status}</StatusBadge>,
              },
            ]}
            rows={items}
            actions={(row) => (
              <SecondaryButton type="button" onClick={() => open(row.uuid)}>
                Chi tiết
              </SecondaryButton>
            )}
          />
        </SectionCard>
        <SectionCard title={selected ? selected.code : 'Chi tiết báo giá'}>
          {selected ? (
            <div className="grid gap-5">
              {selected.archivedAt ? (
                <Notice type="info">
                  Phiếu này đang ở kho lưu trữ. Khôi phục phiếu trước khi tiếp tục xử lý.
                </Notice>
              ) : null}
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Tạo lúc:</span>{' '}
                  {formatDate(selected.createdAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Hết hạn:</span>{' '}
                  {formatDate(selected.expiresAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Ghi chú:</span> {selected.note || '—'}
                </p>
              </div>
              <SelectInput
                label="Cập nhật trạng thái"
                value={selected.status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={busy || Boolean(selected.archivedAt)}
              >
                {quoteStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </SelectInput>
              {quotePublicUrl ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <SecondaryButton type="button" onClick={copyPublicUrl}>
                    <Copy className="mr-2 size-4" />
                    Sao chép link
                  </SecondaryButton>
                  <a
                    href={quotePublicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center border border-border px-4 text-xs font-semibold uppercase tracking-[0.08em] transition hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="mr-2 size-4" />
                    Mở phiếu
                  </a>
                  <a
                    href={env.MESSENGER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center bg-primary px-4 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground sm:col-span-2"
                  >
                    <MessageCircle className="mr-2 size-4" />
                    Mở Messenger Midi
                  </a>
                </div>
              ) : (
                <Notice type="info">
                  Phiếu cũ không có token mã hóa để khôi phục link. Các phiếu mới sẽ có nút sao chép
                  và mở trang public.
                </Notice>
              )}
              <div className="grid gap-3">
                {selected.items?.map((item) => (
                  <div
                    key={`${item.productUuid}-${item.name}`}
                    className="grid grid-cols-[3.5rem_1fr] gap-3 border-t border-border pt-3"
                  >
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatMoney(item.unitPrice, selected.currency)}
                      </p>
                      <p className="mt-1 text-sm">
                        {formatMoney(item.lineTotal, selected.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="border-t border-border pt-4 text-right font-display text-2xl">
                {formatMoney(selected.snapshotTotal, selected.currency)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chọn một báo giá để xem sản phẩm và cập nhật trạng thái xử lý.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function AdminInterestAnalyticsPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const response = await adminApi.interestAnalytics(range);
    setData(response.data);
  }, [range]);
  useEffect(() => {
    Promise.resolve()
      .then(() => load())
      .catch((err) => setError(err.message));
  }, [load]);
  const maxFunnel = Math.max(...(data?.funnel || []).map((item) => item.value), 1);
  const maxTrend = Math.max(...(data?.trend || []).map((item) => item.total), 1);
  const rankingColumns = [
    { key: 'name', label: 'Sản phẩm' },
    { key: 'category', label: 'Danh mục', render: (row) => row.category?.name || '—' },
    { key: 'brand', label: 'Thương hiệu', render: (row) => row.brand?.name || '—' },
    { key: 'events', label: 'Lượt' },
  ];
  const dimensionColumns = [
    { key: 'name', label: 'Tên' },
    { key: 'viewed', label: 'Xem' },
    { key: 'addedToCart', label: 'Thêm giỏ' },
    { key: 'includedInQuote', label: 'Trong phiếu' },
    { key: 'events', label: 'Tổng tín hiệu' },
  ];
  const kpis = data
    ? [
        {
          label: 'Lượt xem sản phẩm',
          value: data.counters?.PRODUCT_VIEWED || 0,
          hint: 'Số event xem trang chi tiết sản phẩm trong khoảng thời gian.',
        },
        {
          label: 'Lượt thêm vào giỏ',
          value: data.counters?.ADDED_TO_CART || 0,
          hint: 'Tín hiệu quan tâm; không đồng nghĩa sản phẩm đã bán.',
        },
        {
          label: 'Phiếu được tạo',
          value: data.counters?.QUOTE_CREATED || 0,
          hint: 'Phiếu yêu cầu đã tạo, chưa phải giao dịch được xác nhận.',
        },
        {
          label: 'Mở Messenger',
          value: data.counters?.MESSENGER_CLICKED || 0,
          hint: 'Số lần khách bấm mở Messenger từ phiếu.',
        },
      ]
    : [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Mức độ quan tâm"
        description="Theo dõi hành vi ẩn danh từ xem sản phẩm đến mở Messenger; không dùng đây như doanh thu đã chốt."
        actions={
          <SecondaryButton type="button" onClick={() => load()}>
            <RefreshCw className="mr-2 size-4" />
            Làm mới
          </SecondaryButton>
        }
      />
      <Notice>{error}</Notice>
      <Toolbar>
        <TextInput
          label="Từ ngày"
          type="date"
          value={range.from}
          onChange={(e) => setRange({ ...range, from: e.target.value })}
        />
        <TextInput
          label="Đến ngày"
          type="date"
          value={range.to}
          onChange={(e) => setRange({ ...range, to: e.target.value })}
        />
      </Toolbar>
      {!data ? (
        <div className="h-64 animate-pulse bg-secondary" />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="bg-background p-5" title={item.hint}>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.hint}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Phễu tư vấn"
              description="Tỷ lệ của từng bước được tính trên bước ngay trước đó."
            >
              <div className="grid gap-5">
                {data.funnel?.map((item) => (
                  <div key={item.key}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">
                        {item.value} · {item.rate}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary">
                      <div
                        className="h-full bg-primary transition-[width] duration-700"
                        style={{ width: `${Math.max(2, (item.value / maxFunnel) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard
              title="Xu hướng theo ngày"
              description="Tổng số event quan tâm, không phải số đơn hàng."
            >
              <div className="flex min-h-56 items-end gap-2 overflow-x-auto border-b border-l border-border px-3 pt-5">
                {data.trend?.length ? (
                  data.trend.map((item) => (
                    <div
                      key={item.date}
                      className="group flex min-w-12 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[10px] font-medium opacity-0 transition group-hover:opacity-100">
                        {item.total}
                      </span>
                      <div
                        className="w-full min-w-8 bg-primary/80 transition-all duration-500 group-hover:bg-primary"
                        style={{ height: `${Math.max(4, (item.total / maxTrend) * 150)}px` }}
                        title={`${item.date}: ${item.total} event`}
                      />
                      <span className="-rotate-45 whitespace-nowrap pb-4 text-[9px] text-muted-foreground">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="m-auto text-sm text-muted-foreground">
                    Chưa đủ dữ liệu để vẽ xu hướng.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard title="Top được xem">
              <AdminTable columns={rankingColumns} rows={data.topViewed || []} />
            </SectionCard>
            <SectionCard title="Top được thêm vào giỏ">
              <AdminTable columns={rankingColumns} rows={data.topAddedToCart || []} />
            </SectionCard>
            <SectionCard title="Top xuất hiện trong phiếu">
              <AdminTable columns={rankingColumns} rows={data.topInQuotes || []} />
            </SectionCard>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Theo danh mục">
              <AdminTable columns={dimensionColumns} rows={data.categories || []} />
            </SectionCard>
            <SectionCard title="Theo thương hiệu">
              <AdminTable columns={dimensionColumns} rows={data.brands || []} />
            </SectionCard>
          </div>
          <SectionCard title="Phiếu theo trạng thái">
            <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
              {data.quoteSummary?.map((item) => (
                <div key={item.status} className="bg-background p-5">
                  <StatusBadge>{item.status}</StatusBadge>
                  <p className="mt-4 text-3xl font-semibold">{item.count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tạm tính {formatMoney(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

const displayLogValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

function AuditChangeTable({ beforeData, afterData }) {
  const before = beforeData && typeof beforeData === 'object' ? beforeData : {};
  const after = afterData && typeof afterData === 'object' ? afterData : {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  if (!keys.length)
    return (
      <p className="text-sm text-muted-foreground">Log này không có snapshot dữ liệu trước/sau.</p>
    );
  return (
    <div className="overflow-x-auto border border-border">
      <table className="min-w-[42rem] w-full text-sm">
        <thead className="bg-secondary/60 text-left">
          <tr>
            <th className="px-3 py-2">Trường</th>
            <th className="px-3 py-2">Trước</th>
            <th className="px-3 py-2">Sau</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const beforeValue = displayLogValue(before[key]);
            const afterValue = displayLogValue(after[key]);
            const changed = beforeValue !== afterValue;
            return (
              <tr key={key} className={`border-t border-border ${changed ? 'bg-amber-500/5' : ''}`}>
                <th className="px-3 py-2 text-left align-top font-medium">
                  {key}
                  {changed ? (
                    <span className="ml-2 text-[10px] uppercase text-amber-700">Thay đổi</span>
                  ) : null}
                </th>
                <td className="max-w-xs whitespace-pre-wrap break-all px-3 py-2 align-top text-xs text-muted-foreground">
                  {beforeValue}
                </td>
                <td className="max-w-xs whitespace-pre-wrap break-all px-3 py-2 align-top text-xs">
                  {afterValue}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminLogsPage({ kind }) {
  const isEmail = kind === 'email';
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    action: '',
    actor: '',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await (isEmail ? adminApi.listEmailLogs : adminApi.listAuditLogs)({
        limit: 25,
        page,
        ...filters,
      });
      setItems(response.data.logs || []);
      setMeta(response.meta || { page, totalPages: 1, total: response.data.logs?.length || 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, isEmail, page]);
  useEffect(() => {
    Promise.resolve()
      .then(() => load())
      .catch((err) => setError(err.message));
  }, [load]);
  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const columns = useMemo(
    () =>
      isEmail
        ? [
            { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(row.createdAt) },
            { key: 'to', label: 'Người nhận' },
            { key: 'subject', label: 'Tiêu đề' },
            { key: 'type', label: 'Loại' },
            {
              key: 'status',
              label: 'Trạng thái',
              render: (row) => <StatusBadge>{row.status}</StatusBadge>,
            },
            { key: 'errorMessage', label: 'Lỗi' },
          ]
        : [
            { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(row.createdAt) },
            { key: 'actorEmail', label: 'Người thực hiện' },
            { key: 'action', label: 'Hành động' },
            { key: 'entityType', label: 'Đối tượng' },
            { key: 'entityId', label: 'ID' },
          ],
    [isEmail],
  );
  return (
    <div className="grid gap-6">
      <PageHeader
        title={isEmail ? 'Nhật ký email' : 'Nhật ký thao tác'}
        description={
          isEmail
            ? 'Theo dõi email hệ thống đã gửi hoặc gặp lỗi; không hiển thị credential SMTP.'
            : 'Lịch sử thay đổi quan trọng trong khu vực quản trị. Dữ liệu chỉ đọc.'
        }
      />
      <Notice>{error}</Notice>
      <Toolbar>
        <TextInput
          label={isEmail ? 'Người nhận / nội dung' : 'Email / entity ID'}
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        {isEmail ? (
          <>
            <TextInput
              label="Loại email"
              value={filters.type}
              onChange={(event) => updateFilter('type', event.target.value)}
            />
            <SelectInput
              label="Trạng thái"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="SUCCESS">Success</option>
            </SelectInput>
          </>
        ) : (
          <>
            <TextInput
              label="Actor"
              value={filters.actor}
              onChange={(event) => updateFilter('actor', event.target.value)}
            />
            <TextInput
              label="Hành động"
              value={filters.action}
              onChange={(event) => updateFilter('action', event.target.value)}
            />
            <TextInput
              label="Entity type"
              value={filters.type}
              onChange={(event) => updateFilter('type', event.target.value)}
            />
          </>
        )}
        <TextInput
          label="Từ ngày"
          type="date"
          value={filters.from}
          onChange={(event) => updateFilter('from', event.target.value)}
        />
        <TextInput
          label="Đến ngày"
          type="date"
          value={filters.to}
          onChange={(event) => updateFilter('to', event.target.value)}
        />
      </Toolbar>
      {loading ? (
        <div className="h-52 animate-pulse bg-secondary" />
      ) : (
        <AdminTable
          columns={columns}
          rows={items}
          empty={isEmail ? 'Chưa có email phù hợp bộ lọc.' : 'Chưa có thao tác phù hợp bộ lọc.'}
          actions={(row) => (
            <SecondaryButton type="button" onClick={() => setSelected(row)}>
              <Eye className="mr-1 size-4" />
              Chi tiết
            </SecondaryButton>
          )}
        />
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {meta.total || 0} log · trang {meta.page || page}/{meta.totalPages || 1}
        </p>
        <div className="flex gap-2">
          <SecondaryButton
            type="button"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trang trước
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={!meta.hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Trang sau
          </SecondaryButton>
        </div>
      </div>
      {selected ? (
        <SectionCard
          title={isEmail ? 'Chi tiết email' : 'Chi tiết thao tác'}
          actions={
            <button
              type="button"
              className="text-sm text-muted-foreground underline"
              onClick={() => setSelected(null)}
            >
              Đóng
            </button>
          }
        >
          {isEmail ? (
            <dl className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-muted-foreground">Thời gian</dt>
              <dd>{formatDate(selected.createdAt)}</dd>
              <dt className="text-muted-foreground">Người nhận</dt>
              <dd className="break-all">{selected.to}</dd>
              <dt className="text-muted-foreground">Tiêu đề</dt>
              <dd>{selected.subject}</dd>
              <dt className="text-muted-foreground">Loại</dt>
              <dd>{selected.type}</dd>
              <dt className="text-muted-foreground">Trạng thái</dt>
              <dd>
                <StatusBadge>{selected.status}</StatusBadge>
              </dd>
              <dt className="text-muted-foreground">Thông báo lỗi</dt>
              <dd className="break-words text-destructive">
                {selected.errorMessage || 'Không có'}
              </dd>
            </dl>
          ) : (
            <div className="grid gap-5">
              <dl className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-[9rem_1fr]">
                <dt className="text-muted-foreground">Thời gian</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
                <dt className="text-muted-foreground">Admin</dt>
                <dd>{selected.actorEmail || 'Hệ thống'}</dd>
                <dt className="text-muted-foreground">Hành động</dt>
                <dd>{selected.action}</dd>
                <dt className="text-muted-foreground">Đối tượng</dt>
                <dd>
                  {selected.entityType} · {selected.entityId || '—'}
                </dd>
                <dt className="text-muted-foreground">IP</dt>
                <dd>{selected.ipAddress || '—'}</dd>
                <dt className="text-muted-foreground">User agent</dt>
                <dd className="break-all text-xs">{selected.userAgent || '—'}</dd>
                <dt className="text-muted-foreground">Metadata</dt>
                <dd className="whitespace-pre-wrap break-all text-xs">
                  {displayLogValue(selected.metadata)}
                </dd>
              </dl>
              <AuditChangeTable beforeData={selected.beforeData} afterData={selected.afterData} />
            </div>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

export function AdminEmailLogsPage() {
  return <AdminLogsPage kind="email" />;
}
export function AdminAuditLogsPage() {
  return <AdminLogsPage kind="audit" />;
}
