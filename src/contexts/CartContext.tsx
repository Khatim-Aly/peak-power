import { createContext, useContext, ReactNode } from "react";
import { useCart, CartItem } from "@/hooks/useCart";

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number, variant?: string) => Promise<{ error: Error | null }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ error: Error | null } | undefined>;
  removeFromCart: (itemId: string) => Promise<{ error: Error | null }>;
  clearCart: () => Promise<{ error: Error | null }>;
  fetchCart: () => Promise<void>;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

import { useState } from "react";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartContext.Provider value={{ ...cart, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
};
