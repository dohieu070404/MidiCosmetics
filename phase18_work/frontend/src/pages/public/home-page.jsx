import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { SectionHeading } from '@/components/brand/section-heading';
import { Container } from '@/components/common/container';
import { HorizontalScroller } from '@/components/common/horizontal-scroller';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fadeInUp, staggerContainer } from '@/lib/motion/animations';
import { formatVnd, mediaUrl, publicApi } from '@/lib/api/public-api';

function SkeletonCard() {
  return <div className="h-72 animate-pulse rounded-[1.75rem] bg-secondary/60" />;
}

function getSection(sections, type) {
  return sections.find((section) => section.type === type);
}

function SectionScroller({ section, eyebrow, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      <SectionHeading eyebrow={eyebrow} title={section.title} description={section.subtitle} align="center" />
      <HorizontalScroller className="mt-8 sm:mt-10 lg:mt-12" ariaLabel={section.title}>
        {items}
      </HorizontalScroller>
    </section>
  );
}

function ProductCard({ product }) {
  return (
    <Card className="h-full overflow-hidden bg-card/80 transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full flex-col p-0">
        <Link to={ROUTE_PATHS.productDetail(product.slug)} className="block overflow-hidden bg-secondary/40">
          <ImageWithFallback src={mediaUrl(product.mainImage || product.images?.[0])} alt={product.name} className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-105 sm:aspect-[5/4]" loading="lazy" />
        </Link>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-primary/80">{product.category?.name || product.brand?.name || 'Midi'}</p>
          <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{product.name}</h3>
          <p className="mt-2 font-medium text-primary">{product.formattedPrice || formatVnd(product.price, product.currency)}</p>
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">{product.shortDescription || product.description || ''}</p>
          <Link to={ROUTE_PATHS.productDetail(product.slug)} className="mt-auto pt-5 text-sm font-medium text-primary">Xem chi tiết</Link>
        </div>
      </CardContent>
    </Card>
  );
}

function BlogCard({ post }) {
  return (
    <Card className="h-full overflow-hidden bg-card/80 transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full flex-col p-0">
        {post.image ? <Link to={ROUTE_PATHS.blogDetail(post.slug)}><ImageWithFallback src={mediaUrl(post.image)} alt={post.title} className="aspect-[16/10] w-full object-cover" loading="lazy" /></Link> : null}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-primary/80">{post.category?.name || 'Blog làm đẹp'}</p>
          <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl"><Link to={ROUTE_PATHS.blogDetail(post.slug)}>{post.title}</Link></h3>
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
          <p className="mt-auto pt-5 text-xs text-muted-foreground">{post.readingMinutes || 1} phút đọc</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ category }) {
  return (
    <Card className="h-full bg-card/80">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Danh mục</p>
        <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">{category.name}</h3>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">{category.description || 'Khám phá sản phẩm phù hợp với nhu cầu làm đẹp của bạn.'}</p>
        <Button asChild variant="outline" className="mt-5 w-fit"><Link to={`${ROUTE_PATHS.products}?category=${category.slug}`}>Xem sản phẩm</Link></Button>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    publicApi.homepage().then((res) => setData(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => data?.sections?.length ? data.sections : [], [data]);
  const heroSection = getSection(sections, 'HERO');
  const featuredProducts = getSection(sections, 'FEATURED_PRODUCTS')?.items || data?.featuredProducts || [];
  const heroProduct = heroSection?.heroProduct || featuredProducts[0];
  const heroImage = heroSection ? (heroSection.config?.imageUrl || heroProduct?.mainImage || heroProduct?.images?.[0]) : '';

  return (
    <PageShell className="overflow-hidden py-10 sm:py-14 lg:py-20">
      <Container>
        {heroSection ? (
          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h1 variants={fadeInUp} className="max-w-4xl text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-7xl">{heroSection.title}</motion.h1>
              <motion.p variants={fadeInUp} className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{heroSection.subtitle}</motion.p>
              <motion.div variants={fadeInUp} className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                <Button asChild size="lg" className="w-full sm:w-auto"><Link to={heroSection.config?.ctaHref || ROUTE_PATHS.products}>{heroSection.config?.ctaLabel || 'Xem sản phẩm'} <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto"><Link to={heroSection.config?.secondaryHref || ROUTE_PATHS.blog}>{heroSection.config?.secondaryLabel || 'Đọc blog'}</Link></Button>
              </motion.div>
            </motion.div>
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl" />
              <Card className="relative overflow-hidden rounded-[1.75rem] bg-card/90 sm:rounded-[2rem]">
                <CardContent className="p-0">
                  <div className="flex flex-col justify-between bg-card p-5 sm:p-6">
                    {heroImage ? <>
                      <ImageWithFallback src={mediaUrl(heroImage)} alt={heroProduct?.name || heroSection.title} className="aspect-[4/5] w-full rounded-[1.5rem] object-cover sm:aspect-[4/3] lg:aspect-[5/4]" loading="eager" />
                      {heroProduct ? <div className="pt-5"><p className="text-xs uppercase tracking-[0.2em] text-primary/80">Sản phẩm nổi bật</p><h3 className="mt-2 line-clamp-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{heroProduct.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{heroProduct.shortDescription || heroProduct.description}</p></div> : null}
                    </> : <SkeletonCard />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        ) : null}

        {error ? <div className="mt-8 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}
        {loading ? <section className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((n) => <SkeletonCard key={n} />)}</section> : null}

        {sections.filter((section) => section.type !== 'HERO').map((section) => {
          if (section.type === 'FEATURED_PRODUCTS') return <SectionScroller key={section.id} section={section} eyebrow="Sản phẩm chọn lọc">{(section.items || []).map((product) => <ProductCard key={product.uuid || product.id} product={product} />)}</SectionScroller>;
          if (section.type === 'FEATURED_POSTS') return <SectionScroller key={section.id} section={section} eyebrow="Blog làm đẹp">{(section.items || []).map((post) => <BlogCard key={post.uuid || post.id} post={post} />)}</SectionScroller>;
          if (section.type === 'FEATURED_CATEGORIES') return <SectionScroller key={section.id} section={section} eyebrow="Danh mục">{(section.items || []).map((category) => <CategoryCard key={category.uuid || category.id} category={category} />)}</SectionScroller>;
          if (section.type === 'BRAND_INTRO') return <section key={section.id} className="mt-16 rounded-[1.75rem] border border-border bg-card/70 p-5 sm:mt-20 sm:p-8 lg:mt-24"><div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div><p className="text-xs uppercase tracking-[0.2em] text-primary/80">Midi Cosmetics</p><h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">{section.title}</h2><p className="mt-5 text-base leading-8 text-muted-foreground">{section.config?.body || section.subtitle}</p></div>{section.config?.imageUrl ? <ImageWithFallback src={mediaUrl(section.config.imageUrl)} alt={section.title} className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" /> : null}</div></section>;
          if (section.type === 'CUSTOM_TEXT') return <section key={section.id} className="mt-16 text-center sm:mt-20 lg:mt-24"><SectionHeading eyebrow="Midi" title={section.title} description={section.subtitle || section.config?.body} align="center" /></section>;
          return null;
        })}
      </Container>
    </PageShell>
  );
}
