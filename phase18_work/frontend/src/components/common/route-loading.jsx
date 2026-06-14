export function RouteLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        Đang tải
      </div>
    </div>
  );
}
