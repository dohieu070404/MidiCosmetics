import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api/admin-api';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { validateLocalImageFile } from '@/lib/media';
import { ActionButton, AdminTable, DangerButton, FileInput, Notice, NumberInput, PageHeader, RequiredNote, SecondaryButton, SectionCard, SelectInput, RichTextEditor, StatusBadge, TabButtons, TextArea, TextInput, Toolbar, formatDate, normalizeIntegerInput } from './admin-shared';

const initial = { title: '', categoryUuid: '', featuredImageUuid: '', excerpt: '', content: '', status: 'DRAFT', tagUuids: [], isFeatured: false, featuredOrder: '0' };
const contentText = (html = '') => String(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
const clean = (form) => ({
  ...form,
  categoryUuid: form.categoryUuid || null,
  featuredImageUuid: form.featuredImageUuid || null,
  excerpt: form.excerpt || null,
  isFeatured: Boolean(form.isFeatured),
  featuredOrder: normalizeIntegerInput(form.featuredOrder) ?? 0,
});

export function AdminPostsPage() {
  const [view, setView] = useState('list');
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState('');

  const load = async () => {
    const [p, c, t] = await Promise.all([
      adminApi.listBlogPosts({ limit: 100, search, status: statusFilter }),
      adminApi.listBlogCategories({ limit: 100 }),
      adminApi.listBlogTags({ limit: 100 }),
    ]);
    setPosts(p.data.posts || []);
    setCategories(c.data.categories || []);
    setTags(t.data.tags || []);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminApi.listBlogPosts({ limit: 100, search, status: statusFilter }),
      adminApi.listBlogCategories({ limit: 100 }),
      adminApi.listBlogTags({ limit: 100 }),
    ])
      .then(([p, c, t]) => {
        if (!mounted) return;
        setPosts(p.data.posts || []);
        setCategories(c.data.categories || []);
        setTags(t.data.tags || []);
      })
      .catch((e) => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [search, statusFilter]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleTag = (uuid) => setForm((old) => ({ ...old, tagUuids: old.tagUuids.includes(uuid) ? old.tagUuids.filter((item) => item !== uuid) : [...old.tagUuids, uuid] }));
  const thumbnailPreview = useMemo(() => (thumbnail ? URL.createObjectURL(thumbnail) : currentThumbnailUrl), [thumbnail, currentThumbnailUrl]);
  useEffect(() => () => { if (thumbnail && thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); }, [thumbnail, thumbnailPreview]);

  const uploadThumbnail = async () => {
    if (!thumbnail) return form.featuredImageUuid || null;
    const fileError = validateLocalImageFile(thumbnail, 'Ảnh đại diện');
    if (fileError) throw new Error(fileError);
    const fd = new FormData(); fd.append('file', thumbnail); fd.append('altText', form.title);
    const res = await adminApi.uploadImage(fd); return res.data.media.uuid;
  };

  const uploadInlineBlogImage = async (file) => {
    const fileError = validateLocalImageFile(file, 'Ảnh trong bài viết');
    if (fileError) throw new Error(fileError);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('altText', form.title || 'Ảnh trong bài viết');
    const res = await adminApi.uploadImage(fd);
    return res.data.media.secureUrl;
  };

  const openCreate = () => { setEditing(null); setForm(initial); setThumbnail(null); setCurrentThumbnailUrl(''); setError(''); setOk(''); setView('form'); };
  const edit = (r) => {
    setEditing(r.uuid);
    setThumbnail(null);
    setCurrentThumbnailUrl(r.featuredImage?.secureUrl || '');
    setForm({
      title: r.title || '',
      categoryUuid: r.category?.uuid || '',
      featuredImageUuid: r.featuredImage?.uuid || '',
      excerpt: r.excerpt || '',
      content: r.content || '',
      status: r.status || 'DRAFT',
      tagUuids: (r.tags || []).map((item) => item.tag?.uuid).filter(Boolean),
      isFeatured: Boolean(r.isFeatured),
      featuredOrder: String(r.featuredOrder ?? 0),
    });
    setView('form'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancel = () => { setEditing(null); setForm(initial); setThumbnail(null); setCurrentThumbnailUrl(''); setView('list'); };

  async function submit(e) {
    e.preventDefault(); setLoading(true); setError(''); setOk('');
    try {
      if (!form.title.trim()) throw new Error('Vui lòng nhập tiêu đề bài viết.');
      if (!contentText(form.content)) throw new Error('Vui lòng nhập nội dung bài viết.');
      const featuredImageUuid = await uploadThumbnail();
      const payload = clean({ ...form, featuredImageUuid });
      if (editing) { await adminApi.updateBlogPost(editing, payload); setOk('Đã cập nhật bài viết.'); }
      else { await adminApi.createBlogPost(payload); setOk('Đã tạo bài viết.'); }
      await load(); cancel();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const toggleFeatured = async (r) => {
    setError(''); setOk('');
    try {
      const next = !r.isFeatured;
      await adminApi.updateBlogPostFeatured(r.uuid, { isFeatured: next, featuredOrder: r.featuredOrder || 0 });
      setOk(next ? 'Đã bật bài viết đề xuất trang chủ.' : 'Đã tắt bài viết đề xuất trang chủ.');
      await load();
    } catch (err) { setError(err.message); }
  };

  return <div className="grid gap-6">
    <PageHeader title="Quản lý bài viết" description="Viết bài, xuất bản và bật/tắt bài viết đề xuất trang chủ ngay trong bảng." actions={<><SecondaryButton type="button" onClick={() => setView('list')}>Danh sách</SecondaryButton><ActionButton type="button" onClick={openCreate}>+ Viết bài</ActionButton></>} />
    <Notice>{error}</Notice><Notice type="success">{ok}</Notice>
    <TabButtons value={view} onChange={(next) => next === 'form' && !editing ? openCreate() : setView(next)} items={[{ value: 'list', label: 'Bài viết' }, { value: 'form', label: editing ? 'Sửa bài' : 'Viết bài' }]} />

    {view === 'form' ? <SectionCard title={editing ? 'Sửa bài viết' : 'Viết bài mới'} actions={<SecondaryButton type="button" onClick={cancel}>Quay lại</SecondaryButton>}>
      <form onSubmit={submit} className="grid gap-5">
        <RequiredNote />
        <SectionCard title="Thông tin bài viết">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Tiêu đề" name="title" value={form.title} onChange={set} required />
            <SelectInput label="Danh mục" name="categoryUuid" value={form.categoryUuid} onChange={set}><option value="">Không chọn</option>{categories.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}</SelectInput>
            <SelectInput label="Trạng thái" name="status" value={form.status} onChange={set}><option value="DRAFT">Nháp</option><option value="PUBLISHED">Đăng bài</option><option value="ARCHIVED">Ẩn</option></SelectInput>
            <FileInput label="Ảnh cover" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0] || null; const fileError = validateLocalImageFile(file, 'Ảnh đại diện'); if (fileError) { setError(fileError); e.target.value = ''; setThumbnail(null); return; } setError(''); setThumbnail(file); }} hint="Chỉ hỗ trợ JPG, PNG, WEBP, tối đa 5MB. Chọn ảnh mới nếu muốn thay ảnh hiện tại." />
          </div>
          {thumbnailPreview ? <div className="mt-4 rounded-2xl border border-border p-3"><p className="mb-2 text-sm font-medium">Ảnh cover đang chọn</p><ImageWithFallback src={thumbnailPreview} alt={form.title || 'Ảnh bài viết'} className="max-h-64 w-full rounded-xl object-cover" /></div> : null}
        </SectionCard>

        <SectionCard title="Nội dung">
          <div className="grid gap-4">
            <TextArea label="Tóm tắt" name="excerpt" value={form.excerpt} onChange={set} />
            <RichTextEditor label="Nội dung" value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} onUploadImage={uploadInlineBlogImage} required hint="Dùng toolbar để định dạng. Khi dán nội dung từ bên ngoài, hệ thống chỉ lấy text để tránh HTML độc hại; backend vẫn sanitize trước khi lưu." />
          </div>
        </SectionCard>

        <SectionCard title="Đề xuất trang chủ và tag">
          <div className="grid gap-4 md:grid-cols-2">
            <NumberInput label="Thứ tự đề xuất" name="featuredOrder" value={form.featuredOrder} onChange={set} />
            <label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={set} />Hiển thị ở trang chủ</label>
          </div>
          <div className="mt-4 grid gap-2"><p className="text-sm font-medium">Tags</p><div className="flex flex-wrap gap-2">{tags.length ? tags.map((tag) => <label key={tag.uuid} className="rounded-full border border-border px-3 py-2 text-sm"><input type="checkbox" checked={form.tagUuids.includes(tag.uuid)} onChange={() => toggleTag(tag.uuid)} className="mr-2" />{tag.name}</label>) : <p className="text-sm text-muted-foreground">Chưa có tag.</p>}</div></div>
        </SectionCard>

        {editing && form.status === 'PUBLISHED' ? <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm">Bài đã đăng có thể xem công khai tại <a className="font-semibold text-primary underline" href={`/blog/${posts.find((item) => item.uuid === editing)?.slug || ''}`} target="_blank" rel="noreferrer">trang public</a>.</div> : null}
        <div className="flex flex-wrap gap-2"><ActionButton disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu bài viết'}</ActionButton><SecondaryButton type="button" onClick={cancel}>Hủy</SecondaryButton></div>
      </form>
    </SectionCard> : null}

    {view === 'list' ? <SectionCard title="Danh sách bài viết" description="Bài nháp hoặc đã ẩn sẽ không hiển thị public dù được đánh dấu đề xuất.">
      <div className="grid gap-4"><Toolbar><TextInput label="Tìm kiếm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tiêu đề hoặc tóm tắt" /><SelectInput label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Tất cả</option><option value="DRAFT">Nháp</option><option value="PUBLISHED">Đã đăng</option><option value="ARCHIVED">Đã ẩn</option></SelectInput><div className="flex items-end"><ActionButton type="button" onClick={openCreate} className="w-full">+ Viết bài</ActionButton></div></Toolbar>
      <AdminTable empty="Chưa có bài viết phù hợp bộ lọc." columns={[{ key: 'image', label: 'Ảnh', render: (r) => <ImageWithFallback src={r.featuredImage?.secureUrl} alt={r.title} className="h-12 w-12 rounded-xl object-cover" /> }, { key: 'title', label: 'Tiêu đề' }, { key: 'category', label: 'Danh mục', render: (r) => r.category?.name || '-' }, { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge>{r.status}</StatusBadge> }, { key: 'featured', label: 'Đề xuất', render: (r) => r.isFeatured ? '★ Trang chủ' : '—' }, { key: 'createdAt', label: 'Ngày tạo', render: (r) => formatDate(r.createdAt) }]} rows={posts} actions={(r) => <div className="flex flex-wrap gap-2"><SecondaryButton type="button" onClick={() => toggleFeatured(r)}>{r.isFeatured ? '★ Bỏ đề xuất' : '☆ Đề xuất'}</SecondaryButton><SecondaryButton type="button" onClick={() => edit(r)}>Sửa</SecondaryButton>{r.status === 'PUBLISHED' ? <SecondaryButton type="button" onClick={() => adminApi.unpublishBlogPost(r.uuid).then(load)}>Chuyển nháp</SecondaryButton> : <ActionButton type="button" onClick={() => adminApi.publishBlogPost(r.uuid).then(load)}>Đăng</ActionButton>}<SecondaryButton type="button" onClick={() => adminApi.archiveBlogPost(r.uuid).then(load)}>Ẩn</SecondaryButton><DangerButton type="button" onClick={() => confirm('Xóa bài viết này?') && adminApi.deleteBlogPost(r.uuid).then(load)}>Xóa</DangerButton></div>} /></div>
    </SectionCard> : null}
  </div>;
}
