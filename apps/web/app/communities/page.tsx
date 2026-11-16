"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Community, CommunityType } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CommunityType>("PUBLIC");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const data = await api.get<Community[]>("/api/communities", false);
      setCommunities(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load communities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createCommunity(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      await api.post<Community>("/api/communities", { name, description, type });
      setName(""); setDescription(""); setType("PUBLIC"); setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Failed to create community");
    } finally {
      setCreating(false);
    }
  }

  const filtered = communities.filter((c) =>
    `${c.name} ${c.description ?? ""} ${c.owner.firstName} ${c.owner.lastName}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground">Discover public communities and connect with your courses and peers.</p>
        </div>
        {user && (
          <Button onClick={() => setShowForm((s) => !s)} className="gap-2">
            <Plus className="h-4 w-4" />{showForm ? "Cancel" : "New community"}
          </Button>
        )}
      </div>

      {showForm && user && (
        <Card className="border-primary/20 bg-card">
          <CardHeader>
            <CardTitle>Create a community</CardTitle>
            <CardDescription>Students can create public communities. Professors and admins can also create private ones.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCommunity} className="grid gap-4 sm:grid-cols-2">
              {formError && <p className="text-sm text-destructive sm:col-span-2">{formError}</p>}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CS 101 - Fall 2026" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this community about?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Visibility</Label>
                <select id="type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={type} onChange={(e) => setType(e.target.value as CommunityType)}>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private (professors/admins)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create community"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search communities..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl border bg-muted/40" />)}
        </div>
      ) : error ? (
        <Card className="border-destructive/30"><CardContent className="pt-6 text-sm text-destructive">{error}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <p className="font-medium">No communities found</p>
            <p className="mt-1 text-sm text-muted-foreground">{communities.length === 0 ? "Be the first to create a public community." : "Try a different search term."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-lg">
                    <Link href={`/communities/${c.id}`} className="hover:underline">{c.name}</Link>
                  </CardTitle>
                  <Badge variant={c.type === "PUBLIC" ? "secondary" : "outline"}>{c.type}</Badge>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">{c.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <p className="text-xs text-muted-foreground">Owner: {c.owner.firstName} {c.owner.lastName}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild><Link href={`/communities/${c.id}`}>View community</Link></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
