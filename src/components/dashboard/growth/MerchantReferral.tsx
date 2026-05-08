import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, Copy, Share2 } from "lucide-react";

export const MerchantReferral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [c, r] = await Promise.all([
        supabase.from("referral_codes").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ]);
      setCode(c.data);
      if (r.data) setRefs(r.data);
      setLoading(false);
    })();
  }, [user]);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code.code);
    toast({ title: "Code copied" });
  };

  const shareLink = () => {
    if (!code) return;
    const url = `${window.location.origin}/?ref=${code.code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Referral link copied" });
  };

  if (loading) return <Skeleton className="h-64" />;

  const rewardedCount = refs.filter((r) => r.status === "rewarded").length;
  const totalReward = refs.filter((r) => r.status === "rewarded").reduce((s, r) => s + Number(r.reward_amount), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl border border-gold/30 p-8 text-center">
        <Gift className="w-10 h-10 text-gold mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
        <p className="text-4xl font-bold font-mono text-gold tracking-wider mb-4">{code?.code || "—"}</p>
        <p className="text-sm text-muted-foreground mb-4">Earn <strong>PKR {Number(code?.reward_amount || 200).toFixed(0)}</strong> for every qualified signup</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={copyCode} className="gap-2"><Copy className="w-4 h-4" /> Copy Code</Button>
          <Button onClick={shareLink} className="gap-2"><Share2 className="w-4 h-4" /> Share Link</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Referrals" value={refs.length} />
        <Stat label="Rewarded" value={rewardedCount} />
        <Stat label="Total Earned" value={`PKR ${totalReward.toFixed(0)}`} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Your Referrals</h3>
        {refs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Share your code to start earning rewards.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Reward</TableHead></TableRow></TableHeader>
            <TableBody>
              {refs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  <TableCell>PKR {Number(r.reward_amount).toFixed(0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: any) => (
  <div className="bg-card rounded-2xl border border-border p-5 text-center">
    <p className="text-2xl font-bold text-gold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);
