import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Layers, Plus, Trash2 } from "lucide-react";

interface Cat { id: string; name: string; slug: string; icon: string | null; sort_order: number; is_active: boolean; }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const CmsCategoriesManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("cms_categories").select("*").order("sort_order");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("cms_categories").insert({ name, slug: slugify(name), icon: icon || null, sort_order: items.length });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Category added" });
    setName(""); setIcon("");
    load();
  };

  const update = async (id: string, patch: Partial<Cat>) => {
    await supabase.from("cms_categories").update(patch as any).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("cms_categories").delete().eq("id", id);
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Layers className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">Product Categories</h3>
          <p className="text-sm text-muted-foreground">Top-level taxonomy shown across the storefront</p>
        </div>
      </div>

      <div className="p-6 border-b border-border flex gap-3 bg-muted/20">
        <Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
        <Input placeholder="Icon (emoji or name)" value={icon} onChange={e => setIcon(e.target.value)} className="w-48" />
        <Button onClick={create} disabled={!name.trim()}><Plus className="w-4 h-4 mr-2" />Add</Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No categories yet.</div> :
          items.map(c => (
            <div key={c.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">{c.icon || "📦"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              <Badge variant="outline">#{c.sort_order}</Badge>
              <Switch checked={c.is_active} onCheckedChange={v => update(c.id, { is_active: v })} />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
};
