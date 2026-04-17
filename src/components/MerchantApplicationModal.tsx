import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Store, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const MerchantApplicationModal = ({ isOpen, onClose, onSubmitted }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    business_type: "",
    city: "",
    phone: "",
    pitch: "",
    cnic_number: "",
    business_description: "",
  });
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("merchant-kyc").upload(path, file, { upsert: false });
    if (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
      return null;
    }
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (!form.store_name || !form.business_type || !form.city || !form.phone || !form.pitch || !form.cnic_number || !form.business_description) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill all required fields" });
      return;
    }
    if (!cnicFile || !proofFile) {
      toast({ variant: "destructive", title: "Documents required", description: "Please upload CNIC image and business proof" });
      return;
    }

    setSubmitting(true);
    try {
      const [cnicPath, proofPath] = await Promise.all([uploadFile(cnicFile, "cnic"), uploadFile(proofFile, "proof")]);

      if (!cnicPath || !proofPath) {
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("merchant_applications").insert({
        user_id: user.id,
        ...form,
        cnic_image_path: cnicPath,
        business_proof_path: proofPath,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Application submitted! 🎉", description: "We'll review your application within 2-3 business days." });
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission failed", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-3xl border border-gold/20 max-w-2xl w-full my-8 shadow-2xl"
        >
          {/* Header */}
          <div className="relative p-6 border-b border-border bg-gradient-to-br from-gold/20 to-transparent rounded-t-3xl">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                <Store className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold">Sell on PeakPower GB</h2>
                <p className="text-sm text-muted-foreground">Join our marketplace as a verified merchant</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="store_name">Store Name *</Label>
                <Input id="store_name" value={form.store_name} onChange={(e) => update("store_name", e.target.value)} placeholder="e.g. Mountain Naturals" maxLength={80} required />
              </div>
              <div>
                <Label htmlFor="business_type">Business Type *</Label>
                <Input id="business_type" value={form.business_type} onChange={(e) => update("business_type", e.target.value)} placeholder="e.g. Health Supplements" maxLength={60} required />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Gilgit" maxLength={50} required />
              </div>
              <div>
                <Label htmlFor="phone">Business Phone *</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+92 3XX XXXXXXX" maxLength={20} required />
              </div>
            </div>

            <div>
              <Label htmlFor="cnic_number">CNIC Number *</Label>
              <Input id="cnic_number" value={form.cnic_number} onChange={(e) => update("cnic_number", e.target.value)} placeholder="XXXXX-XXXXXXX-X" maxLength={20} required />
            </div>

            <div>
              <Label htmlFor="pitch">Why do you want to sell on PeakPower GB? *</Label>
              <Textarea id="pitch" value={form.pitch} onChange={(e) => update("pitch", e.target.value)} placeholder="Tell us about your motivation..." maxLength={500} rows={3} required />
            </div>

            <div>
              <Label htmlFor="business_description">Business Description *</Label>
              <Textarea id="business_description" value={form.business_description} onChange={(e) => update("business_description", e.target.value)} placeholder="What products do you sell? What makes your business unique?" maxLength={1000} rows={4} required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FileUpload label="CNIC Image *" file={cnicFile} onChange={setCnicFile} />
              <FileUpload label="Business Proof *" file={proofFile} onChange={setProofFile} />
            </div>

            <p className="text-xs text-muted-foreground">By submitting, you agree to our merchant terms. We'll review your application within 2-3 business days.</p>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" variant="hero" disabled={submitting} className="flex-1">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit Application</>}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

const FileUpload = ({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) => (
  <div>
    <Label>{label}</Label>
    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border hover:border-gold/40 rounded-lg cursor-pointer transition-colors bg-muted/30">
      <Upload className="w-4 h-4" />
      <span className="text-sm truncate">{file ? file.name : "Choose file"}</span>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && f.size > 5 * 1024 * 1024) {
            alert("File must be under 5MB");
            return;
          }
          onChange(f || null);
        }}
      />
    </label>
  </div>
);
