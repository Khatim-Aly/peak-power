import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { useCart, CartItem } from "@/hooks/useCart";
import AddToCartFeedback from "@/components/AddToCartFeedback";

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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [feedbackProduct, setFeedbackProduct] = useState<string | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);

  const wrappedAddToCart = useCallback(async (productId: string, quantity?: number, variant?: string) => {
    const result = await cart.addToCart(productId, quantity, variant);
    if (!result.error) {
      setFeedbackProduct(undefined); // Will show generic "Added to Cart"
      setShowFeedback(true);
    }
    return result;
  }, [cart.addToCart]);

  return (
    <CartContext.Provider value={{ ...cart, addToCart: wrappedAddToCart, isCartOpen, setIsCartOpen }}>
      {children}
      <AddToCartFeedback
        show={showFeedback}
        productName={feedbackProduct}
        onDone={() => setShowFeedback(false)}
      />
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
