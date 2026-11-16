"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
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
    load();
  }, [isLoading, isAdmin]);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => a.id - b.id);
  }, [users]);

  function flash(msg: string, type: "ok" | "err" = "ok") {
    setNotice(msg);
    setNoticeType(type);
  }

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
        <CardContent>
          <Button asChild><Link href="/login">Login</Link></Button>
        </CardContent>
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
          <p className="text-sm text-muted-foreground">View registered users and manage their roles across the platform.</p>
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
          <CardTitle className="text-lg">All users</CardTitle>
          <CardDescription>Change a user’s role to Student, Professor, or Admin. You cannot change your own role.</CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u) => {
                    const isSelf = u.id === user.id;
                    const draft = draftRoles[u.id] ?? u.role;
                    const changed = draft !== u.role;
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
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
                        <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-3 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={u.role === "ADMIN" ? "default" : u.role === "PROFESSOR" ? "secondary" : "outline"}>
                              {u.role}
                            </Badge>
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground">Cannot change</span>
                            ) : (
                              <select
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={draft}
                                onChange={(e) => setDraftRoles((prev) => ({ ...prev, [u.id]: e.target.value as Role }))}
                                disabled={savingId === u.id}
                                aria-label={`Role for ${u.firstName} ${u.lastName}`}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {!isSelf && (
                            <Button
                              size="sm"
                              onClick={() => saveRole(u)}
                              disabled={!changed || savingId === u.id}
                            >
                              {savingId === u.id ? "Saving..." : "Save"}
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
