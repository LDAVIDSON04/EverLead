"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { ArrowLeft, Loader2, Image as ImageIcon, X } from "lucide-react";
import { BlogImageCropModal } from "@/components/blog/BlogImageCropModal";

export default function AdminNewBlogPostPage() {
  useRequireRole("admin");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const save = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
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
      const { error: insertError } = await supabaseClient
        .from("blog_posts")
        .insert({
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
      router.push("/admin/blog");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <BlogImageCropModal
        imageSrc={pendingCropSrc}
        onCancel={() => setPendingCropSrc(null)}
        onComplete={(file) => {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
          setPendingCropSrc(null);
        }}
      />
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      {/* Same LinkedIn-style card as agent */}
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center">
            <Image src="/Soradin.png" alt="Soradin" width={48} height={48} className="w-12 h-12 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900">Soradin</p>
            <p className="text-xs text-neutral-500">Post to blog · Admin</p>
          </div>
        </div>

        <div className="px-4 pt-1 pb-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full py-2 px-0 border-0 resize-none focus:outline-none focus:ring-0 text-neutral-900 placeholder-neutral-500 text-[15px] leading-snug min-h-[100px]"
          />
        </div>

        <div className="px-4 pb-3">
          {imagePreview ? (
            <div className="relative w-full rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-[360px] object-contain object-top"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[120px] rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100 transition-colors flex flex-col items-center justify-center gap-2 py-6 text-neutral-500"
            >
              <ImageIcon className="w-8 h-8 text-neutral-400" />
              <span className="text-sm font-medium">Add photo</span>
            </button>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-4 py-3 flex items-center justify-end gap-2 border-t border-neutral-100">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 bg-white"
          >
            <option value="draft">Save as draft</option>
            <option value="published">Publish now</option>
          </select>
          <button
            type="button"
            onClick={save}
            disabled={saving || !body.trim()}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
