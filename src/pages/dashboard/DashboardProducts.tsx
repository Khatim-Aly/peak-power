import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  DollarSign,
  Eye,
  EyeOff
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
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
import ProductFormModal from "@/components/dashboard/ProductFormModal";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

const DashboardProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setIsLoading(false);
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product status",
      });
      return;
    }

    toast({
      title: "Status Updated",
      description: `Product is now ${!currentStatus ? 'active' : 'inactive'}`,
    });

    fetchProducts();
  };

  const deleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete product" });
      return;
    }
    toast({ title: "Deleted", description: `${productName} has been removed.` });
    fetchProducts();
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const activeProducts = products.filter(p => p.is_active).length;

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'text-gold', bgColor: 'bg-gold/10' },
    { label: 'Active', value: activeProducts, icon: Eye, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { label: 'Inventory Value', value: `PKR ${totalValue.toFixed(0)}`, icon: DollarSign, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  ];

  return (
    <DashboardLayout 
      title="My Products"
      subtitle="Manage your product listings"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Products Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold">Product Listings</h2>
            <p className="text-sm text-muted-foreground">{products.length} products total</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">PKR {product.price.toFixed(2)}</p>
                        {product.original_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            PKR {product.original_price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}>
                        {product.stock} in stock
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'outline'} className={product.is_active ? 'bg-green-500' : ''}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                        >
                          {product.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardProducts;
