import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  variant: string | null;
  created_at: string;
}

export const useCart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setCartItems(data);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1, variant?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Check stock
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .maybeSingle();

    if (!product) return { error: new Error('Product not found') };

    // Check if item already exists
    const existingItem = cartItems.find(
      item => item.product_id === productId && item.variant === (variant || null)
    );

    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stock) {
      return { error: new Error(`Only ${product.stock} available in stock (you have ${currentQty} in cart)`) };
    }

    if (existingItem) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existingItem.id);

      if (!error) await fetchCart();
      return { error };
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity,
        variant: variant || null,
      });

    if (!error) await fetchCart();
    return { error };
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(itemId);
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (!error) await fetchCart();
    return { error };
  };

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (!error) await fetchCart();
    return { error };
  };

  const clearCart = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (!error) await fetchCart();
    return { error };
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    totalItems,
  };
};
