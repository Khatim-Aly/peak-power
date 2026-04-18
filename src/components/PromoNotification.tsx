import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SitePromotion {
  id: string;
  title: string;
  message: string;
  promo_code: string | null;
  discount_percent: number | null;
  scope: string;
  product_id: string | null;
  merchant_id: string | null;
  cta_label: string | null;
  cta_url: string | null;
}

const SESSION_KEY = "promo_notification_dismissed";

const PromoNotification = () => {
  const [promo, setPromo] = useState<SitePromotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (dismissed) return;

    const fetchPromo = async () => {
      const { data } = await supabase
        .from("site_promotions")
        .select("*")
        .eq("status", "approved")
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setPromo(data as SitePromotion);
        // Slight delay for premium entrance
        setTimeout(() => setVisible(true), 1500);
      }
    };
    fetchPromo();
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  const handleCopy = async () => {
    if (!promo?.promo_code) return;
    await navigator.clipboard.writeText(promo.promo_code);
    setCopied(true);
    toast.success("Promo code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const targetUrl =
    promo?.cta_url ||
    (promo?.scope === "store" && promo?.merchant_id
      ? `/merchant/${promo.merchant_id}`
      : promo?.scope === "product" && promo?.product_id
      ? `/products`
      : "/products");

  return (
    <AnimatePresence>
      {visible && promo && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="relative flex items-center gap-3 rounded-full border border-gold/30 bg-background/80 px-4 py-3 shadow-2xl backdrop-blur-xl">
            {/* Glow */}
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-gold/20 via-amber-500/10 to-gold/20 blur-xl" />

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-600 text-background">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {promo.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {promo.message}
              </p>
            </div>

            {promo.promo_code ? (
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-mono font-semibold text-gold transition-all hover:bg-gold/20 active:scale-95"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {promo.promo_code}
              </button>
            ) : (
              <Link
                to={targetUrl}
                className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-background transition-transform active:scale-95"
              >
                {promo.cta_label || "Shop Now"}
              </Link>
            )}

            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromoNotification;
