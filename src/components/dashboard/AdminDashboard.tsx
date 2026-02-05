import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Store, 
  Package, 
  DollarSign,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  UserCheck
} from "lucide-react";
import { DashboardLayout } from "./DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [usersRes, rolesRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    setIsLoading(false);
  };

  const getUserRole = (userId: string) => {
    const role = roles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'merchant' | 'admin') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      });
      return;
    }

    toast({
      title: "Role Updated",
      description: `User role changed to ${newRole}`,
    });

    fetchData();
  };

  const merchants = users.filter(u => getUserRole(u.user_id) === 'merchant');
  const admins = users.filter(u => getUserRole(u.user_id) === 'admin');
  const regularUsers = users.filter(u => getUserRole(u.user_id) === 'user');
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total_amount) : sum, 0);

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'Merchants', value: merchants.length, icon: Store, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label: 'Revenue', value: `£${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</Badge>;
      case 'merchant':
        return <Badge variant="secondary" className="flex items-center gap-1"><Store className="w-3 h-3" /> Merchant</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Users className="w-3 h-3" /> User</Badge>;
    }
  };

  return (
    <DashboardLayout 
      title="Admin Control Panel"
      subtitle="Manage users, merchants, and monitor platform activity"
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

      {/* Users Management */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Tabs defaultValue="users" className="w-full">
          <div className="p-6 border-b border-border">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users ({regularUsers.length})
              </TabsTrigger>
              <TabsTrigger value="merchants" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Merchants ({merchants.length})
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admins ({admins.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Orders ({orders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="users" className="m-0">
                <UsersTable 
                  users={regularUsers} 
                  getRoleBadge={getRoleBadge} 
                  getUserRole={getUserRole}
                  onUpdateRole={updateUserRole}
                />
              </TabsContent>

              <TabsContent value="merchants" className="m-0">
                <UsersTable 
                  users={merchants} 
                  getRoleBadge={getRoleBadge} 
                  getUserRole={getUserRole}
                  onUpdateRole={updateUserRole}
                />
              </TabsContent>

              <TabsContent value="admins" className="m-0">
                <UsersTable 
                  users={admins} 
                  getRoleBadge={getRoleBadge} 
                  getUserRole={getUserRole}
                  onUpdateRole={updateUserRole}
                />
              </TabsContent>

              <TabsContent value="orders" className="m-0">
                <OrdersTable orders={orders} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

interface UsersTableProps {
  users: UserProfile[];
  getRoleBadge: (role: string) => React.ReactNode;
  getUserRole: (userId: string) => string;
  onUpdateRole: (userId: string, role: string) => void;
}

const UsersTable = ({ users, getRoleBadge, getUserRole, onUpdateRole }: UsersTableProps) => {
  if (users.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const role = getUserRole(user.user_id);
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-medium">
                      {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{user.full_name || 'Unnamed'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{getRoleBadge(role)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('en-GB')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {role !== 'merchant' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onUpdateRole(user.user_id, 'merchant')}
                      >
                        <Store className="w-4 h-4 mr-1" />
                        Make Merchant
                      </Button>
                    )}
                    {role !== 'admin' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onUpdateRole(user.user_id, 'admin')}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Make Admin
                      </Button>
                    )}
                    {role !== 'user' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onUpdateRole(user.user_id, 'user')}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Reset to User
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const OrdersTable = ({ orders }: { orders: any[] }) => {
  const statusColors: Record<string, string> = {
    placed: 'bg-blue-500',
    confirmed: 'bg-indigo-500',
    dispatched: 'bg-purple-500',
    shipped: 'bg-amber-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center">
        <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>City</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.slice(0, 20).map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>£{Number(order.total_amount).toFixed(2)}</TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={`${statusColors[order.status]} text-white`}
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('en-GB')}
              </TableCell>
              <TableCell className="text-muted-foreground">{order.shipping_city || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
