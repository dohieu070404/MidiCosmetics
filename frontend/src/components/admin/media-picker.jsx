import { useEffect, useRef, useState } from 'react';
import { Check, Images, Search, X } from 'lucide-react';

import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { adminApi } from '@/lib/api/admin-api';
import { useDialogFocus } from '@/hooks/use-dialog-focus';

export function MediaPicker({ label = 'Chọn từ thư viện ảnh', onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  useDialogFocus({
    open,
    containerRef: dialogRef,
    initialFocusRef: searchRef,
    returnFocusRef: triggerRef,
    onClose: () => setOpen(false),
  });

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      adminApi
        .listMedia({ limit: 100, search })
        .then((response) => {
          if (active) setItems(response.data.media || []);
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, search]);

  const show = () => {
    setSelected(null);
    setLoading(true);
    setError('');
    setOpen(true);
  };

  const confirm = () => {
    if (!selected) return;
    onSelect?.(selected);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        disabled={disabled}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-semibold uppercase tracking-[0.08em] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Images className="mr-2 size-4" />
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-[#201713]/55 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-picker-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border p-4 sm:p-5">
              <div>
                <h2 id="media-picker-title" className="font-display text-2xl">
                  Chọn ảnh từ Media Library
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ảnh đã tải lên có thể dùng lại mà không tạo bản sao.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary"
                aria-label="Đóng thư viện ảnh"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="border-b border-border p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <span className="sr-only">Tìm ảnh</span>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên file hoặc alt text…"
                  className="min-h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {error ? (
                <p className="border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="aspect-square animate-pulse bg-secondary" />
                  ))}
                </div>
              ) : null}
              {!loading && !items.length ? (
                <p className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  Không tìm thấy ảnh phù hợp.
                </p>
              ) : null}
              {!loading && items.length ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {items.map((item) => {
                    const active = selected?.uuid === item.uuid;
                    return (
                      <button
                        key={item.uuid}
                        type="button"
                        onClick={() => setSelected(item)}
                        onDoubleClick={() => {
                          onSelect?.(item);
                          setOpen(false);
                        }}
                        className={`group relative overflow-hidden rounded-xl border bg-secondary text-left transition ${active ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary'}`}
                        aria-pressed={active}
                      >
                        <ImageWithFallback
                          src={item.secureUrl}
                          alt={item.altText || item.originalName}
                          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        <span className="block truncate bg-background p-2 text-xs">
                          {item.altText || item.originalName}
                        </span>
                        {active ? (
                          <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-4" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {selected
                  ? `${selected.originalName} · ${selected.width || '?'}×${selected.height || '?'}`
                  : 'Chọn một ảnh để tiếp tục'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-10 rounded-lg border border-border px-4 text-xs font-semibold uppercase tracking-[0.08em]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!selected}
                  className="min-h-10 rounded-lg bg-primary px-4 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground disabled:opacity-50"
                >
                  Dùng ảnh này
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
