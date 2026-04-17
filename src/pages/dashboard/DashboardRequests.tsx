import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, MessageSquare, Package, Star, Plus, Clock, CheckCircle2, XCircle, Send, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MerchantApplicationModal } from "@/components/MerchantApplicationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

const statusBadge = (status: string) => {
  const map: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: "bg-amber-500", icon: Clock, label: "Pending" },
    approved: { color: "bg-green-500", icon: CheckCircle2, label: "Approved" },
    declined: { color: "bg-red-500", icon: XCircle, label: "Declined" },
    open: { color: "bg-blue-500", icon: Clock, label: "Open" },
    in_progress: { color: "bg-indigo-500", icon: Clock, label: "In Progress" },
    resolved: { color: "bg-green-500", icon: CheckCircle2, label: "Resolved" },
    closed: { color: "bg-gray-500", icon: XCircle, label: "Closed" },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <Badge variant="secondary" className={`${s.color} text-white flex items-center gap-1`}>
      <Icon className="w-3 h-3" /> {s.label}
    </Badge>
  );
};

const DashboardRequests = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { completedOrders, isLoading: ordersLoading } = useOrders();
  const [applications, setApplications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "", category: "general" });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [appsRes, ticketsRes, reviewsRes] = await Promise.all([
      supabase.from("merchant_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("merchant_reviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (appsRes.data) setApplications(appsRes.data);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    setLoading(false);
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketForm.subject || !ticketForm.message) return;
    setSubmittingTicket(true);
    const { error } = await supabase.from("support_tickets").insert({ user_id: user.id, ...ticketForm, status: "open" });
    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } else {
      toast({ title: "Ticket submitted", description: "We'll respond shortly" });
      setTicketForm({ subject: "", message: "", category: "general" });
      setShowTicketForm(false);
      fetchAll();
    }
    setSubmittingTicket(false);
  };

  const latestApp = applications[0];
  const canApply = !latestApp || latestApp.status === "declined";

  return (
    <DashboardLayout title="My Requests" subtitle="Track all your applications, tickets, and activity">
      {/* Quick Action Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-6 border border-gold/20">
          <Store className="w-10 h-10 text-gold mb-3" />
          <h3 className="text-lg font-semibold mb-1">Sell on PeakPower GB</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {role === "merchant" ? "You're already a verified merchant!" : latestApp ? `Status: ${latestApp.status}` : "Apply to become a verified merchant"}
          </p>
          {role !== "merchant" && (
            <Button variant="hero" size="sm" disabled={!canApply} onClick={() => setShowApplicationModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {latestApp?.status === "pending" ? "Application Pending" : latestApp?.status === "declined" ? "Re-apply" : "Apply Now"}
            </Button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl p-6 border border-blue-500/20">
          <MessageSquare className="w-10 h-10 text-blue-500 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Support / Q&A</h3>
          <p className="text-sm text-muted-foreground mb-4">Have a question? We're here to help.</p>
          <Button variant="outline" size="sm" onClick={() => setShowTicketForm((s) => !s)}>
            <Plus className="w-4 h-4 mr-2" /> New Ticket
          </Button>
        </motion.div>
      </div>

      {/* New Ticket Form */}
      {showTicketForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={submitTicket}
          className="bg-card rounded-2xl border border-border p-6 mb-8 space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2"><Send className="w-4 h-4" /> Submit a Support Ticket</h3>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={ticketForm.subject} onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))} maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={ticketForm.message} onChange={(e) => setTicketForm((f) => ({ ...f, message: e.target.value }))} maxLength={1000} rows={4} required />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowTicketForm(false)}>Cancel</Button>
            <Button type="submit" disabled={submittingTicket}>
              {submittingTicket ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Submit"}
            </Button>
          </div>
        </motion.form>
      )}

      {/* Tabs */}
      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="tickets">Q&A ({tickets.length})</TabsTrigger>
          <TabsTrigger value="orders">Completed Orders ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          {loading ? <Skeleton className="h-32 w-full" /> : applications.length === 0 ? (
            <EmptyState icon={Store} message="No applications yet" />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{app.store_name}</h4>
                      <p className="text-xs text-muted-foreground">{app.business_type} • {app.city}</p>
                    </div>
                    {statusBadge(app.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{app.pitch}</p>
                  {app.admin_notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                      <strong>Admin notes:</strong> {app.admin_notes}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(app.created_at).toLocaleDateString("en-GB")}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tickets">
          {loading ? <Skeleton className="h-32 w-full" /> : tickets.length === 0 ? (
            <EmptyState icon={MessageSquare} message="No support tickets yet" />
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{t.subject}</h4>
                    {statusBadge(t.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.message}</p>
                  {t.admin_response && (
                    <div className="mt-3 p-3 bg-gold/10 border border-gold/20 rounded-lg text-sm">
                      <strong className="text-gold">Response:</strong> {t.admin_response}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(t.created_at).toLocaleDateString("en-GB")}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {ordersLoading ? <Skeleton className="h-32 w-full" /> : completedOrders.length === 0 ? (
            <EmptyState icon={Package} message="No completed orders yet" />
          ) : (
            <div className="space-y-3">
              {completedOrders.map((o: any) => (
                <div key={o.id} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-sm text-muted-foreground">PKR {Number(o.total_amount).toFixed(2)} • {new Date(o.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500 text-white">Delivered</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          {loading ? <Skeleton className="h-32 w-full" /> : reviews.length === 0 ? (
            <EmptyState icon={Star} message="You haven't left any reviews yet" />
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString("en-GB")}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MerchantApplicationModal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} onSubmitted={fetchAll} />
    </DashboardLayout>
  );
};

const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="text-center py-16 bg-card rounded-2xl border border-border">
    <Icon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export default DashboardRequests;
