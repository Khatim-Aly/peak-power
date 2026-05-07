import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Plus, Trash2, Save } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  position: string;
  sort_order: number;
  is_active: boolean;
}

const empty = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_label: "Shop Now",
  cta_url: "/products",
  position: "hero",
  sort_order: 0,
  is_active: true,
};

export const CmsBannersManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Banner[]>([]);
  const [draft, setDraft] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("cms_banners").select("*").order("sort_order");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.title) return;
    const { error } = await supabase.from("cms_banners").insert(draft as any);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Banner created" });
    setDraft(empty);
    load();
  };

  const update = async (id: string, patch: Partial<Banner>) => {
    const { error } = await supabase.from("cms_banners").update(patch as any).eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("cms_banners").delete().eq("id", id);
    toast({ title: "Deleted" });
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <ImageIcon className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">Homepage Banners</h3>
          <p className="text-sm text-muted-foreground">Promotional banners shown on the storefront</p>
        </div>
      </div>

      <div className="p-6 border-b border-border space-y-3 bg-muted/20">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Title *" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          <Input placeholder="Position (hero / strip / mid)" value={draft.position} onChange={e => setDraft({ ...draft, position: e.target.value })} />
        </div>
        <Textarea placeholder="Subtitle" value={draft.subtitle} onChange={e => setDraft({ ...draft, subtitle: e.target.value })} />
        <Input placeholder="Image URL" value={draft.image_url} onChange={e => setDraft({ ...draft, image_url: e.target.value })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input placeholder="CTA label" value={draft.cta_label} onChange={e => setDraft({ ...draft, cta_label: e.target.value })} />
          <Input placeholder="CTA URL" value={draft.cta_url} onChange={e => setDraft({ ...draft, cta_url: e.target.value })} />
          <Input type="number" placeholder="Sort order" value={draft.sort_order} onChange={e => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        </div>
        <Button onClick={create} disabled={!draft.title}><Plus className="w-4 h-4 mr-2" />Add Banner</Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No banners yet.</div>
        ) : items.map(b => (
          <div key={b.id} className="p-4 flex items-center gap-4">
            {b.image_url ? <img src={b.image_url} alt="" className="w-20 h-12 object-cover rounded" /> : <div className="w-20 h-12 bg-muted rounded" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{b.title}</p>
                <Badge variant="outline">{b.position}</Badge>
                <Badge variant="secondary">#{b.sort_order}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{b.subtitle || "—"}</p>
            </div>
            <Switch checked={b.is_active} onCheckedChange={v => update(b.id, { is_active: v })} />
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};
