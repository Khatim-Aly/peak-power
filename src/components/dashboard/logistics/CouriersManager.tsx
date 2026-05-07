import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Trash2 } from "lucide-react";

interface Courier { id: string; name: string; code: string; contact_phone: string | null; tracking_url_template: string | null; is_active: boolean; }

export const CouriersManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Courier[]>([]);
  const [draft, setDraft] = useState({ name: "", code: "", contact_phone: "", tracking_url_template: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("couriers").select("*").order("name");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name || !draft.code) return;
    const { error } = await supabase.from("couriers").insert(draft);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Courier added" });
    setDraft({ name: "", code: "", contact_phone: "", tracking_url_template: "" });
    load();
  };

  const update = async (id: string, patch: Partial<Courier>) => {
    await supabase.from("couriers").update(patch as any).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this courier?")) return;
    await supabase.from("couriers").delete().eq("id", id);
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Truck className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">Couriers</h3>
          <p className="text-sm text-muted-foreground">Delivery partners used for shipments</p>
        </div>
      </div>

      <div className="p-6 border-b border-border space-y-3 bg-muted/20">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Name *" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="Code (e.g. TCS, LEOPARDS) *" value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
          <Input placeholder="Contact phone" value={draft.contact_phone} onChange={e => setDraft({ ...draft, contact_phone: e.target.value })} />
          <Input placeholder="Tracking URL ({tracking_number})" value={draft.tracking_url_template} onChange={e => setDraft({ ...draft, tracking_url_template: e.target.value })} />
        </div>
        <Button onClick={create} disabled={!draft.name || !draft.code}><Plus className="w-4 h-4 mr-2" />Add Courier</Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No couriers yet.</div> :
          items.map(c => (
            <div key={c.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.name} <span className="text-xs text-muted-foreground">[{c.code}]</span></p>
                <p className="text-xs text-muted-foreground truncate">{c.contact_phone || "—"} · {c.tracking_url_template || "no tracking URL"}</p>
              </div>
              <Switch checked={c.is_active} onCheckedChange={v => update(c.id, { is_active: v })} />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
};
