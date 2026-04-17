import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, CheckCircle2, XCircle, Clock, Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  user_id: string;
  store_name: string;
  business_type: string;
  city: string;
  phone: string;
  pitch: string;
  cnic_number: string;
  business_description: string;
  cnic_image_path: string | null;
  business_proof_path: string | null;
  status: "pending" | "approved" | "declined";
  admin_notes: string | null;
  created_at: string;
  applicant_name?: string;
  applicant_email?: string;
}

export const MerchantApplicationsManager = () => {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [docUrls, setDocUrls] = useState<{ cnic?: string; proof?: string }>({});

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase.from("merchant_applications").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((a) => a.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const map: Record<string, { name: string; email: string }> = {};
      profiles?.forEach((p: any) => (map[p.user_id] = { name: p.full_name, email: p.email }));
      setApps(data.map((a: any) => ({ ...a, applicant_name: map[a.user_id]?.name || "Unknown", applicant_email: map[a.user_id]?.email })));
    } else {
      setApps([]);
    }
    setLoading(false);
  };

  const openApp = async (app: Application) => {
    setSelected(app);
    setNotes(app.admin_notes || "");
    setDocUrls({});
    // Get signed URLs for KYC docs
    const urls: { cnic?: string; proof?: string } = {};
    if (app.cnic_image_path) {
      const { data } = await supabase.storage.from("merchant-kyc").createSignedUrl(app.cnic_image_path, 3600);
      if (data) urls.cnic = data.signedUrl;
    }
    if (app.business_proof_path) {
      const { data } = await supabase.storage.from("merchant-kyc").createSignedUrl(app.business_proof_path, 3600);
      if (data) urls.proof = data.signedUrl;
    }
    setDocUrls(urls);
  };

  const decide = async (status: "approved" | "declined") => {
    if (!selected) return;
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("merchant_applications")
      .update({ status, admin_notes: notes || null, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", selected.id);
    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } else {
      toast({ title: status === "approved" ? "Application approved 🎉" : "Application declined", description: status === "approved" ? "User promoted to merchant" : "Notified user" });
      setSelected(null);
      fetchApps();
    }
    setProcessing(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { c: string; i: any; l: string }> = {
      pending: { c: "bg-amber-500", i: Clock, l: "Pending" },
      approved: { c: "bg-green-500", i: CheckCircle2, l: "Approved" },
      declined: { c: "bg-red-500", i: XCircle, l: "Declined" },
    };
    const s = map[status];
    const I = s.i;
    return <Badge variant="secondary" className={`${s.c} text-white flex items-center gap-1`}><I className="w-3 h-3" /> {s.l}</Badge>;
  };

  const pending = apps.filter((a) => a.status === "pending");

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Merchant Applications</h2>
            <p className="text-sm text-muted-foreground">{pending.length} pending review</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-gold/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{app.store_name}</h4>
                  {statusBadge(app.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {app.applicant_name} • {app.business_type} • {app.city}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(app.created_at).toLocaleDateString("en-GB")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openApp(app)}>
                <Eye className="w-4 h-4 mr-2" /> Review
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <h3 className="text-xl font-serif font-bold">{selected.store_name}</h3>
              {statusBadge(selected.status)}
            </div>
            <div className="p-6 space-y-4">
              <Field label="Applicant" value={`${selected.applicant_name} (${selected.applicant_email})`} />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Business Type" value={selected.business_type} />
                <Field label="City" value={selected.city} />
                <Field label="Phone" value={selected.phone} />
                <Field label="CNIC" value={selected.cnic_number} />
              </div>
              <Field label="Pitch" value={selected.pitch} />
              <Field label="Business Description" value={selected.business_description} />

              <div className="grid md:grid-cols-2 gap-4">
                <DocLink label="CNIC Image" url={docUrls.cnic} />
                <DocLink label="Business Proof" url={docUrls.proof} />
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea id="admin-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes (visible to applicant)" rows={3} />
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
                  <Button variant="outline" disabled={processing} onClick={() => decide("declined")} className="flex-1 text-red-500 hover:text-red-500 border-red-500/30">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Decline</>}
                  </Button>
                  <Button variant="hero" disabled={processing} onClick={() => decide("approved")} className="flex-1">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</>}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-sm">{value}</p>
  </div>
);

const DocLink = ({ label, url }: { label: string; url?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    {url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gold hover:underline text-sm">
        <FileText className="w-4 h-4" /> View document
      </a>
    ) : (
      <p className="text-sm text-muted-foreground">Not uploaded</p>
    )}
  </div>
);
