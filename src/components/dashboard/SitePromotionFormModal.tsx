import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  isAdmin: boolean;
  existing?: any;
}

export const SitePromotionFormModal = ({ isOpen, onClose, onSaved, isAdmin, existing }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: existing?.title || "",
    message: existing?.message || "",
    promo_code: existing?.promo_code || "",
    discount_percent: existing?.discount_percent ?? 10,
    scope: existing?.scope || "product",
    product_id: existing?.product_id || "",
    cta_label: existing?.cta_label || "Shop Now",
    expires_at: existing?.expires_at ? existing.expires_at.slice(0, 16) : "",
    commission_percent: existing?.commission_percent ?? 5,
  });

  useEffect(() => {
    const loadProducts = async () => {
      let q = supabase.from("products").select("id, name, merchant_id").eq("is_active", true);
      if (!isAdmin && user) q = q.eq("merchant_id", user.id);
      const { data } = await q;
      setProducts(data || []);
    };
    loadProducts();
  }, [isAdmin, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload: any = {
      title: form.title,
      message: form.message,
      promo_code: form.promo_code || null,
      discount_percent: Number(form.discount_percent) || 0,
      scope: form.scope,
      product_id: form.scope === "product" ? form.product_id || null : null,
      merchant_id: form.scope === "store" ? user.id : (form.scope === "product" ? products.find(p => p.id === form.product_id)?.merchant_id || null : null),
      cta_label: form.cta_label,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      commission_percent: isAdmin ? Number(form.commission_percent) : 5,
      created_by: user.id,
    };

    if (isAdmin && !existing) {
      payload.status = "approved";
      payload.is_active = true;
    }

    const { error } = existing
      ? await supabase.from("site_promotions").update(payload).eq("id", existing.id)
      : await supabase.from("site_promotions").insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isAdmin ? "Promotion saved" : "Request submitted for admin approval");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit" : isAdmin ? "Create" : "Request"} Site Promotion</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Floating notification visible site-wide"
              : "Request admin to feature your offer. 5% commission applies on sales."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Limited Time Offer"
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Get 15% off Pure Himalayan Shilajit"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Promo Code (optional)</Label>
              <Input
                value={form.promo_code}
                onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })}
                placeholder="SHILA15"
              />
            </div>
            <div>
              <Label>Discount %</Label>
              <Input
                type="number"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Scope</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Single Product</SelectItem>
                  <SelectItem value="store">Entire Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CTA Label</Label>
              <Input
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
              />
            </div>
          </div>

          {form.scope === "product" && (
            <div>
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Expires At</Label>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
            {isAdmin && (
              <div>
                <Label>Commission %</Label>
                <Input
                  type="number"
                  value={form.commission_percent}
                  onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : existing ? "Update" : isAdmin ? "Create" : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
