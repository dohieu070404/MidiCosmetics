import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Container } from "@/components/common/container";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Reveal } from "@/components/common/reveal";
import { ProductCard } from "@/components/commerce/product-card";
import { Button } from "@/components/ui/button";
import { DEFAULT_HERO_SCENES, DEFAULT_HOME_EDITORIAL, DEFAULT_HOME_SKINCARE_EDITORIAL } from "@/data/default-content";
import { sampleProducts } from "@/data/sample-products";
import { mediaUrl, publicApi } from "@/lib/api/public-api";

const fallbackProducts = sampleProducts.slice(0, 4).map((product) => ({ ...product, uuid: product.id, slug: product.id, mainImage: product.image, formattedPrice: product.price, category: { name: product.category } }));
const sectionOf = (sections, type) => sections.find((section) => section.type === type);
const sectionById = (sections, id) => sections.find((section) => section.id === id);

function Hero({ scenes }) {
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);
  const offsetRef = useRef(0);
  const current = scenes[active];

  const start = (event) => {
    if (window.innerWidth > 820 || event.button !== 0) return;
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event) => {
    if (startX.current === null) return;
    const delta = event.clientX - startX.current;
    const edge = (active === 0 && delta > 0) || (active === scenes.length - 1 && delta < 0);
    const next = edge ? delta * .22 : Math.max(-180, Math.min(180, delta));
    offsetRef.current = next;
    setOffset(next);
  };
  const end = () => {
    if (startX.current === null) return;
    if (offsetRef.current < -48 && active < scenes.length - 1) setActive((index) => index + 1);
    if (offsetRef.current > 48 && active > 0) setActive((index) => index - 1);
    startX.current = null;
    offsetRef.current = 0;
    setOffset(0);
    setDragging(false);
  };

  return (
    <section className={`relative min-h-[calc(100svh-4.5rem)] touch-pan-y overflow-hidden bg-[#d9cec0] text-white outline-none lg:min-h-[calc(100svh-5.25rem)] ${dragging ? "cursor-grabbing" : "cursor-grab lg:cursor-default"}`} aria-label="Danh mục nổi bật" aria-roledescription="carousel" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") setActive((index) => Math.max(0, index - 1)); if (event.key === "ArrowRight") setActive((index) => Math.min(scenes.length - 1, index + 1)); }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <div className="absolute inset-0 hidden lg:block">{scenes.map((scene, index) => <ImageWithFallback key={scene.id} src={scene.image} alt="" className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${active === index ? "scale-100 opacity-100" : "scale-[1.035] opacity-0"}`} />)}</div>
      <div className="absolute inset-0 overflow-hidden lg:hidden"><div className="flex h-full will-change-transform transition-transform duration-700 ease-out" style={{ transform: `translate3d(calc(${-active * 100}% + ${offset}px),0,0)`, transition: dragging ? "none" : undefined }}>{scenes.map((scene) => <div key={scene.id} className="h-full min-w-full"><ImageWithFallback src={scene.image} alt="" className="h-full w-full select-none object-cover transition-transform duration-700" style={{ objectPosition: scene.mobilePosition }} draggable="false" /></div>)}</div></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#24130d18] via-transparent to-[#160f0be8]" />
      <div className="absolute inset-x-[max(1.25rem,6vw)] bottom-[5.5%] hidden grid-cols-4 gap-2 lg:grid" role="tablist" aria-label="Chọn danh mục">{scenes.map((scene, index) => <button type="button" role="tab" aria-selected={active === index} key={scene.id} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => { if (active === index) window.location.assign(scene.href); else setActive(index); }} className={`min-h-36 rounded-xl border px-6 py-5 text-left backdrop-blur-sm transition-all duration-500 ${active === index ? "-translate-y-1 border-white/35 bg-[#1b100a]/48 opacity-100 shadow-xl" : "border-white/10 bg-black/5 opacity-55 hover:-translate-y-0.5 hover:border-white/25 hover:bg-black/15 hover:opacity-85"}`}><strong className="block text-xl font-semibold uppercase tracking-[0.025em] xl:text-2xl">{scene.title}</strong><span className="mt-2 block max-w-[16rem] font-display text-[0.95rem] leading-6">{scene.subtitle}</span><i className={`mt-3 block w-fit border-b border-white text-[0.72rem] not-italic uppercase tracking-[0.09em] transition-opacity ${active === index ? "opacity-100" : "opacity-0"}`}>Xem sản phẩm</i></button>)}</div>
      <div key={current.id} className="midi-fade-up absolute inset-x-4 bottom-5 z-10 rounded-2xl border border-white/15 bg-[#1b100a]/30 p-5 shadow-2xl backdrop-blur-sm lg:hidden"><p className="midi-eyebrow text-white/75">{current.kicker}</p><h1 className="mt-3 font-display text-[2.65rem] font-normal leading-none tracking-[-0.04em]">{current.title}</h1><p className="mt-3 max-w-sm font-display text-base leading-6 text-white/85">{current.subtitle}</p><Link to={current.href} className="mt-4 inline-flex border-b border-white pb-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em]">Xem sản phẩm</Link><div className="mt-5 flex gap-1.5">{scenes.map((scene, index) => <button type="button" key={scene.id} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-9 bg-white" : "w-5 bg-white/35"}`} aria-label={`Chọn ${scene.title}`} />)}</div><p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-white/65">← Giữ và kéo ngang để chuyển ảnh →</p></div>
    </section>
  );
}

function BlogCard({ post }) {
  return <article className="group h-full"><Link to={ROUTE_PATHS.blogDetail(post.slug)} className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-secondary"><ImageWithFallback src={post.image || post.featuredImage?.secureUrl} alt={post.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" /></Link><p className="midi-eyebrow mt-5 text-muted-foreground">{post.category?.name || "Tạp chí Midi"} · {post.readingMinutes || 1} phút đọc</p><h3 className="mt-3 font-display text-2xl font-normal leading-tight tracking-[-0.03em]"><Link to={ROUTE_PATHS.blogDetail(post.slug)}>{post.title}</Link></h3><p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">{post.excerpt}</p></article>;
}

function ProductRail({ products }) {
  const railRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [active, setActive] = useState(0);

  const cardStep = () => {
    const rail = railRef.current;
    const first = rail?.firstElementChild;
    if (!rail || !first) return rail?.clientWidth || 320;
    return first.getBoundingClientRect().width + 16;
  };
  const moveTo = (index) => {
    const rail = railRef.current;
    if (!rail) return;
    const next = Math.max(0, Math.min(products.length - 1, index));
    rail.scrollTo({ left: next * cardStep(), behavior: "smooth" });
  };
  const onScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    setActive(Math.max(0, Math.min(products.length - 1, Math.round(rail.scrollLeft / cardStep()))));
  };
  const startDrag = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (event.target.closest("a, button, input, select, textarea, [role='button']")) return;
    const rail = railRef.current;
    if (!rail) return;
    dragRef.current = { active: true, startX: event.clientX, startLeft: rail.scrollLeft, moved: false };
    rail.setPointerCapture(event.pointerId);
  };
  const drag = (event) => {
    const rail = railRef.current;
    if (!rail || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 5) dragRef.current.moved = true;
    rail.scrollLeft = dragRef.current.startLeft - delta;
  };
  const endDrag = () => { dragRef.current.active = false; };

  return <div className="relative"><div ref={railRef} onScroll={onScroll} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onClickCapture={(event) => { if (dragRef.current.moved) { event.preventDefault(); event.stopPropagation(); dragRef.current.moved = false; } }} className="midi-product-rail -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-5 pt-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing" aria-label="Sản phẩm được quan tâm">{products.map((product, index) => <div key={product.uuid || product.id} className="min-w-full snap-start sm:min-w-[17.5rem] lg:min-w-[19rem] xl:min-w-[calc((100%-4rem)/5)]"><ProductCard product={product} priority={index < 2} /></div>)}</div><div className="mt-2 flex items-center justify-between gap-4"><div className="flex max-w-full gap-1.5 overflow-hidden" aria-label="Vị trí carousel">{products.map((product, index) => <button type="button" key={product.uuid || product.id} onClick={() => moveTo(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-8 bg-primary" : "w-3 bg-border hover:bg-primary/45"}`} aria-label={`Xem sản phẩm ${index + 1}`} />)}</div><div className="hidden shrink-0 gap-2 sm:flex"><button type="button" onClick={() => moveTo(active - 1)} disabled={active === 0} className="grid size-11 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary disabled:opacity-30" aria-label="Sản phẩm trước"><ChevronLeft className="size-4" /></button><button type="button" onClick={() => moveTo(active + 1)} disabled={active >= products.length - 1} className="grid size-11 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary disabled:opacity-30" aria-label="Sản phẩm tiếp theo"><ChevronRight className="size-4" /></button></div></div><p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-muted-foreground sm:hidden">← Vuốt ngang để xem thêm →</p></div>;
}

function EditorialBlock({ editorial, variant = "wine", imageRight = false }) {
  const light = variant === "cream";
  const columns = imageRight ? "lg:grid-cols-[42%_58%]" : "lg:grid-cols-[58%_42%]";
  return <Reveal as="section" className={`mx-4 grid min-h-[42rem] overflow-hidden rounded-3xl ${light ? "bg-[#eee4d4] text-[#34251e]" : "bg-[#581d28] text-[#fff7ee]"} ${columns}`}><div className={`overflow-hidden ${imageRight ? "lg:order-2" : "lg:order-1"}`}><ImageWithFallback src={editorial.imageUrl} alt={light ? "Nghi thức chăm sóc da" : "Nước hoa cao cấp trong ánh sáng trầm ấm"} className="h-full min-h-96 w-full object-cover object-center transition-transform duration-1000 hover:scale-[1.025]" /></div><div className={`flex flex-col items-start justify-center px-7 py-20 sm:px-14 lg:px-[clamp(3rem,7vw,8rem)] ${imageRight ? "lg:order-1" : "lg:order-2"}`}><p className={`midi-eyebrow ${light ? "text-[#6f5548]" : "text-white/70"}`}>{editorial.eyebrow}</p><h2 className="mt-5 font-display text-5xl font-normal leading-[.95] tracking-[-0.045em] lg:text-7xl">{editorial.title}</h2><p className={`mt-7 font-display text-xl leading-8 ${light ? "text-[#5f493e]" : "text-white/78"}`}>{editorial.subtitle}</p><Button asChild variant="outline" className={`midi-link-arrow mt-8 bg-transparent ${light ? "border-[#6f5548]/45 text-[#34251e] hover:bg-[#34251e] hover:text-[#fffaf4]" : "border-white/55 text-white hover:bg-white hover:text-[#581d28]"}`}><Link to={editorial.ctaHref}>{editorial.ctaLabel} <ArrowRight /></Link></Button></div></Reveal>;
}

export function HomePage() {
  const [data, setData] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      publicApi.homepage(),
      publicApi.listProducts({ limit: 8, sort: "popular" }),
    ]).then(([homepageResult, productResult]) => {
      if (!mounted) return;
      if (homepageResult.status === "fulfilled") setData(homepageResult.value.data);
      else setError("Dữ liệu trực tuyến chưa sẵn sàng; đang hiển thị nội dung mặc định của MIDI.");
      if (productResult.status === "fulfilled") setCatalogProducts(productResult.value.data.products || []);
    });
    return () => { mounted = false; };
  }, []);

  const sections = useMemo(() => data?.sections || [], [data]);
  const heroSection = sectionOf(sections, "HERO");
  const productSection = sectionById(sections, "featured-products");
  const editorialSection = sectionById(sections, "custom-text");
  const skincareEditorialSection = sectionById(sections, "skincare-editorial");
  const postSection = sectionById(sections, "featured-posts");
  const featuredProducts = productSection?.items?.length ? productSection.items : (data?.featuredProducts || []);
  const products = featuredProducts.length ? featuredProducts : (catalogProducts.length ? catalogProducts : fallbackProducts);
  const posts = data ? (postSection?.items || []) : [];
  const scenes = useMemo(() => {
    const configured = heroSection?.config?.slides;
    if (Array.isArray(configured) && configured.length) {
      return DEFAULT_HERO_SCENES.map((fallback) => {
        const current = configured.find((slide) => slide.id === fallback.id);
        if (!current) return fallback;
        return { ...fallback, ...current, image: current.imageUrl ? mediaUrl(current.imageUrl) : fallback.image };
      });
    }
    return DEFAULT_HERO_SCENES.map((fallback, index) => index === 0 && heroSection ? { ...fallback, title: heroSection.title || fallback.title, subtitle: heroSection.subtitle || fallback.subtitle, image: heroSection.config?.imageUrl ? mediaUrl(heroSection.config.imageUrl) : fallback.image } : fallback);
  }, [heroSection]);
  const editorial = data
    ? editorialSection && { ...DEFAULT_HOME_EDITORIAL, eyebrow: editorialSection.config?.eyebrow || DEFAULT_HOME_EDITORIAL.eyebrow, title: editorialSection.title || DEFAULT_HOME_EDITORIAL.title, subtitle: editorialSection.subtitle || editorialSection.config?.body || DEFAULT_HOME_EDITORIAL.subtitle, imageUrl: editorialSection.config?.imageUrl ? mediaUrl(editorialSection.config.imageUrl) : DEFAULT_HOME_EDITORIAL.imageUrl, ctaLabel: editorialSection.config?.ctaLabel || DEFAULT_HOME_EDITORIAL.ctaLabel, ctaHref: editorialSection.config?.ctaHref || DEFAULT_HOME_EDITORIAL.ctaHref }
    : DEFAULT_HOME_EDITORIAL;
  const skincareEditorial = data
    ? skincareEditorialSection && { ...DEFAULT_HOME_SKINCARE_EDITORIAL, eyebrow: skincareEditorialSection.config?.eyebrow || DEFAULT_HOME_SKINCARE_EDITORIAL.eyebrow, title: skincareEditorialSection.title || DEFAULT_HOME_SKINCARE_EDITORIAL.title, subtitle: skincareEditorialSection.subtitle || skincareEditorialSection.config?.body || DEFAULT_HOME_SKINCARE_EDITORIAL.subtitle, imageUrl: skincareEditorialSection.config?.imageUrl ? mediaUrl(skincareEditorialSection.config.imageUrl) : DEFAULT_HOME_SKINCARE_EDITORIAL.imageUrl, ctaLabel: skincareEditorialSection.config?.ctaLabel || DEFAULT_HOME_SKINCARE_EDITORIAL.ctaLabel, ctaHref: skincareEditorialSection.config?.ctaHref || DEFAULT_HOME_SKINCARE_EDITORIAL.ctaHref }
    : DEFAULT_HOME_SKINCARE_EDITORIAL;

  return (
    <div className="overflow-hidden">
      <Hero scenes={scenes} />
      {error ? <div className="bg-secondary/50 px-5 py-2 text-center text-xs text-muted-foreground">{error}</div> : null}

      {products.length ? <Container className="py-24 lg:py-32"><div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="midi-eyebrow">{productSection?.config?.eyebrow || "Được quan tâm"}</p><h2 className="mt-4 max-w-3xl font-display text-5xl font-normal leading-[.96] tracking-[-0.05em] sm:text-6xl">{productSection?.title || "Những món bạn sẽ muốn dùng mỗi ngày."}</h2>{productSection?.subtitle ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{productSection.subtitle}</p> : null}</div><Link to={ROUTE_PATHS.products} className="midi-link-arrow inline-flex items-center gap-3 border-b border-foreground pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em]">Xem tất cả <ArrowRight className="size-4" /></Link></div><ProductRail products={products.slice(0, productSection?.config?.limit || 8)} /></Container> : null}

      {editorial ? <EditorialBlock editorial={editorial} /> : null}
      {skincareEditorial ? <div className="mt-4"><EditorialBlock editorial={skincareEditorial} variant="cream" imageRight /></div> : null}

      {posts.length ? <Container className="py-24 lg:py-32"><div className="flex items-end justify-between border-b border-border pb-7"><div><p className="midi-eyebrow">{postSection?.config?.eyebrow || "Tạp chí Midi"}</p><h2 className="mt-3 font-display text-5xl font-normal tracking-[-0.05em]">{postSection?.title || "Đọc chậm, chọn kỹ."}</h2>{postSection?.subtitle ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{postSection.subtitle}</p> : null}</div><Link to={ROUTE_PATHS.blog} className="hidden text-xs uppercase tracking-[0.1em] sm:block">Xem tất cả</Link></div><div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:gap-10 lg:overflow-visible lg:pb-0">{posts.slice(0, postSection?.config?.limit || 3).map((post) => <div key={post.uuid || post.id} className="min-w-[86%] snap-start sm:min-w-[22rem] lg:min-w-0"><BlogCard post={post} /></div>)}</div></Container> : null}

      <section className="m-4 grid overflow-hidden rounded-3xl bg-secondary px-5 py-10 sm:grid-cols-3 lg:px-10 lg:py-14">{[["01", "Tư vấn thật lòng", "Chọn theo làn da, không theo trào lưu."], ["02", "Tuyển chọn có chủ đích", "Ưu tiên công thức, trải nghiệm và độ phù hợp."], ["03", "Tạo phiếu nhanh", "Chọn sản phẩm và gửi thẳng cho MIDI qua Messenger."]].map(([number, title, body]) => <div key={number} className="relative rounded-2xl border-b border-border p-7 pl-12 transition-all duration-300 hover:-translate-y-1 hover:bg-card/60 hover:shadow-sm sm:border-b-0 sm:border-r sm:last:border-0"><span className="absolute left-5 top-8 text-[0.72rem] font-semibold text-primary">{number}</span><h3 className="font-display text-2xl font-normal">{title}</h3><p className="mt-2 text-[0.9rem] leading-6 text-muted-foreground">{body}</p></div>)}</section>
    </div>
  );
}
