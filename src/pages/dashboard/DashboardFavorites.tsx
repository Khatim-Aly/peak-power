import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardFavorites = () => {
  const { favorites, isLoading, removeFavorite } = useFavorites();

  return (
    <DashboardLayout 
      title="My Favorites"
      subtitle="Products you've saved for later"
    >
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <Heart className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-xl font-serif font-bold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6">
            Start adding products you love to your favorites
          </p>
          <Link to="/product">
            <Button variant="hero">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden group"
            >
              <div className="aspect-square bg-muted relative">
                {favorite.product?.image_url ? (
                  <img 
                    src={favorite.product.image_url} 
                    alt={favorite.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                <button
                  onClick={() => removeFavorite(favorite.product_id)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-1">{favorite.product?.name || 'Product'}</h3>
                <p className="text-gold font-bold text-lg">
                  £{favorite.product?.price?.toFixed(2) || '0.00'}
                </p>
                <div className="flex gap-2 mt-4">
                  <Link to="/product" className="flex-1">
                    <Button variant="outline" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFavorite(favorite.product_id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardFavorites;
