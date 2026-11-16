"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Heart, MessageSquare, Pencil, Reply, Send, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Comment, Community, Post, User } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type CommentTreeNode = Comment & { children: CommentTreeNode[] };

function buildTree(comments: Comment[]): CommentTreeNode[] {
  const byId = new Map<number, CommentTreeNode>();
  comments.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: CommentTreeNode[] = [];
  byId.forEach((c) => {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.children.push(c);
    else roots.push(c);
  });
  return roots;
}

function CommentNode({
  c,
  depth,
  user,
  community,
  replyTo,
  replyContent,
  editId,
  editContent,
  busy,
  onReplyTo,
  onReplyContent,
  onEditStart,
  onEditContent,
  onEditCancel,
  onReplyCancel,
  onToggleLike,
  onSubmitReply,
  onSaveEdit,
  onDelete,
}: {
  c: CommentTreeNode;
  depth: number;
  user: User | null;
  community: Community | null;
  replyTo: number | null;
  replyContent: string;
  editId: number | null;
  editContent: string;
  busy: boolean;
  onReplyTo: (id: number) => void;
  onReplyContent: (v: string) => void;
  onEditStart: (id: number, content: string) => void;
  onEditContent: (v: string) => void;
  onEditCancel: () => void;
  onReplyCancel: () => void;
  onToggleLike: (c: Comment) => void;
  onSubmitReply: (parentId: number) => void;
  onSaveEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const mine = user?.id === c.author.id;
  const canDelete = !!(user && (mine || user.role === "ADMIN" || (community && community.owner.id === user.id)));
  const isReplying = replyTo === c.id;
  const isEditing = editId === c.id;
  return (
    <div className={depth > 0 ? "relative ml-3 pl-4 sm:ml-5 sm:pl-5" : ""}>
      {depth > 0 && <span className="absolute bottom-2 left-0 top-0 w-px bg-border" aria-hidden />}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{c.author.firstName[0]}{c.author.lastName[0]}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.author.firstName} {c.author.lastName}</p>
              <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}{c.updatedAt ? " · edited" : ""}</p>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-3 space-y-2">
            <Textarea value={editContent} onChange={(e) => onEditContent(e.target.value)} className="min-h-[90px]" />
            <div className="flex gap-2"><Button size="sm" onClick={() => onSaveEdit(c.id)} disabled={busy}>Save</Button><Button size="sm" variant="ghost" onClick={onEditCancel}>Cancel</Button></div>
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.content}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1">
          {user && (
            <Button size="sm" variant="ghost" className={`h-8 gap-1.5 px-2 ${c.likedByMe ? "text-primary" : "text-muted-foreground"}`} onClick={() => onToggleLike(c)} disabled={busy}>
              <Heart className={`h-4 w-4 ${c.likedByMe ? "fill-primary" : ""}`} />{c.likeCount}
            </Button>
          )}
          {!user && <span className="inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground"><Heart className="h-4 w-4" />{c.likeCount}</span>}
          {user && <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-muted-foreground" onClick={() => onReplyTo(c.id)}><Reply className="h-4 w-4" />Reply</Button>}
          {mine && !isEditing && <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-muted-foreground" onClick={() => onEditStart(c.id, c.content)}><Pencil className="h-4 w-4" />Edit</Button>}
          {canDelete && <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-destructive" onClick={() => onDelete(c.id)} disabled={busy}><Trash2 className="h-4 w-4" />Delete</Button>}
        </div>

        {isReplying && (
          <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Replying to {c.author.firstName}</p>
            <Textarea value={replyContent} onChange={(e) => onReplyContent(e.target.value)} placeholder="Write a thoughtful reply..." className="min-h-[80px] bg-background" autoFocus />
            <div className="flex gap-2"><Button size="sm" onClick={() => onSubmitReply(c.id)} disabled={busy || !replyContent.trim()}>Post reply</Button><Button size="sm" variant="ghost" onClick={onReplyCancel}>Cancel</Button></div>
          </div>
        )}
      </div>
      {c.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {c.children.map((child) => (
            <CommentNode
              key={child.id}
              c={child}
              depth={depth + 1}
              user={user}
              community={community}
              replyTo={replyTo}
              replyContent={replyContent}
              editId={editId}
              editContent={editContent}
              busy={busy}
              onReplyTo={onReplyTo}
              onReplyContent={onReplyContent}
              onEditStart={onEditStart}
              onEditContent={onEditContent}
              onEditCancel={onEditCancel}
              onReplyCancel={onReplyCancel}
              onToggleLike={onToggleLike}
              onSubmitReply={onSubmitReply}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams<{ id: string; postId: string }>();
  const { id: communityId, postId } = params;
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [p, c] = await Promise.all([
        api.get<Post>(`/api/posts/${postId}`, !!user),
        api.get<Comment[]>(`/api/posts/${postId}/comments`, !!user),
      ]);
      setPost(p);
      setComments(c);
      try {
        setCommunity(await api.get<Community>(`/api/communities/${communityId}`, !!user));
      } catch { setCommunity(null); }
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [postId, user?.id]);

  const canManagePost = !!(user && (user.id === post?.author.id || user.role === "ADMIN" || (community && community.owner.id === user.id)));

  async function togglePostLike() {
    if (!post) return;
    setBusy(true);
    try {
      if (post.likedByMe) await api.del(`/api/posts/${post.id}/likes`);
      else await api.post(`/api/posts/${post.id}/likes`);
      await load();
    } catch (e) { setNotice(e instanceof ApiError ? e.message : "Action failed"); }
    finally { setBusy(false); }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/posts/${postId}/comments`, { content: newComment });
      setNewComment(""); setNotice(null); await load();
    } catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to comment"); }
    finally { setBusy(false); }
  }

  async function submitReply(parentId: number) {
    setBusy(true);
    try {
      await api.post(`/api/comments/${parentId}/replies`, { content: replyContent });
      setReplyTo(null); setReplyContent(""); await load();
    } catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to reply"); }
    finally { setBusy(false); }
  }

  async function saveEdit(commentId: number) {
    setBusy(true);
    try {
      await api.patch(`/api/comments/${commentId}`, { content: editContent });
      setEditId(null); setEditContent(""); await load();
    } catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to edit"); }
    finally { setBusy(false); }
  }

  async function deleteComment(commentId: number) {
    setBusy(true);
    try { await api.del(`/api/comments/${commentId}`); await load(); }
    catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to delete comment"); }
    finally { setBusy(false); }
  }

  async function toggleCommentLike(c: Comment) {
    setBusy(true);
    try {
      if (c.likedByMe) await api.del(`/api/comments/${c.id}/likes`);
      else await api.post(`/api/comments/${c.id}/likes`);
      await load();
    } catch (e) { setNotice(e instanceof ApiError ? e.message : "Action failed"); }
    finally { setBusy(false); }
  }

  async function deletePost() {
    if (!post || !confirm("Delete this post? This cannot be undone.")) return;
    setBusy(true);
    try { await api.del(`/api/posts/${post.id}`); router.push(`/communities/${communityId}`); }
    catch (e) { setNotice(e instanceof ApiError ? e.message : "Failed to delete post"); setBusy(false); }
  }

  const tree = useMemo(() => buildTree(comments), [comments]);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="h-56 animate-pulse rounded-xl border bg-muted/40" />
      <div className="h-40 animate-pulse rounded-xl border bg-muted/40" />
    </div>
  );
  if (error) return (
    <div className="space-y-4">
      <Link href={`/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to community</Link>
      <Card className="border-destructive/30"><CardContent className="pt-6 text-destructive">{error}</CardContent></Card>
    </div>
  );
  if (!post) return <p>Not found.</p>;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/communities" className="hover:text-foreground">Communities</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/communities/${communityId}`} className="hover:text-foreground">Community</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="max-w-[200px] truncate font-medium text-foreground sm:max-w-md">{post.title}</span>
      </nav>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground" asChild>
          <Link href={`/communities/${communityId}`}><ArrowLeft className="h-4 w-4" />Back to community</Link>
        </Button>
      </div>

      {notice && <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{notice}</div>}

      <article>
        <Card className="overflow-hidden">
          <CardHeader className="space-y-3 border-b bg-muted/20">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Post</Badge>
              <span className="text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
              {post.updatedAt && <span className="text-sm text-muted-foreground">· edited</span>}
            </div>
            <CardTitle className="text-2xl leading-tight sm:text-3xl">{post.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{post.author.firstName[0]}{post.author.lastName[0]}</span>
              <span className="font-medium text-foreground">{post.author.firstName} {post.author.lastName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground">{post.content}</div>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              {user ? (
                <Button variant={post.likedByMe ? "default" : "secondary"} className="gap-2" onClick={togglePostLike} disabled={busy}>
                  <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""}`} />{post.likedByMe ? "Liked" : "Like"} · {post.likeCount}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"><Heart className="h-4 w-4" />{post.likeCount} likes</span>
              )}
              <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"><MessageSquare className="h-4 w-4" />{comments.length} comments</span>
              {canManagePost && <Button variant="outline" className="ml-auto gap-2 text-destructive hover:text-destructive" onClick={deletePost} disabled={busy}><Trash2 className="h-4 w-4" />Delete post</Button>}
            </div>
          </CardContent>
        </Card>
      </article>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Discussion</h2>
          <span className="text-sm text-muted-foreground">{comments.length} {comments.length === 1 ? "comment" : "comments"}</span>
        </div>

        {user ? (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Add a comment</CardTitle><CardDescription>Join the discussion — be respectful and constructive.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={addComment} className="space-y-3">
                <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your thoughts..." className="min-h-[110px]" required />
                <Button type="submit" disabled={busy} className="gap-2"><Send className="h-4 w-4" />{busy ? "Posting..." : "Post comment"}</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm text-muted-foreground">Sign in to comment, reply, and like.</p>
            <Button asChild size="sm"><Link href="/login">Login</Link></Button>
          </CardContent></Card>
        )}

        {tree.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 rounded-full bg-muted p-3"><MessageSquare className="h-5 w-5 text-muted-foreground" /></div>
            <p className="font-medium">No comments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start the conversation by adding the first comment.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {tree.map((c) => (
              <CommentNode
                key={c.id}
                c={c}
                depth={0}
                user={user}
                community={community}
                replyTo={replyTo}
                replyContent={replyContent}
                editId={editId}
                editContent={editContent}
                busy={busy}
                onReplyTo={(id) => { setReplyTo(id); setReplyContent(""); setEditId(null); }}
                onReplyContent={setReplyContent}
                onEditStart={(id, content) => { setEditId(id); setEditContent(content); setReplyTo(null); }}
                onEditContent={setEditContent}
                onEditCancel={() => setEditId(null)}
                onReplyCancel={() => setReplyTo(null)}
                onToggleLike={toggleCommentLike}
                onSubmitReply={submitReply}
                onSaveEdit={saveEdit}
                onDelete={deleteComment}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
