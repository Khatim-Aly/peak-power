import { useEffect, useState } from "react";
import { Wallet, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Commission {
  id: string;
  order_id: string;
  base_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
  product_id: string | null;
  merchant_id: string | null;
}

export const AdminWallet = () => {
  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("admin_commissions")
        .select("*")
        .order("created_at", { ascending: false });
      setItems((data as Commission[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const total = items.reduce((s, i) => s + Number(i.commission_amount || 0), 0);
  const pending = items.filter(i => i.status === 'earned').reduce((s, i) => s + Number(i.commission_amount || 0), 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold">Admin Wallet</h3>
          <p className="text-sm text-muted-foreground">Commission earnings from promoted product sales</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-green-500">PKR {total.toFixed(0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-muted-foreground mb-1">Unpaid</p>
          <p className="text-2xl font-bold text-amber-500">PKR {pending.toFixed(0)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No commissions yet. Earnings appear after promoted-product orders are delivered.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
              <div>
                <p className="font-medium">PKR {Number(c.commission_amount).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {c.commission_percent}% of PKR {Number(c.base_amount).toFixed(2)} • {new Date(c.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <Badge variant={c.status === 'paid' ? 'secondary' : 'default'}>{c.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
