import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Store, Shield, Edit, UserCheck, Package, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UserEditModal } from "@/components/dashboard/UserEditModal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const DashboardMerchants = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [usersRes, rolesRes, productsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('products').select('*'),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setIsLoading(false);
  };

  const getUserRole = (userId: string) => {
    const role = roles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const getMerchantProducts = (userId: string) => {
    return products.filter(p => p.merchant_id === userId);
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

  return (
    <DashboardLayout 
      title="Merchants Management"
      subtitle="View and manage all merchants"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
            <Store className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{merchants.length}</p>
          <p className="text-sm text-muted-foreground">Total Merchants</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-gold" />
          </div>
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-sm text-muted-foreground">Total Products</p>
        </motion.div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-serif font-bold">All Merchants</h2>
          <p className="text-sm text-muted-foreground">{merchants.length} merchants registered</p>
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
        ) : merchants.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No merchants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.map((user) => {
                  const merchantProducts = getMerchantProducts(user.user_id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-medium">
                            {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <span className="font-medium">{user.full_name || 'Unnamed'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{merchantProducts.length} products</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="text-gold hover:text-gold"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateUserRole(user.user_id, 'user')}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Demote
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateUserRole(user.user_id, 'admin')}
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Admin
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {editingUser && (
        <UserEditModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          currentRole={getUserRole(editingUser.user_id)}
          onSave={fetchData}
        />
      )}
    </DashboardLayout>
  );
};

export default DashboardMerchants;
