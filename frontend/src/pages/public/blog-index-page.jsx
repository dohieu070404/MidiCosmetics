import { ArrowRight, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { StatePanel } from '@/components/common/state-panel';
import { Button } from '@/components/ui/button';
import { publicApi } from '@/lib/api/public-api';

function BlogCard({ post, featured = false }) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(48,33,24,0.1)] ${featured ? 'grid border border-border/70 bg-secondary/45 lg:grid-cols-[1.2fr_.8fr]' : 'bg-card'}`}
    >
      <Link to={ROUTE_PATHS.blogDetail(post.slug)} className="block overflow-hidden bg-secondary">
        <ImageWithFallback
          src={post.featuredImage?.secureUrl || post.image}
          alt={post.title}
          className={`${featured ? 'h-full min-h-80' : 'aspect-[16/10]'} w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]`}
        />
      </Link>
      <div className={featured ? 'flex flex-col justify-center p-7 sm:p-10' : 'p-5'}>
        <p className="midi-eyebrow text-muted-foreground">
          {post.category?.name || 'Tạp chí Midi'} · {post.readingMinutes || 1} phút đọc
        </p>
        <h2
          className={`mt-3 font-display font-normal leading-[1.02] tracking-[-0.035em] ${featured ? 'text-4xl sm:text-5xl' : 'text-2xl'}`}
        >
          <Link to={ROUTE_PATHS.blogDetail(post.slug)}>{post.title}</Link>
        </h2>
        <p className="mt-4 line-clamp-3 text-base leading-7 text-muted-foreground">
          {post.excerpt}
        </p>
        <Link
          to={ROUTE_PATHS.blogDetail(post.slug)}
          className="midi-link-arrow mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]"
        >
          Đọc bài viết <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
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
  const query = useMemo(
    () => ({ search, category, tags, sort, page, limit: 9 }),
    [category, page, search, sort, tags],
  );
  const [searchInput, setSearchInput] = useState(search);
  const composing = useRef(false);
  const setParam = useCallback(
    (key, value) =>
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.set('page', '1');
        return next;
      }),
    [setParams],
  );
  useEffect(() => {
    publicApi
      .taxonomies()
      .then((response) => setTax(response.data))
      .catch(() => null);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      publicApi
        .listBlogs(query)
        .then((response) => {
          setBlogs(response.data.blogs || []);
          setMeta(response.meta || {});
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const featured = blogs[0];
  return (
    <div className="pb-24">
      <header className="bg-secondary/45 py-16 text-center sm:py-24">
        <Container>
          <p className="midi-eyebrow">Tạp chí Midi</p>
          <h1 className="mx-auto mt-5 max-w-4xl font-display text-5xl font-normal leading-[.96] tracking-[-0.06em] sm:text-7xl">
            Cảm hứng làm đẹp, đọc chậm và chọn kỹ.
          </h1>
        </Container>
      </header>
      <Container>
        <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm lg:grid-cols-[1fr_13rem_13rem]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                setParam('search', event.currentTarget.value.trim());
              }}
              onChange={(event) => {
                setSearchInput(event.target.value);
                if (!composing.current) setParam('search', event.target.value.trim());
              }}
              className="h-12 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-base outline-none transition-colors focus:border-primary"
              placeholder="Tìm bài viết..."
            />
          </label>
          <select
            value={category}
            onChange={(event) => setParam('category', event.target.value)}
            className="h-12 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">Mọi chủ đề</option>
            {tax.blogCategories?.map((item) => (
              <option key={item.uuid} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setParam('sort', event.target.value)}
            className="h-12 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="latest">Mới nhất</option>
            <option value="popular">Nhiều lượt xem</option>
          </select>
          <div className="flex gap-2 overflow-x-auto lg:col-span-3">
            {tax.blogTags?.map((tag) => (
              <button
                type="button"
                key={tag.uuid}
                onClick={() => setParam('tags', tags === tag.slug ? '' : tag.slug)}
                className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs uppercase tracking-[0.1em] transition-all ${tags === tag.slug ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary/50 hover:bg-secondary'}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <StatePanel
            type="error"
            title="Chưa tải được bài viết"
            description={error}
            className="mt-8"
          />
        ) : null}
        {loading ? <div className="mt-8 h-96 animate-pulse rounded-2xl bg-secondary" /> : null}
        {!loading && !error && featured ? (
          <>
            <div className="mt-10">
              <BlogCard post={featured} featured />
            </div>
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.slice(1).map((post) => (
                <BlogCard key={post.uuid} post={post} />
              ))}
            </div>
          </>
        ) : null}
        {!loading && !error && !blogs.length ? (
          <StatePanel
            title="Chưa có bài viết phù hợp"
            description="Hãy thử chủ đề hoặc từ khóa khác."
            className="mt-8"
          />
        ) : null}
        {meta.totalPages > 1 ? (
          <div className="mt-14 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={!meta.hasPreviousPage}
              onClick={() => setParam('page', String(page - 1))}
            >
              Trang trước
            </Button>
            <span className="text-sm text-muted-foreground">
              {meta.page}/{meta.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!meta.hasNextPage}
              onClick={() => setParam('page', String(page + 1))}
            >
              Trang sau
            </Button>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
