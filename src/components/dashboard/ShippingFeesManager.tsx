import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ShippingFee {
  id: string;
  city: string;
  fee: number;
}

export const ShippingFeesManager = () => {
  const { toast } = useToast();
  const [fees, setFees] = useState<ShippingFee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCity, setNewCity] = useState("");
  const [newFee, setNewFee] = useState("");

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('shipping_fees')
      .select('*')
      .order('city');

    if (!error && data) {
      setFees(data.map(d => ({ ...d, fee: Number(d.fee) })));
    }
    setIsLoading(false);
  };

  const addFee = async () => {
    if (!newCity.trim() || !newFee) return;

    const { error } = await supabase
      .from('shipping_fees')
      .upsert({ city: newCity.trim(), fee: parseFloat(newFee) }, { onConflict: 'city' });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: "Shipping fee saved", description: `Fee for ${newCity} set to PKR ${newFee}` });
    setNewCity("");
    setNewFee("");
    fetchFees();
  };

  const updateFee = async (id: string, fee: number) => {
    const { error } = await supabase
      .from('shipping_fees')
      .update({ fee })
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Fee updated" });
    fetchFees();
  };

  const deleteFee = async (id: string, city: string) => {
    const { error } = await supabase
      .from('shipping_fees')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Removed", description: `Shipping fee for ${city} removed` });
    fetchFees();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <Truck className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-serif font-bold">Shipping Fees by City</h2>
        </div>
        <p className="text-sm text-muted-foreground">Set delivery charges for different cities</p>
      </div>

      {/* Add new city fee */}
      <div className="p-6 border-b border-border">
        <div className="flex gap-3">
          <Input
            placeholder="City name"
            value={newCity}
            onChange={e => setNewCity(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Fee (PKR)"
            type="number"
            step="0.01"
            min="0"
            value={newFee}
            onChange={e => setNewFee(e.target.value)}
            className="w-32"
          />
          <Button onClick={addFee} disabled={!newCity.trim() || !newFee}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Fees list */}
      {isLoading ? (
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      ) : fees.length === 0 ? (
        <div className="p-12 text-center">
          <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No shipping fees configured yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Fee (PKR)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <FeeRow key={fee.id} fee={fee} onUpdate={updateFee} onDelete={deleteFee} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

const FeeRow = ({ 
  fee, 
  onUpdate, 
  onDelete 
}: { 
  fee: ShippingFee; 
  onUpdate: (id: string, fee: number) => void;
  onDelete: (id: string, city: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(fee.fee.toString());

  return (
    <TableRow>
      <TableCell className="font-medium">{fee.city}</TableCell>
      <TableCell>
        {editing ? (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="w-24 h-8"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onUpdate(fee.id, parseFloat(editValue));
                setEditing(false);
              }
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <span
            className="cursor-pointer hover:text-gold transition-colors"
            onClick={() => { setEditing(true); setEditValue(fee.fee.toString()); }}
          >
            PKR {fee.fee.toFixed(2)}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onUpdate(fee.id, parseFloat(editValue)); setEditing(false); }}
            >
              <Save className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(fee.id, fee.city)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
