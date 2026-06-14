import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAVIGATION } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button variant="outline" size="icon" type="button" onClick={() => setOpen((value) => !value)} aria-label="Mở hoặc đóng menu điều hướng">
        {open ? <X /> : <Menu />}
      </Button>
      {open ? (
        <div className="absolute inset-x-4 top-16 z-50 rounded-2xl border border-border bg-card p-4 shadow-xl sm:top-20">
          <nav className="grid gap-1" aria-label="Điều hướng di động">
            {PUBLIC_NAVIGATION.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    isActive && "bg-secondary text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-end border-t border-border pt-4">
            <ThemeToggle />
          </div>
        </div>
      ) : null}
    </div>
  );
}
