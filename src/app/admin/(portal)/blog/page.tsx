"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { BookOpen, Plus, CheckCircle, Pencil, Trash2, Loader2, Eye, X, Upload } from "lucide-react";
import { BlogImageCropModal } from "@/components/blog/BlogImageCropModal";

type BlogPostRow = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles: { full_name: string | null; job_title: string | null; funeral_home: string | null; role?: string; profile_picture_url?: string | null } | null;
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending approval",
  published: "Published",
};

export default function AdminBlogPage() {
  useRequireRole("admin");
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewPost, setViewPost] = useState<BlogPostRow | null>(null);
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [cropPostId, setCropPostId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = async () => {
    const { data: raw, error } = await supabaseClient
      .from("blog_posts")
      .select("id, title, body, image_url, status, created_at, updated_at, author_id")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading blog posts:", error);
      setPosts([]);
      setLoading(false);
      return;
    }

    const list = raw || [];
    const authorIds = [...new Set(list.map((p: { author_id: string }) => p.author_id))];
    let profilesMap: Record<string, { full_name: string | null; job_title: string | null; funeral_home: string | null; role?: string; profile_picture_url?: string | null }> = {};
    if (authorIds.length > 0) {
      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("id, full_name, job_title, funeral_home, role, profile_picture_url")
        .in("id", authorIds);
      (profiles || []).forEach((p: any) => {
        profilesMap[p.id] = { full_name: p.full_name, job_title: p.job_title, funeral_home: p.funeral_home, role: p.role, profile_picture_url: p.profile_picture_url };
      });
    }

    setPosts(list.map((p: any) => ({ ...p, profiles: profilesMap[p.author_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const setStatus = async (id: string, status: string) => {
    setApprovingId(id);
    const { error } = await supabaseClient
      .from("blog_posts")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setApprovingId(null);
    if (error) {
      console.error("Error updating status:", error);
    } else {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(id);
    const { error } = await supabaseClient.from("blog_posts").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      console.error("Error deleting post:", error);
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filtered = statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

  const handleReviewImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !viewPost) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    setCropPostId(viewPost.id);
    const reader = new FileReader();
    reader.onloadend = () => setPendingCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const beginRecropCurrentImage = () => {
    if (!viewPost?.image_url) return;
    setCropPostId(viewPost.id);
    setPendingCropSrc(viewPost.image_url);
  };

  const handleCropCompleteForPost = async (file: File) => {
    const postId = cropPostId;
    setPendingCropSrc(null);
    setCropPostId(null);
    if (!postId) return;

    setImageUploading(true);
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;

      const path = `blog/${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabaseClient.storage.from("blog-images").upload(path, file, { upsert: true });
      if (upErr) {
        console.error(upErr);
        alert("Failed to upload image.");
        return;
      }
      const { data: urlData } = supabaseClient.storage.from("blog-images").getPublicUrl(path);
      const image_url = urlData.publicUrl;
      const updated_at = new Date().toISOString();

      const { error: dbErr } = await supabaseClient
        .from("blog_posts")
        .update({ image_url, updated_at })
        .eq("id", postId);

      if (dbErr) {
        alert("Failed to save image on post.");
        return;
      }

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, image_url, updated_at } : p)));
      setViewPost((prev) => (prev && prev.id === postId ? { ...prev, image_url, updated_at } : prev));
    } finally {
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BlogImageCropModal
        imageSrc={pendingCropSrc}
        onCancel={() => {
          setPendingCropSrc(null);
          setCropPostId(null);
        }}
        onComplete={handleCropCompleteForPost}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          New post
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-neutral-600">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending approval</option>
          <option value="published">Published</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">No posts match the filter.</p>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-neutral-700">Agent</th>
                <th className="px-4 py-3 text-sm font-medium text-neutral-700">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-neutral-700">Updated</th>
                <th className="px-4 py-3 text-sm font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((post) => (
                <tr key={post.id} className="bg-white hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-900">{post.profiles?.role === "admin" ? "Soradin" : (post.profiles?.full_name ?? "—")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      post.status === "published" ? "bg-green-100 text-green-800" :
                      post.status === "pending_review" ? "bg-amber-100 text-amber-800" :
                      "bg-neutral-100 text-neutral-700"
                    }`}>
                      {statusLabel[post.status] ?? post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setViewPost(post)}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {post.status === "pending_review" && (
                      <button
                        type="button"
                        onClick={() => setStatus(post.id, "published")}
                        disabled={approvingId === post.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    )}
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-700 px-2.5 py-1.5 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View post modal - LinkedIn-style post with Approve/Decline under the post */}
      {viewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setViewPost(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-900">Review post</h3>
              <button type="button" onClick={() => setViewPost(null)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-4 overflow-y-auto flex-1">
              {/* Post card - LinkedIn style: author row part of the post, no separate card */}
              <div className="rounded-lg border border-neutral-200 overflow-hidden">
                {/* Author row - integrated at top of post like LinkedIn */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                  {viewPost.profiles?.profile_picture_url ? (
                    <img
                      src={viewPost.profiles.profile_picture_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 font-medium flex-shrink-0">
                      {(viewPost.profiles?.full_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{viewPost.profiles?.full_name ?? "—"}</p>
                    <p className="text-sm text-neutral-600">
                      {[viewPost.profiles?.job_title, viewPost.profiles?.funeral_home].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{new Date(viewPost.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {/* Post content - no title, just body then image */}
                <div className="px-4 pb-3">
                  <div className="text-neutral-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {viewPost.body || "—"}
                  </div>
                  {viewPost.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50">
                      <img src={viewPost.image_url} alt="" className="w-full max-h-80 object-contain" />
                    </div>
                  )}
                  <input
                    ref={reviewImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReviewImageFile}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {viewPost.image_url ? (
                      <button
                        type="button"
                        onClick={beginRecropCurrentImage}
                        disabled={imageUploading || !!pendingCropSrc}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Re-crop image
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => reviewImageInputRef.current?.click()}
                      disabled={imageUploading || !!pendingCropSrc}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {viewPost.image_url ? "Replace image" : "Add image"}
                    </button>
                    {imageUploading ? (
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving…
                      </span>
                    ) : null}
                  </div>
                </div>
                {/* Approve / Decline bar - under the post like LinkedIn actions */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={async () => {
                      await setStatus(viewPost.id, "published");
                      setViewPost(null);
                    }}
                    disabled={approvingId === viewPost.id || imageUploading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {approvingId === viewPost.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await setStatus(viewPost.id, "draft");
                      setViewPost(null);
                    }}
                    disabled={approvingId === viewPost.id || imageUploading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
