# Storage Bucket Setup Instructions

After running the SQL migration to create the `avatars` bucket, you need to set up the storage policies through the Supabase Dashboard.

## Step 1: Run the SQL Migration

Run the SQL in `supabase/migrations/create_avatars_storage_bucket.sql` to create the bucket.

## Step 2: Create Storage Policies in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click on the **avatars** bucket
4. Go to the **Policies** tab
5. Click **New Policy** and create the following policies:

### Policy 1: Allow authenticated users to upload their own profile pictures

- **Policy name**: `Users can upload their own profile pictures`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition** (USING expression):
```sql
bucket_id = 'avatars' AND
name LIKE 'profile-pictures/%' AND
split_part(split_part(name, '/', 2), '-', 1) = auth.uid()::text
```

### Policy 2: Allow authenticated users to update their own profile pictures

- **Policy name**: `Users can update their own profile pictures`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition** (USING expression):
```sql
bucket_id = 'avatars' AND
name LIKE 'profile-pictures/%' AND
split_part(split_part(name, '/', 2), '-', 1) = auth.uid()::text
```

### Policy 3: Allow authenticated users to delete their own profile pictures

- **Policy name**: `Users can delete their own profile pictures`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition** (USING expression):
```sql
bucket_id = 'avatars' AND
name LIKE 'profile-pictures/%' AND
split_part(split_part(name, '/', 2), '-', 1) = auth.uid()::text
```

### Policy 4: Allow public read access to avatars

- **Policy name**: `Public can view avatars`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition** (USING expression):
```sql
bucket_id = 'avatars'
```

## Alternative: Use Supabase CLI

If you have Supabase CLI access, you can also create these policies using the Supabase Management API or by using the service role key in a script.

## File Path Format

The policies expect files to be uploaded with this path format:
```
profile-pictures/{userId}-{timestamp}.{ext}
```

For example: `profile-pictures/123e4567-e89b-12d3-a456-426614174000-1703123456789.jpg`

The user ID is extracted from the filename (the part before the first hyphen after the folder name).
