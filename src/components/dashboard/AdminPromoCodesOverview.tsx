import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Store,
  Package,
  Percent,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PendingCode {
  id: string;
  code: string;
  discount_percent: number;
  scope: string;
  product_id: string | null;
  merchant_id: string | null;
  store_name: string | null;
  product_name: string | null;
  starts_at: string;
  expires_at: string;
  max_uses: number | null;
  used_count: number;
}

interface ActiveCode {
  id: string;
  code: string;
  discount_percent: number;
  scope: string;
  product_id: string | null;
  product_name: string | null;
  expires_at: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

interface StoreGroup {
  merchant_id: string | null;
  store_name: string;
  count: number;
  codes: ActiveCode[];
}

export const AdminPromoCodesOverview = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingCode[]>([]);
  const [activeByStore, setActiveByStore] = useState<StoreGroup[]>([]);
  const [openStore, setOpenStore] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_promo_codes_overview");
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setLoading(false);
      return;
    }
    const payload = data as any;
    if (payload?.error) {
      toast({ variant: "destructive", title: "Forbidden", description: "Admin only" });
    } else {
      setPending(payload?.pending || []);
      setActiveByStore(payload?.active_by_store || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("promo_codes").update({ status }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: status === "approved" ? "Approved ✓" : "Rejected" });
    load();
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Manage Promo Codes</h2>
            <p className="text-sm text-muted-foreground">
              Review pending submissions and active codes grouped by store
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="p-6 space-y-8">
          {/* PENDING */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Approval
              <Badge variant="outline" className="ml-1">
                {pending.length}
              </Badge>
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                No pending promo codes 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {pending.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-wrap items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
                  >
                    <span className="font-mono font-bold text-gold text-sm">{p.code}</span>
                    <Badge variant="outline" className="text-xs">
                      <Percent className="w-3 h-3 mr-1" />
                      {p.discount_percent}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {p.scope === "product" ? (
                        <>
                          <Package className="w-3 h-3 mr-1" />
                          {p.product_name || "Product"}
                        </>
                      ) : (
                        <>
                          <Store className="w-3 h-3 mr-1" />
                          {p.store_name || "Store"}
                        </>
                      )}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Expires {new Date(p.expires_at).toLocaleDateString("en-GB")}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={() => decide(p.id, "approved")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => decide(p.id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE GROUPED BY STORE */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Active Promo Codes by Store
              <Badge variant="outline" className="ml-1">
                {activeByStore.length} stores
              </Badge>
            </h3>
            {activeByStore.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                No active promo codes right now
              </p>
            ) : (
              <div className="space-y-2">
                {activeByStore.map((store) => {
                  const key = store.merchant_id || "platform";
                  const isOpen = openStore === key;
                  return (
                    <div
                      key={key}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenStore(isOpen ? null : key)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <Store className="w-4 h-4 text-gold" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{store.store_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {store.count} active promo {store.count === 1 ? "code" : "codes"}
                            </p>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border"
                          >
                            <div className="p-4 space-y-2 bg-muted/10">
                              {store.codes.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex flex-wrap items-center gap-3 p-3 bg-background rounded-md text-sm"
                                >
                                  <span className="font-mono font-bold text-gold">{c.code}</span>
                                  <Badge variant="outline" className="text-xs">
                                    <Percent className="w-3 h-3 mr-1" />
                                    {c.discount_percent}%
                                  </Badge>
                                  {c.scope === "product" && c.product_name && (
                                    <Badge variant="outline" className="text-xs">
                                      <Package className="w-3 h-3 mr-1" />
                                      {c.product_name}
                                    </Badge>
                                  )}
                                  {c.scope === "store" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Store className="w-3 h-3 mr-1" /> Whole store
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    Used {c.used_count}
                                    {c.max_uses ? `/${c.max_uses}` : ""} • Expires{" "}
                                    {new Date(c.expires_at).toLocaleDateString("en-GB")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodesOverview;
