import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Percent, Save, Plus, Trash2 } from "lucide-react";

interface Setting {
  id: string;
  merchant_id: string | null;
  commission_percent: number;
  is_default: boolean;
  notes: string | null;
}

export const CommissionSettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultPct, setDefaultPct] = useState<string>("10");
  const [newMerchantId, setNewMerchantId] = useState("");
  const [newPct, setNewPct] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [s, m] = await Promise.all([
      supabase.from("commission_settings").select("*").order("is_default", { ascending: false }),
      supabase.from("user_roles").select("user_id, profiles:profiles!inner(store_name, full_name, email)").eq("role", "merchant"),
    ]);
    if (s.data) {
      setSettings(s.data as any);
      const def = (s.data as any[]).find((x) => x.is_default);
      if (def) setDefaultPct(String(def.commission_percent));
    }
    if (m.data) setMerchants(m.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveDefault = async () => {
    const def = settings.find((s) => s.is_default);
    if (!def) return;
    const { error } = await supabase.from("commission_settings").update({ commission_percent: Number(defaultPct) }).eq("id", def.id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Default commission updated" });
    fetchData();
  };

  const addOverride = async () => {
    if (!newMerchantId || !newPct) return;
    const { error } = await supabase.from("commission_settings").insert({ merchant_id: newMerchantId, commission_percent: Number(newPct), is_default: false });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    setNewMerchantId(""); setNewPct("");
    toast({ title: "Override added" });
    fetchData();
  };

  const deleteOverride = async (id: string) => {
    const { error } = await supabase.from("commission_settings").delete().eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    fetchData();
  };

  const overrides = settings.filter((s) => !s.is_default);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold">Platform Default Commission</h3>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Label>Commission %</Label>
            <Input type="number" step="0.01" min="0" max="100" value={defaultPct} onChange={(e) => setDefaultPct(e.target.value)} />
          </div>
          <Button onClick={saveDefault} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Per-Merchant Overrides</h3>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <select className="bg-background border border-border rounded-md px-3 py-2" value={newMerchantId} onChange={(e) => setNewMerchantId(e.target.value)}>
            <option value="">Select merchant...</option>
            {merchants.map((m: any) => (
              <option key={m.user_id} value={m.user_id}>{m.profiles?.store_name || m.profiles?.full_name || m.profiles?.email}</option>
            ))}
          </select>
          <Input type="number" step="0.01" placeholder="Commission %" value={newPct} onChange={(e) => setNewPct(e.target.value)} />
          <Button onClick={addOverride} className="gap-2"><Plus className="w-4 h-4" /> Add Override</Button>
        </div>

        {loading ? <Skeleton className="h-32 w-full" /> : overrides.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No overrides — all merchants use the platform default.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Merchant</TableHead><TableHead>Commission %</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((o) => {
                const m = merchants.find((x: any) => x.user_id === o.merchant_id);
                return (
                  <TableRow key={o.id}>
                    <TableCell>{m?.profiles?.store_name || m?.profiles?.full_name || o.merchant_id}</TableCell>
                    <TableCell>{o.commission_percent}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteOverride(o.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
