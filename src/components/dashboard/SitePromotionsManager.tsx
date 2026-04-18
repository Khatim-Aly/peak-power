import { useEffect, useState } from "react";
import { Megaphone, Check, X, Trash2, Plus, Power, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SitePromotionFormModal } from "./SitePromotionFormModal";

interface Promotion {
  id: string;
  title: string;
  message: string;
  promo_code: string | null;
  discount_percent: number | null;
  scope: string;
  product_id: string | null;
  merchant_id: string | null;
  status: string;
  is_active: boolean;
  commission_percent: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export const SitePromotionsManager = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_promotions")
      .select("*")
      .order("created_at", { ascending: false });
    setPromos((data as Promotion[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("site_promotions")
      .update({
        status,
        is_active: status === "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Promotion ${status}`);
    fetch();
  };

  const toggleActive = async (p: Promotion) => {
    const { error } = await supabase
      .from("site_promotions")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    const { error } = await supabase.from("site_promotions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold">Site Promotions</h3>
            <p className="text-sm text-muted-foreground">
              Floating notification offers • 5% commission on promoted product sales
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : promos.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No promotions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-muted/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium truncate">{p.title}</span>
                  <Badge variant={p.status === "approved" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                    {p.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {p.scope}
                  </Badge>
                  {p.promo_code && (
                    <code className="text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold font-mono">
                      {p.promo_code}
                    </code>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Wallet className="w-3 h-3" /> {p.commission_percent}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.message}</p>
              </div>

              <div className="flex items-center gap-2">
                {p.status === "approved" && (
                  <div className="flex items-center gap-2 px-2">
                    <Power className="w-3.5 h-3.5 text-muted-foreground" />
                    <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  </div>
                )}
                {p.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "approved")}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(p);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <SitePromotionFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={fetch}
          isAdmin={true}
          existing={editing}
        />
      )}
    </div>
  );
};
