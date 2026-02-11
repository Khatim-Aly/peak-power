import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ProductGallery from "./ProductGallery";
import { AuthModal } from "./auth/AuthModal";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  label: string;
  isBestValue?: boolean;
}

const ProductCard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<string>("20g");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [dbProducts, setDbProducts] = useState<Record<string, string>>({});
  const { addToCart } = useCart();
  
  const { 
    showAuthModal, 
    setShowAuthModal, 
    executeProtectedAction, 
    executePendingAction 
  } = useProtectedAction();

  // Fetch product IDs from DB
  useEffect(() => {
    supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(p => {
            if (p.name.includes('10g')) map['10g'] = p.id;
            if (p.name.includes('20g')) map['20g'] = p.id;
          });
          setDbProducts(map);
        }
      });
  }, []);

  const variants: ProductVariant[] = [
    {
      id: "10g",
      productId: dbProducts['10g'] || '',
      size: "10 Grams",
      originalPrice: 2000,
      discount: 20,
      finalPrice: 1600,
      label: "Great for First-Time Users",
    },
    {
      id: "20g",
      productId: dbProducts['20g'] || '',
      size: "20 Grams",
      originalPrice: 4000,
      discount: 30,
      finalPrice: 2800,
      label: "Best Value",
      isBestValue: true,
    },
  ];

  const currentVariant = variants.find((v) => v.id === selectedVariant)!;
  const savings = currentVariant.originalPrice - currentVariant.finalPrice;
  const totalPrice = currentVariant.finalPrice * quantity;
  const totalSavings = savings * quantity;

  const performAddToCart = async () => {
    if (!currentVariant.productId) {
      toast({ title: "Error", description: "Product not found", variant: "destructive" });
      return;
    }
    setIsAddingToCart(true);
    const { error } = await addToCart(currentVariant.productId, quantity, currentVariant.id);
    setIsAddingToCart(false);
    
    if (error) {
      toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" });
    } else {
      toast({
        title: "Added to Cart! 🎉",
        description: `${quantity}x ${currentVariant.size} Pure Himalayan Shilajit`,
      });
    }
  };

  const performBuyNow = () => {
    navigate("/checkout");
  };

  const handleAddToCart = () => {
    executeProtectedAction(performAddToCart);
  };

  const handleBuyNow = () => {
    executeProtectedAction(performBuyNow);
  };

  return (
    <section className="py-24 relative overflow-hidden" id="product">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Product Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative lg:sticky lg:top-32"
          >
            <ProductGallery />

            {/* Trust Badges Below Image */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                "100% Authentic",
                "Lab Tested",
                "No Additives",
                "Himalayan Source",
              ].map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-gold" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Ratings */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Star className="w-5 h-5 star-filled fill-current" />
                  </motion.div>
                ))}
              </div>
              <span className="text-muted-foreground text-sm">(2,847 reviews)</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              Pure Himalayan <span className="text-gradient-gold">Shilajit</span>
            </h1>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Experience the ancient power of authentic Shilajit, harvested from 
              pristine Himalayan altitudes above 5000 meters. Rich in fulvic acid 
              and 85+ trace minerals for complete wellness support.
            </p>

            {/* Variant Selector */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Select Size
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {variants.map((variant) => (
                  <motion.button
                    key={variant.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                      selectedVariant === variant.id
                        ? "border-gold bg-gold/5 shadow-gold"
                        : "border-border hover:border-gold/50 bg-card"
                    }`}
                  >
                    {variant.isBestValue && (
                      <span className="absolute -top-3 left-4 px-3 py-1 bg-gradient-gold text-secondary text-xs font-bold rounded-full">
                        BEST VALUE
                      </span>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{variant.size}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{variant.label}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedVariant === variant.id
                            ? "border-gold bg-gold"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedVariant === variant.id && (
                          <Check className="w-3 h-3 text-secondary" />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-2xl font-bold text-foreground">
                        Rs. {variant.finalPrice.toLocaleString()}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        Rs. {variant.originalPrice.toLocaleString()}
                      </span>
                      <span className="badge-discount text-xs">
                        {variant.discount}% OFF
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </motion.button>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={quantity}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="w-16 text-center font-semibold text-lg"
                    >
                      {quantity}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="text-sm text-muted-foreground">
                  You save{" "}
                  <span className="text-gold font-semibold">
                    Rs. {totalSavings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="glass-card p-6 rounded-2xl mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-gold font-semibold">FREE</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="text-2xl font-bold text-gradient-gold">
                    Rs. {totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="xl"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                variant="hero"
                size="xl"
                className="flex-1"
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
            </div>

            {/* Guarantee */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              🔒 Secure checkout · 30-day money-back guarantee
            </p>
          </motion.div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={executePendingAction}
      />
    </section>
  );
};

export default ProductCard;
