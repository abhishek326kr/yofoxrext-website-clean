# YoForex Object Storage Setup Guide

## Overview

YoForex uses Replit Object Storage (backed by Google Cloud Storage) for persistent file uploads. This ensures EA files, screenshots, and other content remain available even when the app restarts on Replit's autoscale platform.

## Why Object Storage?

**Problem**: Replit autoscale deployments don't persist local file uploads. Files saved to `/public/uploads/` are lost on restart.

**Solution**: Object Storage provides persistent, scalable cloud storage with:
- ✅ Persistent storage across restarts
- ✅ ACL-based access control (public/private files)
- ✅ Direct client-to-storage uploads (presigned URLs)
- ✅ Automatic scaling and CDN caching

## Setup Steps

### Step 1: Create Object Storage Bucket

1. Open your Replit workspace
2. Click the **Tools** panel on the left sidebar
3. Click **Object Storage**
4. Click **Create Bucket**
5. Enter bucket name: `yoforex-files`
6. Click **Create**

### Step 2: Configure Environment Variables

Add these environment variables to your Replit Secrets:

```bash
# Private directory for EA files and protected content
PRIVATE_OBJECT_DIR=/yoforex-files/content

# Public directories for serving assets (optional, comma-separated)
PUBLIC_OBJECT_SEARCH_PATHS=/yoforex-files/public
```

**How to add secrets:**
1. Click the **Tools** panel
2. Click **Secrets**
3. Click **+ New Secret**
4. Add each variable above

### Step 3: Verify Integration

The object storage is now ready! The following endpoints are available:

- **POST /api/objects/upload** - Get presigned URL for file upload
- **GET /objects/:path** - Download files (ACL-protected)
- **PUT /api/content/files** - Set access control after upload

## Usage in Code

### Frontend: Upload EA Files

```typescript
import { ObjectUploader } from '@/components/ObjectUploader';

function PublishEAForm() {
  const handleGetUploadURL = async () => {
    const res = await fetch('/api/objects/upload', {
      method: 'POST',
      credentials: 'include'
    });
    const { uploadURL } = await res.json();
    return { method: 'PUT' as const, url: uploadURL };
  };

  const handleUploadComplete = async (result: any) => {
    const uploadedFileURL = result.successful[0].uploadURL;
    
    // Set ACL policy
    await fetch('/api/content/files', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileURL: uploadedFileURL,
        visibility: 'private', // or 'public' for screenshots
        contentId: myContentId
      })
    });
  };

  return (
    <ObjectUploader
      maxNumberOfFiles={5}
      maxFileSize={10485760} // 10MB
      allowedFileTypes={['.ex4', '.ex5', '.jpg', '.png']}
      onGetUploadParameters={handleGetUploadURL}
      onComplete={handleUploadComplete}
    >
      Upload EA Files
    </ObjectUploader>
  );
}
```

### Backend: Access Control

The object storage uses ACL policies to control file access:

**Public Files** (screenshots, logos):
```typescript
{
  owner: userId,
  visibility: "public" // Anyone can view
}
```

**Private Files** (EA files, source code):
```typescript
{
  owner: userId,
  visibility: "private",
  aclRules: [{
    group: {
      type: ObjectAccessGroupType.PURCHASERS,
      id: contentId
    },
    permission: ObjectPermission.READ
  }]
}
```

## File Access Patterns

### Who Can Download Files?

| File Type | Owner | Purchasers | Public |
|-----------|-------|------------|--------|
| EA Files (.ex4, .ex5) | ✅ | ✅ | ❌ |
| Screenshots (.jpg, .png) | ✅ | ✅ | ✅ |
| Source Code (.mq4, .mq5) | ✅ | ✅ | ❌ |

### Access Control Flow

1. **Upload**: Client gets presigned URL from `/api/objects/upload`
2. **Upload**: Client uploads directly to Google Cloud Storage
3. **Set ACL**: Client calls `/api/content/files` with file URL and visibility
4. **Download**: Users request `/objects/uploads/[file-id]`
5. **Check ACL**: Server verifies user has permission to access file
6. **Stream**: Server streams file to user if authorized

## Troubleshooting

### Error: "PRIVATE_OBJECT_DIR not set"

**Solution**: Add the `PRIVATE_OBJECT_DIR` environment variable in Replit Secrets (see Step 2).

### Error: "Failed to sign object URL"

**Cause**: Not running on Replit, or object storage not set up.

**Solution**:
1. Ensure you're running on Replit (not locally)
2. Verify bucket exists in Object Storage tool
3. Check environment variables are set correctly

### Files not persisting

**Cause**: Using local file system (`/public/uploads/`) instead of object storage.

**Solution**: Use the `ObjectUploader` component which uploads to object storage.

### Access denied (403)

**Cause**: User doesn't have permission to access the file.

**Solution**: Check ACL policy for the file. Ensure:
- User is the file owner, OR
- User purchased the content (for private EA files), OR
- File visibility is "public" (for screenshots)

## Migration from Local Uploads

To migrate existing uploads to object storage:

1. **Identify files**: Check `/public/uploads/` directory
2. **Upload to storage**: Use the Object Storage tool to manually upload files
3. **Update database**: Update file paths in database from `/uploads/[filename]` to `/objects/uploads/[file-id]`
4. **Set ACL policies**: Call `/api/content/files` for each file to set proper access control

## Advanced: Custom ACL Groups

You can extend ACL functionality for custom access patterns:

```typescript
// server/objectAcl.ts
export enum ObjectAccessGroupType {
  PURCHASERS = "purchasers",
  FOLLOWERS = "followers",
  SUBSCRIBERS = "subscribers", // NEW: Premium subscribers
  BETA_TESTERS = "beta_testers", // NEW: Beta test group
}
```

Implement the corresponding access group class:

```typescript
class SubscribersAccessGroup extends BaseObjectAccessGroup {
  async hasMember(userId: string): Promise<boolean> {
    // Check if user is a premium subscriber
    const user = await storage.getUser(userId);
    return user?.subscriptionTier === 'premium';
  }
}
```

## Security Best Practices

1. **Always authenticate**: All object storage endpoints require `isAuthenticated` middleware
2. **Validate ACL policies**: Always set ACL policies after upload
3. **Use private by default**: Set `visibility: "private"` for sensitive files (EA files, source code)
4. **Set public only when needed**: Use `visibility: "public"` only for screenshots and logos
5. **Rate limit uploads**: Prevent abuse with upload rate limiting

## Performance Optimization

1. **CDN Caching**: Public files are cached with `Cache-Control: public, max-age=3600`
2. **Private caching**: Private files use `Cache-Control: private, max-age=3600`
3. **Streaming**: Files are streamed directly from storage to client (no server buffering)
4. **Presigned URLs**: Client uploads directly to GCS, reducing server load

## References

- [Replit Object Storage Documentation](https://docs.replit.com/hosting/deployments/object-storage)
- Blueprint: `blueprint:javascript_object_storage`
- Code:
  - `server/objectStorage.ts` - Storage service
  - `server/objectAcl.ts` - Access control
  - `app/components/ObjectUploader.tsx` - Upload component
  - `server/routes.ts` - API endpoints (lines 176-264)
