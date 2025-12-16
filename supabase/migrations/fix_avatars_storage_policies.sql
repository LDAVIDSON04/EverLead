-- Fix avatars storage bucket policies
-- This allows authenticated users to upload to the avatars bucket

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Note: Storage policies must be created through Supabase Dashboard
-- Go to Storage > avatars > Policies and add these policies:

-- Policy 1: Allow authenticated users to INSERT (upload)
-- Name: "Authenticated users can upload"
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition:
-- (bucket_id = 'avatars')

-- Policy 2: Allow authenticated users to UPDATE
-- Name: "Authenticated users can update"
-- Operation: UPDATE  
-- Target roles: authenticated
-- Policy definition:
-- (bucket_id = 'avatars')

-- Policy 3: Allow authenticated users to DELETE
-- Name: "Authenticated users can delete"
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition:
-- (bucket_id = 'avatars')

-- Policy 4: Allow public SELECT (view)
-- Name: "Public can view avatars"
-- Operation: SELECT
-- Target roles: public
-- Policy definition:
-- (bucket_id = 'avatars')
