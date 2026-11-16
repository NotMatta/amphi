"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Crown, Heart, KeyRound, Lock, LogOut, MessageSquare, Send, Shield, UserMinus, UserPlus, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Community, InvitationCode, Post, User } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CommunityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [invitation, setInvitation] = useState<InvitationCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"ok" | "err">("ok");

  const [joinCode, setJoinCode] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [busy, setBusy] = useState(false);

  const isOwner = !!(user && community && community.owner.id === user.id);
  const isAdmin = user?.role === "ADMIN";
  const canManage = isOwner || isAdmin;
  const isMember = !!(user && members.some((m) => m.id === user.id));
  const canPost = !!user && (isMember || canManage);

  function flash(msg: string, type: "ok" | "err" = "ok") { setNotice(msg); setNoticeType(type); }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const c = await api.get<Community>(`/api/communities/${id}`, !!user);
      setCommunity(c);
      try {
        const p = await api.get<Post[]>(`/api/communities/${id}/posts`, !!user);
        setPosts(p);
      } catch (e) {
        setPosts([]);
        if (!(e instanceof ApiError && e.status === 403)) throw e;
      }
      if (user) {
        try {
          const m = await api.get<User[]>(`/api/communities/${id}/members`);
          setMembers(m);
        } catch { setMembers([]); }
        if (c.owner.id === user.id || user.role === "ADMIN") {
          try { setInvitation(await api.get<InvitationCode>(`/api/communities/${id}/invitation`)); }
          catch { setInvitation(null); }
        }
      } else {
        setMembers([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, user?.id]);

  async function join() {
    setBusy(true);
    try {
      await api.post(`/api/communities/${id}/members/join`, community?.type === "PRIVATE" ? { invitationCode: joinCode } : {});
      flash("You have joined the community.");
      await loadAll();
    } catch (e) { flash(e instanceof ApiError ? e.message : "Failed to join", "err"); }
    finally { setBusy(false); }
  }

  async function leave() {
    setBusy(true);
    try {
      await api.del(`/api/communities/${id}/members/me`);
      flash("You have left the community.");
      await loadAll();
    } catch (e) { flash(e instanceof ApiError ? e.message : "Failed to leave", "err"); }
    finally { setBusy(false); }
  }

  async function generateInvitation() {
    setBusy(true);
    try {
      const inv = await api.post<InvitationCode>(`/api/communities/${id}/invitation`);
      setInvitation(inv);
      flash("Invitation code generated.");
    } catch (e) { flash(e instanceof ApiError ? e.message : "Failed to generate invitation", "err"); }
    finally { setBusy(false); }
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/communities/${id}/posts`, { title: postTitle, content: postContent });
      setPostTitle(""); setPostContent("");
      flash("Post published.");
      await loadAll();
    } catch (e) { flash(e instanceof ApiError ? e.message : "Failed to create post", "err"); }
    finally { setBusy(false); }
  }

  async function removeMember(userId: number) {
    setBusy(true);
    try { await api.del(`/api/communities/${id}/members/${userId}`); flash("Member removed."); await loadAll(); }
    catch (e) { flash(e instanceof ApiError ? e.message : "Failed to remove member", "err"); }
    finally { setBusy(false); }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="h-40 animate-pulse rounded-xl border bg-muted/40" />
      <div className="grid gap-6 lg:grid-cols-3"><div className="h-64 animate-pulse rounded-xl border bg-muted/40 lg:col-span-2" /><div className="h-64 animate-pulse rounded-xl border bg-muted/40" /></div>
    </div>
  );
  if (error) return (
    <div className="space-y-4">
      <Link href="/communities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to communities</Link>
      <Card className="border-destructive/30"><CardContent className="pt-6"><p className="text-destructive">{error}</p></CardContent></Card>
    </div>
  );
  if (!community) return <p>Not found.</p>;

  const created = new Date(community.createdAt).toLocaleDateString();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/communities" className="hover:text-foreground">Communities</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{community.name}</span>
      </nav>

      <Card className="overflow-hidden">
        <div className="h-2 bg-primary/80" />
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl sm:text-3xl">{community.name}</CardTitle>
              <Badge variant={community.type === "PUBLIC" ? "secondary" : "outline"} className="gap-1">
                {community.type === "PRIVATE" ? <Lock className="h-3 w-3" /> : <Users className="h-3 w-3" />}{community.type}
              </Badge>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1"><Crown className="h-3.5 w-3.5" /> {community.owner.firstName} {community.owner.lastName}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {created}</span>
              {typeof community.maxMembers === "number" && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Max {community.maxMembers}</span>}
            </CardDescription>
            {community.description && <p className="max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base">{community.description}</p>}
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild><Link href="/communities"><ArrowLeft className="h-4 w-4" />All communities</Link></Button>
        </CardHeader>
      </Card>

      {notice && (
        <div className={`rounded-md border px-4 py-3 text-sm ${noticeType === "err" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground"}`}>{notice}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {user ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" />Membership</CardTitle>
              </CardHeader>
              <CardContent>
                {isMember ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm"><Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">Member</Badge><span className="text-muted-foreground">You are part of this community.</span></div>
                    {!isOwner && <Button variant="outline" size="sm" className="gap-2" onClick={leave} disabled={busy}><LogOut className="h-4 w-4" />Leave</Button>}
                    {isOwner && <span className="text-xs text-muted-foreground">You own this community.</span>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{community.type === "PRIVATE" ? "This is a private community. Enter an invitation code to join." : "Join to participate in discussions and share posts."}</p>
                    <div className="flex flex-wrap items-end gap-3">
                      {community.type === "PRIVATE" && (
                        <div className="min-w-[220px] flex-1 space-y-1.5">
                          <Label htmlFor="joinCode">Invitation code</Label>
                          <Input id="joinCode" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter invitation code" />
                        </div>
                      )}
                      <Button onClick={join} disabled={busy} className="gap-2"><UserPlus className="h-4 w-4" />{busy ? "Joining..." : "Join community"}</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-muted-foreground">Sign in to join this community, post, and take part in discussions.</p>
              <Button asChild size="sm"><Link href="/login">Login</Link></Button>
            </CardContent></Card>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><MessageSquare className="h-5 w-5 text-primary" />Posts</h2>
              <span className="text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
            </div>

            {canPost && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Start a discussion</CardTitle><CardDescription>Share an update, question, or announcement with the community.</CardDescription></CardHeader>
                <CardContent>
                  <form onSubmit={createPost} className="space-y-3">
                    <div className="space-y-1.5"><Label htmlFor="ptitle">Title</Label><Input id="ptitle" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Give your post a clear title" required /></div>
                    <div className="space-y-1.5"><Label htmlFor="pcontent">Content</Label><Textarea id="pcontent" value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Write your post..." className="min-h-[120px]" required /></div>
                    <Button type="submit" disabled={busy} className="gap-2"><Send className="h-4 w-4" />{busy ? "Publishing..." : "Publish post"}</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {posts.length === 0 ? (
              <Card className="border-dashed"><CardContent className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 rounded-full bg-muted p-3"><MessageSquare className="h-5 w-5 text-muted-foreground" /></div>
                <p className="font-medium">No posts yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{user && !canPost ? "Join the community to view and create posts." : "Be the first to start a discussion in this community."}</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => (
                  <Link key={p.id} href={`/communities/${id}/posts/${p.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                    <Card className="transition-all hover:border-primary/30 hover:shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="line-clamp-2 text-lg leading-snug">{p.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{p.author.firstName} {p.author.lastName}</span>
                          <span>·</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{p.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5"><Heart className={`h-4 w-4 ${p.likedByMe ? "fill-primary text-primary" : ""}`} />{p.likeCount}</span>
                          <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />View discussion</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {(isOwner || isAdmin) && community.type === "PRIVATE" && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-primary" />Invitation</CardTitle>
                <CardDescription>Manage access for this private community.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invitation ? (
                  <div className="rounded-md border bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Active code</p>
                    <p className="font-mono text-base font-semibold tracking-wider">{invitation.code}</p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No active code loaded.</p>}
                <Button variant="secondary" size="sm" className="w-full" onClick={generateInvitation} disabled={busy}>Generate / Regenerate</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Members</CardTitle>
              <CardDescription>{members.length > 0 ? `${members.length} member${members.length === 1 ? "" : "s"}` : "Member list"}</CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <p className="text-sm text-muted-foreground">Login to view members.</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members visible or you may not have access.</p>
              ) : (
                <ul className="space-y-1">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted/40">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{m.firstName[0]}{m.lastName[0]}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">{m.id === community.owner.id && <Shield className="h-3 w-3" />}{m.id === community.owner.id ? "Owner" : m.role}</p>
                        </div>
                      </div>
                      {canManage && m.id !== community.owner.id && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" disabled={busy} onClick={() => removeMember(m.id)} aria-label={`Remove ${m.firstName}`}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">About</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Type:</span> {community.type === "PUBLIC" ? "Public — anyone can browse and join." : "Private — invitation code required."}</p>
              <Separator />
              <p>Use this space to share course updates, ask questions, and collaborate with members.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
