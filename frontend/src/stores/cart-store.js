import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MIN_CART_QUANTITY = 1;
const MAX_CART_QUANTITY = 20;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const clampCartQuantity = (quantity) =>
  Math.max(MIN_CART_QUANTITY, Math.min(MAX_CART_QUANTITY, Number(quantity) || MIN_CART_QUANTITY));

const mergeCartItemsByUuid = (items) => {
  const itemsByUuid = new Map();

  for (const item of items) {
    const existingItem = itemsByUuid.get(item.uuid);

    itemsByUuid.set(
      item.uuid,
      existingItem
        ? {
            ...existingItem,
            ...item,
            quantity: clampCartQuantity(
              Number(existingItem.quantity || 0) + Number(item.quantity || 0),
            ),
          }
        : item,
    );
  }

  return [...itemsByUuid.values()];
};

export const normalizeCartProduct = (product) => {
  const stock = Number(product.stock);

  return {
    uuid: product.uuid || product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku || null,
    unit: product.unit || null,
    price: toNumber(product.price),
    currency: product.currency || 'VND',
    formattedPrice: product.formattedPrice || null,
    image: product.mainImage || product.images?.[0] || null,
    stock: Number.isFinite(stock) ? stock : null,
    available: product.status ? product.status === 'ACTIVE' : true,
    capturedAt: new Date().toISOString(),
  };
};

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      addItem: (product, quantity = 1) =>
        set((state) => {
          const item = normalizeCartProduct(product);
          const safeQuantity = clampCartQuantity(quantity);
          const existing = state.items.find((current) => current.uuid === item.uuid);

          if (existing) {
            return {
              items: state.items.map((current) =>
                current.uuid === item.uuid
                  ? {
                      ...current,
                      ...item,
                      quantity: clampCartQuantity(current.quantity + safeQuantity),
                    }
                  : current,
              ),
              drawerOpen: true,
            };
          }

          return { items: [...state.items, { ...item, quantity: safeQuantity }], drawerOpen: true };
        }),
      updateQuantity: (uuid, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.uuid === uuid ? { ...item, quantity: clampCartQuantity(quantity) } : item,
          ),
        })),
      removeItem: (uuid) =>
        set((state) => ({ items: state.items.filter((item) => item.uuid !== uuid) })),
      replaceItem: (uuid, nextItem) =>
        set((state) => {
          const refreshed = state.items.map((item) =>
            item.uuid === uuid ? { ...item, ...nextItem } : item,
          );
          // A database restore/import can assign a new UUID to the same slug.
          // Merge any stale/current duplicate after replacing the UUID so the
          // quote payload never contains duplicate or obsolete product IDs.
          return { items: mergeCartItemsByUuid(refreshed) };
        }),
      clearCart: () => set({ items: [], drawerOpen: false }),
    }),
    {
      name: 'midi-guest-cart-v1',
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCartCount = (state) =>
  state.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.items.reduce((total, item) => total + toNumber(item.price) * item.quantity, 0);
