import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme: theme === "dark" ? "dark" : "light" }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "midi-cosmetics-theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
