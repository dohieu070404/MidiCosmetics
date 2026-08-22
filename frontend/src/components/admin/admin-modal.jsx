import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRef } from 'react';

import { useDialogFocus } from '@/hooks/use-dialog-focus';
import { cn } from '@/lib/utils';

export function AdminModal({ open, onClose, title, description, children, footer, size = 'xl' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  useDialogFocus({ open, containerRef: dialogRef, initialFocusRef: closeRef, onClose });

  if (!open) return null;

  const width = size === '2xl' ? 'max-w-6xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-5xl';
  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-[#211713]/55 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'midi-fade-up flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_90px_rgba(39,25,20,.28)]',
          width,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-normal tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background transition hover:border-primary hover:bg-secondary hover:text-primary"
            aria-label="Đóng popup"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-secondary/25 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
