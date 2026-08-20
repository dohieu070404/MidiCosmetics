import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Container } from "@/components/common/container";
import { StatePanel } from "@/components/common/state-panel";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { Button } from "@/components/ui/button";
import { formatVnd, publicApi } from "@/lib/api/public-api";
import { useAppStore } from "@/stores/app-store";
import { useCartStore } from "@/stores/cart-store";

const has = (value) => value !== null && value !== undefined && String(value).trim() !== "";

function DetailBlock({ title, value, html = false }) {
  if (!has(value)) return null;
  return (
    <details className="group border-t border-border py-5" open>
      <summary className="cursor-pointer list-none font-display text-xl font-normal">{title}</summary>
      {html ? <div className="prose mt-4 max-w-none break-words text-[0.96rem] leading-7 text-muted-foreground" dangerouslySetInnerHTML={{ __html: value }} /> : <p className="mt-4 whitespace-pre-wrap text-[0.96rem] leading-7 text-muted-foreground">{value}</p>}
    </details>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const notify = useAppStore((state) => state.notify);
  const product = data?.product;

  useEffect(() => {
    let active = true;
    publicApi.getProduct(slug)
      .then((response) => {
        if (!active) return;
        setData(response.data);
        setError("");
        const item = response.data?.product;
        if (item) publicApi.trackInterest({ eventType: "PRODUCT_VIEWED", productUuid: item.uuid || item.id }).catch(() => null);
      })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [slug]);

  if (error && !product) return <Container className="py-16"><StatePanel type="error" title="Không mở được sản phẩm" description={error} /></Container>;
  if (!product) return <Container className="py-16"><StatePanel type="loading" title="Đang chuẩn bị sản phẩm" description="Một chút nữa thôi..." /></Container>;

  const images = product.images?.length ? product.images : [product.mainImage];
  const unavailable = product.status !== "ACTIVE" || Number(product.stock) === 0;
  const add = () => {
    if (unavailable) return;
    addItem(product, quantity);
    notify(`${product.name} đã được thêm vào giỏ.`);
    publicApi.trackInterest({ eventType: "ADDED_TO_CART", productUuid: product.uuid || product.id, metadata: { quantity } }).catch(() => null);
  };

  return (
    <div className="pb-24 lg:pb-36">
      <Container className="py-6 text-xs uppercase tracking-[0.1em] text-muted-foreground"><Link to={ROUTE_PATHS.products} className="transition-colors hover:text-foreground">Sản phẩm</Link> <span className="mx-2">/</span> {product.name}</Container>
      <Container className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <ProductGallery images={images} name={product.name} />
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="midi-eyebrow">{product.category?.name || product.brand?.name || "Midi Cosmetics"}</p>
          <h1 className="mt-5 font-display text-5xl font-normal leading-[.94] tracking-[-0.055em] sm:text-6xl">{product.name}</h1>
          <p className="mt-5 font-display text-2xl">{product.formattedPrice || formatVnd(product.price, product.currency)}</p>
          {product.shortDescription ? <p className="mt-6 text-base leading-8 text-muted-foreground">{product.shortDescription}</p> : null}
          <div className="mt-7 grid grid-cols-[auto_1fr] gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={product.stock ? Math.min(20, product.stock) : 20} />
            <Button type="button" onClick={add} disabled={unavailable} className="midi-link-arrow w-full">{unavailable ? "Tạm hết hàng" : "Thêm vào giỏ"} {!unavailable ? <ShoppingBag /> : null}</Button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Check className="size-4 text-primary" /> Không cần tài khoản · Tạo phiếu rồi gửi qua Messenger</p>
          <div className="mt-8">
            <DetailBlock title="Công dụng" value={product.benefits || product.description} html />
            <DetailBlock title="Loại da phù hợp" value={product.skinType} />
            <DetailBlock title="Thành phần" value={product.ingredients} html />
            <DetailBlock title="Cách sử dụng" value={product.howToUse} html />
            <DetailBlock title="Lưu ý" value={product.caution} />
          </div>
          <Button asChild variant="outline" className="midi-link-arrow mt-6"><Link to={ROUTE_PATHS.cart}>Xem giỏ và tạo phiếu <ArrowRight /></Link></Button>
        </div>
      </Container>
      {data.related?.length ? (
        <Container className="mt-24"><div className="flex items-end justify-between border-b border-border pb-7"><div><p className="midi-eyebrow">Có thể bạn sẽ thích</p><h2 className="mt-3 font-display text-4xl font-normal tracking-[-0.045em]">Sản phẩm liên quan</h2></div></div><div className="mt-8 grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{data.related.slice(0, 4).map((item) => <ProductCard key={item.uuid || item.id} product={item} />)}</div></Container>
      ) : null}
    </div>
  );
}
