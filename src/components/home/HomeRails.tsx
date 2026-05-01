import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Heart, Flame, Package, ArrowRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface RailProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  rating_avg: number;
  sales_count: number;
}

const ProductTile = ({ p }: { p: RailProduct }) => {
  const discount =
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : 0;
  return (
    <Link
      to={`/product/${p.id}`}
      className="group block w-56 shrink-0 bg-card border border-border rounded-2xl overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        {discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
            {discount}% OFF
          </Badge>
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
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-gold">PKR {p.price.toLocaleString()}</span>
          {p.original_price && p.original_price > p.price && (
            <span className="text-xs text-muted-foreground line-through">
              PKR {p.original_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const Rail = ({
  title,
  icon: Icon,
  products,
  marquee = false,
}: {
  title: string;
  icon: any;
  products: RailProduct[];
  marquee?: boolean;
}) => {
  const [paused, setPaused] = useState(false);
  if (products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-3">
            <Icon className="w-6 h-6 text-gold" />
            {title}
          </h2>
          <Link
            to="/products"
            className="text-sm text-gold hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {marquee ? (
          <div
            className="relative overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            <div
              className="flex gap-4"
              style={{
                animation: paused
                  ? "none"
                  : `marquee-rtl ${Math.max(20, products.length * 4)}s linear infinite`,
                width: "max-content",
              }}
            >
              {[...products, ...products].map((p, i) => (
                <ProductTile key={`${p.id}-${i}`} p={p} />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {products.map((p) => (
              <div key={p.id} className="snap-start">
                <ProductTile p={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const HomeRails = () => {
  const [topSelling, setTopSelling] = useState<RailProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<RailProduct[]>([]);
  const [customerChoice, setCustomerChoice] = useState<RailProduct[]>([]);
  const [dailyDeals, setDailyDeals] = useState<RailProduct[]>([]);

  useEffect(() => {
    const load = async () => {
      const baseSelect =
        "id, name, price, original_price, image_url, rating_avg, sales_count, is_top_selling, is_new_arrival, is_customer_choice, is_daily_deal, created_at";

      const { data: all } = await supabase
        .from("products")
        .select(baseSelect)
        .eq("is_active", true)
        .limit(100);

      if (!all) return;

      // Hybrid: manual flags first, fall back to auto-computed.
      const manualTop = all.filter((p: any) => p.is_top_selling);
      const autoTop = [...all].sort((a: any, b: any) => b.sales_count - a.sales_count).slice(0, 10);
      setTopSelling((manualTop.length > 0 ? manualTop : autoTop).slice(0, 12) as any);

      const manualNew = all.filter((p: any) => p.is_new_arrival);
      const autoNew = [...all]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setNewArrivals((manualNew.length > 0 ? manualNew : autoNew).slice(0, 12) as any);

      const manualChoice = all.filter((p: any) => p.is_customer_choice);
      const autoChoice = [...all]
        .filter((p: any) => p.rating_avg >= 4)
        .sort((a: any, b: any) => b.rating_avg - a.rating_avg)
        .slice(0, 10);
      setCustomerChoice((manualChoice.length > 0 ? manualChoice : autoChoice).slice(0, 12) as any);

      const manualDeals = all.filter((p: any) => p.is_daily_deal);
      const autoDeals = all.filter(
        (p: any) => p.original_price && Number(p.original_price) > Number(p.price)
      );
      setDailyDeals((manualDeals.length > 0 ? manualDeals : autoDeals).slice(0, 12) as any);
    };
    load();
  }, []);

  return (
    <>
      <Rail title="Top Selling" icon={TrendingUp} products={topSelling} marquee />
      <Rail title="New Arrivals" icon={Sparkles} products={newArrivals} />
      <Rail title="Customer Choice" icon={Heart} products={customerChoice} />
      <Rail title="Daily Deals" icon={Flame} products={dailyDeals} />
    </>
  );
};

export default HomeRails;
