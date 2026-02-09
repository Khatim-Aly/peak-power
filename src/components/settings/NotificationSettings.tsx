import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_promotions: false,
    push_orders: true,
    push_updates: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setNotifications({
          email_orders: data.email_orders,
          email_promotions: data.email_promotions,
          push_orders: data.push_orders,
          push_updates: data.push_updates,
        });
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user.id, ...notifications },
        { onConflict: 'user_id' }
      );

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save preferences" });
    } else {
      toast({ title: "Preferences Saved", description: "Your notification preferences have been updated" });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <h3 className="text-lg font-serif font-bold mb-6">Notification Preferences</h3>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Updates</p>
                <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
              </div>
              <Switch
                checked={notifications.email_orders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email_orders: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Promotions</p>
                <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
              </div>
              <Switch
                checked={notifications.email_promotions}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email_promotions: checked })}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="font-medium mb-4">Push Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Alerts</p>
                <p className="text-sm text-muted-foreground">Push notifications for order updates</p>
              </div>
              <Switch
                checked={notifications.push_orders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push_orders: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Updates</p>
                <p className="text-sm text-muted-foreground">Get notified about new features</p>
              </div>
              <Switch
                checked={notifications.push_updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push_updates: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </motion.div>
  );
};

export default NotificationSettings;
