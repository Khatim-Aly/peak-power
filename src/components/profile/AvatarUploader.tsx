import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploaderProps {
  size?: "md" | "lg";
}

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const AvatarUploader = ({ size = "lg" }: AvatarUploaderProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const initials = profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U";
  const dim = size === "lg" ? "w-24 h-24 sm:w-28 sm:h-28" : "w-16 h-16";

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file later
    if (!file || !user) return;

    if (!ACCEPTED.includes(file.type)) {
      toast({ variant: "destructive", title: "Unsupported file", description: "Use JPG, PNG or WEBP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ variant: "destructive", title: "File too large", description: "Max 3MB allowed." });
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      await refreshProfile();
      toast({ title: "Profile picture updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message || "Please try again" });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !profile?.avatar_url) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Profile picture removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full">
      <div className="relative shrink-0">
        <Avatar className={`${dim} border-4 border-gold`}>
          <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
          <AvatarFallback className="bg-gold/20 text-gold text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-gold text-secondary flex items-center justify-center hover:bg-gold/90 transition-colors shadow-lg disabled:opacity-60"
          aria-label="Change profile picture"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="text-center sm:text-left flex-1 min-w-0">
        <h3 className="text-lg sm:text-xl font-serif font-bold truncate">
          {profile?.full_name || "User"}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
          <Button size="sm" variant="outline" onClick={handlePick} disabled={busy}>
            <Camera className="w-4 h-4 mr-2" /> {profile?.avatar_url ? "Change photo" : "Upload photo"}
          </Button>
          {profile?.avatar_url && (
            <Button size="sm" variant="ghost" onClick={handleRemove} disabled={busy} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WEBP • Max 3MB</p>
      </div>
    </div>
  );
};

export default AvatarUploader;
