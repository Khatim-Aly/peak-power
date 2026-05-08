import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";

export const CommissionsLedger = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("admin_commissions").select("*").order("created_at", { ascending: false }).limit(100);
      if (data) setRows(data);
      setLoading(false);
    })();
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.commission_amount), 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold">Commissions Ledger</h3>
        </div>
        <div className="text-sm text-muted-foreground">Total earned: <strong className="text-gold">PKR {total.toFixed(0)}</strong></div>
      </div>
      {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No commissions recorded yet. Commissions accrue when promoted orders are delivered.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Merchant</TableHead><TableHead>Base</TableHead><TableHead>%</TableHead><TableHead>Commission</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs font-mono">{r.merchant_id?.slice(0, 8)}</TableCell>
                <TableCell>PKR {Number(r.base_amount).toFixed(0)}</TableCell>
                <TableCell>{r.commission_percent}%</TableCell>
                <TableCell className="font-semibold text-gold">PKR {Number(r.commission_amount).toFixed(0)}</TableCell>
                <TableCell className="text-sm">{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
