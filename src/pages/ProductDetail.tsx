import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Package,
  Store,
  Truck,
  Shield,
  CheckCircle,
  Minus,
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { AuthModal } from "@/components/auth/AuthModal";
import ProductReviews from "@/components/ProductReviews";

interface ProductFull {
  id: string;
  name: string;
  description: string | null;
  description_long: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  gallery_urls: string[] | null;
  category: string | null;
  merchant_id: string | null;
  rating_avg: number;
  rating_count: number;
  sales_count: number;
  variants: any;
  store_name?: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, setIsCartOpen } = useCartContext();
  const { showAuthModal, setShowAuthModal, executeProtectedAction, executePendingAction } =
    useProtectedAction();
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<ProductFull[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (id) load();
    window.scrollTo(0, 0);
  }, [id]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("id", id!).maybeSingle();
    if (!data) {
      setLoading(false);
      return;
    }
    let storeName: string | undefined;
    if (data.merchant_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("store_name, full_name")
        .eq("user_id", data.merchant_id)
        .maybeSingle();
      storeName = prof?.store_name || prof?.full_name || "Store";
    }
    const full = { ...data, store_name: storeName } as ProductFull;
    setProduct(full);
    setActiveImage(full.image_url);

    // related products in same category
    if (data.category) {
      const { data: rel } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(4);
      if (rel) setRelated(rel as ProductFull[]);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!product) return;
    executeProtectedAction(async () => {
      setIsAdding(true);
      const { error } = await addToCart(product.id, quantity);
      setIsAdding(false);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add to cart" });
      } else {
        toast({ title: "Added to Cart 🎉", description: `${product.name} × ${quantity}` });
        setIsCartOpen(true);
      }
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    executeProtectedAction(async () => {
      await addToCart(product.id, quantity);
      navigate("/checkout");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <Navigation />
        <div className="container mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <Link to="/products">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const gallery = [
    product.image_url,
    ...(product.gallery_urls || []),
  ].filter(Boolean) as string[];

  const discountPct =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0;

  return (
    <div className="min-h-screen pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gold">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <span className="capitalize">{product.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl overflow-hidden mb-4"
            >
              <div className="aspect-square relative bg-muted">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                )}
                {discountPct > 0 && (
                  <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground shadow-lg">
                    {discountPct}% OFF
                  </Badge>
                )}
              </div>
            </motion.div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {gallery.map((url) => (
                  <button
                    key={url}
                    onClick={() => setActiveImage(url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === url ? "border-gold" : "border-border hover:border-gold/50"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.merchant_id && product.store_name && (
              <Link
                to={`/merchant/${product.merchant_id}`}
                className="inline-flex items-center gap-2 mb-3 text-sm text-gold hover:underline"
              >
                <Store className="w-4 h-4" />
                <span className="font-medium">{product.store_name}</span>
              </Link>
            )}

            <h1 className="text-3xl lg:text-4xl font-serif font-bold mb-3">{product.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= Math.round(product.rating_avg)
                        ? "fill-gold text-gold"
                        : "text-muted-foreground/40"
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                  {product.rating_avg.toFixed(1)} ({product.rating_count} reviews)
                </span>
              </div>
              {product.sales_count > 0 && (
                <span className="text-sm text-muted-foreground">
                  {product.sales_count}+ sold
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-gold">
                PKR {product.price.toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  PKR {product.original_price.toLocaleString()}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground mb-6">{product.description}</p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {product.stock > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center gap-2 border border-border rounded-full">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-9 h-9 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                className="flex-1"
                disabled={product.stock === 0 || isAdding}
                onClick={handleAdd}
              >
                {isAdding ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="hero"
                className="flex-1"
                disabled={product.stock === 0}
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="w-4 h-4 text-gold" />
                Fast Delivery
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-gold" />
                Secure Checkout
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-gold" />
                Verified Seller
              </div>
            </div>
          </div>
        </div>

        {/* Long description */}
        {product.description_long && (
          <section className="mt-12">
            <h2 className="text-2xl font-serif font-bold mb-4">Product Details</h2>
            <div className="bg-card border border-border rounded-2xl p-6 prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              {product.description_long}
            </div>
          </section>
        )}

        {/* Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-serif font-bold mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-muted">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                    <p className="text-gold font-bold text-sm mt-1">PKR {p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
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

export default ProductDetail;
