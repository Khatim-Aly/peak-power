import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, MessageCircle, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface OrderStatus {
  id: string;
  status: "processing" | "shipped" | "out_for_delivery" | "delivered";
  date: string;
  message: string;
}

const OrderTracking = () => {
  const [orderId, setOrderId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderFound, setOrderFound] = useState<boolean | null>(null);

  const orderStatuses: OrderStatus[] = [
    {
      id: "1",
      status: "processing",
      date: "Order Placed",
      message: "Your order has been confirmed and is being prepared",
    },
    {
      id: "2",
      status: "shipped",
      date: "Shipped",
      message: "Your package is on its way",
    },
    {
      id: "3",
      status: "out_for_delivery",
      date: "Out for Delivery",
      message: "Your package is out for delivery today",
    },
    {
      id: "4",
      status: "delivered",
      date: "Delivered",
      message: "Package delivered successfully",
    },
  ];

  const currentStatusIndex = 1; // Simulated: Order is shipped

  const handleTrackOrder = async () => {
    if (!orderId.trim()) return;
    
    setIsSearching(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSearching(false);
    
    // Simulate order found (in real app, this would check against database)
    setOrderFound(orderId.toUpperCase().startsWith("SHJ") || orderId.toUpperCase().startsWith("PP"));
  };

  const handleWhatsAppTracking = () => {
    const message = orderId
      ? `Hi! I'd like to track my order: ${orderId}`
      : "Hi! I'd like to track my order. Can you help me?";
    const whatsappUrl = `https://wa.me/923554421113?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <section className="py-24 relative" id="order-tracking">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <Truck className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold">Track Your Order</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Order <span className="text-gradient-gold">Tracking</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Enter your order ID to track your package or get instant updates via WhatsApp
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-2xl mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setOrderFound(null);
                  }}
                  placeholder="Enter Order ID (e.g., PP-ABC123)"
                  className="h-14 pl-12 rounded-xl text-lg"
                />
              </div>
              <Button
                variant="hero"
                size="lg"
                onClick={handleTrackOrder}
                disabled={isSearching || !orderId.trim()}
                className="h-14 px-8"
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full"
                  />
                ) : (
                  "Track Order"
                )}
              </Button>
            </div>

            {/* WhatsApp Alternative */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">or</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWhatsAppTracking}
                className="text-gold hover:text-gold/80"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Track via WhatsApp
              </Button>
            </div>
          </motion.div>

          {/* Order Status Display */}
          <AnimatePresence mode="wait">
            {orderFound === true && (
              <motion.div
                key="order-found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-8 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="text-xl font-bold text-gold">{orderId.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-semibold">2-3 Business Days</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;

                    return (
                      <motion.div
                        key={status.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 mb-6 last:mb-0"
                      >
                        {/* Icon */}
                        <div className="relative">
                          <motion.div
                            animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? "bg-gradient-gold text-secondary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {status.status === "processing" && <Package className="w-5 h-5" />}
                            {status.status === "shipped" && <Truck className="w-5 h-5" />}
                            {status.status === "out_for_delivery" && <Clock className="w-5 h-5" />}
                            {status.status === "delivered" && <CheckCircle className="w-5 h-5" />}
                          </motion.div>
                          {index < orderStatuses.length - 1 && (
                            <div
                              className={`absolute left-1/2 top-10 w-0.5 h-8 -translate-x-1/2 ${
                                index < currentStatusIndex ? "bg-gold" : "bg-muted"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <p
                            className={`font-semibold ${
                              isCurrent ? "text-gold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {status.date}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {status.message}
                          </p>
                        </div>

                        {/* Status Badge */}
                        {isCurrent && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium h-fit"
                          >
                            Current
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* WhatsApp Updates Button */}
                <div className="mt-8 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleWhatsAppTracking}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Get Live Updates on WhatsApp
                  </Button>
                </div>
              </motion.div>
            )}

            {orderFound === false && (
              <motion.div
                key="order-not-found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-8 rounded-2xl text-center"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find an order with ID "{orderId}". Please check your order ID and try again.
                </p>
                <Button variant="outline" onClick={handleWhatsAppTracking}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Support on WhatsApp
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default OrderTracking;
