import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, CheckCircle, User, Store, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const roleOptions: { role: AppRole; label: string; icon: React.ElementType; description: string }[] = [
  { role: 'user', label: 'Customer', icon: User, description: 'Shop & track orders' },
  { role: 'merchant', label: 'Merchant', icon: Store, description: 'Sell products' },
  { role: 'admin', label: 'Admin', icon: Shield, description: 'Manage platform' },
];

export const SignupForm = ({ onSuccess, onSwitchToLogin }: SignupFormProps) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, selectedRole, data.fullName);

    if (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
      return;
    }

    setIsLoading(false);
    setShowSuccess(true);
    
    toast({
      title: "Account created! 🎉",
      description: "Please check your email to verify your account.",
    });
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
          className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>

        <div>
          <h3 className="text-2xl font-serif font-bold mb-2">Check Your Email</h3>
          <p className="text-muted-foreground">
            We've sent a verification link to your email address.
            <br />
            Please click the link to activate your account.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onSwitchToLogin}
          className="mx-auto"
        >
          Back to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Role Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Account Type</label>
        <div className="grid grid-cols-3 gap-2">
          {roleOptions.map(({ role, label, icon: Icon, description }) => (
            <motion.button
              key={role}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole(role)}
              className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                selectedRole === role
                  ? 'border-gold bg-gold/10'
                  : 'border-border hover:border-gold/50'
              }`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${
                selectedRole === role ? 'text-gold' : 'text-muted-foreground'
              }`} />
              <span className={`text-xs font-medium block ${
                selectedRole === role ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              {selectedRole === role && (
                <motion.div
                  layoutId="roleIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-gold"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {roleOptions.find(r => r.role === selectedRole)?.description}
        </p>
      </div>

      <FloatingLabelInput
        label="Full Name"
        type="text"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <FloatingLabelInput
        label="Email Address"
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="space-y-3">
        <FloatingLabelInput
          label="Password"
          showPasswordToggle
          error={errors.password?.message}
          {...register("password")}
        />
        {password && <PasswordStrengthMeter password={password} />}
      </div>

      <FloatingLabelInput
        label="Confirm Password"
        showPasswordToggle
        error={errors.confirmPassword?.message}
        success={passwordsMatch}
        {...register("confirmPassword")}
      />

      {/* Terms & Privacy */}
      <p className="text-xs text-muted-foreground text-center">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-gold hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-gold hover:underline">
          Privacy Policy
        </a>
      </p>

      {/* Submit Button */}
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full relative overflow-hidden group"
          disabled={isLoading || !isValid}
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
                Creating account...
              </motion.div>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                Create {roleOptions.find(r => r.role === selectedRole)?.label} Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Social Signup */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-border hover:border-gold/50 bg-background/50 backdrop-blur-sm transition-colors"
        >
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

      {/* Switch to Login */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          onClick={onSwitchToLogin}
          className="text-gold hover:text-gold/80 font-semibold transition-colors"
        >
          Sign in
        </motion.button>
      </p>
    </motion.form>
  );
};
