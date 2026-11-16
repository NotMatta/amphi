"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { StudyResource } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", moduleName: "", attachmentReference: "", communityId: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterCommunityId, setFilterCommunityId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const q = filterCommunityId ? `?communityId=${encodeURIComponent(filterCommunityId)}` : "";
      const data = await api.get<StudyResource[]>(`/api/study-resources${q}`, !!user);
      setResources(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice(null);
    try {
      await api.post("/api/study-resources", {
        title: form.title,
        description: form.description || null,
        moduleName: form.moduleName,
        attachmentReference: form.attachmentReference || null,
        communityId: form.communityId ? Number(form.communityId) : null,
      });
      setForm({ title: "", description: "", moduleName: "", attachmentReference: "", communityId: "" });
      setShowForm(false);
      await load();
    } catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to create resource"); }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!confirm("Delete this resource?")) return;
    setBusy(true);
    try { await api.del(`/api/study-resources/${id}`); await load(); }
    catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to delete"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Study Resources</h1>
          <p className="text-sm text-muted-foreground">Browse and share learning materials.</p>
        </div>
        {user && <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "New resource"}</Button>}
      </div>

      <div className="flex items-end gap-2">
        <div className="space-y-1"><Label>Filter by community ID</Label><Input value={filterCommunityId} onChange={(e) => setFilterCommunityId(e.target.value)} placeholder="e.g. 1" /></div>
        <Button variant="secondary" onClick={load}>Apply</Button>
      </div>

      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      {showForm && user && (
        <Card>
          <CardHeader><CardTitle>Share a resource</CardTitle><CardDescription>Attachment is a reference (URL/path/filename). Optionally scope to a community.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
              <div className="space-y-1"><Label>Module/Course</Label><Input value={form.moduleName} onChange={(e) => set("moduleName", e.target.value)} required /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label>Attachment reference</Label><Input value={form.attachmentReference} onChange={(e) => set("attachmentReference", e.target.value)} placeholder="URL or filename" /></div>
                <div className="space-y-1"><Label>Community ID (optional)</Label><Input value={form.communityId} onChange={(e) => set("communityId", e.target.value)} placeholder="Leave blank for global" /></div>
              </div>
              <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Create"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <p>Loading...</p> : error ? <p className="text-destructive">{error}</p> : resources.length === 0 ? (
        <p className="text-muted-foreground">No resources found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-lg">{r.title}</CardTitle>
                <CardDescription>{r.moduleName} · by {r.author.firstName} {r.author.lastName}{r.communityId ? ` · community #${r.communityId}` : " · global"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.description && <p className="text-muted-foreground">{r.description}</p>}
                {r.attachmentReference && <p><span className="font-medium">Attachment:</span> {r.attachmentReference.startsWith("http") ? <a className="underline" href={r.attachmentReference} target="_blank" rel="noreferrer">{r.attachmentReference}</a> : r.attachmentReference}</p>}
                {user?.id === r.author.id && <Button size="sm" variant="outline" onClick={() => remove(r.id)} disabled={busy}>Delete</Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
