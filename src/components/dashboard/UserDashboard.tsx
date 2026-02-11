import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Heart, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  TrendingUp,
  Eye
} from "lucide-react";
import { DashboardLayout } from "./DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const statusConfig = {
  placed: { color: 'bg-blue-500', label: 'Order Placed', icon: Clock },
  confirmed: { color: 'bg-indigo-500', label: 'Confirmed', icon: CheckCircle },
  dispatched: { color: 'bg-purple-500', label: 'Dispatched', icon: Package },
  shipped: { color: 'bg-amber-500', label: 'In Transit', icon: TrendingUp },
  delivered: { color: 'bg-green-500', label: 'Delivered', icon: CheckCircle },
  cancelled: { color: 'bg-red-500', label: 'Cancelled', icon: XCircle },
};

export const UserDashboard = () => {
  const { profile } = useAuth();
  const { orders, activeOrders, completedOrders, cancelledOrders, isLoading: ordersLoading } = useOrders();
  const { favorites, isLoading: favoritesLoading } = useFavorites();

  const stats = [
    { 
      label: 'Active Orders', 
      value: activeOrders.length, 
      icon: Clock, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'Completed', 
      value: completedOrders.length, 
      icon: CheckCircle, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Favorites', 
      value: favorites.length, 
      icon: Heart, 
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    { 
      label: 'Total Orders', 
      value: orders.length, 
      icon: Package, 
      color: 'text-gold',
      bgColor: 'bg-gold/10'
    },
  ];

  return (
    <DashboardLayout 
      title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'there'}!`}
      subtitle="Here's what's happening with your orders"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl p-5 border border-border hover:border-gold/30 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Orders Section */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold">My Orders</h2>
          <Link to="/dashboard/orders">
            <Button variant="ghost" className="text-gold hover:text-gold/80">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4 bg-muted/50">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active ({activeOrders.length})
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

          <AnimatePresence mode="wait">
            <TabsContent value="active" className="mt-0">
              <OrdersList orders={activeOrders} isLoading={ordersLoading} emptyMessage="No active orders" />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <OrdersList orders={completedOrders} isLoading={ordersLoading} emptyMessage="No completed orders yet" />
            </TabsContent>

            <TabsContent value="cancelled" className="mt-0">
              <OrdersList orders={cancelledOrders} isLoading={ordersLoading} emptyMessage="No cancelled orders" />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-6 border border-gold/20"
        >
          <ShoppingBag className="w-10 h-10 text-gold mb-4" />
          <h3 className="text-lg font-semibold mb-2">Continue Shopping</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Explore our premium Himalayan Shilajit collection
          </p>
          <Link to="/product">
            <Button variant="hero" size="sm">
              Shop Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-rose-500/20 to-rose-500/5 rounded-2xl p-6 border border-rose-500/20"
        >
          <Heart className="w-10 h-10 text-rose-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your Wishlist</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {favorites.length > 0 
              ? `You have ${favorites.length} items saved`
              : 'Start adding items you love'}
          </p>
          <Link to="/dashboard/favorites">
            <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
              View Favorites <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

interface OrdersListProps {
  orders: any[];
  isLoading: boolean;
  emptyMessage: string;
}

const OrdersList = ({ orders, isLoading, emptyMessage }: OrdersListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
        <Link to="/product">
          <Button variant="outline" className="mt-4">
            Start Shopping
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.slice(0, 5).map((order, index) => {
        const status = statusConfig[order.status as keyof typeof statusConfig];
        const StatusIcon = status.icon;
        
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-gold/30 transition-all cursor-pointer group"
          >
            {/* Order Image */}
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
              {order.items?.[0]?.product_image ? (
                <img 
                  src={order.items[0].product_image} 
                  alt={order.items[0].product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Order Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{order.order_number}</p>
              <p className="text-sm text-muted-foreground">
                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} • 
                PKR {order.total_amount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(order.created_at).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Status Badge */}
            <Badge 
              variant="secondary" 
              className={`${status.color} text-white flex items-center gap-1`}
            >
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>

            {/* View Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};
