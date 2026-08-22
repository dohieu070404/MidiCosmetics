import { ChevronDown, Menu, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { BrandLogo } from '@/components/brand/brand-logo';
import { MOBILE_SECONDARY_NAVIGATION, SOCIAL_LINKS } from '@/constants/navigation';
import { PRODUCT_MENU_GROUPS, productCategoryHref } from '@/constants/product-taxonomy';
import { useDialogFocus } from '@/hooks/use-dialog-focus';
import { cn } from '@/lib/utils';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState('');
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const location = useLocation();
  const activeGroup =
    location.pathname === '/products'
      ? new URLSearchParams(location.search).get('group') || ''
      : '';

  useDialogFocus({
    open,
    containerRef: panelRef,
    returnFocusRef: triggerRef,
    onClose: () => setOpen(false),
  });

  const close = () => setOpen(false);

  return (
    <div className="justify-self-start lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary"
        aria-label="Mở menu"
      >
        <Menu className="size-5" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[85] bg-[#241712]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Menu di động"
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={close}
            aria-label="Đóng menu"
          />
          <aside
            ref={panelRef}
            className="midi-drawer-in-left absolute inset-y-0 left-0 flex w-[min(92vw,27rem)] flex-col overflow-hidden border-r border-[#d9c9bb] bg-[#f8f1e8] shadow-[18px_0_60px_rgba(31,20,16,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-[#d9c9bb] bg-[#fffaf4] px-5 py-3">
              <BrandLogo />
              <button
                type="button"
                onClick={close}
                className="grid size-11 place-items-center rounded-full bg-secondary/70 transition-colors hover:bg-secondary"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="safe-scrollbar flex-1 overflow-y-auto px-4 py-4">
              <p className="midi-eyebrow px-2 pb-3 text-muted-foreground">Danh mục sản phẩm</p>
              <nav className="grid gap-2" aria-label="Danh mục sản phẩm trên di động">
                {PRODUCT_MENU_GROUPS.map((group, index) => {
                  const isExpanded = expanded === group.id;
                  const isActive = activeGroup === group.id;
                  return (
                    <div
                      key={group.id}
                      className={cn(
                        'overflow-hidden rounded-xl border bg-[#fffdf9] shadow-sm transition-colors',
                        isActive ? 'border-primary/45' : 'border-[#ded1c5]',
                      )}
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div className="flex items-stretch">
                        <Link
                          to={group.href}
                          onClick={close}
                          className={cn(
                            'flex min-h-14 flex-1 items-center px-4 font-display text-[1.3rem] leading-tight tracking-[-0.025em] transition-colors',
                            isActive ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {group.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? '' : group.id)}
                          className="grid w-14 place-items-center border-l border-[#ded1c5] text-muted-foreground"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Thu gọn' : 'Mở'} ${group.label}`}
                        >
                          <ChevronDown
                            className={cn(
                              'size-4 transition-transform duration-300',
                              isExpanded && 'rotate-180',
                            )}
                          />
                        </button>
                      </div>
                      <div
                        className={cn(
                          'grid transition-[grid-template-rows] duration-300 ease-out',
                          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="grid gap-4 border-t border-[#ded1c5] bg-[#f1e6da]/55 px-4 py-4">
                            {group.columns.map((menuColumn) => (
                              <div key={`${group.id}-${menuColumn.title}`}>
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.11em] text-primary/80">
                                  {menuColumn.title}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {menuColumn.items.map((item) => (
                                    <Link
                                      key={item.slug}
                                      to={productCategoryHref(group.id, item.slug)}
                                      onClick={close}
                                      className="rounded-full border border-[#d8c9bd] bg-[#fffaf4] px-3 py-2 text-[0.78rem] text-foreground transition-colors hover:border-primary hover:text-primary"
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>

              <nav
                className="mt-6 grid border-t border-[#d9c9bb] pt-3"
                aria-label="Điều hướng di động"
              >
                {MOBILE_SECONDARY_NAVIGATION.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={close}
                    className={({ isActive }) =>
                      cn(
                        'border-b border-[#ded1c5] px-2 py-3.5 font-display text-lg transition-all hover:translate-x-1 hover:text-primary',
                        isActive ? 'text-primary' : 'text-foreground',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="border-t border-[#d9c9bb] bg-[#fffaf4] px-5 py-5">
              <p className="midi-eyebrow text-muted-foreground">Kết nối với MIDI</p>
              <div className="mt-3 flex gap-5">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline decoration-primary/30 underline-offset-4"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
