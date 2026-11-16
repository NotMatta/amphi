"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Trash2, UserCog } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user, isLoading, refreshMe, logout } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"ok" | "err">("ok");
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  function flash(msg: string, type: "ok" | "err" = "ok") {
    setNotice(msg); setNoticeType(type);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusyProfile(true); setNotice(null);
    try {
      await api.patch<User>("/api/users/me", { firstName, lastName });
      await refreshMe();
      flash("Profile updated.");
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to update profile", "err");
    } finally { setBusyProfile(false); }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusyPassword(true); setNotice(null);
    try {
      await api.patch("/api/users/me/password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword("");
      flash("Password changed.");
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to change password", "err");
    } finally { setBusyPassword(false); }
  }

  async function deleteAccount() {
    if (!confirm("Delete your account permanently? This will remove your data and cannot be undone.")) return;
    setBusyDelete(true); setNotice(null);
    try {
      await api.del("/api/users/me");
      logout();
      router.push("/");
      router.refresh();
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to delete account", "err");
      setBusyDelete(false);
    }
  }

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />;

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardHeader><CardTitle>Sign in required</CardTitle><CardDescription>Login to manage your profile and account settings.</CardDescription></CardHeader>
        <CardContent><Button asChild><Link href="/login">Login</Link></Button></CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile information, password, and account.</p>
      </div>

      {notice && (
        <div className={`rounded-md border px-4 py-3 text-sm ${noticeType === "err" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground"}`}>{notice}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><UserCog className="h-5 w-5 text-primary" />Profile</CardTitle>
          <CardDescription>Update your display name. Email: <span className="font-medium text-foreground">{user.email}</span> · Role: <span className="font-medium text-foreground">{user.role}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busyProfile}>{busyProfile ? "Saving..." : "Save profile"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-primary" />Password</CardTitle>
          <CardDescription>Change your password by confirming your current one.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={busyPassword}>{busyPassword ? "Changing..." : "Change password"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive"><Trash2 className="h-5 w-5" />Danger zone</CardTitle>
          <CardDescription>Permanently delete your account and associated data (including communities you own). This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={deleteAccount} disabled={busyDelete}>{busyDelete ? "Deleting..." : "Delete my account"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
