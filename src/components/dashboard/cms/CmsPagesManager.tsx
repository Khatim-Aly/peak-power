import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Save, Trash2 } from "lucide-react";

interface Page { id: string; slug: string; title: string; body: string; meta_description: string | null; is_published: boolean; }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const CmsPagesManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Page[]>([]);
  const [editing, setEditing] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("cms_pages").select("*").order("created_at");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => setEditing({ id: "", slug: "", title: "", body: "", meta_description: "", is_published: false });

  const save = async () => {
    if (!editing) return;
    if (!editing.title) return toast({ variant: "destructive", title: "Title required" });
    const slug = editing.slug || slugify(editing.title);
    if (editing.id) {
      const { error } = await supabase.from("cms_pages").update({ slug, title: editing.title, body: editing.body, meta_description: editing.meta_description, is_published: editing.is_published }).eq("id", editing.id);
      if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      const { error } = await supabase.from("cms_pages").insert({ slug, title: editing.title, body: editing.body, meta_description: editing.meta_description, is_published: editing.is_published });
      if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    }
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    await supabase.from("cms_pages").delete().eq("id", id);
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gold" />
          <div>
            <h3 className="text-lg font-serif font-bold">Static Pages</h3>
            <p className="text-sm text-muted-foreground">About, Privacy, Terms, etc.</p>
          </div>
        </div>
        <Button onClick={startNew}><Plus className="w-4 h-4 mr-2" />New Page</Button>
      </div>

      {editing && (
        <div className="p-6 border-b border-border space-y-3 bg-muted/20">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Title *" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <Input placeholder="Slug (auto)" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} />
          </div>
          <Input placeholder="Meta description (SEO)" value={editing.meta_description || ""} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} />
          <Textarea placeholder="Body (Markdown / HTML)" rows={10} value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><Switch checked={editing.is_published} onCheckedChange={v => setEditing({ ...editing, is_published: v })} /> Published</label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}><Save className="w-4 h-4 mr-2" />Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No pages yet.</div> :
          items.map(p => (
            <div key={p.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{p.title}</p>
                  <Badge variant={p.is_published ? "default" : "outline"}>{p.is_published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{p.slug}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
};
