import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SecuritySettings = () => {
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 8) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 8 characters" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Password Updated", description: "Your password has been changed successfully" });
      setPasswords({ newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
    }
    setIsSaving(false);
  };

  const handleSignOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out other sessions" });
    } else {
      toast({ title: "Sessions Cleared", description: "All other sessions have been signed out" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <h3 className="text-lg font-serif font-bold mb-6">Security Settings</h3>

      <div className="space-y-6">
        {/* Change Password */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            {!isChangingPassword && (
              <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                Change
              </Button>
            )}
          </div>

          {isChangingPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswords({ newPassword: "", confirmPassword: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sign Out All Sessions */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div>
            <p className="font-medium">Active Sessions</p>
            <p className="text-sm text-muted-foreground">Sign out of all other devices</p>
          </div>
          <Button variant="outline" onClick={handleSignOutAll} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out All
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SecuritySettings;
