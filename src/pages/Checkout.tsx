import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  CheckCircle, 
  ChevronRight,
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Mail,
  Home,
  Building,
  Tag,
  X,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCartContext } from "@/contexts/CartContext";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";

type CheckoutStep = "cart" | "shipping" | "payment" | "confirmation";

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
}

interface CheckoutCartItem {
  id: string;
  product_id: string;
  quantity: number;
  variant: string | null;
  product?: ProductDetails;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ShippingFee {
  id: string;
  city: string;
  fee: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { cartItems: rawCartItems, clearCart, updateQuantity: updateCartQuantity } = useCartContext();
  const { createOrder } = useOrders();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([]);
  const [selectedShippingFee, setSelectedShippingFee] = useState<number>(0);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutCartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoFreeShipping, setPromoFreeShipping] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ variant: "destructive", title: "Please sign in to checkout" });
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Pakistan",
  });

  // Fetch product details for cart items
  useEffect(() => {
    const fetchProducts = async () => {
      if (rawCartItems.length === 0) {
        setCheckoutItems([]);
        return;
      }
      const productIds = rawCartItems.map(i => i.product_id);
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, original_price, image_url')
        .in('id', productIds);

      const items: CheckoutCartItem[] = rawCartItems.map(ci => ({
        ...ci,
        product: products?.find(p => p.id === ci.product_id) as ProductDetails | undefined,
      }));
      setCheckoutItems(items);
    };
    fetchProducts();
  }, [rawCartItems]);

  // Fetch shipping fees from DB
  useEffect(() => {
    supabase
      .from('shipping_fees')
      .select('*')
      .order('city')
      .then(({ data }) => {
        if (data) setShippingFees(data);
      });
  }, []);

  // Update shipping fee when city changes
  useEffect(() => {
    if (shippingInfo.city) {
      const fee = shippingFees.find(
        (f) => f.city.toLowerCase() === shippingInfo.city.toLowerCase()
      );
      setSelectedShippingFee(fee ? fee.fee : 0);
    } else {
      setSelectedShippingFee(0);
    }
  }, [shippingInfo.city, shippingFees]);

  const steps = [
    { id: "cart", label: "Cart", icon: ShoppingBag },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "confirmation", label: "Confirm", icon: CheckCircle },
  ];

  const subtotal = checkoutItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  const discountAmount = promoDiscount > 0 ? Math.round(subtotal * promoDiscount / 100) : 0;
  const effectiveShipping = promoFreeShipping && subtotal > 0 ? 0 : selectedShippingFee;
  const total = subtotal - discountAmount + effectiveShipping;
  const totalSavings = checkoutItems.reduce(
    (acc, item) => acc + ((item.product?.original_price || item.product?.price || 0) - (item.product?.price || 0)) * item.quantity,
    0
  ) + discountAmount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");

    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, discount_percent, free_shipping_threshold, scope, max_uses, used_count")
      .eq("code", promoCode.trim().toUpperCase())
      .eq("is_active", true)
      .eq("status", "approved")
      .lte("starts_at", new Date().toISOString())
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    setPromoLoading(false);

    if (error || !data) {
      setPromoError("Invalid or expired promo code");
      setPromoDiscount(0);
      setPromoFreeShipping(false);
      setAppliedPromo(null);
      return;
    }

    if (data.max_uses && data.used_count >= data.max_uses) {
      setPromoError("This promo code has reached its usage limit");
      return;
    }

    setPromoDiscount(data.discount_percent || 0);
    setPromoFreeShipping(data.free_shipping_threshold != null && subtotal >= Number(data.free_shipping_threshold));
    setAppliedPromo(data.code);
    toast({ title: "Promo Applied! 🎉", description: `${data.discount_percent}% discount applied` });
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoDiscount(0);
    setPromoFreeShipping(false);
    setAppliedPromo(null);
    setPromoError("");
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartQuantity(id, newQuantity);
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateShipping = () => {
    const required = ["fullName", "email", "phone", "address", "city"];
    return required.every((field) => shippingInfo[field as keyof ShippingInfo].trim());
  };

  const handleNextStep = () => {
    if (currentStep === "cart") {
      if (checkoutItems.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Add some products to your cart first.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("shipping");
    } else if (currentStep === "shipping") {
      if (!validateShipping()) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Please sign in to place an order" });
      return;
    }
    setIsProcessing(true);

    const orderItems = checkoutItems.map(item => ({
      product_name: item.product?.name || 'Unknown Product',
      product_image: item.product?.image_url || null,
      quantity: item.quantity,
      price: item.product?.price || 0,
      product_id: item.product_id,
    }));

    const result = await createOrder({
      total_amount: total,
      shipping_address: shippingInfo.address,
      shipping_city: shippingInfo.city,
      shipping_postal_code: shippingInfo.zipCode,
      shipping_phone: shippingInfo.phone,
      notes: shippingInfo.state ? `State: ${shippingInfo.state}` : undefined,
      items: orderItems,
    });

    setIsProcessing(false);

    if (result.error) {
      toast({ variant: "destructive", title: "Order failed", description: result.error.message });
      return;
    }

    setOrderId(result.data?.order_number || result.data?.id || '');
    await clearCart();
    setCurrentStep("confirmation");

    toast({
      title: "Order Placed Successfully! 🎉",
      description: `Your order has been confirmed.`,
    });
  };

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Progress Steps */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
                <motion.div
                  className="h-full bg-gradient-gold"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(stepIndex / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {steps.map((step, index) => {
                const isActive = index === stepIndex;
                const isCompleted = index < stepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted || isActive ? "hsl(var(--gold))" : "hsl(var(--muted))",
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted || isActive
                          ? "text-secondary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive ? "text-gold" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {currentStep === "cart" && (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-6 rounded-2xl"
                  >
                    <h2 className="text-2xl font-serif font-bold mb-6">Your Cart</h2>
                    
                    {checkoutItems.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-muted/30 mb-4">
                        <img
                          src={item.product?.image_url || '/placeholder.svg'}
                          alt={item.product?.name || 'Product'}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product?.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.variant || ''}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-gold">
                              PKR {(item.product?.price || 0).toLocaleString()}
                            </span>
                            {item.product?.original_price && item.product.original_price > item.product.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                PKR {item.product.original_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {currentStep === "shipping" && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-6 rounded-2xl"
                  >
                    <h2 className="text-2xl font-serif font-bold mb-6">Shipping Information</h2>
                    
                    <div className="grid gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-gold" />
                            Full Name *
                          </label>
                          <Input
                            name="fullName"
                            value={shippingInfo.fullName}
                            onChange={handleShippingChange}
                            placeholder="John Doe"
                            className="h-12 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gold" />
                            Email *
                          </label>
                          <Input
                            name="email"
                            type="email"
                            value={shippingInfo.email}
                            onChange={handleShippingChange}
                            placeholder="john@example.com"
                            className="h-12 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gold" />
                          Phone Number *
                        </label>
                        <Input
                          name="phone"
                          type="tel"
                          value={shippingInfo.phone}
                          onChange={handleShippingChange}
                          placeholder="+92 355 442 1113"
                          className="h-12 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <Home className="w-4 h-4 text-gold" />
                          Street Address *
                        </label>
                        <Input
                          name="address"
                          value={shippingInfo.address}
                          onChange={handleShippingChange}
                          placeholder="123 Main Street, Apartment 4B"
                          className="h-12 rounded-xl"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Building className="w-4 h-4 text-gold" />
                            City *
                          </label>
                          {shippingFees.length > 0 ? (
                            <Select
                              value={shippingInfo.city}
                              onValueChange={(value) =>
                                setShippingInfo((prev) => ({ ...prev, city: value }))
                              }
                            >
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Select your city" />
                              </SelectTrigger>
                              <SelectContent>
                                {shippingFees.map((sf) => (
                                  <SelectItem key={sf.id} value={sf.city}>
                                    {sf.city} — PKR {sf.fee.toLocaleString()} shipping
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              name="city"
                              value={shippingInfo.city}
                              onChange={handleShippingChange}
                              placeholder="Karachi"
                              className="h-12 rounded-xl"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gold" />
                            State / Province
                          </label>
                          <Input
                            name="state"
                            value={shippingInfo.state}
                            onChange={handleShippingChange}
                            placeholder="Sindh"
                            className="h-12 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Zip / Postal Code</label>
                          <Input
                            name="zipCode"
                            value={shippingInfo.zipCode}
                            onChange={handleShippingChange}
                            placeholder="75500"
                            className="h-12 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Country</label>
                          <Input
                            name="country"
                            value={shippingInfo.country}
                            onChange={handleShippingChange}
                            className="h-12 rounded-xl"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === "payment" && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-6 rounded-2xl"
                  >
                    <h2 className="text-2xl font-serif font-bold mb-6">Payment Method</h2>
                    
                    <div className="space-y-4">
                      {/* Cash on Delivery - Primary Option */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="p-6 rounded-2xl border-2 border-gold bg-gold/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center">
                            <Truck className="w-6 h-6 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">Cash on Delivery</h3>
                            <p className="text-sm text-muted-foreground">
                              Pay when your order arrives
                            </p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-gold bg-gold flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-secondary" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Credit Card - Coming Soon */}
                      <div className="p-6 rounded-2xl border border-border bg-muted/30 opacity-60">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">Credit / Debit Card</h3>
                            <p className="text-sm text-muted-foreground">
                              Coming soon
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            Soon
                          </span>
                        </div>
                      </div>

                      {/* Bank Transfer - Coming Soon */}
                      <div className="p-6 rounded-2xl border border-border bg-muted/30 opacity-60">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                            <Building className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">Bank Transfer</h3>
                            <p className="text-sm text-muted-foreground">
                              Coming soon
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            Soon
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-6 text-sm text-muted-foreground text-center">
                      🔒 Your payment information is secure and encrypted
                    </p>
                  </motion.div>
                )}

                {currentStep === "confirmation" && (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 rounded-2xl text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-secondary" />
                    </motion.div>

                    <h2 className="text-3xl font-serif font-bold mb-3">
                      Order <span className="text-gradient-gold">Confirmed!</span>
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Thank you for your order. We've sent a confirmation to your email.
                    </p>

                    <div className="glass-card p-6 rounded-xl mb-6 bg-gold/5">
                      <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                      <p className="text-xl font-bold text-gold">{orderId}</p>
                    </div>

                    <div className="space-y-3 text-left p-6 rounded-xl bg-muted/30 mb-6">
                      <h3 className="font-semibold mb-4">Shipping Details</h3>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Name:</span>{" "}
                        {shippingInfo.fullName}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Email:</span>{" "}
                        {shippingInfo.email}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Phone:</span>{" "}
                        {shippingInfo.phone}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Address:</span>{" "}
                        {shippingInfo.address}, {shippingInfo.city}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="glow"
                        className="flex-1"
                        onClick={() => navigate("/")}
                      >
                        Continue Shopping
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const message = `Hi! I just placed order ${orderId}. Can you confirm my order details?`;
                          const whatsappUrl = `https://wa.me/923554421113?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, "_blank");
                        }}
                      >
                        Track on WhatsApp
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            {currentStep !== "confirmation" && (
              <div className="lg:col-span-1">
                <div className="glass-card p-6 rounded-2xl sticky top-28">
                  <h3 className="text-lg font-serif font-bold mb-4">Order Summary</h3>

                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-3 mb-4 pb-4 border-b border-border">
                      <img
                        src={item.product?.image_url || '/placeholder.svg'}
                        alt={item.product?.name || 'Product'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.variant || ''}</p>
                        <p className="text-sm font-semibold mt-1">
                          {item.quantity} × PKR {(item.product?.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>PKR {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      {shipping > 0 ? (
                        <span className="font-semibold">PKR {shipping.toLocaleString()}</span>
                      ) : shippingInfo.city ? (
                        <span className="text-gold font-semibold">FREE</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Select city</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-gold">
                      <span>You Save</span>
                      <span>PKR {totalSavings.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-gradient-gold">
                        PKR {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleNextStep}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full"
                      />
                    ) : currentStep === "cart" ? (
                      <>
                        Proceed to Shipping
                        <ChevronRight className="w-5 h-5 ml-1" />
                      </>
                    ) : currentStep === "shipping" ? (
                      <>
                        Continue to Payment
                        <ChevronRight className="w-5 h-5 ml-1" />
                      </>
                    ) : (
                      <>
                        Place Order
                        <CheckCircle className="w-5 h-5 ml-1" />
                      </>
                    )}
                  </Button>

                  {currentStep !== "cart" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        const prevSteps: Record<CheckoutStep, CheckoutStep> = {
                          cart: "cart",
                          shipping: "cart",
                          payment: "shipping",
                          confirmation: "payment",
                        };
                        setCurrentStep(prevSteps[currentStep]);
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Go Back
                    </Button>
                  )}

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    🔒 Secure checkout · 30-day money-back guarantee
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
