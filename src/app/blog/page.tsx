import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BlogPostCard, type PostWithAuthor } from "./BlogPostCard";

// Always fetch fresh posts so newly published posts show without redeploy
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  if (!supabaseAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-neutral-600">Blog is temporarily unavailable.</p>
      </div>
    );
  }

  const { data: posts, error } = await supabaseAdmin
    .from("blog_posts")
    .select("id, title, body, image_url, created_at, author_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error loading blog:", error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-neutral-600">Failed to load blog.</p>
      </div>
    );
  }

  const list = posts || [];
  const authorIds = [...new Set(list.map((p: { author_id: string }) => p.author_id))];
  let profilesMap: Record<string, { full_name: string | null; job_title: string | null; funeral_home: string | null; profile_picture_url: string | null; role: string | null; agent_city: string | null; agent_province: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, job_title, funeral_home, profile_picture_url, role, agent_city, agent_province")
      .in("id", authorIds);
    (profiles || []).forEach((p: any) => {
      profilesMap[p.id] = {
        full_name: p.full_name,
        job_title: p.job_title,
        funeral_home: p.funeral_home,
        profile_picture_url: p.profile_picture_url,
        role: p.role ?? null,
        agent_city: p.agent_city ?? null,
        agent_province: p.agent_province ?? null,
      };
    });
  }

  const postsWithAuthor: PostWithAuthor[] = list.map((p: any) => ({
    ...p,
    author: profilesMap[p.author_id] ?? null,
  }));

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 bg-[#FAF9F6] py-3 px-4 border-b border-neutral-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src="/Soradin.png"
              alt="Soradin Logo"
              width={48}
              height={48}
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
            />
            <span className="text-sm md:text-base font-medium text-[#1A1A1A]">Soradin Blog</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-[#1A1A1A] hover:text-[#1A1A1A]/80 transition-colors text-sm font-medium">
              About us
            </Link>
            <Link href="/learn-more-about-starting" className="text-[#1A1A1A] hover:text-[#1A1A1A]/80 transition-colors text-sm font-medium">
              List your specialty
            </Link>
            <Link href="/agent" className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-sm font-medium">
              Agent log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {postsWithAuthor.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
            No posts yet. Check back soon.
          </div>
        ) : (
          <ul className="space-y-6">
            {postsWithAuthor.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
