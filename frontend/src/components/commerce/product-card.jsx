import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { formatVnd, publicApi } from '@/lib/api/public-api';
import { useAppStore } from '@/stores/app-store';
import { useCartStore } from '@/stores/cart-store';

export function ProductCard({ product, priority = false }) {
  const addItem = useCartStore((state) => state.addItem);
  const notify = useAppStore((state) => state.notify);
  const image = product.mainImage || product.images?.[0];
  const unavailable = product.status === 'INACTIVE' || Number(product.stock) === 0;

  const add = () => {
    if (unavailable) return;
    addItem(product);
    notify(`${product.name} đã được thêm vào giỏ.`);
    publicApi
      .trackInterest({ eventType: 'ADDED_TO_CART', productUuid: product.uuid || product.id })
      .catch(() => null);
  };

  return (
    <article className="beauty-card group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-2.5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_55px_rgba(70,43,35,0.12)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary/70">
        <Link
          to={ROUTE_PATHS.productDetail(product.slug)}
          className="absolute inset-0 block"
          aria-label={`Xem ${product.name}`}
        >
          <ImageWithFallback
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
            loading={priority ? 'eager' : 'lazy'}
          />
        </Link>
        <button
          type="button"
          onClick={add}
          disabled={unavailable}
          className="absolute inset-x-3 bottom-3 flex min-h-11 translate-y-0 items-center justify-between rounded-xl border border-white/70 bg-[#2b211cdb] px-4 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white opacity-100 shadow-lg backdrop-blur-md transition-all duration-300 disabled:cursor-not-allowed disabled:bg-[#574d47cc] sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          {unavailable ? 'Tạm hết hàng' : 'Thêm vào giỏ'}{' '}
          {!unavailable ? <Plus className="size-4" /> : null}
        </button>
      </div>
      <div className="grid min-h-40 flex-1 grid-cols-[1fr_auto] gap-4 px-2 pb-3 pt-5">
        <div className="min-w-0">
          <p className="midi-eyebrow truncate text-muted-foreground">
            {product.category?.name || product.brand?.name || 'Midi Cosmetics'}
          </p>
          <h2 className="mt-2 font-display text-[1.3rem] font-normal leading-[1.22] tracking-[-0.02em]">
            <Link to={ROUTE_PATHS.productDetail(product.slug)}>{product.name}</Link>
          </h2>
          <Link
            to={ROUTE_PATHS.productDetail(product.slug)}
            className="midi-link-arrow mt-3 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.09em] text-muted-foreground hover:text-primary"
          >
            Xem sản phẩm <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <strong className="pt-0.5 text-[0.84rem] font-semibold">
          {product.formattedPrice || formatVnd(product.price, product.currency)}
        </strong>
      </div>
    </article>
  );
}
