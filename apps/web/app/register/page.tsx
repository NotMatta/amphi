"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await register(form);
      router.push("/communities");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.validationErrors) setFieldErrors(err.validationErrors);
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <Card className="w-full shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Join Amphi to connect with communities and resources. (Student accounts by default.)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" required />
                {fieldErrors.firstName && <p className="text-xs text-destructive">{fieldErrors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="you@university.edu" required />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" required minLength={6} />
              {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              <p className="text-xs text-muted-foreground">At least 6 characters.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
