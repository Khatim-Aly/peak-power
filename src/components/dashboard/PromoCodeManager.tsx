import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  Truck,
  Store,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PromoCodeFormModal } from "./PromoCodeFormModal";

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
  created_at: string;
}

interface PromoCodeManagerProps {
  isAdmin: boolean;
  merchantId?: string;
}

export const PromoCodeManager = ({ isAdmin, merchantId }: PromoCodeManagerProps) => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    let query = supabase.from("promo_codes").select("*").order("created_at", { ascending: false });

    if (!isAdmin && merchantId) {
      query = query.eq("merchant_id", merchantId);
    }

    const { data } = await query;
    if (data) setCodes(data as PromoCode[]);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete promo code" });
      return;
    }
    toast({ title: "Deleted", description: "Promo code removed" });
    fetchCodes();
  };

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("promo_codes").update({ status }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
      return;
    }
    toast({ title: status === "approved" ? "Approved ✓" : "Rejected", description: `Promo code ${status}` });
    fetchCodes();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const isNotStarted = (startsAt: string) => new Date(startsAt) > new Date();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Promo Codes</h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Manage all promo codes & approve merchant requests" : "Create promo codes for your store"}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingCode(null); setIsModalOpen(true); }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Code
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-20 h-6 rounded" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24 flex-1" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : codes.length === 0 ? (
        <div className="p-12 text-center">
          <Tag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No promo codes yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Free Ship</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((promo, index) => {
                const expired = isExpired(promo.expires_at);
                const notStarted = isNotStarted(promo.starts_at);

                return (
                  <motion.tr
                    key={promo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-border ${expired ? "opacity-50" : ""}`}
                  >
                    <TableCell>
                      <span className="font-mono font-bold text-gold">{promo.code}</span>
                    </TableCell>
                    <TableCell>
                      {promo.discount_percent > 0 ? (
                        <span className="flex items-center gap-1"><Percent className="w-3 h-3" />{promo.discount_percent}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {promo.free_shipping_threshold ? (
                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" />PKR {promo.free_shipping_threshold}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {promo.scope === "product" ? (
                          <><Package className="w-3 h-3 mr-1" />Product</>
                        ) : (
                          <><Store className="w-3 h-3 mr-1" />Store</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                      ) : notStarted ? (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>
                      ) : (
                        getStatusBadge(promo.status)
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{new Date(promo.starts_at).toLocaleDateString("en-GB")}</div>
                      <div>→ {new Date(promo.expires_at).toLocaleDateString("en-GB")}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {promo.used_count}{promo.max_uses ? `/${promo.max_uses}` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Admin approval buttons for pending merchant codes */}
                        {isAdmin && promo.status === "pending" && promo.merchant_id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproval(promo.id, "approved")}
                              className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproval(promo.id, "rejected")}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingCode(promo); setIsModalOpen(true); }}
                          className="text-gold hover:text-gold"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal */}
      <PromoCodeFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCode(null); }}
        onSave={fetchCodes}
        editingCode={editingCode}
        isAdmin={isAdmin}
        merchantId={merchantId}
      />
    </div>
  );
};
