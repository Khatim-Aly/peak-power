import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { conversionConfig } from "@/lib/conversionConfig";

const SESSION_KEY = "ppgb_social_proof_count";

const SocialProofPopup = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({ city: "", product: "", timeAgo: "" });
  const countRef = useRef(parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { cities, productNames, intervalMs, maxPerSession } = conversionConfig.socialProof;

  const generateData = () => {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const product = productNames[Math.floor(Math.random() * productNames.length)];
    const mins = Math.floor(Math.random() * 15) + 1;
    return { city, product, timeAgo: `${mins} min ago` };
  };

  useEffect(() => {
    // Initial delay before first popup
    const initialDelay = setTimeout(() => {
      if (countRef.current < maxPerSession) {
        setData(generateData());
        setVisible(true);
        countRef.current++;
        sessionStorage.setItem(SESSION_KEY, String(countRef.current));

        // Auto-hide after 5s
        setTimeout(() => setVisible(false), 5000);
      }

      // Recurring
      timerRef.current = setInterval(() => {
        if (countRef.current >= maxPerSession) {
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
        setData(generateData());
        setVisible(true);
        countRef.current++;
        sessionStorage.setItem(SESSION_KEY, String(countRef.current));
        setTimeout(() => setVisible(false), 5000);
      }, intervalMs);
    }, 8000); // First popup after 8s

    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="fixed bottom-24 left-4 z-50 max-w-xs"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg p-3.5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                Someone in <span className="text-gold font-semibold">{data.city}</span> purchased
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{data.product}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{data.timeAgo}</p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SocialProofPopup;
