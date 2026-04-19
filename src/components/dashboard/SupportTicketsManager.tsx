import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Loader2, Eye, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, { c: string; i: any; l: string }> = {
    open: { c: "bg-blue-500", i: Clock, l: "Open" },
    in_progress: { c: "bg-indigo-500", i: Clock, l: "In Progress" },
    resolved: { c: "bg-green-500", i: CheckCircle2, l: "Resolved" },
    closed: { c: "bg-gray-500", i: CheckCircle2, l: "Closed" },
  };
  const s = map[status] || map.open;
  const I = s.i;
  return (
    <Badge variant="secondary" className={`${s.c} text-white flex items-center gap-1`}>
      <I className="w-3 h-3" /> {s.l}
    </Badge>
  );
};

export const SupportTicketsManager = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState<Ticket["status"]>("resolved");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((t) => t.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const map: Record<string, { name: string; email: string }> = {};
      profiles?.forEach((p: any) => (map[p.user_id] = { name: p.full_name, email: p.email }));
      setTickets(
        data.map((t: any) => ({
          ...t,
          user_name: map[t.user_id]?.name || "Unknown",
          user_email: map[t.user_id]?.email || "",
        })),
      );
    } else {
      setTickets([]);
    }
    setLoading(false);
  };

  const openTicket = (t: Ticket) => {
    setSelected(t);
    setReply(t.admin_response || "");
    setNewStatus(t.status === "open" ? "resolved" : t.status);
  };

  const submitReply = async () => {
    if (!selected) return;
    if (!reply.trim()) {
      toast({ variant: "destructive", title: "Reply required", description: "Type a response before submitting." });
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("support_tickets")
      .update({
        admin_response: reply.trim(),
        responded_by: user?.id,
        responded_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq("id", selected.id);
    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } else {
      toast({ title: "Reply sent", description: "User has been notified." });
      setSelected(null);
      fetchAll();
    }
    setSubmitting(false);
  };

  const open = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-serif font-bold">Support Tickets / Q&amp;A</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{open} open · {tickets.length} total</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No tickets yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border hover:border-gold/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-semibold truncate">{t.subject}</h4>
                  {statusBadge(t.status)}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {t.user_name} • {t.user_email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openTicket(t)} className="shrink-0">
                <Eye className="w-4 h-4 mr-2" /> Reply
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl border border-border max-w-xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border sticky top-0 bg-card flex items-center justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-serif font-bold truncate">{selected.subject}</h3>
              {statusBadge(selected.status)}
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm">
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <p>{selected.user_name} • {selected.user_email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="p-3 rounded-lg bg-muted/40 text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div>
                <Label htmlFor="reply">Your reply</Label>
                <Textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder="Type your response..." maxLength={2000} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm">Set status:</Label>
                {(["in_progress", "resolved", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      newStatus === s ? "bg-gold/20 border-gold text-gold" : "border-border hover:border-gold/40"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
                <Button variant="hero" onClick={submitReply} disabled={submitting} className="flex-1">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
