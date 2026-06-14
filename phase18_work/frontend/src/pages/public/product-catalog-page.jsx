import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionHeading } from '@/components/brand/section-heading';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { PageShell } from '@/components/common/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { formatVnd, publicApi } from '@/lib/api/public-api';

const getPublicProductImage = (product) => product.mainImage || product.images?.[0] || null;

function ProductCard({ product }) {
  return (
    <Card className="group h-full overflow-hidden bg-card/80 transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full flex-col p-0">
        <Link to={ROUTE_PATHS.productDetail(product.slug)} className="block overflow-hidden bg-secondary/40">
          <ImageWithFallback src={getPublicProductImage(product)} alt={product.name} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-[5/4]" loading="lazy" />
        </Link>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="max-w-full truncate">{product.category?.name || 'Midi'}</Badge>
            <span className="text-sm font-semibold text-primary">{product.formattedPrice || formatVnd(product.price, product.currency)}</span>
          </div>
          <h2 className="mt-4 line-clamp-2 font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl"><Link to={ROUTE_PATHS.productDetail(product.slug)}>{product.name}</Link></h2>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{product.brand?.name || 'Chưa có thương hiệu'}</p>
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">{product.shortDescription || product.description || 'Đang cập nhật mô tả.'}</p>
          <Button asChild variant="outline" className="mt-auto w-full sm:w-fit"><Link to={ROUTE_PATHS.productDetail(product.slug)}>Xem chi tiết</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductCatalogPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [tax, setTax] = useState({ productCategories: [], productBrands: [] });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const sort = params.get('sort') || 'latest';
  const page = Number(params.get('page') || 1);
  const query = useMemo(() => ({ search, category, brand, sort, page, limit: 12 }), [search, category, brand, sort, page]);

  useEffect(() => { publicApi.taxonomies().then((res) => setTax(res.data)).catch(() => null); }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      publicApi.listProducts(query)
        .then((res) => { setProducts(res.data.products || []); setMeta(res.meta || {}); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  };

  return (
    <PageShell className="py-10 sm:py-14 lg:py-20">
      <Container>
        <SectionHeading eyebrow="Sản phẩm Midi Cosmetics" title="Danh sách sản phẩm Midi Cosmetics." description="Tìm sản phẩm theo danh mục, thương hiệu hoặc mức giá." />
        <div className="mt-8 grid gap-3 rounded-[1.75rem] border border-border bg-card/70 p-4 sm:mt-10 md:grid-cols-4">
          <input value={search} onChange={(e) => updateParam('search', e.target.value)} placeholder="Tìm sản phẩm..." className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm md:col-span-2" />
          <select value={category} onChange={(e) => updateParam('category', e.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm"><option value="">Tất cả danh mục</option>{(tax.productCategories || []).map((item) => <option key={item.uuid || item.slug} value={item.slug}>{item.name}</option>)}</select>
          <select value={brand} onChange={(e) => updateParam('brand', e.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm"><option value="">Tất cả thương hiệu</option>{(tax.productBrands || []).map((item) => <option key={item.uuid || item.slug} value={item.slug}>{item.name}</option>)}</select>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm md:col-span-2"><option value="latest">Mới nhất</option><option value="popular">Phổ biến</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option><option value="name_asc">Tên A-Z</option></select>
        </div>
        {error ? <div className="mt-6 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        <div className="mt-6 text-sm text-muted-foreground">{loading ? 'Đang tải...' : `Đang hiển thị ${products.length}/${meta.total || products.length} sản phẩm`}</div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? [1,2,3,4,5,6,7,8].map((n) => <div key={n} className="h-96 animate-pulse rounded-[1.75rem] bg-secondary/60" />) : products.map((product) => <ProductCard key={product.uuid || product.id} product={product} />)}
        </div>
        {!loading && !products.length ? <div className="mt-8 rounded-[2rem] border border-dashed p-8 text-center text-muted-foreground sm:p-10">Chưa có sản phẩm phù hợp.</div> : null}
        <div className="mt-10 grid gap-3 sm:flex sm:items-center sm:justify-center"><Button variant="outline" disabled={!meta.hasPreviousPage} onClick={() => updateParam('page', String(Math.max(1, page - 1)))}>Trang trước</Button><span className="text-center text-sm text-muted-foreground">Trang {meta.page || page}/{meta.totalPages || 1}</span><Button variant="outline" disabled={!meta.hasNextPage} onClick={() => updateParam('page', String(page + 1))}>Trang sau</Button></div>
      </Container>
    </PageShell>
  );
}
