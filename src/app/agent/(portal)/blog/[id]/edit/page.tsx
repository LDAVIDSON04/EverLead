"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import { ArrowLeft, Loader2, Upload, X, Trash2 } from "lucide-react";
import { BlogImageCropModal } from "@/components/blog/BlogImageCropModal";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabaseClient
        .from("blog_posts")
        .select("id, title, body, image_url, status")
        .eq("id", id)
        .eq("author_id", user.id)
        .maybeSingle();

      if (fetchError || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTitle(data.title);
      setBody(data.body ?? "");
      setExistingImageUrl(data.image_url);
      setLoading(false);
    })();
  }, [id]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, GIF, WebP).");
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
  };

  const removeNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setClearImage(true);
  };

  const save = async (status: "draft" | "pending_review") => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setError("You must be signed in to update.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | null = clearImage ? null : existingImageUrl;
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
      } else if (!existingImageUrl) {
        imageUrl = null;
      }

      const { error: updateError } = await supabaseClient
        .from("blog_posts")
        .update({
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("author_id", user.id);

      if (updateError) {
        setError(updateError.message || "Failed to save.");
        setSaving(false);
        return;
      }
      router.push("/agent/blog");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    const { error: delError } = await supabaseClient
      .from("blog_posts")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id);
    setDeleting(false);
    if (delError) {
      setError("Failed to delete. Please try again.");
    } else {
      router.push("/agent/blog");
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <p className="text-gray-600">Post not found or you don’t have permission to edit it.</p>
        <Link href="/agent/blog" className="mt-4 inline-block text-sm text-black hover:underline">
          Back to Blog
        </Link>
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
          setClearImage(false);
          setPendingCropSrc(null);
        }}
      />
      <Link
        href="/agent/blog"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit post</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm p-3">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Post title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Write your post..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={removeNewImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : existingImageUrl && !clearImage ? (
            <div className="relative inline-block">
              <img src={existingImageUrl} alt="Current" className="max-h-48 rounded-lg border border-gray-200" />
              <p className="text-xs text-gray-500 mt-1">Current image.</p>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                <button type="button" onClick={removeImage} className="text-sm text-red-600 hover:underline">
                  Remove image
                </button>
              </div>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 text-gray-500 text-sm">
              <Upload className="w-5 h-5" />
              Choose image
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save("draft")}
          disabled={saving}
          className="rounded-lg bg-gray-100 text-gray-800 px-4 py-2.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save as draft
        </button>
        <button
          type="button"
          onClick={() => save("pending_review")}
          disabled={saving}
          className="rounded-lg bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit for approval
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="ml-auto rounded-lg border border-red-200 text-red-700 px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete post
        </button>
      </div>
    </div>
  );
}
