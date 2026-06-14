import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin-api';
import { ActionButton, AdminTable, DangerButton, FileInput, Notice, PageHeader, SecondaryButton, SectionCard, TabButtons, TextArea, TextInput } from './admin-shared';

const initial = { name: '', description: '', logoUrl: '', country: '' };
const groups = [
  { value: 'blog', label: 'Danh mục blog' },
  { value: 'product', label: 'Danh mục sản phẩm' },
  { value: 'brand', label: 'Thương hiệu' },
  { value: 'tag', label: 'Thẻ blog' },
];

export function AdminTaxonomiesPage() {
  const [active, setActive] = useState('blog');
  const [blogCats, setBlogCats] = useState([]);
  const [prodCats, setProdCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [b, p, br, t] = await Promise.all([
      adminApi.listBlogCategories({ limit: 100 }),
      adminApi.listProductCategories({ limit: 100 }),
      adminApi.listProductBrands({ limit: 100 }),
      adminApi.listBlogTags({ limit: 100 }),
    ]);
    setBlogCats(b.data.categories || []);
    setProdCats(p.data.categories || []);
    setBrands(br.data.brands || []);
    setTags(t.data.tags || []);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminApi.listBlogCategories({ limit: 100 }),
      adminApi.listProductCategories({ limit: 100 }),
      adminApi.listProductBrands({ limit: 100 }),
      adminApi.listBlogTags({ limit: 100 }),
    ])
      .then(([b, p, br, t]) => {
        if (!mounted) return;
        setBlogCats(b.data.categories || []);
        setProdCats(p.data.categories || []);
        setBrands(br.data.brands || []);
        setTags(t.data.tags || []);
      })
      .catch((e) => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, []);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const apiFor = (type) => ({
    blog: { create: adminApi.createBlogCategory, update: adminApi.updateBlogCategory, del: adminApi.deleteBlogCategory, rows: blogCats },
    product: { create: adminApi.createProductCategory, update: adminApi.updateProductCategory, del: adminApi.deleteProductCategory, rows: prodCats },
    brand: { create: adminApi.createProductBrand, update: adminApi.updateProductBrand, del: adminApi.deleteProductBrand, rows: brands },
    tag: { create: adminApi.createBlogTag, update: adminApi.updateBlogTag, del: adminApi.deleteBlogTag, rows: tags },
  }[type]);

  const switchGroup = (type) => {
    setActive(type);
    setEditing(null);
    setForm(initial);
    setLogo(null);
    setError('');
    setOk('');
  };

  const edit = (type, row) => {
    setActive(type);
    setEditing(row.uuid);
    setForm({ name: row.name || '', description: row.description || '', logoUrl: row.logoUrl || '', country: row.country || '' });
    setLogo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditing(null);
    setForm(initial);
    setLogo(null);
  };

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOk('');
    try {
      const api = apiFor(active);
      let logoUrl = form.logoUrl;
      if (active === 'brand' && logo) {
        const fd = new FormData();
        fd.append('file', logo);
        fd.append('altText', form.name);
        const res = await adminApi.uploadImage(fd);
        logoUrl = res.data.media.secureUrl;
      }
      const payload = active === 'brand'
        ? { name: form.name, description: form.description || null, logoUrl: logoUrl || null, country: form.country || null }
        : active === 'tag'
          ? { name: form.name }
          : { name: form.name, description: form.description || null };
      if (editing) {
        await api.update(editing, payload);
        setOk('Đã cập nhật.');
      } else {
        await api.create(payload);
        setOk('Đã tạo.');
      }
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const current = apiFor(active);
  const activeLabel = groups.find((group) => group.value === active)?.label;

  return (
    <div className="grid gap-6">
      <PageHeader title="Danh mục và thương hiệu" description="" />
      <Notice>{error}</Notice>
      <Notice type="success">{ok}</Notice>
      <TabButtons value={active} onChange={switchGroup} items={groups} />
      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <SectionCard title={editing ? `Sửa ${activeLabel}` : `Tạo ${activeLabel}`} description={active === 'brand' ? 'Có thể nhập URL logo hoặc tải logo lên.' : 'Đường dẫn sẽ tự tạo từ tên nếu để trống.'}>
          <form onSubmit={submit} className="grid gap-4">
            <TextInput label="Tên" name="name" value={form.name} onChange={set} required />
            {active === 'brand' ? <><TextInput label="Quốc gia" name="country" value={form.country} onChange={set} /><FileInput label="Tải logo thương hiệu lên" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogo(e.target.files?.[0] || null)} hint={form.logoUrl ? 'Đang có logo. Upload file mới nếu muốn thay.' : ''} /></> : null}
            {active !== 'tag' ? <TextArea label="Mô tả" name="description" value={form.description} onChange={set} /> : null}
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={loading}>{loading ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}</ActionButton>
              {editing ? <SecondaryButton type="button" onClick={reset}>Huỷ sửa</SecondaryButton> : null}
            </div>
          </form>
        </SectionCard>
        <SectionCard title={`Danh sách ${activeLabel}`} description="">
          <AdminTable
            columns={[
              { key: 'name', label: 'Tên' },
              { key: 'slug', label: 'Slug' },
              ...(active === 'brand' ? [{ key: 'logoUrl', label: 'Logo', render: (r) => r.logoUrl ? <span className="text-emerald-700">Có logo</span> : '-' }, { key: 'country', label: 'Quốc gia' }] : []),
            ]}
            rows={current.rows}
            actions={(r) => <div className="flex flex-wrap gap-2"><SecondaryButton type="button" onClick={() => edit(active, r)}>Sửa</SecondaryButton><DangerButton type="button" onClick={() => confirm('Xoá mềm mục này?') && current.del(r.uuid).then(load)}>Xoá</DangerButton></div>}
          />
        </SectionCard>
      </div>
    </div>
  );
}
