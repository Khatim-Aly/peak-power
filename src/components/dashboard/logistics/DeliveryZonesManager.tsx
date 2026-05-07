import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Map, Plus, Trash2 } from "lucide-react";

interface Zone { id: string; name: string; cities: string[]; base_fee: number; eta_min_days: number; eta_max_days: number; is_active: boolean; }

export const DeliveryZonesManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Zone[]>([]);
  const [draft, setDraft] = useState({ name: "", cities: "", base_fee: 0, eta_min_days: 1, eta_max_days: 5 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("delivery_zones").select("*").order("name");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name) return;
    const cities = draft.cities.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("delivery_zones").insert({
      name: draft.name, cities, base_fee: draft.base_fee, eta_min_days: draft.eta_min_days, eta_max_days: draft.eta_max_days,
    });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Zone created" });
    setDraft({ name: "", cities: "", base_fee: 0, eta_min_days: 1, eta_max_days: 5 });
    load();
  };

  const update = async (id: string, patch: Partial<Zone>) => {
    await supabase.from("delivery_zones").update(patch as any).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    await supabase.from("delivery_zones").delete().eq("id", id);
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Map className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">Delivery Zones</h3>
          <p className="text-sm text-muted-foreground">Group cities by delivery ETA & base fee</p>
        </div>
      </div>

      <div className="p-6 border-b border-border space-y-3 bg-muted/20">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Zone name *" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="Base fee (PKR)" type="number" value={draft.base_fee} onChange={e => setDraft({ ...draft, base_fee: Number(e.target.value) })} />
        </div>
        <Input placeholder="Cities (comma-separated)" value={draft.cities} onChange={e => setDraft({ ...draft, cities: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="ETA min days" type="number" value={draft.eta_min_days} onChange={e => setDraft({ ...draft, eta_min_days: Number(e.target.value) })} />
          <Input placeholder="ETA max days" type="number" value={draft.eta_max_days} onChange={e => setDraft({ ...draft, eta_max_days: Number(e.target.value) })} />
        </div>
        <Button onClick={create} disabled={!draft.name}><Plus className="w-4 h-4 mr-2" />Add Zone</Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No zones yet.</div> :
          items.map(z => (
            <div key={z.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{z.name}</p>
                  <Badge variant="secondary">PKR {Number(z.base_fee).toFixed(0)}</Badge>
                  <Badge variant="outline">{z.eta_min_days}-{z.eta_max_days}d</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{z.cities?.join(", ") || "no cities"}</p>
              </div>
              <Switch checked={z.is_active} onCheckedChange={v => update(z.id, { is_active: v })} />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(z.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
};
