import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '@/components/common/container';
import { HorizontalScroller } from '@/components/common/horizontal-scroller';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { PageShell } from '@/components/common/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { formatVnd, publicApi } from '@/lib/api/public-api';

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const DetailSection = ({ title, children, html }) => {
  if (!hasValue(html || children)) return null;
  return (
    <section className="rounded-[1.75rem] border border-border bg-card/70 p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {html ? (
        <div className="prose prose-sm mt-4 max-w-none break-words leading-8 text-muted-foreground prose-p:my-3 prose-ul:my-3 prose-li:my-1 dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{children}</p>
      )}
    </section>
  );
};

const getProductImages = (product) => {
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  if (images.length) return images;
  return [product.mainImage || null];
};

function RelatedProductCard({ item }) {
  return (
    <Card className="h-full overflow-hidden bg-card/80">
      <CardContent className="flex h-full flex-col p-0">
        <Link to={ROUTE_PATHS.productDetail(item.slug)}><ImageWithFallback src={item.mainImage || item.images?.[0]} alt={item.name} className="aspect-[4/5] w-full object-cover sm:aspect-square" loading="lazy" /></Link>
        <div className="flex flex-1 flex-col p-4">
          <Link to={ROUTE_PATHS.productDetail(item.slug)} className="line-clamp-2 font-medium leading-snug">{item.name}</Link>
          <p className="mt-2 text-sm text-primary">{item.formattedPrice || formatVnd(item.price, item.currency)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    publicApi.getProduct(slug)
      .then((res) => { if (alive) { setData(res.data); setError(''); setSelected(0); } })
      .catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, [slug]);

  if (error) return <PageShell><Container><div className="rounded-2xl bg-destructive/10 p-4 text-destructive">{error}</div></Container></PageShell>;
  if (!data?.product) return <PageShell><Container><div className="h-96 animate-pulse rounded-[2rem] bg-secondary/60" /></Container></PageShell>;

  const product = data.product;
  const images = getProductImages(product);

  return (
    <PageShell className="py-10 sm:py-14 lg:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <ImageWithFallback src={images[selected]} alt={product.name} className="aspect-square w-full rounded-[1.75rem] object-cover sm:rounded-[2rem]" />
            {images.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button key={`${image || 'placeholder'}-${index}`} type="button" onClick={() => setSelected(index)} className={`min-w-20 overflow-hidden rounded-2xl border ${selected === index ? 'border-primary' : 'border-border'}`}>
                    <ImageWithFallback src={image} alt={product.name} className="aspect-square w-20 object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="min-w-0 lg:pt-4">
            <Badge variant="luxury">{product.category?.name || product.brand?.name || 'Midi Cosmetics'}</Badge>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{product.name}</h1>
            <p className="mt-4 text-2xl font-semibold text-primary sm:text-3xl">{product.formattedPrice || formatVnd(product.price, product.currency)}</p>
            {product.description ? (
              <div className="prose prose-sm mt-6 max-w-none break-words leading-8 text-muted-foreground prose-p:my-3 dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="mt-6 whitespace-pre-wrap break-words text-base leading-8 text-muted-foreground">Đang cập nhật mô tả sản phẩm.</p>
            )}
            <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-border bg-card/60 p-4 text-sm sm:grid-cols-2">
              <div><span className="font-medium">Thương hiệu:</span> {product.brand?.name || '-'}</div>
              <div><span className="font-medium">Danh mục:</span> {product.category?.name || '-'}</div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:mt-14 lg:grid-cols-2">
          <DetailSection title="Công dụng">{product.benefits}</DetailSection>
          <DetailSection title="Loại da phù hợp">{product.skinType}</DetailSection>
          <DetailSection title="Thành phần" html={product.ingredients} />
          <DetailSection title="Cách sử dụng" html={product.howToUse} />
          <DetailSection title="Lưu ý sử dụng">{product.caution}</DetailSection>
        </div>

        {(data.related || []).length ? (
          <section className="mt-14 lg:mt-16">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Sản phẩm liên quan</h2>
            <HorizontalScroller className="mt-6" itemClassName="min-w-[62%] sm:min-w-[34%] lg:min-w-[23%]" ariaLabel="Sản phẩm liên quan">
              {(data.related || []).map((item) => <RelatedProductCard key={item.uuid || item.id} item={item} />)}
            </HorizontalScroller>
          </section>
        ) : null}
      </Container>
    </PageShell>
  );
}
