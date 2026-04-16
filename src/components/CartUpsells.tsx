import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { conversionConfig } from "@/lib/conversionConfig";

interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

const CartUpsells = () => {
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const { cartItems, addToCart } = useCartContext();
  const { toast } = useToast();

  useEffect(() => {
    const cartProductIds = cartItems.map(i => i.product_id);
    supabase
      .from("products")
      .select("id, name, price, image_url")
      .eq("is_active", true)
      .gt("stock", 0)
      .limit(6)
      .then(({ data }) => {
        if (data) {
          // Filter out items already in cart
          const filtered = data.filter(p => !cartProductIds.includes(p.id));
          setProducts(filtered.slice(0, conversionConfig.upsells.maxSuggestions));
        }
      });
  }, [cartItems]);

  const handleAdd = async (product: UpsellProduct) => {
    setAdding(product.id);
    const result = await addToCart(product.id, 1);
    setAdding(null);
    if (result.error) {
      toast({ variant: "destructive", title: "Could not add", description: result.error.message });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-gold" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Customers Also Buy
        </span>
      </div>
      {products.map((product) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/30"
        >
          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{product.name}</p>
            <p className="text-xs text-gold font-bold">PKR {product.price.toLocaleString()}</p>
          </div>
          <button
            onClick={() => handleAdd(product)}
            disabled={adding === product.id}
            className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors disabled:opacity-50"
          >
            {adding === product.id ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full" />
            ) : (
              <Plus className="w-4 h-4 text-gold" />
            )}
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default CartUpsells;
