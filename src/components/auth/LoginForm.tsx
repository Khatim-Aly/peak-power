import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignup }: LoginFormProps) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Google Sign-In failed",
        description: error.message,
      });
      setIsGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    trigger,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleAdminLogin = async () => {
    setIsAdminMode(true);
    // Set values with animation effect
    setValue("email", "khatimaly@gmail.com", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("password", "123213@123213", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    
    // Trigger validation to update UI
    await trigger();
    
    toast({
      title: "Admin credentials ready",
      description: "Click Sign In to continue",
    });
  };

  const onSubmit = async (data: LoginFormData) => {
    if (cooldown) return;

    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      setIsLoading(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);

      setError("root", { message: error.message });

      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Welcome back! 👋",
      description: "You've successfully logged in.",
    });
    onSuccess();
  };

  const { ref: emailRegisterRef, ...emailRegisterRest } = register("email");
  const { ref: passwordRegisterRef, ...passwordRegisterRest } = register("password");

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <motion.div
        animate={errors.root ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <FloatingLabelInput
          label="Email Address"
          type="email"
          error={errors.email?.message}
          ref={(e) => {
            emailRegisterRef(e);
            (emailInputRef as any).current = e;
          }}
          {...emailRegisterRest}
        />
      </motion.div>

      <FloatingLabelInput
        label="Password"
        showPasswordToggle
        error={errors.password?.message}
        ref={(e) => {
          passwordRegisterRef(e);
          (passwordInputRef as any).current = e;
        }}
        {...passwordRegisterRest}
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              rememberMe
                ? "bg-gold border-gold"
                : "border-border group-hover:border-gold/50"
            }`}
            onClick={() => setRememberMe(!rememberMe)}
          >
            <AnimatePresence>
              {rememberMe && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-3 h-3 text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
          <span className="text-muted-foreground">Remember me</span>
        </label>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="text-gold hover:text-gold/80 transition-colors"
        >
          Forgot password?
        </motion.button>
      </div>

      {/* Submit Button */}
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full relative overflow-hidden group"
          disabled={isLoading || cooldown}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </motion.div>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Admin Login Button */}
      <motion.button
        type="button"
        onClick={handleAdminLogin}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        animate={isAdminMode ? { 
          borderColor: "hsl(var(--gold))",
          backgroundColor: "hsl(var(--gold) / 0.1)"
        } : {}}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gold/30 hover:border-gold hover:bg-gold/5 text-muted-foreground hover:text-gold transition-all duration-300"
      >
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isAdminMode ? "Admin Credentials Filled ✓" : "Login as Admin"}
        </span>
      </motion.button>

      {/* Social Login */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-border hover:border-gold/50 bg-background/50 backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span className="font-medium">Google</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-border hover:border-gold/50 bg-background/50 backdrop-blur-sm transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span className="font-medium">Apple</span>
        </motion.button>
      </div>

      {/* Switch to Signup */}
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          onClick={onSwitchToSignup}
          className="text-gold hover:text-gold/80 font-semibold transition-colors"
        >
          Create one
        </motion.button>
      </p>
    </motion.form>
  );
};
