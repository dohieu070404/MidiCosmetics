import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-6 py-24 text-center">
      <div className="max-w-lg">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">404</p>
        <h1 className="mt-4 font-display text-5xl">Không tìm thấy trang</h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.</p>
        <Button asChild className="mt-8">
          <Link to={ROUTE_PATHS.home}>Về trang chủ</Link>
        </Button>
      </div>
    </main>
  );
}
