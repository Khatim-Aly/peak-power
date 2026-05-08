import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gift, Award } from "lucide-react";

export const ReferralsManager = () => {
  const { toast } = useToast();
  const [refs, setRefs] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [r, c] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("referral_codes").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (r.data) setRefs(r.data);
    if (c.data) setCodes(c.data);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "qualified") updates.qualified_at = new Date().toISOString();
    if (status === "rewarded") updates.rewarded_at = new Date().toISOString();
    const { error } = await supabase.from("referrals").update(updates).eq("id", id);
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Status updated" });
    fetchData();
  };

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Referrals" value={refs.length} />
        <Stat label="Qualified" value={refs.filter((r) => r.status === "qualified" || r.status === "rewarded").length} />
        <Stat label="Active Codes" value={codes.filter((c) => c.is_active).length} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4"><Gift className="w-5 h-5 text-gold" /><h3 className="text-lg font-semibold">Referrals</h3></div>
        {refs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No referrals yet. Share codes to start growing.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Code</TableHead><TableHead>Reward</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {refs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-sm">{r.code_used}</TableCell>
                  <TableCell>PKR {Number(r.reward_amount).toFixed(0)}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  <TableCell className="space-x-2">
                    {r.status === "pending" && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "qualified")}>Qualify</Button>}
                    {r.status === "qualified" && <Button size="sm" className="gap-1" onClick={() => updateStatus(r.id, "rewarded")}><Award className="w-3 h-3" /> Reward</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Latest Codes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {codes.slice(0, 12).map((c) => (
            <div key={c.id} className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="font-mono font-bold text-gold">{c.code}</p>
              <p className="text-xs text-muted-foreground mt-1">PKR {Number(c.reward_amount).toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: any) => (
  <div className="bg-card rounded-2xl border border-border p-5">
    <p className="text-2xl font-bold text-gold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);
