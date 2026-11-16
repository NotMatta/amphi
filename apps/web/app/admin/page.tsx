"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Plus, Shield, Trash2, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES: Role[] = ["STUDENT", "PROFESSOR", "ADMIN"];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"ok" | "err">("ok");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, Role>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, string>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRole, setNewRole] = useState<Role>("STUDENT");

  const isAdmin = user?.role === "ADMIN";

  function flash(msg: string, type: "ok" | "err" = "ok") {
    setNotice(msg);
    setNoticeType(type);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<User[]>("/api/users");
      setUsers(data);
      const drafts: Record<number, Role> = {};
      data.forEach((u) => { drafts[u.id] = u.role; });
      setDraftRoles(drafts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    load();
  }, [isLoading, isAdmin]);

  const sorted = useMemo(() => [...users].sort((a, b) => a.id - b.id), [users]);

  async function saveRole(target: User) {
    const nextRole = draftRoles[target.id];
    if (!nextRole || nextRole === target.role) return;
    setSavingId(target.id);
    setNotice(null);
    try {
      const updated = await api.patch<User>(`/api/users/${target.id}/role`, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setDraftRoles((prev) => ({ ...prev, [updated.id]: updated.role }));
      flash(`Updated ${updated.firstName} ${updated.lastName} to ${updated.role}.`);
    } catch (e) {
      setDraftRoles((prev) => ({ ...prev, [target.id]: target.role }));
      flash(e instanceof ApiError ? e.message : "Failed to update role", "err");
    } finally {
      setSavingId(null);
    }
  }

  async function changePassword(target: User) {
    const pw = passwordDrafts[target.id] || "";
    if (pw.length < 6) { flash("New password must be at least 6 characters.", "err"); return; }
    setBusyAction(`pw-${target.id}`);
    setNotice(null);
    try {
      await api.patch(`/api/users/${target.id}/password`, { newPassword: pw });
      setPasswordDrafts((prev) => ({ ...prev, [target.id]: "" }));
      flash(`Password updated for ${target.email}.`);
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to change password", "err");
    } finally { setBusyAction(null); }
  }

  async function deleteUser(target: User) {
    if (!confirm(`Delete user ${target.firstName} ${target.lastName} (${target.email})? This cannot be undone.`)) return;
    setBusyAction(`del-${target.id}`);
    setNotice(null);
    try {
      await api.del(`/api/users/${target.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      flash(`Deleted user ${target.email}.`);
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to delete user", "err");
    } finally { setBusyAction(null); }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusyAction("create");
    setNotice(null);
    try {
      const created = await api.post<User>("/api/users", {
        email: newEmail,
        password: newPassword,
        firstName: newFirstName,
        lastName: newLastName,
        role: newRole,
      });
      setUsers((prev) => [...prev, created]);
      setDraftRoles((prev) => ({ ...prev, [created.id]: created.role }));
      setNewEmail(""); setNewPassword(""); setNewFirstName(""); setNewLastName(""); setNewRole("STUDENT");
      flash(`Created user ${created.email}.`);
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to create user", "err");
    } finally { setBusyAction(null); }
  }

  if (isLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>You need to sign in with an administrator account to manage users.</CardDescription>
        </CardHeader>
        <CardContent><Button asChild><Link href="/login">Login</Link></Button></CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-destructive" />Access denied</CardTitle>
          <CardDescription>This area is restricted to administrators.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Your role: <span className="font-medium text-foreground">{user.role}</span></p>
          <Button variant="outline" asChild><Link href="/">Go home</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">User management</h1>
          <p className="text-sm text-muted-foreground">Create, delete, and manage users, roles, and passwords. Admins can manage any community.</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span><span className="font-medium text-foreground">{users.length}</span> {users.length === 1 ? "user" : "users"}</span>
        </div>
      </div>

      {notice && (
        <div className={`rounded-md border px-4 py-3 text-sm ${noticeType === "err" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground"}`}>
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5 text-primary" />Create user</CardTitle>
          <CardDescription>Create a new user account with a specific role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="n-email">Email</Label>
              <Input id="n-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-password">Password</Label>
              <Input id="n-password" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-role">Role</Label>
              <select id="n-role" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-first">First name</Label>
              <Input id="n-first" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-last">Last name</Label>
              <Input id="n-last" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busyAction === "create"}>{busyAction === "create" ? "Creating..." : "Create user"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All users</CardTitle>
          <CardDescription>Manage roles, reset passwords, or delete accounts. You cannot change your own role or delete yourself here.</CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Change password</th>
                    <th className="px-3 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u) => {
                    const isSelf = u.id === user.id;
                    const draft = draftRoles[u.id] ?? u.role;
                    const changed = draft !== u.role;
                    return (
                      <tr key={u.id} className="border-b align-top last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground">ID #{u.id}{isSelf ? " · You" : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{u.email}<div className="text-xs">Joined {new Date(u.createdAt).toLocaleDateString()}</div></td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-2">
                            <Badge variant={u.role === "ADMIN" ? "default" : u.role === "PROFESSOR" ? "secondary" : "outline"} className="w-fit">{u.role}</Badge>
                            {!isSelf && (
                              <div className="flex items-center gap-2">
                                <select
                                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                  value={draft}
                                  onChange={(e) => setDraftRoles((prev) => ({ ...prev, [u.id]: e.target.value as Role }))}
                                  disabled={savingId === u.id}
                                  aria-label={`Role for ${u.firstName} ${u.lastName}`}
                                >
                                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <Button size="sm" onClick={() => saveRole(u)} disabled={!changed || savingId === u.id}>
                                  {savingId === u.id ? "Saving..." : "Save role"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex max-w-xs items-center gap-2">
                            <Input
                              type="password"
                              placeholder="New password"
                              value={passwordDrafts[u.id] || ""}
                              onChange={(e) => setPasswordDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                              aria-label={`New password for ${u.email}`}
                            />
                            <Button size="sm" variant="secondary" className="gap-1" onClick={() => changePassword(u)} disabled={busyAction === `pw-${u.id}` || !(passwordDrafts[u.id] || "")}> 
                              <KeyRound className="h-4 w-4" />{busyAction === `pw-${u.id}` ? "..." : "Set"}
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {!isSelf && (
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => deleteUser(u)} disabled={busyAction === `del-${u.id}`}>
                              <Trash2 className="h-4 w-4" />{busyAction === `del-${u.id}` ? "Deleting..." : "Delete"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
