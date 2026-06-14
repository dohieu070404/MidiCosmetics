import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
  user: null,
  accessToken: null,
  permissions: [],
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
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
    }),
    {
      name: "midi-auth-session",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, permissions: state.permissions }),
    }
  )
);
