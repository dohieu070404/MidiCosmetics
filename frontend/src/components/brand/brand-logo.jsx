import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }) {
  return (
    <Link
      to={ROUTE_PATHS.home}
      className={cn("group inline-flex min-w-0 items-center rounded-full", className)}
      aria-label="Về trang chủ Midi Cosmetics"
    >
      <img
        src="/brand/midi-logo.webp"
        alt="Midi Cosmetics & Perfume"
        className="size-12 rounded-full object-cover mix-blend-multiply ring-1 ring-primary/10 transition duration-500 group-hover:scale-[1.035] group-hover:ring-primary/25 sm:size-14 lg:size-[4.65rem]"
        width="80"
        height="80"
      />
    </Link>
  );
}
