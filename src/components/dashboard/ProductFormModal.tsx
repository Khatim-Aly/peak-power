import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  category: string | null;
}

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  userId: string;
  onSaved: () => void;
}

const ProductFormModal = ({ open, onOpenChange, product, userId, onSaved }: ProductFormModalProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiKeywords, setAiKeywords] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(String(product.price));
      setOriginalPrice(product.original_price ? String(product.original_price) : "");
      setStock(String(product.stock));
      setCategory(product.category || "");
      setImageUrl(product.image_url || "");
      setIsActive(product.is_active);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setStock("0");
      setCategory("");
      setImageUrl("");
      setIsActive(true);
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Name and price are required." });
      return;
    }

    setIsSaving(true);

    const basePayload = {
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock) || 0,
      category: category.trim() || null,
      image_url: imageUrl.trim() || null,
      is_active: isActive,
    };

    let error;

    if (product) {
      // When editing, preserve the original merchant_id (admins editing other merchants' products shouldn't overwrite ownership)
      ({ error } = await supabase.from("products").update(basePayload).eq("id", product.id));
    } else {
      ({ error } = await supabase.from("products").insert({ ...basePayload, merchant_id: userId }));
    }

    setIsSaving(false);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    toast({ title: product ? "Product Updated" : "Product Created", description: `${name} has been saved.` });
    onOpenChange(false);
    onSaved();
  };

  const handleAiGenerate = async () => {
    if (!aiKeywords.trim()) {
      toast({ variant: "destructive", title: "Add keywords", description: "Enter a few keywords for the AI to work with." });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-product", {
        body: { keywords: aiKeywords.trim(), category: category.trim() || null, currentName: name.trim() || null },
      });
      if (error) throw error;
      if (data?.name) setName(data.name);
      if (data?.description) {
        const desc = data.description + (data.bullets?.length ? "\n\nKey features:\n• " + data.bullets.join("\n• ") : "");
        setDescription(desc);
      }
      toast({ title: "AI generated ✨", description: "Review the suggestions and tweak as needed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI error", description: e.message || "Try again" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* AI Generator */}
          <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-amber-500/5 p-3 space-y-2">
            <Label htmlFor="aiKeywords" className="flex items-center gap-1.5 text-xs font-semibold text-gold">
              <Sparkles className="w-3.5 h-3.5" /> AI Title & Description Generator
            </Label>
            <div className="flex gap-2">
              <Input
                id="aiKeywords"
                value={aiKeywords}
                onChange={e => setAiKeywords(e.target.value)}
                placeholder="e.g. premium himalayan shilajit 20g resin"
                className="bg-background/50"
                disabled={isGenerating}
              />
              <Button type="button" variant="outline" onClick={handleAiGenerate} disabled={isGenerating} className="border-gold/40 hover:bg-gold/10 shrink-0">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Product name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (PKR) *</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price</Label>
              <Input id="originalPrice" type="number" step="0.01" min="0" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Supplements" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
