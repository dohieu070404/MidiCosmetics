import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <Button
      variant="outline"
      size="icon"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Đổi sang giao diện sáng" : "Đổi sang giao diện tối"}
      title={isDark ? "Giao diện tối" : "Giao diện sáng"}
    >
      <Icon />
    </Button>
  );
}
