import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, TrendingUp, Wallet } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500", processing: "bg-blue-500", paid: "bg-green-500", failed: "bg-red-500", cancelled: "bg-muted-foreground"
};

export const MerchantPayouts = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingEarnings, setPendingEarnings] = useState<{ gross: number; commission_pct: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date();
      const ago = new Date(); ago.setDate(today.getDate() - 30);
      const [p, e] = await Promise.all([
        supabase.from("payouts").select("*").eq("merchant_id", user.id).order("created_at", { ascending: false }),
        supabase.rpc("compute_merchant_earnings", { _merchant_id: user.id, _from: ago.toISOString().slice(0, 10), _to: today.toISOString().slice(0, 10) }),
      ]);
      if (p.data) setPayouts(p.data);
      if (e.data) setPendingEarnings({ gross: Number((e.data as any).gross_sales) || 0, commission_pct: Number((e.data as any).commission_percent) || 10 });
      setLoading(false);
    })();
  }, [user]);

  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending" || p.status === "processing").reduce((s, p) => s + Number(p.net_amount), 0);

  if (loading) return <Skeleton className="h-64" />;

  const projectedNet = pendingEarnings ? pendingEarnings.gross - (pendingEarnings.gross * pendingEarnings.commission_pct) / 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Total Paid Out" value={`PKR ${totalPaid.toFixed(0)}`} color="text-green-500" />
        <StatCard icon={Banknote} label="Pending Payouts" value={`PKR ${pendingPayouts.toFixed(0)}`} color="text-amber-500" />
        <StatCard icon={TrendingUp} label="Last 30d Earnings (est.)" value={`PKR ${projectedNet.toFixed(0)}`} color="text-gold" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Payout History</h3>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No payouts yet. Earnings accrue from delivered orders and are paid out on schedule.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Commission</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{p.period_start} → {p.period_end}</TableCell>
                  <TableCell>PKR {Number(p.gross_sales).toFixed(0)}</TableCell>
                  <TableCell className="text-muted-foreground">−PKR {Number(p.commission_amount).toFixed(0)}</TableCell>
                  <TableCell className="font-semibold text-gold">PKR {Number(p.net_amount).toFixed(0)}</TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[p.status]} text-white`}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{p.payment_reference || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-card rounded-2xl border border-border p-5">
    <Icon className={`w-6 h-6 mb-2 ${color}`} />
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);
