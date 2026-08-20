import { SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ProductCard } from "@/components/commerce/product-card";
import { Container } from "@/components/common/container";
import { Reveal } from "@/components/common/reveal";
import { StatePanel } from "@/components/common/state-panel";
import { Button } from "@/components/ui/button";
import { HERO_PRODUCT_GROUPS, PRODUCT_GROUP_BY_ID, getProductGroupCategorySlugs } from "@/constants/product-taxonomy";
import { publicApi } from "@/lib/api/public-api";
import { cn } from "@/lib/utils";

export function ProductCatalogPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [tax, setTax] = useState({ productCategories: [], productBrands: [] });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const search = params.get("search") || "";
  const group = params.get("group") || "";
  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const sort = params.get("sort") || "latest";
  const page = Number(params.get("page") || 1);
  const query = useMemo(() => ({ search, group, category, brand, sort, page, limit: 12 }), [brand, category, group, page, search, sort]);
  const activeGroup = PRODUCT_GROUP_BY_ID[group];
  const composing = useRef(false);
  const [searchInput, setSearchInput] = useState(search);

  const categoryOptions = useMemo(() => {
    if (!group) return tax.productCategories || [];
    const allowed = new Set(getProductGroupCategorySlugs(group));
    return (tax.productCategories || []).filter((item) => allowed.has(item.slug));
  }, [group, tax.productCategories]);

  useEffect(() => { publicApi.taxonomies().then((response) => setTax(response.data)).catch(() => null); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      publicApi.listProducts(query)
        .then((response) => { setProducts(response.data.products || []); setMeta(response.meta || {}); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => { if (!composing.current) setSearchInput(search); }, [search]);

  const setParam = useCallback((key, value) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.set("page", "1");
    return next;
  }), [setParams]);

  const selectGroup = useCallback((value) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set("group", value); else next.delete("group");
    next.delete("category");
    next.delete("search");
    next.set("page", "1");
    return next;
  }), [setParams]);

  const hasFilters = Boolean(search || group || category || brand || sort !== "latest");

  return (
    <div className="pb-24 lg:pb-36">
      <header className="border-b border-border bg-secondary/45 py-14 text-center sm:py-20">
        <Container>
          <Reveal>
            <p className="midi-eyebrow">MIDI Selection</p>
            <h1 className="mx-auto mt-5 max-w-4xl font-display text-[clamp(2.8rem,6vw,5.5rem)] font-normal leading-[.96] tracking-[-0.052em]">{activeGroup ? activeGroup.label : "Sản phẩm được chọn kỹ, để bạn chọn dễ hơn."}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-[0.98rem] leading-7 text-muted-foreground">{activeGroup?.description || "Tìm theo nhu cầu, danh mục hoặc thương hiệu. Không cần đăng nhập để thêm vào giỏ."}</p>
          </Reveal>
        </Container>
      </header>

      <Container>
        <div className="-mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Nhóm sản phẩm chính">
          {HERO_PRODUCT_GROUPS.map((item) => {
            const selected = group === item.id;
            return <button type="button" role="tab" aria-selected={selected} key={item.id} onClick={() => selectGroup(selected ? "" : item.id)} className={cn("min-h-14 rounded-xl border px-3 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.075em] shadow-sm transition-all duration-300 sm:text-[0.8rem]", selected ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/45 hover:text-primary")}>{item.label}</button>;
          })}
        </div>

        <div className="sticky top-[4.5rem] z-20 -mx-4 mt-7 border-y border-border bg-background/96 px-4 py-4 backdrop-blur-xl lg:top-[6.35rem] lg:mx-0 lg:grid lg:grid-cols-[minmax(16rem,1fr)_repeat(3,12rem)] lg:gap-2 lg:rounded-xl lg:border lg:px-3">
          <label className="relative block"><span className="sr-only">Tìm sản phẩm</span><input value={searchInput} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={(event) => { composing.current = false; setParam("search", event.currentTarget.value.trim()); }} onChange={(event) => { setSearchInput(event.target.value); if (!composing.current) setParam("search", event.target.value.trim()); }} placeholder="Tìm sản phẩm..." className="h-12 w-full rounded-lg border border-input bg-card px-4 text-[0.92rem] outline-none transition-colors focus:border-primary" />{searchInput ? <button type="button" onClick={() => { setSearchInput(""); setParam("search", ""); }} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-secondary" aria-label="Xóa từ khóa"><X className="size-4" /></button> : null}</label>
          <div className="mt-2 grid grid-cols-2 gap-2 lg:mt-0 lg:contents">
            <select value={category} onChange={(event) => setParam("category", event.target.value)} className="h-12 rounded-lg border border-input bg-card px-3 text-[0.8rem] outline-none transition-colors focus:border-primary"><option value="">{activeGroup ? `Mọi mục ${activeGroup.label.toLowerCase()}` : "Mọi danh mục"}</option>{categoryOptions.map((item) => <option key={item.uuid || item.slug} value={item.slug}>{item.name}</option>)}</select>
            <select value={brand} onChange={(event) => setParam("brand", event.target.value)} className="h-12 rounded-lg border border-input bg-card px-3 text-[0.8rem] outline-none transition-colors focus:border-primary"><option value="">Mọi thương hiệu</option>{tax.productBrands?.map((item) => <option key={item.uuid || item.slug} value={item.slug}>{item.name}</option>)}</select>
            <select value={sort} onChange={(event) => setParam("sort", event.target.value)} className="col-span-2 h-12 rounded-lg border border-input bg-card px-3 text-[0.8rem] outline-none transition-colors focus:border-primary lg:col-span-1"><option value="latest">Mới nhất</option><option value="popular">Được quan tâm</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option><option value="name_asc">Tên A–Z</option></select>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border py-5 text-[0.8rem] text-muted-foreground"><span>{loading ? "Đang cập nhật..." : `${meta.total || products.length} sản phẩm`}</span>{hasFilters ? <button type="button" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-primary transition-colors hover:bg-primary/8" onClick={() => setParams({})}><SlidersHorizontal className="size-3.5" /> Xóa bộ lọc</button> : null}</div>
        {error ? <StatePanel type="error" title="Chưa tải được sản phẩm" description={error} actionLabel="Thử lại" onAction={() => setParams((current) => new URLSearchParams(current))} className="mt-8" /> : null}
        {!error ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{loading ? Array.from({ length: 8 }, (_, index) => <div key={index} className="h-[31rem] animate-pulse rounded-2xl bg-secondary" />) : products.map((product, index) => <Reveal key={product.uuid || product.id} delay={(index % 4) * 65}><ProductCard product={product} /></Reveal>)}</div> : null}
        {!loading && !error && !products.length ? <StatePanel title="Không tìm thấy sản phẩm" description="Hãy thử một nhóm, danh mục hoặc từ khóa khác." actionLabel="Xóa bộ lọc" onAction={() => setParams({})} className="mt-8" /> : null}
        {!error && meta.totalPages > 1 ? <nav className="mt-14 flex items-center justify-center gap-3" aria-label="Phân trang"><Button variant="outline" disabled={!meta.hasPreviousPage} onClick={() => setParam("page", String(page - 1))}>Trang trước</Button><span className="min-w-20 text-center text-sm text-muted-foreground">{meta.page || page} / {meta.totalPages}</span><Button variant="outline" disabled={!meta.hasNextPage} onClick={() => setParam("page", String(page + 1))}>Trang sau</Button></nav> : null}
      </Container>
    </div>
  );
}
