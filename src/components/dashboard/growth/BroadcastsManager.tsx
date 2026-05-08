import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Send } from "lucide-react";

const STATUS_COLOR: Record<string, string> = { draft: "bg-muted-foreground", scheduled: "bg-blue-500", sending: "bg-amber-500", sent: "bg-green-500", failed: "bg-red-500" };

export const BroadcastsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", channel: "in_app", audience: "all_users" });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const createDraft = async () => {
    if (!form.title || !form.body || !user) return;
    const { error } = await supabase.from("broadcasts").insert({ ...form, channel: form.channel as any, audience: form.audience as any, created_by: user.id });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Broadcast saved as draft" });
    setOpen(false); setForm({ title: "", body: "", channel: "in_app", audience: "all_users" });
    fetchData();
  };

  const send = async (id: string) => {
    const { data, error } = await supabase.rpc("send_broadcast", { _broadcast_id: id });
    if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
    toast({ title: "Broadcast sent", description: `Delivered to ${(data as any)?.recipients || 0} recipients` });
    fetchData();
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-gold" /><h3 className="text-lg font-semibold">Broadcasts</h3></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> New Broadcast</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Create Broadcast</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Channel</Label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                    <option value="in_app">In-app notification</option>
                    <option value="email">Email (planned)</option>
                    <option value="sms">SMS (planned)</option>
                  </select>
                </div>
                <div>
                  <Label>Audience</Label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                    <option value="all_users">All users</option>
                    <option value="all_customers">Customers only</option>
                    <option value="all_merchants">Merchants only</option>
                  </select>
                </div>
              </div>
              <Button onClick={createDraft} className="w-full">Save as Draft</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Skeleton className="h-40" /> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No broadcasts yet.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Channel</TableHead><TableHead>Audience</TableHead><TableHead>Status</TableHead><TableHead>Reach</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell className="text-sm">{b.channel}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.audience}</TableCell>
                <TableCell><Badge className={`${STATUS_COLOR[b.status]} text-white`}>{b.status}</Badge></TableCell>
                <TableCell className="text-sm">{b.delivered_count} / {b.recipient_count}</TableCell>
                <TableCell>
                  {b.status === "draft" && b.channel === "in_app" && (
                    <Button size="sm" onClick={() => send(b.id)} className="gap-1"><Send className="w-3 h-3" /> Send</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
