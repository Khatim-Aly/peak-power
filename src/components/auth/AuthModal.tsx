import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Sparkles } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { AnimatedBackground } from "./AnimatedBackground";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: "login" | "signup";
}

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[9998]"
          />

          {/* Modal - single scroll container to prevent mobile jank */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
          >
            <div className="relative w-full max-w-md my-4 sm:my-auto">
              {/* Glassmorphism Card - no nested scroll, no double overflow */}
              <div className="relative rounded-3xl border border-border/50 bg-card/90 sm:backdrop-blur-xl shadow-2xl">
                {/* Animated Background (lightweight on mobile) */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <AnimatedBackground />
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Content */}
                <div className="relative z-10 p-8 pt-16">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                  >
                    {/* Logo/Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold"
                    >
                      <Shield className="w-8 h-8 text-secondary" />
                    </motion.div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2 className="text-2xl font-serif font-bold mb-2">
                          {mode === "login" ? "Welcome Back" : "Join PeakPower GB"}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {mode === "login"
                            ? "Sign in to continue your wellness journey"
                            : "Create an account to unlock exclusive benefits"}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  {/* Mode Toggle */}
                  <div className="relative mb-6">
                    <div className="flex bg-muted/50 rounded-xl p-1">
                      <motion.div
                        className="absolute top-1 bottom-1 rounded-lg bg-background shadow-md"
                        layoutId="activeTab"
                        style={{
                          width: "calc(50% - 4px)",
                          left: mode === "login" ? "4px" : "calc(50%)",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                      <button
                        onClick={() => setMode("login")}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition-colors ${
                          mode === "login" ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => setMode("signup")}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition-colors ${
                          mode === "signup" ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        Create Account
                      </button>
                    </div>
                  </div>

                  {/* Forms */}
                  <AnimatePresence mode="wait">
                    {mode === "login" ? (
                      <LoginForm
                        key="login"
                        onSuccess={handleSuccess}
                        onSwitchToSignup={() => setMode("signup")}
                      />
                    ) : (
                      <SignupForm
                        key="signup"
                        onSuccess={handleSuccess}
                        onSwitchToLogin={() => setMode("login")}
                      />
                    )}
                  </AnimatePresence>

                  {/* Security Badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground"
                  >
                    <Shield className="w-3.5 h-3.5 text-gold" />
                    <span>256-bit SSL encrypted</span>
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span>Your data is safe</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
