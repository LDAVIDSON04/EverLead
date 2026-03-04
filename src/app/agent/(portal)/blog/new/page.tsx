"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const save = async (status: "draft" | "pending_review") => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setError("You must be signed in to create a post.");
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

      const { data: post, error: insertError } = await supabaseClient
        .from("blog_posts")
        .insert({
          author_id: user.id,
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl,
          status,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message || "Failed to save post.");
        setSaving(false);
        return;
      }
      router.push("/agent/blog");
      if (post) router.replace(`/agent/blog#${post.id}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <Link
        href="/agent/blog"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">New post</h1>

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
          {!imagePreview ? (
            <label className="flex items-center justify-center gap-2 w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 text-gray-500 text-sm">
              <Upload className="w-5 h-5" />
              Choose image
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          ) : (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
      </div>
    </div>
  );
}
