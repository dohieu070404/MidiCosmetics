import { create } from "zustand";

export const useAppStore = create((set) => ({
  commandMenuOpen: false,
  sidebarCollapsed: false,
  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
