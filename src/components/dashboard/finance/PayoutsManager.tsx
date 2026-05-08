import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Banknote, Plus, Calculator } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500", processing: "bg-blue-500", paid: "bg-green-500", failed: "bg-red-500", cancelled: "bg-muted-foreground"
};

export const PayoutsManager = () => {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ merchant_id: "", period_start: "", period_end: "", payment_method: "Bank Transfer", payment_reference: "", notes: "" });
  const [computed, setComputed] = useState<{ gross: number; commission_pct: number } | null>(null);
  const [computing, setComputing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([
      supabase.from("payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, profiles:profiles!inner(store_name, full_name, email)").eq("role", "merchant"),
    ]);
    if (p.data) setPayouts(p.data);
    if (m.data) setMerchants(m.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const computeEarnings = async () => {
    if (!form.merchant_id || !form.period_start || !form.period_end) return;
    setComputing(true);
    const { data } = await supabase.rpc("compute_merchant_earnings", { _merchant_id: form.merchant_id, _from: form.period_start, _to: form.period_end });
    setComputing(false);
    if (data) setComputed({ gross: Number((data as any).gross_sales) || 0, commission_pct: Number((data as any).commission_percent) || 10 });
  };

  const createPayout = async () => {
    if (!computed) return toast({ variant: "destructive", title: "Compute earnings first" });
    const commission = (computed.gross * computed.commission_pct) / 100;
    const net = computed.gross - commission;
    const { error } = await supabase.from("payouts").insert({
      merchant_id: form.merchant_id, period_start: form.period_start, period_end: form.period_end,
      gross_sales: computed.gross, commission_amount: commission, net_amount: net,
      payment_method: form.payment_method, payment_reference: form.payment_reference, notes: form.notes,
    });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Payout created" });
    setOpen(false); setForm({ merchant_id: "", period_start: "", period_end: "", payment_method: "Bank Transfer", payment_reference: "", notes: "" }); setComputed(null);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "paid") updates.paid_at = new Date().toISOString();
    const { error } = await supabase.from("payouts").update(updates).eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    fetchData();
  };

  const merchantName = (id: string) => {
    const m = merchants.find((x: any) => x.user_id === id);
    return m?.profiles?.store_name || m?.profiles?.full_name || m?.profiles?.email || id.slice(0, 8);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold">Merchant Payouts</h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Payout</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Payout</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Merchant</Label>
                <select className="w-full bg-background border border-border rounded-md px-3 py-2" value={form.merchant_id} onChange={(e) => { setForm({ ...form, merchant_id: e.target.value }); setComputed(null); }}>
                  <option value="">Select...</option>
                  {merchants.map((m: any) => <option key={m.user_id} value={m.user_id}>{m.profiles?.store_name || m.profiles?.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Period start</Label><Input type="date" value={form.period_start} onChange={(e) => { setForm({ ...form, period_start: e.target.value }); setComputed(null); }} /></div>
                <div><Label>Period end</Label><Input type="date" value={form.period_end} onChange={(e) => { setForm({ ...form, period_end: e.target.value }); setComputed(null); }} /></div>
              </div>
              <Button variant="outline" onClick={computeEarnings} disabled={computing} className="w-full gap-2"><Calculator className="w-4 h-4" /> {computing ? "Computing..." : "Compute Earnings"}</Button>
              {computed && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                  <p>Gross sales: <strong>PKR {computed.gross.toFixed(2)}</strong></p>
                  <p>Commission ({computed.commission_pct}%): <strong>PKR {((computed.gross * computed.commission_pct) / 100).toFixed(2)}</strong></p>
                  <p className="text-gold">Net payout: <strong>PKR {(computed.gross - (computed.gross * computed.commission_pct) / 100).toFixed(2)}</strong></p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Payment method</Label><Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} /></div>
                <div><Label>Reference</Label><Input value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder="TXN-..." /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={createPayout} className="w-full" disabled={!computed}>Create Payout</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Skeleton className="h-40" /> : payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No payouts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Merchant</TableHead><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{merchantName(p.merchant_id)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.period_start} → {p.period_end}</TableCell>
                  <TableCell>PKR {Number(p.gross_sales).toFixed(0)}</TableCell>
                  <TableCell className="font-semibold">PKR {Number(p.net_amount).toFixed(0)}</TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[p.status]} text-white`}>{p.status}</Badge></TableCell>
                  <TableCell>
                    <select className="bg-background border border-border rounded px-2 py-1 text-xs" value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
