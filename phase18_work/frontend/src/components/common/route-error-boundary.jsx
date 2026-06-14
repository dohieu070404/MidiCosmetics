import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ROUTE_PATHS } from "@/app/router/route-paths";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : "Đã có lỗi xảy ra";
  const message = isRouteErrorResponse(error)
    ? error.data?.message || "Không thể tải trang này."
    : error instanceof Error
      ? error.message
      : "Ứng dụng gặp lỗi ngoài dự kiến.";

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-24 text-center">
      <div className="max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Lỗi ứng dụng</p>
        <h1 className="mt-4 font-display text-4xl text-foreground">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{message}</p>
        <Button asChild className="mt-8">
          <Link to={ROUTE_PATHS.home}>Về trang chủ</Link>
        </Button>
      </div>
    </main>
  );
}
