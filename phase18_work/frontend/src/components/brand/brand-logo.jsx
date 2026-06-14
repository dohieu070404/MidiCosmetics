import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }) {
  return (
    <Link
      to={ROUTE_PATHS.home}
      className={cn("group inline-flex min-w-0 items-center gap-2 sm:gap-3", className)}
      aria-label="Về trang chủ Midi Cosmetics"
    >
      <span className="grid size-9 shrink-0 place-items-center sm:size-10 rounded-full border border-primary/20 bg-card px-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        midi
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-base font-semibold tracking-tight sm:text-xl">Midi Cosmetics</span>
        <span className="mt-1 hidden text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground sm:block">Mỹ phẩm & chăm sóc da</span>
      </span>
    </Link>
  );
}
