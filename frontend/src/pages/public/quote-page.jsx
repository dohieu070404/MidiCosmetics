import { Copy, ExternalLink, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { StatePanel } from '@/components/common/state-panel';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { formatVnd, publicApi } from '@/lib/api/public-api';
import { useAppStore } from '@/stores/app-store';

const statusLabel = {
  CREATED: 'Đã tạo',
  MESSENGER_OPENED: 'Đã mở Messenger',
  PROCESSED: 'Đã xử lý',
  EXPIRED: 'Đã hết hạn',
};

export function QuotePage() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const notify = useAppStore((state) => state.notify);
  useEffect(() => {
    publicApi
      .getQuote(token)
      .then((response) => setQuote(response.data.quote || response.data))
      .catch((err) => setError(err.message));
  }, [token]);
  if (error)
    return (
      <Container className="py-16">
        <StatePanel
          type="error"
          title="Phiếu không tồn tại hoặc đã hết hạn"
          description="Link có thể đã hết thời hạn hoặc không chính xác. Hãy liên hệ Midi Cosmetics để được hỗ trợ."
        />
      </Container>
    );
  if (!quote)
    return (
      <Container className="py-16">
        <StatePanel type="loading" title="Đang mở phiếu yêu cầu" />
      </Container>
    );
  const publicUrl = window.location.href;
  const content = [
    `Phiếu ${quote.code || quote.quoteCode}`,
    ...(quote.items || []).map((item) => `${item.name} × ${item.quantity}`),
    `Tổng tạm tính: ${formatVnd(quote.subtotal || quote.snapshotTotal)}`,
    publicUrl,
  ].join('\n');
  const copy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(message);
    } catch {
      window.prompt('Trình duyệt đang chặn clipboard. Hãy sao chép nội dung bên dưới:', value);
    }
  };
  const messenger = () => {
    publicApi.markMessengerOpened(token).catch(() => null);
    const opened = window.open(env.MESSENGER_URL, '_blank');
    if (opened) opened.opener = null;
    else notify(`Trình duyệt đã chặn cửa sổ mới. Hãy mở: ${env.MESSENGER_URL}`, 'info');
  };
  const expired = quote.status === 'EXPIRED';
  return (
    <Container className="py-12 sm:py-20">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <header className="border-b border-border p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="midi-eyebrow">Phiếu yêu cầu mua hàng</p>
              <h1 className="mt-4 font-display text-4xl font-normal tracking-[-0.05em] sm:text-5xl">
                {quote.code || quote.quoteCode}
              </h1>
            </div>
            <span className="rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em]">
              {statusLabel[quote.status] || quote.status}
            </span>
          </div>
          <div className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Tạo lúc: {new Date(quote.createdAt).toLocaleString('vi-VN')}</p>
            <p className="sm:text-right">
              Có hiệu lực đến: {new Date(quote.expiresAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </header>
        <div className="p-6 sm:p-10">
          {expired ? (
            <div className="mb-6 rounded-xl border-l-2 border-destructive bg-destructive/5 p-4 text-sm leading-6 text-destructive">
              Phiếu này đã hết hiệu lực. Hãy tạo phiếu mới để Midi Cosmetics kiểm tra lại giá và tồn
              kho.
            </div>
          ) : null}
          {quote.items?.map((item) => (
            <div
              key={item.uuid || `${item.name}-${item.sku}`}
              className="grid grid-cols-[4.5rem_1fr_auto] gap-4 border-b border-border py-5"
            >
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.name}
                className="h-20 w-full rounded-lg bg-secondary object-contain p-1"
              />
              <div>
                <p className="midi-eyebrow text-muted-foreground">
                  {item.sku || item.unit || 'MIDI'}
                </p>
                <h2 className="mt-2 font-display text-xl font-normal">{item.name}</h2>
                <p className="mt-2 text-sm">
                  {formatVnd(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <strong className="text-sm">
                {formatVnd(item.lineTotal || item.unitPrice * item.quantity)}
              </strong>
            </div>
          ))}
          <div className="mt-6 flex items-center justify-between font-display text-2xl">
            <span>Tổng tạm tính</span>
            <strong className="font-normal">
              {formatVnd(quote.subtotal || quote.snapshotTotal)}
            </strong>
          </div>
          {quote.note ? (
            <div className="mt-6 rounded-xl bg-secondary/60 p-4">
              <p className="midi-eyebrow text-muted-foreground">Ghi chú</p>
              <p className="mt-2 text-base leading-7">{quote.note}</p>
            </div>
          ) : null}
          <p className="mt-6 text-base leading-7 text-muted-foreground">
            Đây không phải hóa đơn tài chính hoặc đơn đã xác nhận. Giá và tồn kho sẽ được chủ shop
            xác nhận qua Messenger.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => copy(publicUrl, 'Đã sao chép link phiếu.')}>
              <Copy /> Sao chép link
            </Button>
            <Button variant="outline" onClick={() => copy(content, 'Đã sao chép nội dung phiếu.')}>
              <Copy /> Sao chép nội dung
            </Button>
            <Button className="sm:col-span-2" onClick={messenger} disabled={expired}>
              Mở Messenger Midi Cosmetics <ExternalLink />
            </Button>
            {navigator.share ? (
              <Button
                variant="outline"
                className="sm:col-span-2"
                onClick={() =>
                  navigator
                    .share({
                      title: `Phiếu ${quote.code || quote.quoteCode}`,
                      text: content,
                      url: publicUrl,
                    })
                    .catch(() => null)
                }
              >
                <Share2 /> Chia sẻ
              </Button>
            ) : null}
          </div>
        </div>
      </article>
    </Container>
  );
}
