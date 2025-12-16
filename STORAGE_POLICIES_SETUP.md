# Storage Bucket Policies Setup

The storage bucket needs policies to allow authenticated users to upload files. Since we're using an API endpoint with admin client, the policies are less critical, but you should still set them up for security.

## Quick Fix: Use the API Endpoint

The code now uses `/api/agent/settings/upload-profile-picture` which uses the admin client and bypasses RLS. This should work immediately.

## Optional: Set Up Storage Policies (Recommended)

If you want to allow direct client-side uploads, set up these policies in Supabase Dashboard:

1. Go to **Storage** → **avatars** bucket → **Policies** tab
2. Click **New Policy** and create these 4 policies:

### Policy 1: Authenticated users can upload
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars'
```

### Policy 2: Authenticated users can update
- **Policy name**: `Authenticated users can update`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars'
```

### Policy 3: Authenticated users can delete
- **Policy name**: `Authenticated users can delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'avatars'
```

### Policy 4: Public can view
- **Policy name**: `Public can view avatars`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'avatars'
```

## Note

The API endpoint approach (using admin client) is more secure and reliable, so the policies above are optional. The upload should work now without them.
