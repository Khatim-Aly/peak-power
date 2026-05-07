import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Plus, Trash2 } from "lucide-react";

interface Faq { id: string; question: string; answer: string; category: string; sort_order: number; is_published: boolean; }

export const CmsFaqsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Faq[]>([]);
  const [draft, setDraft] = useState({ question: "", answer: "", category: "general" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("cms_faqs").select("*").order("sort_order");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.question || !draft.answer) return;
    const { error } = await supabase.from("cms_faqs").insert({ ...draft, sort_order: items.length });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "FAQ added" });
    setDraft({ question: "", answer: "", category: "general" });
    load();
  };

  const update = async (id: string, patch: Partial<Faq>) => {
    await supabase.from("cms_faqs").update(patch as any).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("cms_faqs").delete().eq("id", id);
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <HelpCircle className="w-5 h-5 text-gold" />
        <div>
          <h3 className="text-lg font-serif font-bold">FAQs</h3>
          <p className="text-sm text-muted-foreground">Frequently asked questions shown publicly</p>
        </div>
      </div>

      <div className="p-6 border-b border-border space-y-3 bg-muted/20">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Question *" value={draft.question} onChange={e => setDraft({ ...draft, question: e.target.value })} />
          <Input placeholder="Category (general / shipping / returns)" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} />
        </div>
        <Textarea placeholder="Answer *" rows={3} value={draft.answer} onChange={e => setDraft({ ...draft, answer: e.target.value })} />
        <Button onClick={create} disabled={!draft.question || !draft.answer}><Plus className="w-4 h-4 mr-2" />Add FAQ</Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> :
          items.length === 0 ? <div className="p-12 text-center text-muted-foreground">No FAQs yet.</div> :
          items.map(f => (
            <div key={f.id} className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{f.question}</p>
                  <Badge variant="outline">{f.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
              </div>
              <Switch checked={f.is_published} onCheckedChange={v => update(f.id, { is_published: v })} />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(f.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))
        }
      </div>
    </div>
  );
};
