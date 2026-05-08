import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, ShoppingCart, Heart } from "lucide-react";

export const AnalyticsWidgets = () => {
  const [stats, setStats] = useState<{ users: number; orders: number; followers: number; conversion: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [u, o, f, d] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("store_follows").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      ]);
      const total = o.count || 0;
      const delivered = d.count || 0;
      setStats({
        users: u.count || 0,
        orders: total,
        followers: f.count || 0,
        conversion: total ? Math.round((delivered / total) * 100) : 0,
      });
    })();
  }, []);

  if (!stats) return <Skeleton className="h-32" />;

  const cards = [
    { icon: Users, label: "Total Users", value: stats.users, color: "text-blue-500" },
    { icon: ShoppingCart, label: "Total Orders", value: stats.orders, color: "text-amber-500" },
    { icon: Heart, label: "Store Followers", value: stats.followers, color: "text-pink-500" },
    { icon: TrendingUp, label: "Delivery Rate", value: `${stats.conversion}%`, color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-card rounded-2xl border border-border p-5">
          <c.icon className={`w-6 h-6 mb-2 ${c.color}`} />
          <p className="text-2xl font-bold">{c.value}</p>
          <p className="text-sm text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
};
