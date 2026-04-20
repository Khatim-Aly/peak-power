import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Star, MessageSquare, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";

const iconForType = (type: string) => {
  switch (type) {
    case "review": return Star;
    case "support": return MessageSquare;
    case "success": return CheckCircle2;
    case "warning": return AlertTriangle;
    default: return Info;
  }
};

const colorForType = (type: string) => {
  switch (type) {
    case "review": return "text-amber-500 bg-amber-500/10";
    case "support": return "text-blue-500 bg-blue-500/10";
    case "success": return "text-green-500 bg-green-500/10";
    case "warning": return "text-orange-500 bg-orange-500/10";
    default: return "text-gold bg-gold/10";
  }
};

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className }: NotificationBellProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const top = notifications.slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
          className={`relative p-2 rounded-lg hover:bg-muted transition-colors ${className ?? ""}`}
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-secondary text-[10px] font-bold flex items-center justify-center shadow-sm"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 z-[100]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gold" />
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold text-secondary font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllAsRead()}>
              <Check className="w-3 h-3 mr-1" /> Mark all
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          {top.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">You're all caught up</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {top.map((n) => {
                const Icon = iconForType(n.type);
                const color = colorForType(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 transition-colors ${
                      n.is_read ? "hover:bg-muted/40" : "bg-gold/5 hover:bg-gold/10"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 break-words">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-2">
          <Link
            to="/dashboard/requests"
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-gold hover:underline py-1.5"
          >
            View all in Requests →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
