import { create } from "zustand";

const initialState = {
  user: null,
  accessToken: null,
  permissions: [],
};

// Access tokens intentionally live in memory only. The HttpOnly refresh cookie
// restores the session after a reload, so an XSS cannot steal a persisted token
// from localStorage/sessionStorage.
export const useAuthStore = create((set, get) => ({
  ...initialState,
  setSession: ({ user, tokens }) =>
    set({
      user,
      accessToken: tokens?.accessToken ?? null,
      permissions: user?.permissions ?? [],
    }),
  updateAccessToken: (accessToken) => set({ accessToken }),
  logout: () => set(initialState),
  isAuthenticated: () => Boolean(get().accessToken && get().user),
  isAdmin: () => get().user?.role === "ADMIN",
}));
