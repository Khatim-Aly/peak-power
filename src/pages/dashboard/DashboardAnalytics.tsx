import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  Calendar
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#D4AF37', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];

const DashboardAnalytics = () => {
  const { role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [role]);

  const fetchData = async () => {
    setIsLoading(true);

    if (role === 'admin') {
      // Admin can query all tables
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('*'),
        supabase.from('products').select('*'),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } else if (role === 'merchant') {
      // Merchant uses RPC for orders, can query their own products
      const [ordersRes, productsRes] = await Promise.all([
        supabase.rpc('get_merchant_orders'),
        supabase.from('products').select('*'),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as any[]);
      if (productsRes.data) setProducts(productsRes.data);
    } else {
      // Regular user - just their orders
      const ordersRes = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });
      if (ordersRes.data) setOrders(ordersRes.data);
    }

    setIsLoading(false);
  };

  // Calculate analytics
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total_amount) : sum, 0);
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Group orders by month for chart
  const ordersByMonth = orders.reduce((acc: any, order) => {
    const month = new Date(order.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    if (!acc[month]) {
      acc[month] = { month, revenue: 0, orders: 0 };
    }
    if (order.status !== 'cancelled') {
      acc[month].revenue += Number(order.total_amount);
    }
    acc[month].orders += 1;
    return acc;
  }, {});

  const chartData = Object.values(ordersByMonth).slice(-6);

  // Order status distribution
  const statusDistribution = orders.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `PKR ${totalRevenue.toFixed(0)}`, 
      icon: DollarSign, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    { 
      label: 'Total Orders', 
      value: orders.length, 
      icon: Package, 
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    { 
      label: 'Avg Order Value', 
      value: `PKR ${averageOrderValue.toFixed(0)}`, 
      icon: ShoppingBag, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    ...(role === 'admin' ? [{ 
      label: 'Total Users', 
      value: users.length, 
      icon: Users, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    }] : [{ 
      label: 'Products', 
      value: products.length, 
      icon: ShoppingBag, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    }]),
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Loading analytics data...">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Analytics"
      subtitle="Track your business performance"
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif font-bold">Revenue Overview</h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Last 6 months
            </Badge>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData as any[]}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No revenue data yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="text-lg font-serif font-bold mb-6">Order Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No order data available</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {pieData.map((entry, index) => (
              <Badge key={entry.name} variant="outline" className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                {entry.name}: {entry.value as number}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Orders Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl border border-border p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-serif font-bold mb-6">Orders Over Time</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData as any[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No order data yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAnalytics;