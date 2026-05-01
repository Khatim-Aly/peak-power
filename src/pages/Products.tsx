import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, Store, Package, Search, Sparkles, TrendingUp, ArrowRight, Edit, Trash2, Shield } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import ProductFormModal from "@/components/dashboard/ProductFormModal";

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
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductWithStore | null>(null);
  const [formOpen, setFormOpen] = useState(false);
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
      const merchantIds = [...new Set(productsData.filter((p) => p.merchant_id).map((p) => p.merchant_id!))];
      let storeMap: Record<string, string> = {};
      if (merchantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, store_name, full_name")
          .in("user_id", merchantIds);
        profiles?.forEach((p: any) => {
          storeMap[p.user_id] = p.store_name || p.full_name || "Store";
        });
      }
      setProducts(
        productsData.map((p) => ({
          ...p,
          store_name: p.merchant_id ? storeMap[p.merchant_id] || "Store" : null,
        })),
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

  const handleAdminEdit = (product: ProductWithStore) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleAdminDelete = async (product: ProductWithStore) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Product Deleted", description: `${product.name} has been removed.` });
    fetchProducts();
  };

  return (
    <div className="min-h-screen pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Curated marketplace
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">
            Discover <span className="text-gradient-gold">Premium Goods</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Hand-picked products from verified merchants across Pakistan
          </p>
        </motion.div>

        {/* Sell CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border border-gold/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold">Sell on PeakPower GB</h3>
              <p className="text-sm text-muted-foreground">Reach thousands of customers — apply to become a merchant.</p>
            </div>
          </div>
          <Link to="/dashboard/requests">
            <Button variant="hero" size="sm">
              Apply Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Search & Filters - sticky */}
        <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-lg py-4 -mx-4 px-4 mb-8 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products, categories, brands..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)} className="rounded-full">
                All
              </Button>
              {categories.map((cat) => (
                <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)} className="rounded-full capitalize">
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            {filtered.length} {filtered.length === 1 ? "product" : "products"} available
          </p>
        </div>

        {/* Masonry Grid */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="w-full break-inside-avoid mb-6" style={{ height: `${250 + (i % 3) * 80}px` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filtered.map((product, i) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="group relative break-inside-avoid bg-card rounded-2xl border border-border overflow-hidden hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-300 mb-6"
              >
                {/* Image — links to detail page */}
                <Link to={`/product/${product.id}`} className="block relative bg-muted overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Floating badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.original_price && product.original_price > product.price && (
                      <Badge className="bg-destructive text-destructive-foreground shadow-lg">
                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                      </Badge>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <Badge variant="secondary" className="bg-amber-500 text-white shadow-lg">
                        Only {product.stock} left
                      </Badge>
                    )}
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAdminEdit(product);
                        }}
                        title="Edit product (Admin)"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAdminDelete(product);
                        }}
                        title="Delete product (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Admin badge */}
                  {isAdmin && (
                    <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-medium shadow-lg">
                      <Shield className="w-3 h-3" /> Admin
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4">
                  {/* Clickable merchant store name */}
                  {product.merchant_id && product.store_name && (
                    <Link
                      to={`/merchant/${product.merchant_id}`}
                      className="inline-flex items-center gap-1.5 mb-2 text-xs text-gold hover:underline group/store"
                    >
                      <Store className="w-3 h-3" />
                      <span className="font-medium">{product.store_name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover/store:opacity-100 -translate-x-1 group-hover/store:translate-x-0 transition-all" />
                    </Link>
                  )}

                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-base mb-1 line-clamp-1 hover:text-gold transition-colors">{product.name}</h3>
                  </Link>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  )}

                  {product.category && (
                    <Badge variant="outline" className="mb-3 text-xs capitalize">{product.category}</Badge>
                  )}

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold">PKR {product.price.toLocaleString()}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through">PKR {product.original_price.toLocaleString()}</span>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    disabled={product.stock === 0}
                    onClick={() => handleAddToCart(product.id, product.name)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <Footer />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={executePendingAction} />

      {isAdmin && user && (
        <ProductFormModal
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingProduct(null);
          }}
          product={editingProduct as any}
          userId={user.id}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
};

export default Products;
