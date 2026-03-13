import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  DollarSign,
  Eye,
  TrendingUp,
  Store,
  CalendarDays,
} from "lucide-react";

interface MerchantDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantUserId: string;
  merchantName: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

interface OrderItem {
  quantity: number;
  price: number;
  product_name: string;
  created_at: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MerchantDetailModal = ({ open, onOpenChange, merchantUserId, merchantName }: MerchantDetailModalProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  useEffect(() => {
    if (open && merchantUserId) {
      fetchData();
    }
  }, [open, merchantUserId]);

  const fetchData = async () => {
    setIsLoading(true);
    const [productsRes, profileRes] = await Promise.all([
      supabase.from("products").select("*").eq("merchant_id", merchantUserId),
      supabase.from("profiles").select("store_name").eq("user_id", merchantUserId).maybeSingle(),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (profileRes.data) setStoreName((profileRes.data as any).store_name);

    // Fetch orders containing this merchant's products
    if (productsRes.data && productsRes.data.length > 0) {
      const productIds = productsRes.data.map((p) => p.id);
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, price, product_name, created_at, order_id")
        .in("product_id", productIds);

      if (orderItems) {
        setOrders(orderItems);
      }
    } else {
      setOrders([]);
    }

    setIsLoading(false);
  };

  const activeProducts = products.filter((p) => p.is_active).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);

  const filteredOrders = useMemo(() => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [orders, selectedMonth, selectedYear]);

  const monthlyRevenue = filteredOrders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const monthlySales = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Store className="w-5 h-5 text-purple-500" />
            {merchantName}
            {storeName && (
              <Badge variant="secondary" className="ml-2">{storeName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Package} label="Total Products" value={products.length} color="text-blue-500" bg="bg-blue-500/10" />
              <StatCard icon={Eye} label="Active Products" value={activeProducts} color="text-green-500" bg="bg-green-500/10" />
              <StatCard icon={DollarSign} label="Total Revenue" value={`PKR ${totalRevenue.toLocaleString()}`} color="text-gold" bg="bg-gold/10" />
              <StatCard icon={TrendingUp} label="Total Sales" value={orders.reduce((s, o) => s + o.quantity, 0)} color="text-purple-500" bg="bg-purple-500/10" />
            </div>

            {/* Monthly Sales Filter */}
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  Monthly Sales
                </h3>
                <div className="flex gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[130px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[90px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{monthlySales}</p>
                  <p className="text-xs text-muted-foreground">Units Sold</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">PKR {monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Products ({products.length})</h3>
              </div>
              {products.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No products</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>PKR {p.price.toLocaleString()}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? "default" : "outline"} className={p.is_active ? "bg-green-500" : ""}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string | number; color: string; bg: string }) => (
  <div className="rounded-xl border border-border p-3">
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default MerchantDetailModal;
