import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  DollarSign, 
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  XCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface NormalizedOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_phone?: string | null;
  customer_name?: string | null;
  items: {
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
  }[];
}

const statusOptions = [
  { value: 'placed', label: 'Placed', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-indigo-500' },
  { value: 'dispatched', label: 'Dispatched', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-amber-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const DashboardOrders = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  
  // For regular users, use the useOrders hook
  const { orders: userOrders, isLoading: userOrdersLoading } = useOrders();
  
  // For admin/merchant, fetch separately
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'admin') {
      fetchAdminOrders();
    } else if (role === 'merchant') {
      fetchMerchantOrders();
    } else {
      setIsLoading(false);
    }
  }, [role]);

  const fetchAdminOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*)`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAdminOrders(data);
    }
    setIsLoading(false);
  };

  const fetchMerchantOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_merchant_orders');
    if (!error && data) {
      setMerchantOrders(data as any[]);
    }
    setIsLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus as any })
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

    if (role === 'admin') fetchAdminOrders();
    else if (role === 'merchant') fetchMerchantOrders();
  };

  // Normalize orders to a common shape
  const orders: NormalizedOrder[] = role === 'admin' 
    ? adminOrders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at,
        shipping_address: o.shipping_address,
        shipping_city: o.shipping_city,
        shipping_phone: o.shipping_phone,
        items: o.order_items || [],
      }))
    : role === 'merchant'
    ? merchantOrders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at,
        customer_name: o.customer_name,
        items: o.order_items || [],
      }))
    : userOrders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at,
        shipping_address: o.shipping_address,
        shipping_city: o.shipping_city,
        shipping_phone: o.shipping_phone,
        items: o.items || [],
      }));

  const loading = role === 'user' || !role ? userOrdersLoading : isLoading;

  const pendingOrders = orders.filter(o => ['placed', 'confirmed'].includes(o.status));
  const inTransitOrders = orders.filter(o => ['dispatched', 'shipped'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total_amount) : sum, 0);

  const canEditStatus = role === 'admin' || role === 'merchant';

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-gold', bgColor: 'bg-gold/10' },
    { label: 'Pending', value: pendingOrders.length, icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'In Transit', value: inTransitOrders.length, icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label: 'Revenue', value: `PKR ${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ];

  const renderOrdersList = (ordersList: typeof orders) => {
    if (ordersList.length === 0) {
      return (
        <div className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {ordersList.map((order, index) => {
          const isExpanded = expandedOrder === order.id;
          const statusConfig = statusOptions.find(s => s.value === order.status);
          const items = order.items || [];

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {items[0]?.product_image ? (
                      <img 
                        src={items[0].product_image} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

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
                      {items.length} items • PKR {Number(order.total_amount).toFixed(2)}
                    </p>
                  </div>

                  {canEditStatus && (
                    <div onClick={e => e.stopPropagation()}>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
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
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                    {/* Customer info for merchant */}
                    {role === 'merchant' && order.customer_name && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" /> Customer
                        </h4>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      </div>
                    )}

                    {/* Shipping info for admin */}
                    {role === 'admin' && order.shipping_address && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Shipping Address
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address}, {order.shipping_city}
                        </p>
                        {order.shipping_phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {order.shipping_phone}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Shipping info for user's own orders */}
                    {(!role || role === 'user') && (order as any).shipping_address && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Shipping Address
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {(order as any).shipping_address}, {(order as any).shipping_city}
                        </p>
                        {(order as any).shipping_phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {(order as any).shipping_phone}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {items.map((item, i) => (
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
                                Qty: {item.quantity} × PKR {Number(item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

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
    );
  };

  return (
    <DashboardLayout 
      title={role === 'user' || !role ? "My Orders" : "Orders Management"}
      subtitle={role === 'user' || !role ? "Track your order history" : "View and manage all orders"}
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
        <Tabs defaultValue="all" className="w-full">
          <div className="p-6 border-b border-border">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                All ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="transit" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                In Transit ({inTransitOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Cancelled ({cancelledOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
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
          ) : (
            <>
              <TabsContent value="all" className="m-0">
                {renderOrdersList(orders)}
              </TabsContent>
              <TabsContent value="pending" className="m-0">
                {renderOrdersList(pendingOrders)}
              </TabsContent>
              <TabsContent value="transit" className="m-0">
                {renderOrdersList(inTransitOrders)}
              </TabsContent>
              <TabsContent value="completed" className="m-0">
                {renderOrdersList(completedOrders)}
              </TabsContent>
              <TabsContent value="cancelled" className="m-0">
                {renderOrdersList(cancelledOrders)}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;