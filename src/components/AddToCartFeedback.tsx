import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBag } from "lucide-react";

interface AddToCartFeedbackProps {
  show: boolean;
  productName?: string;
  onDone: () => void;
}

const AddToCartFeedback = ({ show, productName, onDone }: AddToCartFeedbackProps) => {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 2200);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[99995] max-w-sm w-full mx-4"
        >
          <div className="bg-card border border-gold/30 rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0"
            >
              <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Added to Cart ✓</p>
              {productName && (
                <p className="text-xs text-muted-foreground truncate">{productName}</p>
              )}
            </div>
            <ShoppingBag className="w-5 h-5 text-gold flex-shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AddToCartFeedback;
