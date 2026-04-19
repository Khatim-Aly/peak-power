import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Star, MessageSquare, CheckCircle2, AlertTriangle, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationsPanelProps {
  /** Optional filter: "review" only shows review notifications. Omit to show all. */
  filterType?: string;
  emptyMessage?: string;
}

const iconForType = (type: string) => {
  switch (type) {
    case "review":
      return Star;
    case "support":
      return MessageSquare;
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    default:
      return Info;
  }
};

const colorForType = (type: string) => {
  switch (type) {
    case "review":
      return "text-amber-500 bg-amber-500/10";
    case "support":
      return "text-blue-500 bg-blue-500/10";
    case "success":
      return "text-green-500 bg-green-500/10";
    case "warning":
      return "text-orange-500 bg-orange-500/10";
    default:
      return "text-gold bg-gold/10";
  }
};

const NotificationsPanel = ({ filterType, emptyMessage = "No notifications yet" }: NotificationsPanelProps) => {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount, fetchNotifications } = useNotifications();

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = filterType ? notifications.filter((n) => n.type === filterType) : notifications;
  const visibleUnread = visible.filter((n) => !n.is_read).length;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold" />
          <h3 className="font-semibold">Notifications</h3>
          {visibleUnread > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gold text-secondary font-medium">
              {visibleUnread} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
            <Check className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const Icon = iconForType(n.type);
            const color = colorForType(n.type);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  n.is_read ? "border-border bg-background/40" : "border-gold/30 bg-gold/5 hover:bg-gold/10"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 break-words">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
