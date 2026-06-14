import { useEffect } from "react";

import { useThemeStore } from "@/stores/theme-store";

function applyTheme(theme) {
  const root = window.document.documentElement;
  const resolvedTheme = theme === "dark" ? "dark" : "light";

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.dataset.theme = resolvedTheme;
}

export function ThemeProvider({ children }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return children;
}
