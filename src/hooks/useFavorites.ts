import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Favorite {
  id: string;
  product_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(data);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (productId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, product_id: productId });

    if (!error) {
      await fetchFavorites();
    }

    return { error };
  };

  const removeFavorite = async (productId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (!error) {
      await fetchFavorites();
    }

    return { error };
  };

  const toggleFavorite = async (productId: string) => {
    const isFav = isFavorite(productId);
    return isFav ? removeFavorite(productId) : addFavorite(productId);
  };

  const isFavorite = (productId: string) => {
    return favorites.some(f => f.product_id === productId);
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    fetchFavorites,
  };
};
