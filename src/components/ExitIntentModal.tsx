import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, MessageCircle, Clock, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { conversionConfig } from "@/lib/conversionConfig";

const SESSION_KEY = "ppgb_exit_intent_shown";

const ExitIntentModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(conversionConfig.exitIntent.countdownMinutes * 60);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerStarted = useRef(false);

  const discountCode = "PEAK10";
  const { discountPercent, whatsappNumber, idleTimeoutMs } = conversionConfig.exitIntent;

  const showModal = useCallback(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsOpen(true);
    timerStarted.current = true;
  }, []);

  // Desktop: detect cursor leaving viewport
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5 && !sessionStorage.getItem(SESSION_KEY)) {
        showModal();
      }
    };
    document.addEventListener("mouseout", handler);
    return () => document.removeEventListener("mouseout", handler);
  }, [showModal]);

  // Mobile: idle detection
  useEffect(() => {
    const resetIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (!sessionStorage.getItem(SESSION_KEY)) showModal();
      }, idleTimeoutMs);
    };

    const events = ["touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [showModal, idleTimeoutMs]);

  // Countdown timer
  useEffect(() => {
    if (!timerStarted.current || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi! I'd like to use my ${discountPercent}% discount code: ${discountCode}`);
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99990] flex items-center justify-center p-4"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-gold/20 to-accent/20 p-6 pb-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">Wait! Don't Leave Yet</h2>
                <p className="text-sm text-muted-foreground">Here's a special offer just for you</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Discount badge */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2.5">
                <span className="text-3xl font-bold text-gold">{discountPercent}% OFF</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Use code at checkout</p>
            </div>

            {/* Discount code */}
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 hover:bg-gold/10 transition-colors group"
            >
              <span className="font-mono font-bold text-lg tracking-widest text-gold">{discountCode}</span>
              <span className="text-xs text-muted-foreground group-hover:text-gold transition-colors">
                {copied ? "✓ Copied!" : "Tap to copy"}
              </span>
            </button>

            {/* Countdown */}
            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-gold" />
                <span>Offer expires in</span>
                <span className="font-mono font-bold text-foreground">{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Email capture */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Your email for more deals"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <Button variant="default" size="default" className="rounded-xl h-11 bg-gold text-secondary hover:bg-gold-dark">
                Save
              </Button>
            </div>

            {/* WhatsApp CTA */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-medium text-sm"
            >
              <MessageCircle className="w-4 h-4" fill="currentColor" />
              Chat with us on WhatsApp
            </button>

            <p className="text-center text-xs text-muted-foreground">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ExitIntentModal;
