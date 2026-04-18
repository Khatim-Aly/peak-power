import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SitePromotionFormModal } from "./SitePromotionFormModal";

export const MerchantPromotionsRequest = () => {
  const { user } = useAuth();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("site_promotions")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this request?")) return;
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
            <h3 className="font-semibold">Site Promotion Requests</h3>
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
              <Wallet className="w-3 h-3" /> 5% commission on promoted sales
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Request
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : promos.length === 0 ? (
        <div className="text-center py-10">
          <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No requests yet — promote a product or your store on the homepage notification.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium truncate">{p.title}</span>
                  <Badge
                    variant={
                      p.status === "approved" ? "default" : p.status === "pending" ? "secondary" : "destructive"
                    }
                  >
                    {p.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{p.scope}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.message}</p>
                {p.admin_notes && (
                  <p className="text-xs text-amber-600 mt-1">Admin: {p.admin_notes}</p>
                )}
              </div>
              {p.status === "pending" && (
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <SitePromotionFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={fetch}
          isAdmin={false}
        />
      )}
    </div>
  );
};
