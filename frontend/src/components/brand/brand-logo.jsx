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
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-primary/15 bg-[#f9f5f0] shadow-sm ring-1 ring-white/60 transition-transform duration-200 group-hover:scale-[1.03] sm:size-14">
        <picture>
          <source srcSet="/brand/midi-logo.webp" type="image/webp" />
          <img
            src="/brand/midi-logo.png"
            alt=""
            className="h-full w-full object-cover"
            decoding="async"
            loading="eager"
          />
        </picture>
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-base font-semibold tracking-tight sm:text-xl">Midi Cosmetics</span>
        <span className="mt-1 hidden text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground sm:block">Mỹ phẩm & nước hoa chính hãng</span>
      </span>
    </Link>
  );
}
