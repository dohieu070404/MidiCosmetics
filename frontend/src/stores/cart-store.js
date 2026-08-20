import { create } from "zustand";
import { persist } from "zustand/middleware";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const normalizeCartProduct = (product) => ({
  uuid: product.uuid || product.id,
  slug: product.slug,
  name: product.name,
  sku: product.sku || null,
  unit: product.unit || null,
  price: toNumber(product.price),
  currency: product.currency || "VND",
  formattedPrice: product.formattedPrice || null,
  image: product.mainImage || product.images?.[0] || null,
  stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : null,
  available: product.status ? product.status === "ACTIVE" : true,
  capturedAt: new Date().toISOString(),
});

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      addItem: (product, quantity = 1) => set((state) => {
        const item = normalizeCartProduct(product);
        const safeQuantity = Math.max(1, Math.min(20, Number(quantity) || 1));
        const existing = state.items.find((current) => current.uuid === item.uuid);
        if (existing) {
          return { items: state.items.map((current) => current.uuid === item.uuid ? { ...current, ...item, quantity: Math.min(20, current.quantity + safeQuantity) } : current), drawerOpen: true };
        }
        return { items: [...state.items, { ...item, quantity: safeQuantity }], drawerOpen: true };
      }),
      updateQuantity: (uuid, quantity) => set((state) => ({
        items: state.items.map((item) => item.uuid === uuid ? { ...item, quantity: Math.max(1, Math.min(20, Number(quantity) || 1)) } : item),
      })),
      removeItem: (uuid) => set((state) => ({ items: state.items.filter((item) => item.uuid !== uuid) })),
      replaceItem: (uuid, nextItem) => set((state) => {
        const refreshed = state.items.map((item) => item.uuid === uuid ? { ...item, ...nextItem } : item);
        // A database restore/import can assign a new UUID to the same slug.
        // Merge any stale/current duplicate after replacing the UUID so the
        // quote payload never contains duplicate or obsolete product IDs.
        const byUuid = new Map();
        for (const item of refreshed) {
          const existing = byUuid.get(item.uuid);
          byUuid.set(item.uuid, existing
            ? { ...existing, ...item, quantity: Math.min(20, Number(existing.quantity || 0) + Number(item.quantity || 0)) }
            : item);
        }
        return { items: [...byUuid.values()] };
      }),
      clearCart: () => set({ items: [], drawerOpen: false }),
    }),
    {
      name: "midi-guest-cart-v1",
      version: 1,
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const selectCartCount = (state) => state.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state) => state.items.reduce((total, item) => total + toNumber(item.price) * item.quantity, 0); 