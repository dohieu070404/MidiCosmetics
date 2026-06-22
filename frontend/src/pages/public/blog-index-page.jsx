import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionHeading } from '@/components/brand/section-heading';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { publicApi } from '@/lib/api/public-api';

function BlogCard({ post }) {
  return (
    <Card className="h-full overflow-hidden bg-card/80 transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full flex-col p-0">
        {post.featuredImage?.secureUrl ? <Link to={ROUTE_PATHS.blogDetail(post.slug)}><ImageWithFallback src={post.featuredImage.secureUrl} alt={post.title} className="aspect-[16/10] w-full object-cover" loading="lazy" /></Link> : null}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">{post.category?.name || 'Blog làm đẹp'}</p>
          <h2 className="mt-4 line-clamp-2 font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl"><Link to={ROUTE_PATHS.blogDetail(post.slug)}>{post.title}</Link></h2>
          <p className="mt-5 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
          <p className="mt-auto pt-5 text-xs text-muted-foreground">{post.readingMinutes} phút đọc · {post.viewCount} lượt xem</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BlogIndexPage() {
  const [params, setParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [tax, setTax] = useState({ blogCategories: [], blogTags: [] });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const tags = params.get('tags') || '';
  const sort = params.get('sort') || 'latest';
  const page = Number(params.get('page') || 1);

  const query = useMemo(() => ({ search, category, tags, sort, page, limit: 9 }), [search, category, tags, sort, page]);

  useEffect(() => { publicApi.taxonomies().then((res) => setTax(res.data)).catch(() => null); }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true); setError('');
      publicApi.listBlogs(query).then((res) => { setBlogs(res.data.blogs || []); setMeta(res.meta || {}); }).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const updateParam = useCallback((key, value, options = {}) => {
    setParams((currentParams) => {
      const next = new URLSearchParams(currentParams);
      if (value) next.set(key, value); else next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next;
    }, options);
  }, [setParams]);

  const [searchInput, setSearchInput] = useState(search);
  const isComposingSearchRef = useRef(false);

  useEffect(() => {
    if (!isComposingSearchRef.current) setSearchInput(search);
  }, [search]);

  const commitSearch = useCallback((value) => {
    updateParam('search', value.trim(), { replace: true });
  }, [updateParam]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    if (!isComposingSearchRef.current) commitSearch(value);
  };

  const handleSearchCompositionStart = () => {
    isComposingSearchRef.current = true;
  };

  const handleSearchCompositionEnd = (event) => {
    isComposingSearchRef.current = false;
    const value = event.currentTarget.value;
    setSearchInput(value);
    commitSearch(value);
  };

  return (
    <PageShell className="py-10 sm:py-14 lg:py-20">
      <Container>
        <SectionHeading eyebrow="Blog Midi Cosmetics" title="Cảm hứng làm đẹp thanh lịch cho mỗi ngày." description="Tìm bài viết theo chủ đề, tag hoặc từ khóa bạn quan tâm." />
        <div className="mt-8 grid gap-3 rounded-[1.75rem] border border-border bg-card/70 p-4 sm:mt-10 md:grid-cols-4">
          <input value={searchInput} onChange={handleSearchChange} onCompositionStart={handleSearchCompositionStart} onCompositionEnd={handleSearchCompositionEnd} placeholder="Tìm bài viết..." className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm md:col-span-2" />
          <select value={category} onChange={(e) => updateParam('category', e.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm"><option value="">Tất cả danh mục</option>{tax.blogCategories.map((item) => <option key={item.uuid} value={item.slug}>{item.name}</option>)}</select>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm"><option value="latest">Mới nhất</option><option value="popular">Nhiều lượt xem</option></select>
          <div className="flex gap-2 overflow-x-auto pb-1 md:col-span-4 md:flex-wrap md:overflow-visible">{tax.blogTags.map((tag) => <Button key={tag.uuid} size="sm" variant={tags === tag.slug ? 'default' : 'outline'} onClick={() => updateParam('tags', tags === tag.slug ? '' : tag.slug)}>{tag.name}</Button>)}</div>
        </div>
        {error ? <div className="mt-6 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        <div className="mt-6 text-sm text-muted-foreground">{loading ? 'Đang tải...' : `Có ${meta.total || blogs.length} bài viết`}</div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{loading ? [1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-80 animate-pulse rounded-[1.75rem] bg-secondary/60" />) : blogs.map((post) => <BlogCard key={post.uuid} post={post} />)}</div>
        {!loading && !blogs.length ? <div className="mt-8 rounded-[2rem] border border-dashed p-8 text-center text-muted-foreground sm:p-10">Chưa có bài viết phù hợp.</div> : null}
        <div className="mt-10 grid gap-3 sm:flex sm:items-center sm:justify-center"><Button variant="outline" disabled={!meta.hasPreviousPage} onClick={() => updateParam('page', String(Math.max(1, page - 1)))}>Trang trước</Button><span className="text-center text-sm text-muted-foreground">Trang {meta.page || page}/{meta.totalPages || 1}</span><Button variant="outline" disabled={!meta.hasNextPage} onClick={() => updateParam('page', String(page + 1))}>Trang sau</Button></div>
      </Container>
    </PageShell>
  );
}
