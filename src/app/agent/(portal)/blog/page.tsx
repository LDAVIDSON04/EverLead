"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { BlogImageCropModal } from "@/components/blog/BlogImageCropModal";

const TRUNCATE_LENGTH = 200;

type BlogPost = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending approval",
  published: "Published",
};

const statusClass: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
};

export default function AgentBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>("");

  // Start a post composer state
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    const { data } = await supabaseClient
      .from("profiles")
      .select("profile_picture_url, full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setProfilePic(data.profile_picture_url || null);
      setProfileName(data.full_name || "You");
    }
  };

  const loadPosts = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data, error: fetchError } = await supabaseClient
      .from("blog_posts")
      .select("id, title, body, image_url, status, created_at, updated_at")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      console.error("Error loading blog posts:", fetchError);
      setPosts([]);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, []);

  const onPhotoClick = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (JPEG, PNG, GIF, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPendingCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const submitPost = async (status: "draft" | "pending_review") => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setError("You must be signed in to post.");
      return;
    }
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Write something to post.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `blog/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabaseClient.storage
          .from("blog-images")
          .upload(path, imageFile, { upsert: true });
        if (uploadError) {
          setError("Failed to upload image. Please try again.");
          setSaving(false);
          return;
        }
        const { data: urlData } = supabaseClient.storage.from("blog-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const title = trimmedBody.split("\n")[0].slice(0, 80) || "Post";
      const { error: insertError } = await supabaseClient.from("blog_posts").insert({
        author_id: user.id,
        title,
        body: trimmedBody,
        image_url: imageUrl,
        status,
      });

      if (insertError) {
        setError(insertError.message || "Failed to save post.");
        setSaving(false);
        return;
      }

      setBody("");
      setImageFile(null);
      setImagePreview(null);
      loadPosts();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirmId;
    if (!id) return;
    setDeleteConfirmId(null);
    setDeletingId(id);
    const { error: delError } = await supabaseClient.from("blog_posts").delete().eq("id", id);
    setDeletingId(null);
    if (delError) {
      console.error("Error deleting post:", delError);
      alert("Failed to delete. Please try again.");
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <BlogImageCropModal
        imageSrc={pendingCropSrc}
        onCancel={() => setPendingCropSrc(null)}
        onComplete={(file) => {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
          setPendingCropSrc(null);
        }}
      />
      {/* LinkedIn-style create post card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        {/* Header: profile + name + audience (like LinkedIn "Post to Anyone") */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {profilePic ? (
            <img
              src={profilePic}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium flex-shrink-0">
              {profileName[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{profileName}</p>
            <p className="text-xs text-gray-500">Post to blog · Requires approval</p>
          </div>
        </div>

        {/* Writing above: large text area, placeholder like LinkedIn */}
        <div className="px-4 pt-1 pb-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start a post..."
            rows={4}
            className="w-full py-2 px-0 border-0 resize-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 text-[15px] leading-snug min-h-[100px]"
          />
        </div>

        {/* Image area: large block below text - empty state (add photo) or preview with remove */}
        <div className="px-4 pb-3">
          {imagePreview ? (
            <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-[360px] object-contain object-top"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPhotoClick}
              className="w-full min-h-[120px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2 py-6 text-gray-500"
            >
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium">Add photo</span>
            </button>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Bottom bar: minimal like LinkedIn - Save as draft | Post (blue) */}
        <div className="px-4 py-3 flex items-center justify-end gap-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => submitPost("draft")}
            disabled={saving || !body.trim()}
            className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Save as draft"}
          </button>
          <button
            type="button"
            onClick={() => submitPost("pending_review")}
            disabled={saving || !body.trim()}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Post"}
          </button>
        </div>
      </div>

      <p className="text-sm mb-4">
        <button
          type="button"
          onClick={() => setGuidelinesOpen(true)}
          className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#0A66C2] rounded"
        >
          Soradin Blog Community Guidelines
        </button>
      </p>

      {/* Feed of posts - text above image, see more for long */}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          <p>Your posts will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              profilePic={profilePic}
              profileName={profileName}
              onDelete={() => handleDeleteClick(post.id)}
              deleting={deletingId === post.id}
            />
          ))}
        </ul>
      )}

      {/* Blog Community Guidelines modal */}
      {guidelinesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setGuidelinesOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative rounded-2xl bg-white shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Soradin Blog Community Guidelines</h2>
              <button
                type="button"
                onClick={() => setGuidelinesOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm text-gray-700 space-y-4">
              <p>
                The Soradin blog is designed to educate families about estate planning and end-of-life preparation. Articles should help people better understand the services professionals provide and the decisions involved in planning ahead.
              </p>
              <p>
                To maintain a helpful and trustworthy resource for families, all posts must follow the guidelines below. Posts are reviewed before being published.
              </p>
              <h3 className="font-semibold text-gray-900 pt-2">Content Purpose</h3>
              <p>
                Blog posts should focus on education, insight, and guidance related to your professional expertise.
              </p>
              <p className="font-medium text-gray-800">Good examples include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Explaining how life insurance fits into estate planning</li>
                <li>What families should know before meeting an estate lawyer</li>
                <li>How funeral pre-planning works</li>
                <li>Common mistakes people make when planning their estate</li>
                <li>Financial considerations families should prepare for later in life</li>
              </ul>
              <p>
                Posts should help families learn and understand, not serve as advertisements.
              </p>
              <h3 className="font-semibold text-gray-900 pt-2">What You Should Not Include</h3>
              <p>
                To maintain fairness and quality across the platform, posts must not include:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Direct contact information such as phone numbers, personal email addresses, or office addresses</li>
                <li>Requests for readers to call, email, or contact you directly</li>
                <li>Sales language such as &quot;book with me,&quot; &quot;contact me today,&quot; or promotional offers</li>
                <li>External booking links or websites directing users away from Soradin</li>
                <li>Misleading, exaggerated, or unverified claims about services or results</li>
                <li>Content unrelated to estate planning or end-of-life preparation</li>
              </ul>
              <p>
                Families should always connect with professionals through the Soradin platform, where appointments can be booked securely.
              </p>
              <h3 className="font-semibold text-gray-900 pt-2">Professional Conduct</h3>
              <p>
                All posts should maintain a professional tone and reflect the standards of your profession.
              </p>
              <p className="font-medium text-gray-800">Content must not include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Offensive or inappropriate language</li>
                <li>Disparaging remarks about other professionals or companies</li>
                <li>Political or unrelated content</li>
                <li>Confidential client information</li>
              </ul>
              <h3 className="font-semibold text-gray-900 pt-2">Approval Process</h3>
              <p>
                All blog submissions are reviewed by Soradin before appearing publicly. Posts that do not follow these guidelines may be edited, rejected, or removed.
              </p>
              <p>
                Repeated violations may result in loss of blogging privileges.
              </p>
              <h3 className="font-semibold text-gray-900 pt-2">Goal of the Soradin Blog</h3>
              <p>
                The Soradin blog exists to help families understand estate planning and make informed decisions. By sharing your knowledge, you help build trust with families while demonstrating your expertise within your profession.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setDeleteConfirmId(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative rounded-2xl bg-white shadow-xl max-w-sm w-full p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete this post?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  profilePic,
  profileName,
  onDelete,
  deleting,
}: {
  post: BlogPost;
  profilePic: string | null;
  profileName: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (post.body?.length ?? 0) > TRUNCATE_LENGTH;
  const displayBody = expanded || !isLong ? post.body : post.body.slice(0, TRUNCATE_LENGTH);

  return (
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            {profilePic ? (
              <img
                src={profilePic}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                {profileName[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{profileName}</p>
              <p className="text-xs text-gray-500">
                {new Date(post.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                <span className={`font-medium ${statusClass[post.status] || ""}`}>
                  {statusLabel[post.status] ?? post.status}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/agent/blog/${post.id}/edit`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Text above image - with see more */}
        <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
          {displayBody || "—"}
          {isLong && !expanded && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-gray-500 font-medium hover:underline"
              >
                ...see more
              </button>
            </>
          )}
          {isLong && expanded && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-gray-500 font-medium hover:underline"
              >
                see less
              </button>
            </>
          )}
        </div>

        {post.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={post.image_url}
              alt=""
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
      </div>
    </li>
  );
}
