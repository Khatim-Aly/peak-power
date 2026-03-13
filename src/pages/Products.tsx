import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Store, Package, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "@/components/auth/AuthModal";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductWithStore {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  category: string | null;
  merchant_id: string | null;
  store_name?: string | null;
}

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addToCart, setIsCartOpen } = useCartContext();
  const { showAuthModal, setShowAuthModal, executeProtectedAction, executePendingAction } = useProtectedAction();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (productsData && productsData.length > 0) {
      // Fetch store names for merchants
      const merchantIds = [...new Set(productsData.filter(p => p.merchant_id).map(p => p.merchant_id!))];
      
      let storeMap: Record<string, string> = {};
      if (merchantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, store_name, full_name")
          .in("user_id", merchantIds);

        if (profiles) {
          profiles.forEach((p: any) => {
            storeMap[p.user_id] = p.store_name || p.full_name || "Store";
          });
        }
      }

      setProducts(
        productsData.map((p) => ({
          ...p,
          store_name: p.merchant_id ? storeMap[p.merchant_id] || "Store" : null,
        }))
      );
    }
    setIsLoading(false);
  };

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleAddToCart = (productId: string, productName: string) => {
    executeProtectedAction(async () => {
      const { error } = await addToCart(productId, 1);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add to cart" });
      } else {
        toast({ title: "Added to Cart! 🎉", description: productName });
        setIsCartOpen(true);
      }
    });
  };

  return (
    <div className="min-h-screen pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Our <span className="text-gradient-gold">Products</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse all products from verified merchants
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {product.original_price && product.original_price > product.price && (
                    <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                      {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                    </Badge>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <Badge variant="secondary" className="absolute top-3 right-3">
                      Only {product.stock} left
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Store name */}
                  {product.store_name && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Store className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{product.store_name}</span>
                    </div>
                  )}

                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  )}

                  {product.category && (
                    <Badge variant="outline" className="mb-3 text-xs">{product.category}</Badge>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-lg font-bold">PKR {product.price.toLocaleString()}</span>
                      {product.original_price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          PKR {product.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-3"
                    size="sm"
                    disabled={product.stock === 0}
                    onClick={() => handleAddToCart(product.id, product.name)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={executePendingAction}
      />
    </div>
  );
};

export default Products;
