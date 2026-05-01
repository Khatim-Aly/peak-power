import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthModal } from "@/components/auth/AuthModal";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name?: string;
}

interface Props {
  productId: string;
}

const StarRow = ({
  value,
  onChange,
  size = 5,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={!onChange}
        onClick={() => onChange?.(n)}
        className={onChange ? "transition-transform hover:scale-110 active:scale-95" : ""}
      >
        <Star
          className={`w-${size} h-${size} ${
            n <= value ? "fill-gold text-gold" : "text-muted-foreground/40"
          }`}
        />
      </button>
    ))}
  </div>
);

export const ProductReviews = ({ productId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: rs } = await supabase
      .from("product_reviews")
      .select("id, user_id, rating, comment, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (rs) {
      const userIds = [...new Set(rs.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p: any) => {
        nameMap[p.user_id] = p.full_name || p.email?.split("@")[0] || "Customer";
      });
      setReviews(rs.map((r) => ({ ...r, user_name: nameMap[r.user_id] || "Customer" })));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [productId]);

  const submit = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("product_reviews")
      .upsert(
        { product_id: productId, user_id: user.id, rating, comment: comment.trim() || null },
        { onConflict: "product_id,user_id" }
      );
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't post review", description: error.message });
      return;
    }
    toast({ title: "Review posted ⭐", description: "Thank you for your feedback!" });
    setComment("");
    setRating(5);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    load();
  };

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-gold" />
          Customer Reviews
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRow value={Math.round(parseFloat(avg))} />
            <span className="font-semibold">{avg}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Write a review */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <p className="font-medium mb-3">{myReview ? "Update your review" : "Write a review"}</p>
        <div className="mb-3">
          <StarRow value={rating} onChange={setRating} />
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={3}
          className="mb-3"
        />
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {myReview ? "Update Review" : "Post Review"}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gold/20 text-gold">
                    {r.user_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{r.user_name}</p>
                    {user?.id === r.user_id && (
                      <button
                        onClick={() => remove(r.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <StarRow value={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-foreground/80">{r.comment}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
    </section>
  );
};

export default ProductReviews;
