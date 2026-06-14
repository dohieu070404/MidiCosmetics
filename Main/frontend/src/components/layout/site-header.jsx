import { NavLink } from "react-router-dom";

import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PUBLIC_NAVIGATION } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e1d3c1]/80 bg-[#f4ecdf]/95 text-foreground backdrop-blur-xl dark:border-[#4a3b32] dark:bg-[#241c17]/95">
      <div className="luxury-container relative flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-6">
        <BrandLogo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {PUBLIC_NAVIGATION.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground",
                  isActive && "bg-secondary text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
        </div>
        <MobileNavigation />
      </div>
    </header>
  );
}
