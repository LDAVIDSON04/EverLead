-- Create avatars storage bucket for profile pictures
-- This migration creates the storage bucket and sets up RLS policies

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload their own profile pictures
-- File path format: profile-pictures/{userId}-{timestamp}.{ext}
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  split_part((storage.foldername(name))[2], '-', 1) = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  split_part((storage.foldername(name))[2], '-', 1) = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  split_part((storage.foldername(name))[2], '-', 1) = auth.uid()::text
);

-- Policy: Allow public read access to avatars (for displaying profile pictures)
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

COMMENT ON POLICY "Users can upload their own profile pictures" ON storage.objects IS 'Allows authenticated users to upload profile pictures to their own folder';
COMMENT ON POLICY "Users can update their own profile pictures" ON storage.objects IS 'Allows authenticated users to update their own profile pictures';
COMMENT ON POLICY "Users can delete their own profile pictures" ON storage.objects IS 'Allows authenticated users to delete their own profile pictures';
COMMENT ON POLICY "Public can view avatars" ON storage.objects IS 'Allows public read access to avatar images';
