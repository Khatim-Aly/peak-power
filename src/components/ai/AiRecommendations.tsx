import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Package, Star, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  rating_avg: number;
}

interface Props {
  productId?: string;
  userId?: string;
  title?: string;
}

const AiRecommendations = ({ productId, userId, title = "AI Picks for You" }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: result } = await supabase.functions.invoke("ai-recommendations", {
          body: { productId, userId },
        });
        const ids: string[] = result?.productIds || [];
        if (ids.length === 0) {
          if (!cancelled) setProducts([]);
          return;
        }
        const { data: prods } = await supabase
          .from("products")
          .select("id,name,price,original_price,image_url,rating_avg")
          .in("id", ids);
        if (!cancelled && prods) {
          // preserve AI ordering
          const ordered = ids.map(id => prods.find(p => p.id === id)).filter(Boolean) as Product[];
          setProducts(ordered);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [productId, userId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-serif font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            {title}
            <Badge variant="outline" className="ml-2 border-gold/40 text-gold text-xs">AI</Badge>
          </h2>
          <Link to="/products" className="text-sm text-gold hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(p => {
              const discount = p.original_price && p.original_price > p.price
                ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-muted relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-muted-foreground/30" /></div>
                    )}
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">{discount}% OFF</Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                    {p.rating_avg > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <span className="text-xs text-muted-foreground">{p.rating_avg.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="text-base font-bold text-gold mt-1">PKR {p.price.toLocaleString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AiRecommendations;
