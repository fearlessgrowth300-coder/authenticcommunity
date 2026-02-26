import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleChangeEmail = async () => {
    if (!newEmail) return toast.error("Please enter a new email");
    setLoading("email");
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to your new address");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setLoading(null);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return toast.error("Please enter a new password");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    setLoading("password");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading("delete");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      await signOut();
      navigate("/");
      toast.success("Account deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Account Settings</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {/* Change Email */}
        <section className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Change Email</h2>
          </div>
          <p className="text-xs text-muted-foreground">Current: {user?.email}</p>
          <div className="space-y-2">
            <Label htmlFor="newEmail" className="text-xs">New Email</Label>
            <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" />
          </div>
          <Button onClick={handleChangeEmail} disabled={loading === "email"} size="sm" className="w-full">
            {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Email"}
          </Button>
        </section>

        {/* Change Password */}
        <section className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPass" className="text-xs">New Password</Label>
            <Input id="newPass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPass" className="text-xs">Confirm Password</Label>
            <Input id="confirmPass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePassword} disabled={loading === "password"} size="sm" className="w-full">
            {loading === "password" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
          </Button>
        </section>

        {/* Delete Account */}
        <section className="bg-card rounded-xl shadow-card border border-destructive/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">Delete Account</h2>
          </div>
          <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, profile, messages, and all data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Forever"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
};

export default AccountSettings;
