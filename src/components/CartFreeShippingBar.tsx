import { motion } from "framer-motion";
import { Truck, Gift } from "lucide-react";
import { conversionConfig } from "@/lib/conversionConfig";

interface CartFreeShippingBarProps {
  subtotal: number;
}

const CartFreeShippingBar = ({ subtotal }: CartFreeShippingBarProps) => {
  const { threshold, currency } = conversionConfig.freeShipping;
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - subtotal, 0);
  const qualified = remaining <= 0;

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {qualified ? (
            <Gift className="w-4 h-4 text-green-500" />
          ) : (
            <Truck className="w-4 h-4 text-gold" />
          )}
          <span className="text-xs font-medium">
            {qualified
              ? "🎉 You've unlocked FREE shipping!"
              : `Add ${currency} ${remaining.toLocaleString()} more for free shipping`}
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${
            qualified
              ? "bg-green-500"
              : "bg-gradient-to-r from-gold to-accent"
          }`}
        />
      </div>
    </div>
  );
};

export default CartFreeShippingBar;
