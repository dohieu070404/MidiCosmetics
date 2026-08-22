import { Search, ShoppingBag, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { BrandLogo } from '@/components/brand/brand-logo';
import { MobileNavigation } from '@/components/layout/mobile-navigation';
import { PUBLIC_NAVIGATION } from '@/constants/navigation';
import {
  PRODUCT_GROUP_BY_ID,
  PRODUCT_MENU_GROUPS,
  productCategoryHref,
} from '@/constants/product-taxonomy';
import { useDialogFocus } from '@/hooks/use-dialog-focus';
import { cn } from '@/lib/utils';
import { selectCartCount, useCartStore } from '@/stores/cart-store';

const ALL_PRODUCTS_MENU = Object.freeze({
  label: 'Khám phá MIDI',
  description: 'Đi thẳng đến nhóm sản phẩm bạn cần, theo đúng dữ liệu đang có trong catalog.',
  image: '/images/editorial/editorial-perfume-2026.webp',
  mobilePosition: '38% center',
  href: ROUTE_PATHS.products,
  columns: PRODUCT_MENU_GROUPS.map((group) => ({
    title: group.label,
    groupId: group.id,
    items: group.columns.flatMap((menuColumn) => menuColumn.items).slice(0, 5),
  })),
});

const navIsActive = (item, location) => {
  if (item.menuId) {
    if (location.pathname !== ROUTE_PATHS.products) return false;
    const selectedGroup = new URLSearchParams(location.search).get('group') || '';
    return item.menuId === 'all' ? !selectedGroup : selectedGroup === item.menuId;
  }
  if (item.href === ROUTE_PATHS.blog) return location.pathname.startsWith(ROUTE_PATHS.blog);
  return location.pathname === item.href;
};

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState('');
  const [query, setQuery] = useState('');
  const searchDialogRef = useRef(null);
  const searchInputRef = useRef(null);
  const count = useCartStore(selectCartCount);
  const setCartOpen = useCartStore((state) => state.setDrawerOpen);
  const activeMenu = useMemo(
    () => (megaOpen === 'all' ? ALL_PRODUCTS_MENU : PRODUCT_GROUP_BY_ID[megaOpen]),
    [megaOpen],
  );

  useDialogFocus({
    open: searchOpen,
    containerRef: searchDialogRef,
    initialFocusRef: searchInputRef,
    onClose: () => setSearchOpen(false),
  });

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    setSearchOpen(false);
    navigate(
      value ? `${ROUTE_PATHS.products}?search=${encodeURIComponent(value)}` : ROUTE_PATHS.products,
    );
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-border/70 bg-[#fbf8f2] text-foreground shadow-[0_12px_40px_rgba(54,38,29,0.07)]"
        onMouseLeave={() => setMegaOpen('')}
      >
        <div className="hidden h-[5.25rem] grid-cols-[10rem_minmax(0,1fr)_7rem] items-center px-5 lg:grid xl:grid-cols-[12rem_minmax(0,1fr)_8rem] xl:px-8">
          <BrandLogo className="self-center" />
          <nav
            className="flex h-full min-w-0 items-stretch justify-center gap-[clamp(.4rem,1.15vw,1.45rem)]"
            aria-label="Điều hướng chính"
          >
            {PUBLIC_NAVIGATION.map((item) => {
              const isActive = navIsActive(item, location);
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  to={item.href}
                  onMouseEnter={() => setMegaOpen(item.menuId || '')}
                  onFocus={() => setMegaOpen(item.menuId || '')}
                  onClick={() => setMegaOpen('')}
                  className={cn(
                    'relative flex items-center whitespace-nowrap px-1 text-[0.7rem] font-semibold uppercase tracking-[0.07em] transition-colors after:absolute after:inset-x-1 after:bottom-5 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:text-primary hover:after:scale-x-100 xl:text-[0.76rem]',
                    isActive && 'text-primary after:scale-x-100',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.shortLabel || item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-11 place-items-center rounded-full transition-all hover:-translate-y-px hover:bg-primary/8 hover:text-primary"
              aria-label="Tìm kiếm"
            >
              <Search className="size-[1.15rem]" />
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative grid size-11 place-items-center rounded-full transition-all hover:-translate-y-px hover:bg-primary/8 hover:text-primary"
              aria-label={`Giỏ hàng có ${count} sản phẩm`}
            >
              <ShoppingBag className="size-[1.15rem]" />
              {count ? (
                <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[0.58rem] font-bold text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="grid h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center bg-[#fbf8f2] px-3 lg:hidden">
          <MobileNavigation />
          <BrandLogo className="justify-self-center" />
          <div className="flex justify-self-end">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary"
              aria-label="Tìm kiếm"
            >
              <Search className="size-[1.2rem]" />
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary"
              aria-label={`Giỏ hàng có ${count} sản phẩm`}
            >
              <ShoppingBag className="size-[1.2rem]" />
              {count ? (
                <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.56rem] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-x-0 top-full hidden min-h-[19rem] border-b border-border bg-[#fffdf9] shadow-[0_28px_70px_rgba(48,31,24,0.16)] lg:grid',
            activeMenu ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0',
            'transition-all duration-300 ease-out',
          )}
          style={{
            gridTemplateColumns: activeMenu
              ? `minmax(14rem, 17rem) repeat(${activeMenu.columns.length}, minmax(0, 1fr))`
              : undefined,
          }}
          onMouseEnter={() => activeMenu && setMegaOpen(megaOpen)}
        >
          {activeMenu ? (
            <>
              <Link
                to={activeMenu.href}
                onClick={() => setMegaOpen('')}
                className="group relative m-5 overflow-hidden rounded-2xl bg-secondary shadow-sm"
              >
                <img
                  src={activeMenu.image}
                  alt=""
                  className="h-[16rem] w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
                  style={{ objectPosition: activeMenu.mobilePosition }}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#211510d9] via-transparent to-transparent" />
                <span className="absolute inset-x-5 bottom-5 text-white">
                  <strong className="block font-display text-2xl font-normal">
                    {activeMenu.label}
                  </strong>
                  <span className="mt-1 block text-[0.72rem] leading-5 text-white/75">
                    {activeMenu.description}
                  </span>
                </span>
              </Link>
              {activeMenu.columns.map((menuColumn) => {
                const groupId = menuColumn.groupId || activeMenu.id;
                return (
                  <div
                    key={`${activeMenu.label}-${menuColumn.title}`}
                    className="border-l border-border/60 px-[clamp(1rem,2vw,2rem)] py-7"
                  >
                    <Link
                      to={PRODUCT_GROUP_BY_ID[groupId]?.href || activeMenu.href}
                      onClick={() => setMegaOpen('')}
                      className="font-display text-lg text-muted-foreground transition-colors hover:text-primary"
                    >
                      {menuColumn.title}
                    </Link>
                    <div className="mt-3 grid gap-0.5">
                      {menuColumn.items.map((item) => (
                        <Link
                          key={`${groupId}-${item.slug}`}
                          to={productCategoryHref(groupId, item.slug)}
                          onClick={() => setMegaOpen('')}
                          className="w-fit rounded-md py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.065em] transition-all duration-300 hover:translate-x-1 hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}
        </div>
      </header>

      <div
        ref={searchDialogRef}
        className={cn(
          'fixed inset-0 z-[90] bg-[#fbf8f2] transition-all duration-300',
          searchOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-5 opacity-0',
        )}
        aria-hidden={!searchOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm sản phẩm"
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-5 sm:px-8">
          <BrandLogo />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="grid size-11 place-items-center rounded-full transition-colors hover:bg-secondary"
            aria-label="Đóng tìm kiếm"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submitSearch} className="mx-auto mt-14 max-w-5xl px-5">
          <label className="midi-eyebrow" htmlFor="site-search">
            Bạn đang tìm gì?
          </label>
          <div className="mt-4 flex items-center border-b border-foreground pb-3">
            <Search className="mr-4 size-6 shrink-0" />
            <input
              ref={searchInputRef}
              id="site-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent font-display text-3xl font-normal tracking-[-0.035em] outline-none sm:text-5xl"
              placeholder="Serum, son, chống nắng..."
            />
            <button
              type="submit"
              className="text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-primary"
            >
              Tìm
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Serum', 'Kem chống nắng', 'Son', 'Kem body', 'Dầu gội', 'Nước hoa'].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setQuery(item)}
                className="rounded-full border border-border bg-card px-4 py-2.5 text-[0.78rem] text-muted-foreground transition-all hover:-translate-y-px hover:border-primary hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </form>
      </div>
    </>
  );
}
