-- Blog posts: agents and admins can create; approval required before public display
-- Author is profiles.id (agent or admin). Public feed shows only status = 'published'.

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  slug text UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug) WHERE slug IS NOT NULL;

COMMENT ON TABLE blog_posts IS 'Blog posts by agents (pending approval) or admins. Public feed shows only published.';

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Agents: can CRUD only their own posts (author_id = auth.uid())
CREATE POLICY blog_posts_agent_own ON blog_posts
  FOR ALL
  USING (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'agent')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'agent')
  );

-- Admins: can do everything
CREATE POLICY blog_posts_admin_all ON blog_posts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Public (anon): can only read published posts (for public /blog feed)
CREATE POLICY blog_posts_public_read_published ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Storage bucket for blog post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true, file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Storage RLS: authenticated users (agents/admins) can upload to blog-images
CREATE POLICY blog_images_upload ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY blog_images_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY blog_images_update ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY blog_images_delete ON storage.objects
  FOR DELETE
  USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
