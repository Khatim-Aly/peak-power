import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Star, MapPin, Package, ShoppingCart, MessageSquare, Calendar, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCartContext } from "@/contexts/CartContext";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { AuthModal } from "@/components/auth/AuthModal";

interface MerchantProfile {
  user_id: string;
  full_name: string | null;
  store_name: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock: number;
  category: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  reviewer_name?: string;
}

const MerchantProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addToCart, setIsCartOpen } = useCartContext();
  const { showAuthModal, setShowAuthModal, executeProtectedAction, executePendingAction } = useProtectedAction();

  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchMerchantData(id);
  }, [id]);

  const fetchMerchantData = async (merchantId: string) => {
    setIsLoading(true);
    const [profileRes, productsRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, store_name, city, avatar_url, created_at").eq("user_id", merchantId).maybeSingle(),
      supabase.from("products").select("*").eq("merchant_id", merchantId).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("merchant_reviews").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setMerchant(profileRes.data as MerchantProfile);
    if (productsRes.data) setProducts(productsRes.data as Product[]);

    if (reviewsRes.data && reviewsRes.data.length > 0) {
      // Fetch reviewer names
      const reviewerIds = [...new Set(reviewsRes.data.map((r) => r.user_id))];
      const { data: reviewers } = await supabase.from("profiles").select("user_id, full_name").in("user_id", reviewerIds);
      const nameMap: Record<string, string> = {};
      reviewers?.forEach((p: any) => (nameMap[p.user_id] = p.full_name || "Customer"));
      setReviews(reviewsRes.data.map((r: any) => ({ ...r, reviewer_name: nameMap[r.user_id] || "Customer" })));
    }
    setIsLoading(false);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

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

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-48 w-full mb-8 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen pt-20">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Merchant not found</h1>
          <Link to="/products">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const storeName = merchant.store_name || merchant.full_name || "Store";

  return (
    <div className="min-h-screen pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        {/* Hero / Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-gold/20 via-gold/5 to-transparent rounded-3xl border border-gold/20 p-6 md:p-10 mb-8 overflow-hidden"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 rounded-2xl bg-gold/20 border-2 border-gold flex items-center justify-center text-gold text-3xl font-serif font-bold shrink-0">
              {storeName[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-5 h-5 text-gold" />
                <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">Verified Merchant</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{storeName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {merchant.city && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {merchant.city}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Joined {new Date(merchant.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5"><Package className="w-4 h-4" /> {products.length} active products</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(avgRating) ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {reviews.length > 0 ? `${avgRating.toFixed(1)} • ${reviews.length} review${reviews.length > 1 ? "s" : ""}` : "No reviews yet"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-6 bg-muted/50">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No products published yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-gold/30 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                      {product.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold">PKR {product.price.toLocaleString()}</span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">PKR {product.original_price.toLocaleString()}</span>
                        )}
                      </div>
                      <Button className="w-full" size="sm" disabled={product.stock === 0} onClick={() => handleAddToCart(product.id, product.name)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No reviews yet. Be the first verified buyer to review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl border border-border p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-medium">
                          {review.reviewer_name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p className="font-medium">{review.reviewer_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("en-GB")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={executePendingAction} />
    </div>
  );
};

export default MerchantProfilePage;
