import { create } from "zustand";

export const useAppStore = create((set) => ({
  commandMenuOpen: false,
  sidebarCollapsed: false,
  toast: null,
  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  notify: (message, type = "success") => set({ toast: { id: Date.now(), message, type } }),
  clearToast: () => set({ toast: null }),
}));
