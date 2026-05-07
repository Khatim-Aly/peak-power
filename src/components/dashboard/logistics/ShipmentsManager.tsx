import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"] as const;
type Status = typeof STATUSES[number];

interface Shipment {
  id: string;
  order_id: string;
  courier_id: string | null;
  tracking_number: string | null;
  status: Status;
  notes: string | null;
  orders?: { order_number: string; shipping_city: string | null } | null;
  couriers?: { name: string; code: string } | null;
}
interface Order { id: string; order_number: string; }
interface Courier { id: string; name: string; code: string; }

export const ShipmentsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ order_id: "", courier_id: "", tracking_number: "" });

  const load = async () => {
    setLoading(true);
    const [s, o, c] = await Promise.all([
      supabase.from("shipments").select("*, orders(order_number, shipping_city), couriers(name, code)").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, order_number").order("created_at", { ascending: false }).limit(200),
      supabase.from("couriers").select("id, name, code").eq("is_active", true),
    ]);
    setItems((s.data as any) || []);
    setOrders((o.data as any) || []);
    setCouriers((c.data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.order_id) return;
    const { error } = await supabase.from("shipments").insert({
      order_id: draft.order_id,
      courier_id: draft.courier_id || null,
      tracking_number: draft.tracking_number || null,
      status: "pending",
    });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Shipment created" });
    setDraft({ order_id: "", courier_id: "", tracking_number: "" });
    load();
  };

  const updateStatus = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "picked_up") patch.dispatched_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("shipments").update(patch).eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    load();
  };

  const statusColor: Record<Status, string> = {
    pending: "bg-blue-500",
    picked_up: "bg-indigo-500",
    in_transit: "bg-purple-500",
    out_for_delivery: "bg-amber-500",
    delivered: "bg-green-500",
    failed: "bg-red-500",
    returned: "bg-gray-500",
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Package className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">Shipments</h3>
          <p className="text-sm text-muted-foreground">Track orders dispatched to customers</p>
        </div>
      </div>

      <div className="p-6 border-b border-border space-y-3 bg-muted/20">
        <div className="grid sm:grid-cols-3 gap-3">
          <Select value={draft.order_id} onValueChange={v => setDraft({ ...draft, order_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
            <SelectContent>
              {orders.map(o => <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={draft.courier_id} onValueChange={v => setDraft({ ...draft, courier_id: v })}>
            <SelectTrigger><SelectValue placeholder="Courier" /></SelectTrigger>
            <SelectContent>
              {couriers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Tracking number" value={draft.tracking_number} onChange={e => setDraft({ ...draft, tracking_number: e.target.value })} />
        </div>
        <Button onClick={create} disabled={!draft.order_id}><Plus className="w-4 h-4 mr-2" />Create Shipment</Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No shipments yet.</div> :
          items.map(s => (
            <div key={s.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{s.orders?.order_number || s.order_id.slice(0, 8)}</p>
                  <Badge className={`${statusColor[s.status]} text-white`}>{s.status.replace("_", " ")}</Badge>
                  {s.couriers && <Badge variant="outline">{s.couriers.name}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.tracking_number ? `Tracking: ${s.tracking_number}` : "No tracking #"} · {s.orders?.shipping_city || "—"}
                </p>
              </div>
              <Select value={s.status} onValueChange={v => updateStatus(s.id, v as Status)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(st => <SelectItem key={st} value={st}>{st.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))
        }
      </div>
    </div>
  );
};
