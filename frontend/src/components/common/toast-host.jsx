import { Check, Info, X } from 'lucide-react';
import { useEffect } from 'react';

import { useAppStore } from '@/stores/app-store';

export function ToastHost() {
  const toast = useAppStore((state) => state.toast);
  const clearToast = useAppStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(clearToast, 3200);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);

  if (!toast) return null;
  return (
    <div
      className="fixed inset-x-4 bottom-5 z-[100] flex justify-center sm:inset-x-auto sm:right-6"
      role="status"
      aria-live="polite"
    >
      <div className="midi-fade-up flex max-w-md items-center gap-3 rounded-md border border-border bg-foreground px-4 py-3 text-sm text-background shadow-2xl">
        {toast.type === 'info' ? <Info className="size-4" /> : <Check className="size-4" />}
        <span className="min-w-0 flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={clearToast}
          className="grid size-8 place-items-center rounded-full hover:bg-background/10"
          aria-label="Đóng thông báo"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
