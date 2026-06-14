import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api/admin-api';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { validateLocalImageFiles } from '@/lib/media';
import { ActionButton, AdminTable, DangerButton, FileInput, Notice, NumberInput, PageHeader, RequiredNote, SecondaryButton, SectionCard, SelectInput, StatusBadge, TabButtons, TextArea, TextInput, Toolbar, formatDate, formatMoney, normalizeIntegerInput, normalizeMoneyInput, toInputNumber } from './admin-shared';

const initial = {
  name: '', sku: '', barcode: '', categoryUuid: '', brandUuid: '', skinType: '', shortDescription: '', description: '', benefits: '', caution: '', ingredients: '', howToUse: '',
  price: '', compareAtPrice: '', stock: '0', unit: '', currency: 'VND', status: 'DRAFT', isFeatured: false, featuredOrder: '0', images: [], imageUrlText: '',
};

const clean = (form) => ({
  categoryUuid: form.categoryUuid || null,
  brandUuid: form.brandUuid || null,
  name: form.name,
  sku: form.sku || null,
  barcode: form.barcode || null,
  skinType: form.skinType || null,
  shortDescription: form.shortDescription || null,
  description: form.description || null,
  benefits: form.benefits || null,
  caution: form.caution || null,
  ingredients: form.ingredients || null,
  howToUse: form.howToUse || null,
  price: normalizeMoneyInput(form.price),
  stock: normalizeIntegerInput(form.stock) ?? 0,
  unit: form.unit || null,
  compareAtPrice: form.compareAtPrice === '' ? null : normalizeMoneyInput(form.compareAtPrice),
  currency: form.currency || 'VND',
  status: form.status,
  isFeatured: Boolean(form.isFeatured),
  featuredOrder: normalizeIntegerInput(form.featuredOrder) ?? 0,
  images: form.images || [],
});

export function AdminProductsPage({ initialView = 'list' }) {
  const [view, setView] = useState(initialView);
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [preview, setPreview] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [importResult, setImportResult] = useState(null);

  const load = async () => {
    const [p, c, b, imports] = await Promise.all([
      adminApi.listProducts({ limit: 100, search, status: statusFilter, categoryUuid: categoryFilter, brandUuid: brandFilter }),
      adminApi.listProductCategories({ limit: 100 }),
      adminApi.listProductBrands({ limit: 100 }),
      adminApi.listImportJobs({ limit: 10 }),
    ]);
    setItems(p.data.products || []);
    setCats(c.data.categories || []);
    setBrands(b.data.brands || []);
    setLogs(imports.data.jobs || imports.data.imports || []);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminApi.listProducts({ limit: 100, search, status: statusFilter, categoryUuid: categoryFilter, brandUuid: brandFilter }),
      adminApi.listProductCategories({ limit: 100 }),
      adminApi.listProductBrands({ limit: 100 }),
      adminApi.listImportJobs({ limit: 10 }),
    ])
      .then(([p, c, b, imports]) => {
        if (!mounted) return;
        setItems(p.data.products || []);
        setCats(c.data.categories || []);
        setBrands(b.data.brands || []);
        setLogs(imports.data.jobs || imports.data.imports || []);
      })
      .catch((e) => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [search, statusFilter, categoryFilter, brandFilter]);

  const selectedImageCount = useMemo(() => (form.images?.length || 0) + galleryFiles.length, [form.images, galleryFiles]);
  const filePreviews = useMemo(() => galleryFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [galleryFiles]);
  useEffect(() => () => { filePreviews.forEach((item) => URL.revokeObjectURL(item.url)); }, [filePreviews]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const addUrlImages = () => {
    const urls = form.imageUrlText.split('\n').map((url) => url.trim()).filter(Boolean);
    if (!urls.length) return;
    setForm((current) => ({
      ...current,
      imageUrlText: '',
      images: [...(current.images || []), ...urls.map((url, index) => ({ url, altText: current.name, sortOrder: (current.images?.length || 0) + index, isPrimary: (current.images?.length || 0) + index === 0 }))],
    }));
  };

  const uploadGallery = async () => {
    const fileError = validateLocalImageFiles(galleryFiles, 'Ảnh sản phẩm');
    if (fileError) throw new Error(fileError);
    const existing = form.images || [];
    const uploaded = [];
    for (const file of galleryFiles) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('altText', form.name);
      const res = await adminApi.uploadImage(fd);
      uploaded.push({ mediaAssetUuid: res.data.media.uuid, altText: form.name, sortOrder: existing.length + uploaded.length, isPrimary: existing.length + uploaded.length === 0 });
    }
    return [...existing, ...uploaded];
  };

  const openCreate = () => { setEditing(null); setForm(initial); setGalleryFiles([]); setError(''); setOk(''); setView('manual'); };
  const edit = (r) => {
    setEditing(r.uuid); setGalleryFiles([]);
    setForm({
      ...initial,
      name: r.name || '', sku: r.sku || '', barcode: r.barcode || '', categoryUuid: r.category?.uuid || '', brandUuid: r.brand?.uuid || '', skinType: r.skinType || '',
      shortDescription: r.shortDescription || '', description: r.description || '', benefits: r.benefits || '', caution: r.caution || '', ingredients: r.ingredients || '', howToUse: r.howToUse || '',
      price: toInputNumber(r.price), compareAtPrice: toInputNumber(r.compareAtPrice), stock: String(r.stock ?? 0), unit: r.unit || '', currency: r.currency || 'VND', status: r.status || 'DRAFT', isFeatured: Boolean(r.isFeatured), featuredOrder: String(r.featuredOrder ?? 0),
      images: (r.images || []).map((img, index) => ({ mediaAssetUuid: img.mediaAsset?.uuid, url: img.mediaAsset?.secureUrl, altText: img.altText || r.name, sortOrder: img.sortOrder ?? index, isPrimary: img.isPrimary ?? index === 0 })).filter((img) => img.mediaAssetUuid || img.url),
    });
    setView('manual'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancel = () => { setEditing(null); setForm(initial); setGalleryFiles([]); setView('list'); };

  async function submit(e) {
    e.preventDefault(); setLoading(true); setError(''); setOk('');
    try {
      if (!form.name.trim()) throw new Error('Tên sản phẩm là bắt buộc.');
      if (!normalizeMoneyInput(form.price)) throw new Error('Giá bán chưa đúng. Có thể nhập 1250000, 1.250.000 hoặc 1,250,000.');
      if (form.compareAtPrice && !normalizeMoneyInput(form.compareAtPrice)) throw new Error('Giá cũ chưa đúng định dạng.');
      if (form.stock !== '' && normalizeIntegerInput(form.stock) === null) throw new Error('Tồn kho phải là số nguyên không âm.');
      const images = await uploadGallery();
      const payload = clean({ ...form, images });
      if (editing) { await adminApi.updateProduct(editing, payload); setOk('Đã cập nhật sản phẩm.'); }
      else { await adminApi.createProduct(payload); setOk('Đã thêm sản phẩm.'); }
      await load(); cancel();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const toggleFeatured = async (r) => {
    setError(''); setOk('');
    try {
      const next = !r.isFeatured;
      await adminApi.updateProductFeatured(r.uuid, { isFeatured: next, featuredOrder: r.featuredOrder || 0 });
      setOk(next ? 'Đã bật sản phẩm đề xuất trang chủ.' : 'Đã tắt sản phẩm đề xuất trang chủ.');
      await load();
    } catch (err) { setError(err.message); }
  };

  const removeImage = (index) => setForm((current) => ({ ...current, images: current.images.filter((_, idx) => idx !== index).map((img, idx) => ({ ...img, sortOrder: idx, isPrimary: idx === 0 })) }));

  const previewImport = async () => {
    if (!importFile) { setError('Vui lòng chọn file Excel.'); return; }
    setError(''); setOk(''); setLoading(true);
    try { const fd = new FormData(); fd.append('file', importFile); const res = await adminApi.previewProductImport(fd); setPreview(res.data.preview || res.data); setImportResult(null); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const importProducts = async () => {
    if (!preview?.importJobId) { setError('Vui lòng preview file trước khi import.'); return; }
    setLoading(true); setError(''); setOk('');
    try {
      const res = await adminApi.confirmProductImport(preview.importJobId);
      const job = res.data.job;
      setImportResult(job);
      setOk(`Đã import xong: ${job.successRows || 0} dòng thành công, ${job.failedRows || 0} dòng lỗi.`);
      setPreview(null);
      setImportFile(null);
      await load();
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const downloadTemplate = async () => {
    setError('');
    try {
      const blob = await adminApi.downloadProductImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mau-import-san-pham-kiot.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { setError(err.message || 'Không tải được file mẫu Excel.'); }
  };

  const previewRows = preview?.rows || [];
  const hasErrors = Boolean(preview?.errors?.length || previewRows.some((row) => row.errors?.length));
  const canConfirmImport = Boolean(preview?.importJobId && (preview?.validRows || 0) > 0);
  const warningCount = preview?.warningRows ?? previewRows.filter((row) => row.warnings?.length && !row.errors?.length).length;
  const newCount = preview?.newRows ?? previewRows.filter((row) => row.action === 'NEW' && !row.errors?.length).length;
  const updateCount = preview?.updateRows ?? previewRows.filter((row) => row.action === 'UPDATE' && !row.errors?.length).length;
  const duplicateCount = preview?.duplicateRows ?? previewRows.filter((row) => row.errors?.some((e) => e.code === 'DUPLICATE_IN_FILE')).length;

  return <div className="grid gap-6">
    <PageHeader title={initialView === 'import' ? 'Import Excel Kiot' : 'Quản lý sản phẩm'} description="Quản lý sản phẩm, giá, tồn kho và bật/tắt sản phẩm đề xuất trang chủ ngay trong bảng." actions={<><SecondaryButton type="button" onClick={() => setView('list')}>Danh sách</SecondaryButton><ActionButton type="button" onClick={openCreate}>+ Thêm sản phẩm</ActionButton><SecondaryButton type="button" onClick={() => setView('import')}>Import Excel</SecondaryButton></>} />
    <Notice>{error}</Notice><Notice type="success">{ok}</Notice>
    <TabButtons value={view} onChange={(next) => next === 'manual' && !editing ? openCreate() : setView(next)} items={[{ value: 'list', label: 'Danh sách' }, { value: 'manual', label: editing ? 'Sửa sản phẩm' : 'Thêm thủ công' }, { value: 'import', label: 'Import Excel' }]} />

    {view === 'manual' ? <SectionCard title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} actions={<SecondaryButton type="button" onClick={cancel}>Quay lại</SecondaryButton>}>
      <form onSubmit={submit} className="grid gap-5">
        <RequiredNote />
        <SectionCard title="Thông tin chính" description="Các thông tin khách hàng nhìn thấy ở trang sản phẩm.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Tên sản phẩm" name="name" value={form.name} onChange={set} required />
            <NumberInput label="Giá bán" name="price" value={form.price} onChange={set} required />
            <SelectInput label="Thương hiệu" name="brandUuid" value={form.brandUuid} onChange={set}><option value="">Không chọn</option>{brands.map((b) => <option key={b.uuid} value={b.uuid}>{b.name}</option>)}</SelectInput>
            <SelectInput label="Danh mục" name="categoryUuid" value={form.categoryUuid} onChange={set}><option value="">Không chọn</option>{cats.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}</SelectInput>
            <SelectInput label="Trạng thái" name="status" value={form.status} onChange={set}><option value="DRAFT">Nháp</option><option value="ACTIVE">Hiển thị</option><option value="INACTIVE">Tạm ẩn</option><option value="ARCHIVED">Lưu trữ</option></SelectInput>
            <NumberInput label="Giá cũ" name="compareAtPrice" value={form.compareAtPrice} onChange={set} />
          </div>
        </SectionCard>

        <SectionCard title="Thông tin tư vấn" description="Các thông tin giúp khách hàng hiểu công dụng và cách dùng sản phẩm.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea label="Mô tả ngắn" name="shortDescription" value={form.shortDescription} onChange={set} />
            <TextArea label="Mô tả chi tiết" name="description" value={form.description} onChange={set} />
            <TextArea label="Công dụng" name="benefits" value={form.benefits} onChange={set} />
            <TextArea label="Cách sử dụng" name="howToUse" value={form.howToUse} onChange={set} />
            <SelectInput label="Loại da phù hợp" name="skinType" value={form.skinType} onChange={set}><option value="">Không chọn</option><option>Da khô</option><option>Da dầu</option><option>Da hỗn hợp</option><option>Da nhạy cảm</option><option>Mọi loại da</option></SelectInput>
            <TextArea label="Thành phần" name="ingredients" value={form.ingredients} onChange={set} />
            <TextArea label="Lưu ý sử dụng" name="caution" value={form.caution} onChange={set} className="md:col-span-2" />
          </div>
        </SectionCard>

        <SectionCard title="Quản trị nội bộ" description="Các thông tin chỉ dùng cho chủ shop, không hiển thị ở public.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TextInput label="Mã hàng" name="sku" value={form.sku} onChange={set} hint="Không bắt buộc, nhưng nếu nhập thì không được trùng." />
            <TextInput label="Mã vạch" name="barcode" value={form.barcode} onChange={set} />
            <NumberInput label="Tồn kho" name="stock" value={form.stock} onChange={set} />
            <TextInput label="ĐVT" name="unit" value={form.unit} onChange={set} placeholder="chai, hộp, tuýp..." />
            <TextInput label="Tiền tệ" name="currency" value={form.currency} onChange={set} maxLength={3} />
            <NumberInput label="Thứ tự đề xuất" name="featuredOrder" value={form.featuredOrder} onChange={set} />
          </div>
          <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={set} />Hiển thị ở trang chủ</label>
        </SectionCard>

        <SectionCard title="Hình ảnh">
          <div className="grid gap-4">
            <FileInput label="Tải ảnh lên" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => { const files = Array.from(e.target.files || []); const fileError = validateLocalImageFiles(files, 'Ảnh sản phẩm'); if (fileError) { setError(fileError); e.target.value = ''; setGalleryFiles([]); return; } setError(''); setGalleryFiles(files); }} hint={`${selectedImageCount} ảnh sẽ được lưu. Ảnh đầu tiên là ảnh chính. Mỗi ảnh tối đa 5MB.`} />
            <TextArea label="Hoặc dán URL ảnh" name="imageUrlText" value={form.imageUrlText} onChange={set} hint="Mỗi dòng một link ảnh trực tiếp .jpg, .jpeg, .png hoặc .webp" />
            <div><SecondaryButton type="button" onClick={addUrlImages}>Thêm URL ảnh</SecondaryButton></div>
            {(form.images?.length || filePreviews.length) ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(form.images || []).map((img, index) => <div key={`${img.mediaAssetUuid || img.url}-${index}`} className="rounded-2xl border border-border p-3"><ImageWithFallback src={img.url} alt={img.altText || form.name} className="h-28 w-full rounded-xl object-cover" /><div className="mt-2 flex items-center justify-between text-xs"><span>{index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}`}</span><button type="button" onClick={() => removeImage(index)} className="text-destructive">Xóa</button></div></div>)}
              {filePreviews.map((img, index) => <div key={`${img.name}-${index}`} className="rounded-2xl border border-dashed border-border p-3"><img src={img.url} alt={img.name} className="h-28 w-full rounded-xl object-cover" /><div className="mt-2 text-xs text-muted-foreground">Ảnh mới: {img.name}</div></div>)}
            </div> : null}
          </div>
        </SectionCard>
        <div className="flex flex-wrap gap-2"><ActionButton disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu sản phẩm'}</ActionButton><SecondaryButton type="button" onClick={cancel}>Hủy</SecondaryButton></div>
      </form>
    </SectionCard> : null}

    {view === 'import' ? <div className="grid gap-5">
      <SectionCard
        title="Import sản phẩm từ Excel Kiot"
        description="Tải mẫu .xlsx chuẩn, upload file Kiot, xem preview và chỉ xác nhận khi các cảnh báo đã rõ ràng. SKU trùng trong cùng file sẽ bị chặn để an toàn."
        actions={<SecondaryButton type="button" onClick={downloadTemplate}>Tải form mẫu Kiot (.xlsx)</SecondaryButton>}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <FileInput label="Chọn file Excel Kiot" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setPreview(null); setImportResult(null); }} hint="Chỉ nhận .xlsx thật. Không dùng CSV/XLS đổi đuôi." />
            <div className="flex flex-wrap gap-2 md:justify-end">
              <ActionButton type="button" disabled={loading || !importFile} onClick={previewImport}>Xem trước</ActionButton>
              {preview ? <SecondaryButton type="button" disabled={loading || !canConfirmImport} onClick={importProducts}>Xác nhận import dòng hợp lệ</SecondaryButton> : null}
            </div>
          </div>
          {importFile ? <Notice type="info">Đã chọn file: {importFile.name}</Notice> : null}
          {preview ? <div className="grid gap-3 rounded-3xl border border-border bg-secondary/30 p-4 text-sm">
            <div><strong>Tệp:</strong> {preview.filename || importFile?.name || '-'}</div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-2xl bg-background p-3"><p className="text-xs text-muted-foreground">Tổng dòng</p><strong>{preview.totalRows || 0}</strong></div>
              <div className="rounded-2xl bg-background p-3"><p className="text-xs text-muted-foreground">Tạo mới</p><strong>{newCount}</strong></div>
              <div className="rounded-2xl bg-background p-3"><p className="text-xs text-muted-foreground">Cập nhật</p><strong>{updateCount}</strong></div>
              <div className="rounded-2xl bg-background p-3"><p className="text-xs text-muted-foreground">Cảnh báo</p><strong>{warningCount}</strong></div>
              <div className="rounded-2xl bg-background p-3"><p className="text-xs text-muted-foreground">Trùng SKU</p><strong>{duplicateCount}</strong></div>
              <div className="rounded-2xl bg-background p-3"><p className="text-xs text-muted-foreground">Lỗi</p><strong>{preview.invalidRows || 0}</strong></div>
            </div>
            {hasErrors ? <Notice>File có dòng lỗi hoặc SKU trùng. Các dòng này sẽ bị bỏ qua; chỉ dòng hợp lệ mới được import.</Notice> : <Notice type="success">File không có lỗi chặn import. Vui lòng đọc cảnh báo trước khi xác nhận.</Notice>}
            {warningCount ? <Notice type="info">Có {warningCount} dòng cảnh báo, chủ yếu là SKU đã tồn tại hoặc cột tư vấn/ảnh đang trống nên sẽ giữ dữ liệu cũ.</Notice> : null}
            {preview.errors?.length ? <Notice>{preview.errors.map((e) => e.message).join(', ')}</Notice> : null}
          </div> : null}
          {importResult ? <Notice type="success">Kết quả import: tạo mới {importResult.summary?.createdCount ?? importResult.summary?.createdProducts ?? 0}, cập nhật {importResult.summary?.updatedCount ?? importResult.summary?.updatedProducts ?? 0}, bỏ qua {importResult.summary?.skippedCount ?? 0}, lỗi {importResult.summary?.failedCount ?? importResult.failedRows ?? 0}.</Notice> : null}
          {preview ? <AdminTable
            columns={[
              { key: 'rowNumber', label: 'Dòng' },
              { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> },
              { key: 'action', label: 'Hành động', render: (r) => <StatusBadge>{r.action}</StatusBadge> },
              { key: 'sku', label: 'Mã hàng' },
              { key: 'name', label: 'Tên hàng' },
              { key: 'price', label: 'Giá bán', render: (r) => formatMoney(r.price, 'VND') },
              { key: 'stock', label: 'Tồn kho', render: (r) => r.stock ?? 'Giữ cũ / 0 nếu tạo mới' },
              { key: 'brand', label: 'Thương hiệu' },
              { key: 'category', label: 'Nhóm hàng' },
              { key: 'mainImage', label: 'Ảnh', render: (r) => r.mainImage ? <ImageWithFallback src={r.mainImage} alt={r.name} className="h-12 w-12 rounded-xl object-cover" /> : <span className="text-xs text-muted-foreground">Giữ cũ nếu có</span> },
              { key: 'consulting', label: 'Thông tin tư vấn', render: (r) => <div className="grid gap-1 text-xs"><span>Mô tả: {r.description ? 'Có' : 'Trống'}</span><span>Công dụng: {r.benefits ? 'Có' : 'Trống'}</span><span>Cách dùng: {r.howToUse ? 'Có' : 'Trống'}</span><span>Loại da: {r.skinType ? 'Có' : 'Trống'}</span><span>Thành phần: {r.ingredients ? 'Có' : 'Trống'}</span><span>Lưu ý: {r.caution ? 'Có' : 'Trống'}</span></div> },
              { key: 'warnings', label: 'Cảnh báo', render: (r) => r.warnings?.length ? <ul className="grid gap-1 text-amber-700 dark:text-amber-300">{r.warnings.map((e, i) => <li key={`${e.code}-${i}`}>• {e.message}</li>)}</ul> : '-' },
              { key: 'errors', label: 'Lỗi', render: (r) => r.errors?.length ? <ul className="grid gap-1 text-destructive">{r.errors.map((e, i) => <li key={`${e.code}-${i}`}>• {e.message}</li>)}</ul> : '-' },
            ]}
            rows={previewRows}
            rowClassName={(r) => r.errors?.length ? 'bg-destructive/5' : r.warnings?.length ? 'bg-amber-500/5' : ''}
          /> : null}
        </div>
      </SectionCard>
      <SectionCard title="Lịch sử import" description="Theo dõi trạng thái các lần upload/confirm gần nhất.">
        <AdminTable columns={[{ key: 'originalName', label: 'Tệp' }, { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> }, { key: 'totalRows', label: 'Tổng dòng' }, { key: 'successRows', label: 'Thành công' }, { key: 'failedRows', label: 'Lỗi/Bỏ qua' }, { key: 'createdAt', label: 'Ngày tạo', render: (r) => formatDate(r.createdAt) }]} rows={logs} />
      </SectionCard>
    </div> : null}

    {view === 'list' ? <SectionCard title="Danh sách sản phẩm" description="Bật/tắt đề xuất trang chủ ngay trong bảng. Sản phẩm đang tạm ẩn hoặc lưu trữ sẽ không hiển thị ở public dù được đánh dấu đề xuất.">
      <div className="grid gap-4"><Toolbar><TextInput label="Tìm kiếm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, mã hàng..." /><SelectInput label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Tất cả</option><option value="DRAFT">Nháp</option><option value="ACTIVE">Hiển thị</option><option value="INACTIVE">Tạm ẩn</option><option value="ARCHIVED">Lưu trữ</option></SelectInput><SelectInput label="Danh mục" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Tất cả danh mục</option>{cats.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}</SelectInput><SelectInput label="Thương hiệu" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}><option value="">Tất cả thương hiệu</option>{brands.map((b) => <option key={b.uuid} value={b.uuid}>{b.name}</option>)}</SelectInput><div className="flex items-end"><ActionButton type="button" onClick={openCreate} className="w-full">+ Thêm sản phẩm</ActionButton></div><div className="flex items-end"><SecondaryButton type="button" onClick={() => setView('import')} className="w-full">Import Excel</SecondaryButton></div></Toolbar>
      <AdminTable empty="Chưa có sản phẩm phù hợp bộ lọc." columns={[{ key: 'image', label: 'Ảnh', render: (r) => <ImageWithFallback src={r.images?.[0]?.mediaAsset?.secureUrl} alt={r.name} className="h-12 w-12 rounded-xl object-cover" /> }, { key: 'name', label: 'Tên sản phẩm' }, { key: 'sku', label: 'Mã hàng' }, { key: 'barcode', label: 'Mã vạch' }, { key: 'price', label: 'Giá', render: (r) => formatMoney(r.price, r.currency) }, { key: 'stock', label: 'Tồn kho', render: (r) => `${r.stock ?? 0}${r.unit ? ` ${r.unit}` : ''}` }, { key: 'category', label: 'Danh mục', render: (r) => r.category?.name || '-' }, { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> }, { key: 'featured', label: 'Đề xuất', render: (r) => r.isFeatured ? '★ Trang chủ' : '—' }]} rows={items} actions={(r) => <div className="flex flex-wrap gap-2"><SecondaryButton type="button" onClick={() => toggleFeatured(r)}>{r.isFeatured ? '★ Bỏ đề xuất' : '☆ Đề xuất'}</SecondaryButton><SecondaryButton type="button" onClick={() => edit(r)}>Sửa</SecondaryButton>{r.status === 'ACTIVE' ? <SecondaryButton type="button" onClick={() => adminApi.deactivateProduct(r.uuid).then(load)}>Ẩn</SecondaryButton> : <ActionButton type="button" onClick={() => adminApi.activateProduct(r.uuid).then(load)}>Hiển thị</ActionButton>}<DangerButton type="button" onClick={() => confirm('Xóa sản phẩm này?') && adminApi.deleteProduct(r.uuid).then(load)}>Xóa</DangerButton></div>} /></div>
    </SectionCard> : null}
  </div>;
}

export function AdminProductImportPage() {
  return <AdminProductsPage initialView="import" />;
}
