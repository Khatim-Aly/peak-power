import { Shield, Leaf, Truck } from "lucide-react";

const CartTrustBadges = () => {
  const badges = [
    { icon: Shield, label: "Secure Checkout" },
    { icon: Leaf, label: "100% Authentic" },
    { icon: Truck, label: "Fast Delivery" },
  ];

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-center gap-1.5">
          <badge.icon className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] text-muted-foreground font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CartTrustBadges;
