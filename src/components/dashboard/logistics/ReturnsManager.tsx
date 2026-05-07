import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["requested", "approved", "rejected", "received", "refunded", "closed"] as const;
type Status = typeof STATUSES[number];

interface Ret {
  id: string; order_id: string; user_id: string; reason: string; status: Status;
  refund_amount: number | null; admin_notes: string | null;
  orders?: { order_number: string } | null;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export const ReturnsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Ret[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // Fetch returns; join orders for order_number. Profiles join via user_id.
    const { data } = await supabase
      .from("returns")
      .select("*, orders(order_number)")
      .order("created_at", { ascending: false });
    const list = (data as any) || [];
    if (list.length) {
      const userIds = [...new Set(list.map((r: any) => r.user_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
      list.forEach((r: any) => { r.profiles = map.get(r.user_id) || null; });
    }
    setItems(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Ret>) => {
    const { error } = await supabase.from("returns").update(patch as any).eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    load();
  };

  const statusColor: Record<Status, string> = {
    requested: "bg-amber-500",
    approved: "bg-blue-500",
    rejected: "bg-red-500",
    received: "bg-purple-500",
    refunded: "bg-green-500",
    closed: "bg-gray-500",
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <RotateCcw className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">Returns</h3>
          <p className="text-sm text-muted-foreground">Customer return & refund requests</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No return requests.</div> :
          items.map(r => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{r.orders?.order_number || r.order_id.slice(0, 8)}</p>
                <Badge className={`${statusColor[r.status]} text-white`}>{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{r.profiles?.full_name || r.profiles?.email || "Customer"}</span>
              </div>
              <p className="text-sm">{r.reason}</p>
              <div className="grid sm:grid-cols-3 gap-2 items-center">
                <Select value={r.status} onValueChange={v => update(r.id, { status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Refund amount (PKR)"
                  defaultValue={r.refund_amount ?? 0}
                  onBlur={e => update(r.id, { refund_amount: Number(e.target.value) })}
                />
                <Textarea
                  placeholder="Admin notes"
                  rows={1}
                  defaultValue={r.admin_notes ?? ""}
                  onBlur={e => update(r.id, { admin_notes: e.target.value })}
                />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};
