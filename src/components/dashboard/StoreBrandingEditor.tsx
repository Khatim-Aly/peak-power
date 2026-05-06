import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Save, Image as ImageIcon, Palette, Truck, RotateCcw, Instagram, Facebook, Globe, Send, Pin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface BrandingForm {
  store_name: string;
  bio: string;
  banner_url: string;
  theme_color: string;
  return_policy: string;
  shipping_policy: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  social_whatsapp: string;
}

interface MerchantProduct {
  id: string;
  name: string;
  image_url: string | null;
  is_featured_on_store: boolean;
  pinned_order: number | null;
}

export const StoreBrandingEditor = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<BrandingForm>({
    store_name: "", bio: "", banner_url: "", theme_color: "#D4A574",
    return_policy: "", shipping_policy: "",
    social_instagram: "", social_facebook: "", social_tiktok: "", social_whatsapp: "",
  });
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: prods }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("products").select("id,name,image_url,is_featured_on_store,pinned_order")
          .eq("merchant_id", user.id).eq("is_active", true).order("created_at", { ascending: false }),
      ]);
      if (p) setForm({
        store_name: p.store_name || "",
        bio: (p as any).bio || "",
        banner_url: (p as any).banner_url || "",
        theme_color: (p as any).theme_color || "#D4A574",
        return_policy: (p as any).return_policy || "",
        shipping_policy: (p as any).shipping_policy || "",
        social_instagram: (p as any).social_instagram || "",
        social_facebook: (p as any).social_facebook || "",
        social_tiktok: (p as any).social_tiktok || "",
        social_whatsapp: (p as any).social_whatsapp || "",
      });
      if (prods) setProducts(prods as any);
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form as any).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ variant: "destructive", title: "Save failed", description: error.message });
    else toast({ title: "Store updated ✨", description: "Your storefront branding is live." });
  };

  const togglePin = async (productId: string, currentlyFeatured: boolean) => {
    const { error } = await supabase.from("products")
      .update({ is_featured_on_store: !currentlyFeatured } as any)
      .eq("id", productId);
    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } else {
      setProducts(products.map(p => p.id === productId ? { ...p, is_featured_on_store: !currentlyFeatured } : p));
    }
  };

  if (loading) return <div className="h-40 bg-card rounded-2xl border border-border animate-pulse" />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">Store Branding</h2>
        </div>
        {user && (
          <Link to={`/merchant/${user.id}`} target="_blank" className="text-sm text-gold hover:underline">
            View public store →
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label>Store name</Label>
          <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Theme color</Label>
          <div className="flex gap-2">
            <input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
              className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer" />
            <Input value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Store bio</Label>
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell customers about your brand, mission, and what makes you unique..." />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Banner image URL</Label>
          <Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
            placeholder="https://..." />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Truck className="w-4 h-4" /> Shipping policy</Label>
          <Textarea rows={4} value={form.shipping_policy} onChange={(e) => setForm({ ...form, shipping_policy: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Return policy</Label>
          <Textarea rows={4} value={form.return_policy} onChange={(e) => setForm({ ...form, return_policy: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram URL</Label>
          <Input value={form.social_instagram} onChange={(e) => setForm({ ...form, social_instagram: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Facebook className="w-4 h-4" /> Facebook URL</Label>
          <Input value={form.social_facebook} onChange={(e) => setForm({ ...form, social_facebook: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> TikTok URL</Label>
          <Input value={form.social_tiktok} onChange={(e) => setForm({ ...form, social_tiktok: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Send className="w-4 h-4" /> WhatsApp number</Label>
          <Input value={form.social_whatsapp} onChange={(e) => setForm({ ...form, social_whatsapp: e.target.value })}
            placeholder="+92..." />
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="mb-8">
        <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Branding"}
      </Button>

      {/* Featured products */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Pin className="w-4 h-4 text-gold" />
          <h3 className="font-semibold">Featured products on your store</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Pinned products appear first on your store profile.</p>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active products yet.</p>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground/50" />}
                </div>
                <p className="flex-1 text-sm font-medium line-clamp-1">{p.name}</p>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`feat-${p.id}`} className="text-xs text-muted-foreground">Featured</Label>
                  <Switch id={`feat-${p.id}`} checked={p.is_featured_on_store} onCheckedChange={() => togglePin(p.id, p.is_featured_on_store)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
