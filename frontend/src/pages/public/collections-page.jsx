import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { StatePanel } from '@/components/common/state-panel';
import { ProductCard } from '@/components/commerce/product-card';
import { DEFAULT_COLLECTIONS } from '@/data/default-content';
import { publicApi } from '@/lib/api/public-api';

export function CollectionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    publicApi
      .listCollections({ limit: 24 })
      .then((response) => setItems(response.data.collections || []))
      .catch(() => setItems(DEFAULT_COLLECTIONS))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="pb-24">
      <header className="bg-secondary/45 py-16 text-center sm:py-24">
        <Container>
          <p className="midi-eyebrow">Curated by MIDI</p>
          <h1 className="mx-auto mt-5 max-w-4xl font-display text-6xl font-normal leading-[.94] tracking-[-0.06em] sm:text-7xl">
            Collections
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-muted-foreground">
            Những lựa chọn được gom theo một nhu cầu, một mùa hoặc một tâm trạng.
          </p>
        </Container>
      </header>
      <Container className="mt-10 grid gap-6 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-96 animate-pulse bg-secondary" />
            ))
          : items.map((item) => (
              <Link
                key={item.uuid || item.slug}
                to={ROUTE_PATHS.collectionDetail(item.slug)}
                className="group relative min-h-96 overflow-hidden bg-secondary"
              >
                <ImageWithFallback
                  src={item.coverImage || item.coverMedia?.secureUrl}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-7 bottom-7 text-white">
                  <p className="midi-eyebrow text-white/65">MIDI Collection</p>
                  <h2 className="mt-3 font-display text-4xl font-normal tracking-[-0.04em]">
                    {item.name}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                    {item.description}
                  </p>
                  <span className="midi-link-arrow mt-4 inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em]">
                    Khám phá <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
      </Container>
    </div>
  );
}

export function CollectionDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    publicApi
      .getCollection(slug)
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message));
  }, [slug]);
  if (error)
    return (
      <Container className="py-16">
        <StatePanel type="error" title="Không tìm thấy collection" description={error} />
      </Container>
    );
  if (!data)
    return (
      <Container className="py-16">
        <StatePanel type="loading" title="Đang mở collection" />
      </Container>
    );
  const collection = data.collection || data;
  const products = data.products || collection.products || [];
  return (
    <div className="pb-24">
      <header className="relative min-h-[28rem] overflow-hidden bg-secondary">
        <ImageWithFallback
          src={collection.coverImage || collection.coverMedia?.secureUrl}
          alt={collection.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <Container className="relative flex min-h-[28rem] flex-col justify-end py-12 text-white">
          <p className="midi-eyebrow text-white/65">MIDI Collection</p>
          <h1 className="mt-4 font-display text-6xl font-normal tracking-[-0.055em] sm:text-7xl">
            {collection.name}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/75">{collection.description}</p>
        </Container>
      </header>
      <Container className="mt-12">
        <p className="midi-eyebrow">{products.length} sản phẩm</p>
        {products.length ? (
          <div className="mt-7 grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.uuid || product.id} product={product.product || product} />
            ))}
          </div>
        ) : (
          <StatePanel
            title="Collection đang được cập nhật"
            description="Hãy quay lại sau để xem các sản phẩm được tuyển chọn."
            className="mt-8"
          />
        )}
      </Container>
    </div>
  );
}
