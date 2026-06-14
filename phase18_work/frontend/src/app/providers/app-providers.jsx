import { ThemeProvider } from "@/app/providers/theme-provider";

export function AppProviders({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
