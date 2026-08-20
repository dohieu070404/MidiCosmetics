import { ArrowRight, Check, Copy, ExternalLink, MessageCircle, Share2, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Container } from "@/components/common/container";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { StatePanel } from "@/components/common/state-panel";
import { GoogleRecaptcha } from "@/components/common/google-recaptcha";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { formatVnd, publicApi } from "@/lib/api/public-api";
import { useAppStore } from "@/stores/app-store";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart-store";

const quoteText = (quote, url) => [`Phiếu yêu cầu ${quote.code || quote.quoteCode || "MIDI"}`, ...(quote.items || []).map((item) => `• ${item.name} × ${item.quantity}: ${formatVnd(item.lineTotal || item.unitPrice * item.quantity)}`), `Tổng tạm tính: ${formatVnd(quote.subtotal || quote.snapshotTotal)}`, `Xem phiếu: ${url}`, "Giá và tồn kho sẽ được Midi Cosmetics xác nhận qua Messenger."].join("\n");

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const replaceItem = useCartStore((state) => state.replaceItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const notify = useAppStore((state) => state.notify);
  const [step, setStep] = useState("cart");
  const [note, setNote] = useState("");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaResetNonce, setRecaptchaResetNonce] = useState(0);
  const initialItems = useRef(items);
  const requestId = useRef(null);
  const captchaRequired = env.QUOTE_CAPTCHA_ENABLED;

  useEffect(() => {
    const persistedItems = initialItems.current;
    if (!persistedItems.length) return;
    setChecking(true);
    Promise.allSettled(persistedItems.map((item) => publicApi.getProduct(item.slug))).then((results) => {
      results.forEach((result, index) => {
        const current = persistedItems[index];
        if (result.status === "rejected") {
          if (result.reason?.status === 404) replaceItem(current.uuid, { available: false });
          else setError("Chưa kiểm tra được một số sản phẩm. Vui lòng thử tải lại trước khi tạo phiếu.");
          return;
        }
        const product = result.value?.data?.product;
        if (!product) return;
        const currentPrice = Number(product.price);
        replaceItem(current.uuid, { available: product.status ? product.status === "ACTIVE" : true, stock: product.stock ?? current.stock, price: currentPrice, previousPrice: current.price, priceChanged: currentPrice !== Number(current.price) });
      });
    }).finally(() => setChecking(false));
  }, [replaceItem]);

  const unavailable = useMemo(() => items.filter((item) => item.available === false || item.stock === 0), [items]);
  const beginReview = () => setStep("review");
  const createQuote = async () => {
    if (!items.length || unavailable.length || (captchaRequired && !recaptchaToken)) return;
    if (!requestId.current) requestId.current = globalThis.crypto.randomUUID();
    const messengerWindow = window.open(env.MESSENGER_URL, "_blank");
    if (!messengerWindow) {
      setError("Trình duyệt đã chặn cửa sổ Messenger. Hãy cho phép pop-up rồi thử lại; phiếu chưa được ghi nhận.");
      return;
    }
    messengerWindow.opener = null;
    setCreating(true); setError("");
    try {
      const response = await publicApi.createQuote({ items: items.map((item) => ({ productUuid: item.uuid, quantity: item.quantity })), note: note.trim() || undefined, intent: "MESSENGER", requestId: requestId.current, ...(captchaRequired ? { recaptchaToken } : {}) });
      const payload = response.data || {};
      const quote = payload.quote || payload;
      const token = payload.publicToken || quote.publicToken;
      const publicPath = payload.publicPath || (token ? ROUTE_PATHS.quote(token) : "");
      const publicUrl = payload.publicUrl || (publicPath ? new URL(publicPath, window.location.origin).toString() : "");
      setCreated({ ...quote, publicToken: token, publicUrl });
      setStep("success");
      clearCart();
      notify("Đã mở Messenger và ghi nhận phiếu yêu cầu.");
    } catch (err) {
      setError(err.message || "Chưa thể tạo phiếu. Vui lòng thử lại.");
      if (captchaRequired && /CAPTCHA/i.test(err.message || "")) { setRecaptchaToken(""); setRecaptchaResetNonce((value) => value + 1); }
    } finally { setCreating(false); }
  };

  const copy = async (value, message) => { try { await navigator.clipboard.writeText(value); notify(message); } catch { window.prompt("Trình duyệt đang chặn clipboard. Hãy sao chép nội dung bên dưới:", value); } };
  const openMessenger = () => { if (created?.publicToken) publicApi.markMessengerOpened(created.publicToken).catch(() => null); const opened = window.open(env.MESSENGER_URL, "_blank"); if (opened) opened.opener = null; else setError(`Trình duyệt đã chặn cửa sổ mới. Hãy mở trực tiếp: ${env.MESSENGER_URL}`); };

  if (step === "success" && created) {
    const text = quoteText(created, created.publicUrl);
    return <Container className="py-16 sm:py-24"><div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-10"><div className="grid size-12 place-items-center rounded-full bg-emerald-700 text-white"><Check className="size-5" /></div><p className="midi-eyebrow mt-7">Đã mở Messenger và lưu phiếu</p><h1 className="mt-4 font-display text-4xl font-normal leading-[.98] tracking-[-0.05em] sm:text-5xl">Phiếu đã sẵn sàng để Midi Cosmetics xác nhận.</h1><div className="mt-8 border-y border-border py-5 text-base"><div className="flex justify-between gap-4"><span>Mã phiếu</span><strong>{created.code || created.quoteCode}</strong></div><div className="mt-3 flex justify-between gap-4"><span>Tổng tạm tính</span><strong>{formatVnd(created.subtotal || created.snapshotTotal)}</strong></div></div><p className="mt-5 text-base leading-7 text-muted-foreground">Đây không phải hóa đơn tài chính hoặc đơn đã xác nhận. Giá và tồn kho sẽ được chủ shop xác nhận qua Messenger.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><Button type="button" onClick={() => copy(created.publicUrl, "Đã sao chép link phiếu.")} variant="outline"><Copy /> Sao chép link phiếu</Button><Button type="button" onClick={() => copy(text, "Đã sao chép nội dung phiếu.")} variant="outline"><Copy /> Sao chép nội dung</Button><Button type="button" onClick={openMessenger} className="sm:col-span-2">Mở lại Messenger Midi Cosmetics <ExternalLink /></Button>{navigator.share ? <Button type="button" variant="outline" className="sm:col-span-2" onClick={() => navigator.share({ title: `Phiếu ${created.code || created.quoteCode}`, text, url: created.publicUrl }).catch(() => null)}><Share2 /> Chia sẻ bằng ứng dụng khác</Button> : null}</div><Link to={ROUTE_PATHS.products} className="midi-link-arrow mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em]">Tiếp tục xem sản phẩm <ArrowRight className="size-4" /></Link></div></Container>;
  }

  if (!items.length) return <Container className="py-16 sm:py-24"><StatePanel title="Giỏ hàng đang trống" description="Bạn không cần đăng nhập. Chỉ cần thêm sản phẩm rồi tạo phiếu yêu cầu." actionLabel="Khám phá sản phẩm" onAction={() => { window.location.href = ROUTE_PATHS.products; }} /></Container>;

  return (
    <Container className="py-12 sm:py-20"><div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="midi-eyebrow">Giỏ hàng của bạn</p><h1 className="mt-4 font-display text-5xl font-normal tracking-[-0.055em]">{step === "review" ? "Xem lại phiếu yêu cầu" : `${count} sản phẩm đã chọn`}</h1></div>{step === "cart" ? <button type="button" onClick={() => { if (window.confirm("Xóa toàn bộ sản phẩm khỏi giỏ?")) clearCart(); }} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /> Xóa toàn bộ</button> : null}</div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-3">{items.map((item) => <article key={item.uuid} className="grid grid-cols-[6.5rem_1fr] gap-4 rounded-2xl border border-border/75 bg-card/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[8rem_1fr_auto]"><ImageWithFallback src={item.image} alt={item.name} className="h-36 w-full rounded-xl bg-secondary object-contain p-2 sm:h-40" /><div><p className="midi-eyebrow text-muted-foreground">{item.sku || item.unit || "MIDI"}</p><h2 className="mt-2 font-display text-2xl font-normal leading-tight">{item.name}</h2><p className="mt-2 text-sm">{formatVnd(item.price, item.currency)} / sản phẩm</p>{item.priceChanged ? <p className="mt-2 text-sm text-amber-700">Giá hiện tại đã thay đổi và sẽ được xác minh khi tạo phiếu.</p> : null}{item.available === false || item.stock === 0 ? <p className="mt-2 text-sm font-semibold text-destructive">Sản phẩm hiện không khả dụng. Hãy xóa khỏi giỏ để tiếp tục.</p> : null}<div className="mt-4 flex items-center gap-3">{step === "cart" ? <QuantityStepper value={item.quantity} onChange={(value) => { updateQuantity(item.uuid, value); publicApi.trackInterest({ eventType: "QUANTITY_CHANGED", productUuid: item.uuid, metadata: { quantity: value } }).catch(() => null); }} max={item.stock ? Math.min(20, item.stock) : 20} /> : <span className="text-sm">Số lượng: {item.quantity}</span>}{step === "cart" ? <button type="button" onClick={() => { removeItem(item.uuid); publicApi.trackInterest({ eventType: "REMOVED_FROM_CART", productUuid: item.uuid }).catch(() => null); }} className="text-sm text-muted-foreground underline transition-colors hover:text-destructive">Xóa</button> : null}</div></div><strong className="col-start-2 text-sm sm:col-start-auto">{formatVnd(item.price * item.quantity, item.currency)}</strong></article>)}</div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-32">
          <p className="midi-eyebrow">{step === "review" ? "Nội dung phiếu" : "Tạm tính"}</p>
          <div className="mt-5 grid gap-3 border-b border-border pb-5 text-base"><div className="flex justify-between"><span>Số lượng</span><strong>{count}</strong></div><div className="flex justify-between font-display text-xl"><span>Tổng tạm tính</span><strong className="font-normal">{formatVnd(subtotal)}</strong></div></div>
          <label className="mt-5 grid gap-2 text-sm font-semibold uppercase tracking-[0.08em]">Ghi chú tùy chọn<textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 1000))} rows={4} disabled={step === "cart"} className="resize-y rounded-lg border border-input bg-background p-3 text-base font-normal normal-case tracking-normal outline-none transition-colors focus:border-primary" placeholder="Màu sắc, thời gian liên hệ hoặc điều bạn muốn shop lưu ý..." /><span className="text-right text-xs font-normal text-muted-foreground">{note.length}/1000</span></label>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{captchaRequired ? "Phiếu chỉ được ghi nhận sau khi CAPTCHA hợp lệ và cửa sổ Messenger mở thành công." : "CAPTCHA đang tạm tắt ở môi trường local. Phiếu được ghi nhận sau khi cửa sổ Messenger mở thành công."}</p>
          {checking ? <p className="mt-3 text-sm text-muted-foreground">Đang kiểm tra giá và tồn kho...</p> : null}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {step === "cart" ? <Button type="button" className="mt-5 w-full" onClick={beginReview} disabled={checking || unavailable.length > 0}>Xem trước phiếu <ArrowRight /></Button> : <div className="mt-5 grid gap-3">
            {captchaRequired ? <div className={`rounded-xl border p-4 ${recaptchaToken ? "border-emerald-600/25 bg-emerald-600/8" : "border-border bg-secondary/40"}`}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" /> Google reCAPTCHA</div>
              <GoogleRecaptcha siteKey={env.RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} resetNonce={recaptchaResetNonce} />
              {recaptchaToken ? <p className="mt-2 text-sm font-medium text-emerald-700">Đã xác nhận. Phiếu sẵn sàng gửi.</p> : null}
            </div> : <div className="rounded-xl border border-amber-600/20 bg-amber-500/5 p-4 text-sm leading-6 text-amber-800"><span className="inline-flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" /> CAPTCHA đang tạm tắt</span><p className="mt-1">Chế độ này chỉ dùng khi phát triển local.</p></div>}
            <Button type="button" onClick={createQuote} disabled={creating || unavailable.length > 0 || (captchaRequired && !recaptchaToken)}>{creating ? "Đang ghi nhận phiếu…" : "Gửi phiếu qua Messenger"} <MessageCircle /></Button>
            <Button type="button" variant="outline" onClick={() => setStep("cart")}>Quay lại chỉnh giỏ</Button>
          </div>}
        </aside>
      </div>
    </Container>
  );
}
