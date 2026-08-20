import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { Button } from "@/components/ui/button";
import { formatVnd, publicApi } from "@/lib/api/public-api";
import { selectCartSubtotal, useCartStore } from "@/stores/cart-store";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

export function CartDrawer() {
  const open = useCartStore((state) => state.drawerOpen);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const setOpen = useCartStore((state) => state.setDrawerOpen);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const panelRef = useRef(null);
  useDialogFocus({ open, containerRef: panelRef, onClose: () => setOpen(false) });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <button type="button" className="absolute inset-0 bg-[#201713]/45 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-label="Đóng giỏ hàng" />
      <aside ref={panelRef} className="midi-drawer-in absolute inset-y-0 right-0 flex w-full max-w-[32rem] flex-col bg-background shadow-2xl sm:my-3 sm:mr-3 sm:max-h-[calc(100%-1.5rem)] sm:rounded-2xl">
        <header className="flex min-h-24 items-center justify-between border-b border-border px-5 sm:px-7">
          <div><p className="midi-eyebrow">Giỏ hàng không cần đăng nhập</p><h2 className="mt-2 font-display text-3xl font-normal tracking-[-0.04em]">Món bạn đã chọn</h2></div>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-secondary" aria-label="Đóng"><X className="size-5" /></button>
        </header>
        <div className="safe-scrollbar flex-1 overflow-y-auto px-5 sm:px-7">
          {items.length ? items.map((item) => (
            <article key={item.uuid} className="grid grid-cols-[5.25rem_1fr_auto] gap-4 border-b border-border py-5">
              <ImageWithFallback src={item.image} alt={item.name} className="h-28 w-full rounded-xl bg-secondary object-contain p-2" />
              <div className="min-w-0"><p className="midi-eyebrow text-muted-foreground">{item.unit || item.sku || "Midi"}</p><h3 className="mt-2 font-display text-lg font-normal leading-tight">{item.name}</h3><div className="mt-4"><QuantityStepper value={item.quantity} onChange={(value) => { updateQuantity(item.uuid, value); publicApi.trackInterest({ eventType: "QUANTITY_CHANGED", productUuid: item.uuid, metadata: { quantity: value } }).catch(() => null); }} /></div></div>
              <div className="flex flex-col items-end justify-between"><strong className="text-sm">{formatVnd(item.price * item.quantity, item.currency)}</strong><button type="button" onClick={() => { removeItem(item.uuid); publicApi.trackInterest({ eventType: "REMOVED_FROM_CART", productUuid: item.uuid }).catch(() => null); }} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Xóa ${item.name}`}><Trash2 className="size-4" /></button></div>
            </article>
          )) : <div className="grid min-h-[55vh] place-items-center text-center"><div><ShoppingBag className="mx-auto size-8 text-primary" /><h3 className="mt-4 font-display text-3xl font-normal">Giỏ hàng đang trống</h3><p className="mt-2 text-sm text-muted-foreground">Khám phá các sản phẩm được Midi tuyển chọn.</p><Button asChild variant="outline" className="mt-6"><Link to={ROUTE_PATHS.products} onClick={() => setOpen(false)}>Xem sản phẩm</Link></Button></div></div>}
        </div>
        {items.length ? <footer className="border-t border-border bg-card px-5 py-5 sm:rounded-b-2xl sm:px-7"><div className="flex items-center justify-between font-display text-xl"><span>Tổng tạm tính</span><strong className="font-normal">{formatVnd(subtotal)}</strong></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Giá và tồn kho sẽ được chủ shop xác nhận qua Messenger.</p><Button asChild className="midi-link-arrow mt-5 w-full"><Link to={ROUTE_PATHS.cart} onClick={() => setOpen(false)}>Kiểm tra giỏ & tạo phiếu <ArrowRight /></Link></Button></footer> : null}
      </aside>
    </div>
  );
}
