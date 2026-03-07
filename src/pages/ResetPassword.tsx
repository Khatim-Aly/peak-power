import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check if we already have a session from recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ variant: "destructive", title: "Failed to reset password", description: error.message });
    } else {
      setIsSuccess(true);
      toast({ title: "Password updated successfully!" });
      setTimeout(() => navigate("/"), 3000);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-28 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="glass-card p-8 rounded-2xl text-center">
            {isSuccess ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-serif font-bold mb-2">Password Reset!</h1>
                <p className="text-muted-foreground">Redirecting you to the homepage...</p>
              </>
            ) : !isRecovery ? (
              <>
                <Lock className="w-12 h-12 text-gold mx-auto mb-4" />
                <h1 className="text-2xl font-serif font-bold mb-2">Loading...</h1>
                <p className="text-muted-foreground">Verifying your reset link...</p>
              </>
            ) : (
              <>
                <Lock className="w-12 h-12 text-gold mx-auto mb-4" />
                <h1 className="text-2xl font-serif font-bold mb-2">Set New Password</h1>
                <p className="text-muted-foreground mb-6">Enter your new password below</p>
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
