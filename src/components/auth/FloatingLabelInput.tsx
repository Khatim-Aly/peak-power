import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  showPasswordToggle?: boolean;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, success, showPasswordToggle, type, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = props.value && String(props.value).length > 0;
    const isFloating = isFocused || hasValue;

    const inputType = showPasswordToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <div className="relative">
        <div className="relative group">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "peer w-full h-14 px-4 pt-5 pb-2 text-base bg-background/50 backdrop-blur-sm border-2 rounded-xl",
              "transition-all duration-300 outline-none",
              "focus:ring-2 focus:ring-gold/30 focus:border-gold",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : success
                ? "border-green-500 focus:border-green-500 focus:ring-green-500/30"
                : "border-border hover:border-gold/50",
              showPasswordToggle && "pr-12",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            className={cn(
              "absolute left-4 pointer-events-none transition-colors duration-200",
              error
                ? "text-red-500"
                : isFocused
                ? "text-gold"
                : "text-muted-foreground"
            )}
            initial={false}
            animate={{
              top: isFloating ? "8px" : "50%",
              y: isFloating ? 0 : "-50%",
              fontSize: isFloating ? "11px" : "14px",
              fontWeight: isFloating ? 500 : 400,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {label}
          </motion.label>

          {/* Password Toggle */}
          {showPasswordToggle && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {showPassword ? (
                  <motion.div
                    key="hide"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <EyeOff className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="show"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Eye className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Status Icon */}
          {!showPasswordToggle && (error || success) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </motion.div>
          )}

          {/* Glow Effect on Focus */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: "0 0 20px hsl(var(--gold) / 0.3)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-red-500 text-xs mt-1.5 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
