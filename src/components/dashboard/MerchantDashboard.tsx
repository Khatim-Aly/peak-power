import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Truck,
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { DashboardLayout } from "./DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  notes: string | null;
  order_items: {
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
  }[];
  customer_name: string | null;
}

const statusOptions = [
  { value: 'placed', label: 'Placed', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-indigo-500' },
  { value: 'dispatched', label: 'Dispatched', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-amber-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export const MerchantDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.rpc('get_merchant_orders');

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
    setIsLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'placed' | 'confirmed' | 'dispatched' | 'shipped' | 'delivered' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
      return;
    }

    toast({
      title: "Status Updated",
      description: `Order status changed to ${newStatus}`,
    });

    fetchOrders();
  };

  const pendingOrders = orders.filter(o => ['placed', 'confirmed'].includes(o.status));
  const inTransitOrders = orders.filter(o => ['dispatched', 'shipped'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total_amount) : sum, 0);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-gold', bgColor: 'bg-gold/10' },
    { label: 'Pending', value: pendingOrders.length, icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'In Transit', value: inTransitOrders.length, icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label: 'Revenue', value: `£${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ];

  return (
    <DashboardLayout 
      title="Merchant Dashboard"
      subtitle="Manage your orders and track deliveries"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl p-5 border border-border"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-serif font-bold">Recent Orders</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order, index) => {
              const isExpanded = expandedOrder === order.id;
              const statusConfig = statusOptions.find(s => s.value === order.status);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Order Row */}
                  <div 
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Order Image */}
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {order.order_items?.[0]?.product_image ? (
                          <img 
                            src={order.order_items[0].product_image} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.order_number}</p>
                          <Badge 
                            variant="secondary"
                            className={`${statusConfig?.color} text-white text-xs`}
                          >
                            {statusConfig?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.order_items?.length || 0} items • £{Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>

                      {/* Status Selector */}
                      <div onClick={e => e.stopPropagation()}>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value as 'placed' | 'confirmed' | 'dispatched' | 'shipped' | 'delivered' | 'cancelled')}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                        {/* Customer Info */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <User className="w-4 h-4" /> Customer
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name || 'N/A'}
                          </p>
                        </div>

                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {order.order_items?.map((item, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm">
                                <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                                  {item.product_image ? (
                                    <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p>{item.product_name}</p>
                                  <p className="text-muted-foreground">
                                    Qty: {item.quantity} × £{Number(item.price).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Date */}
                        <p className="text-xs text-muted-foreground">
                          Ordered on {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
