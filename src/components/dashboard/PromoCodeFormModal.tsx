import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Percent, Truck, Calendar, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  free_shipping_threshold: number | null;
  scope: string;
  product_id: string | null;
  merchant_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  show_on_exit_intent: boolean;
  exit_intent_timer_minutes: number;
}

interface PromoCodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCode: PromoCode | null;
  isAdmin: boolean;
  merchantId?: string;
}

export const PromoCodeFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingCode,
  isAdmin,
  merchantId,
}: PromoCodeFormModalProps) => {
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [scope, setScope] = useState<"store" | "product">("store");
  const [productId, setProductId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnExitIntent, setShowOnExitIntent] = useState(false);
  const [exitIntentTimer, setExitIntentTimer] = useState("15");

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      if (editingCode) {
        setCode(editingCode.code);
        setDiscountPercent(String(editingCode.discount_percent || 0));
        setFreeShippingThreshold(editingCode.free_shipping_threshold ? String(editingCode.free_shipping_threshold) : "");
        setScope(editingCode.scope as "store" | "product");
        setProductId(editingCode.product_id || "");
        setStartsAt(editingCode.starts_at ? new Date(editingCode.starts_at).toISOString().slice(0, 16) : "");
        setExpiresAt(editingCode.expires_at ? new Date(editingCode.expires_at).toISOString().slice(0, 16) : "");
        setMaxUses(editingCode.max_uses ? String(editingCode.max_uses) : "");
        setIsActive(editingCode.is_active);
        setShowOnExitIntent(editingCode.show_on_exit_intent || false);
        setExitIntentTimer(String(editingCode.exit_intent_timer_minutes || 15));
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingCode]);

  const resetForm = () => {
    setCode("");
    setDiscountPercent("0");
    setFreeShippingThreshold("");
    setScope("store");
    setProductId("");
    const now = new Date();
    setStartsAt(now.toISOString().slice(0, 16));
    const defaultExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setExpiresAt(defaultExpiry.toISOString().slice(0, 16));
    setMaxUses("");
    setIsActive(true);
    setShowOnExitIntent(false);
    setExitIntentTimer("15");
  };

  const fetchProducts = async () => {
    let query = supabase.from("products").select("id, name").eq("is_active", true);
    if (!isAdmin && merchantId) {
      query = query.eq("merchant_id", merchantId);
    }
    const { data } = await query;
    if (data) setProducts(data);
  };

  const handleSave = async () => {
    if (!code.trim() || !expiresAt) return;
    setIsSaving(true);

    const payload: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      discount_percent: Number(discountPercent) || 0,
      free_shipping_threshold: freeShippingThreshold ? Number(freeShippingThreshold) : null,
      scope,
      product_id: scope === "product" && productId ? productId : null,
      starts_at: startsAt || new Date().toISOString(),
      expires_at: expiresAt,
      max_uses: maxUses ? Number(maxUses) : null,
      is_active: isActive,
      show_on_exit_intent: isAdmin ? showOnExitIntent : false,
      exit_intent_timer_minutes: Number(exitIntentTimer) || 15,
    };

    // Admin-created codes are auto-approved; merchant codes are pending
    if (!editingCode) {
      payload.merchant_id = isAdmin ? null : merchantId;
      payload.status = isAdmin ? "approved" : "pending";
    }

    let error;
    if (editingCode) {
      ({ error } = await supabase.from("promo_codes").update(payload).eq("id", editingCode.id));
    } else {
      ({ error } = await supabase.from("promo_codes").insert(payload as any));
    }

    setIsSaving(false);
    if (!error) {
      onSave();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg mx-4 bg-card rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-serif font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-gold" />
              {editingCode ? "Edit Promo Code" : "Create Promo Code"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Code */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Tag className="w-4 h-4" /> Promo Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="uppercase"
              />
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Percent className="w-4 h-4" /> Discount Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>

            {/* Free Shipping Threshold */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Truck className="w-4 h-4" /> Free Shipping Above (PKR)</Label>
              <Input
                type="number"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                placeholder="Leave empty to not include free shipping"
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Store className="w-4 h-4" /> Scope</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as "store" | "product")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Entire Store</SelectItem>
                  <SelectItem value="product">Specific Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product selector */}
            {scope === "product" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Package className="w-4 h-4" /> Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Starts At</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Expires At</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            {/* Max uses */}
            <div className="space-y-2">
              <Label>Max Uses (leave empty for unlimited)</Label>
              <Input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Exit Intent Settings (admin only) */}
            {isAdmin && (
              <div className="space-y-4 p-4 rounded-xl bg-gold/5 border border-gold/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Show on Exit-Intent Modal</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Display this code when users try to leave</p>
                  </div>
                  <Switch checked={showOnExitIntent} onCheckedChange={setShowOnExitIntent} />
                </div>
                {showOnExitIntent && (
                  <div className="space-y-2">
                    <Label className="text-xs">Countdown Timer (minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={exitIntentTimer}
                      onChange={(e) => setExitIntentTimer(e.target.value)}
                      placeholder="15"
                    />
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Only one promo code can be shown on the exit-intent modal at a time. Enabling this will replace any existing one.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isAdmin && !editingCode && (
              <p className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                ⚠️ Your promo code will be submitted for admin approval before it becomes active.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !code.trim() || !expiresAt}>
              {isSaving ? "Saving..." : editingCode ? "Update" : "Create"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
