"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/lib/types";

const STORAGE_KEY = "atelier-home-cart";

export type CartItem = {
  productId: number;
  name: string;
  category: string;
  imagePath: string;
  price: number;
  color: string;
  material: string;
  size: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isReady: boolean;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setItems(JSON.parse(saved) as CartItem[]);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  function addItem(product: Product, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          imagePath: product.imagePath,
          price: product.price,
          color: product.color,
          material: product.material,
          size: product.size,
          quantity,
        },
      ];
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.productId !== productId);
      }

      return current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      );
    });
  }

  function removeItem(productId: number) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        isReady,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return value;
}
