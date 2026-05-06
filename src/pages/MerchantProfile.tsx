import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, Star, MapPin, Package, ShoppingCart, MessageSquare, Calendar, ArrowLeft,
  Heart, Users, Instagram, Facebook, Globe, Truck, RotateCcw, Pin, Send,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCartContext } from "@/contexts/CartContext";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

interface MerchantProfile {
  user_id: string;
  full_name: string | null;
  store_name: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  theme_color: string | null;
  return_policy: string | null;
  shipping_policy: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  social_whatsapp: string | null;
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
  is_featured_on_store: boolean;
  pinned_order: number | null;
  rating_avg: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  reviewer_name?: string;
}

interface StoreStats {
  total_products: number;
  total_sales: number;
  follower_count: number;
  review_count: number;
  avg_rating: number;
}

const MerchantProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart, setIsCartOpen } = useCartContext();
  const { showAuthModal, setShowAuthModal, executeProtectedAction, executePendingAction } = useProtectedAction();

  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Review form
  const [canReview, setCanReview] = useState<{ allowed: boolean; orderId?: string }>({ allowed: false });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) fetchAll(id);
  }, [id, user?.id]);

  const fetchAll = async (merchantId: string) => {
    setIsLoading(true);
    const [profileRes, productsRes, reviewsRes, statsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", merchantId).maybeSingle(),
      supabase.from("products")
        .select("id,name,description,price,original_price,image_url,stock,category,is_featured_on_store,pinned_order,rating_avg")
        .eq("merchant_id", merchantId).eq("is_active", true)
        .order("is_featured_on_store", { ascending: false })
        .order("pinned_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("merchant_reviews").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false }),
      supabase.rpc("get_store_stats", { _merchant_id: merchantId }),
    ]);

    if (profileRes.data) setMerchant(profileRes.data as any);
    if (productsRes.data) setProducts(productsRes.data as any);
    if (statsRes.data) setStats(statsRes.data as any);

    if (reviewsRes.data && reviewsRes.data.length > 0) {
      const reviewerIds = [...new Set(reviewsRes.data.map((r) => r.user_id))];
      const { data: reviewers } = await supabase.from("profiles").select("user_id, full_name").in("user_id", reviewerIds);
      const nameMap: Record<string, string> = {};
      reviewers?.forEach((p: any) => (nameMap[p.user_id] = p.full_name || "Customer"));
      setReviews(reviewsRes.data.map((r: any) => ({ ...r, reviewer_name: nameMap[r.user_id] || "Customer" })));
    } else {
      setReviews([]);
    }

    // Check follow + review eligibility
    if (user) {
      const [{ data: follow }, { data: orders }] = await Promise.all([
        supabase.from("store_follows").select("id").eq("user_id", user.id).eq("merchant_id", merchantId).maybeSingle(),
        supabase.from("orders").select("id, status, order_items!inner(product_id, products!inner(merchant_id))")
          .eq("user_id", user.id).eq("status", "delivered"),
      ]);
      setIsFollowing(!!follow);

      const eligibleOrder = (orders || []).find((o: any) =>
        o.order_items?.some((oi: any) => oi.products?.merchant_id === merchantId)
      );
      const { data: existing } = await supabase.from("merchant_reviews").select("id")
        .eq("user_id", user.id).eq("merchant_id", merchantId).maybeSingle();
      setCanReview({ allowed: !!eligibleOrder && !existing, orderId: eligibleOrder?.id });
    }

    setIsLoading(false);
  };

  const toggleFollow = () => {
    executeProtectedAction(async () => {
      if (!id || !user) return;
      setFollowBusy(true);
      if (isFollowing) {
        await supabase.from("store_follows").delete().eq("user_id", user.id).eq("merchant_id", id);
        setIsFollowing(false);
        toast({ title: "Unfollowed", description: "You won't get updates from this store." });
      } else {
        await supabase.from("store_follows").insert({ user_id: user.id, merchant_id: id });
        setIsFollowing(true);
        toast({ title: "Following! 🎉", description: "You'll be notified about new products." });
      }
      setFollowBusy(false);
      if (id) fetchAll(id);
    });
  };

  const handleAddToCart = (productId: string, productName: string) => {
    executeProtectedAction(async () => {
      const { error } = await addToCart(productId, 1);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to add to cart" });
      } else {
        toast({ title: "Added to Cart! 🎉", description: productName });
        setIsCartOpen(true);
      }
    });
  };

  const submitReview = async () => {
    if (!user || !id || !canReview.orderId) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("merchant_reviews").insert({
      user_id: user.id,
      merchant_id: id,
      order_id: canReview.orderId,
      rating: newRating,
      comment: newComment.trim() || null,
    });
    setSubmittingReview(false);
    if (error) {
      toast({ variant: "destructive", title: "Could not submit", description: error.message });
    } else {
      toast({ title: "Review posted ⭐", description: "Thanks for sharing your experience!" });
      setNewComment("");
      setNewRating(5);
      fetchAll(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full mb-8 rounded-2xl" />
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
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const storeName = merchant.store_name || merchant.full_name || "Store";
  const themeColor = merchant.theme_color || "#D4A574";

  return (
    <div className="min-h-screen pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-3xl overflow-hidden border border-border mb-6"
          style={{ background: `linear-gradient(135deg, ${themeColor}33, transparent)` }}
        >
          <div className="h-40 md:h-56 relative">
            {merchant.banner_url ? (
              <img src={merchant.banner_url} alt={`${storeName} banner`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${themeColor}55, ${themeColor}11)` }} />
            )}
          </div>

          <div className="p-6 md:p-8 -mt-12 relative">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              <div
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-background flex items-center justify-center text-3xl font-serif font-bold shrink-0 overflow-hidden shadow-xl"
                style={{ background: `${themeColor}33`, color: themeColor }}
              >
                {merchant.avatar_url ? (
                  <img src={merchant.avatar_url} alt={storeName} className="w-full h-full object-cover" />
                ) : (
                  storeName[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="border" style={{ background: `${themeColor}22`, color: themeColor, borderColor: `${themeColor}55` }}>
                    <Store className="w-3 h-3 mr-1" /> Verified Merchant
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{storeName}</h1>
                {merchant.bio && <p className="text-muted-foreground max-w-2xl mb-3">{merchant.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {merchant.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {merchant.city}</span>}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Joined {new Date(merchant.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                onClick={toggleFollow}
                disabled={followBusy}
                variant={isFollowing ? "outline" : "default"}
                className="shrink-0"
              >
                <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                {isFollowing ? "Following" : "Follow Store"}
              </Button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[
                  { icon: Package, label: "Products", value: stats.total_products },
                  { icon: ShoppingCart, label: "Sales", value: stats.total_sales },
                  { icon: Users, label: "Followers", value: stats.follower_count },
                  { icon: Star, label: "Rating", value: stats.avg_rating ? `${Number(stats.avg_rating).toFixed(1)} ★` : "—" },
                ].map((s) => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
                    <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: themeColor }} />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Socials */}
            {(merchant.social_instagram || merchant.social_facebook || merchant.social_tiktok || merchant.social_whatsapp) && (
              <div className="flex items-center gap-2 mt-4">
                {merchant.social_instagram && (
                  <a href={merchant.social_instagram} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {merchant.social_facebook && (
                  <a href={merchant.social_facebook} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {merchant.social_tiktok && (
                  <a href={merchant.social_tiktok} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {merchant.social_whatsapp && (
                  <a href={`https://wa.me/${merchant.social_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition">
                    <Send className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-6 bg-muted/50 flex-wrap h-auto">
            <TabsTrigger value="products"><Package className="w-4 h-4 mr-2" /> Products ({products.length})</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare className="w-4 h-4 mr-2" /> Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="policies"><Shield className="w-4 h-4 mr-2" /> Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <EmptyState icon={Package} text="No products published yet" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-gold/30 hover:shadow-xl transition-all duration-300 relative"
                  >
                    {product.is_featured_on_store && (
                      <Badge className="absolute top-3 right-3 z-10" style={{ background: themeColor, color: "#fff" }}>
                        <Pin className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                    )}
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground/30" /></div>
                        )}
                        {product.original_price && product.original_price > product.price && (
                          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                            {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1 hover:text-gold transition">{product.name}</h3>
                      </Link>
                      {product.rating_avg > 0 && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-gold text-gold" /> {Number(product.rating_avg).toFixed(1)}
                        </div>
                      )}
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
            {/* Verified buyer review form */}
            {canReview.allowed && (
              <div className="bg-card rounded-2xl border border-border p-5 mb-6">
                <h3 className="font-semibold mb-3">Share your experience with {storeName}</h3>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setNewRating(s)} type="button">
                      <Star className={`w-7 h-7 ${s <= newRating ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tell other buyers about service, packaging, delivery..."
                  className="mb-3"
                  rows={3}
                />
                <Button onClick={submitReview} disabled={submittingReview}>
                  {submittingReview ? "Posting..." : "Post Review"}
                </Button>
              </div>
            )}

            {reviews.length === 0 ? (
              <EmptyState icon={MessageSquare} text="No reviews yet. Verified buyers can review after delivery." />
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

          <TabsContent value="policies">
            <div className="grid md:grid-cols-2 gap-4">
              <PolicyCard icon={Truck} title="Shipping Policy" text={merchant.shipping_policy} />
              <PolicyCard icon={RotateCcw} title="Return Policy" text={merchant.return_policy} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={executePendingAction} />
    </div>
  );
};

const Shield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-16 bg-card rounded-2xl border border-border">
    <Icon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
    <p className="text-muted-foreground">{text}</p>
  </div>
);

const PolicyCard = ({ icon: Icon, title, text }: { icon: any; title: string; text: string | null }) => (
  <div className="bg-card rounded-2xl border border-border p-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-gold" />
      <h3 className="font-semibold">{title}</h3>
    </div>
    <p className="text-sm text-muted-foreground whitespace-pre-line">{text || "No policy provided by this merchant."}</p>
  </div>
);

export default MerchantProfilePage;
