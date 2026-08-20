import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
  error: Error | null
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

/**
 * Upload an image file or URI to Supabase Storage ('post_media' or 'stories' bucket).
 */
export async function uploadMediaFile(params: {
  bucket: 'post_media' | 'stories' | 'avatars' | 'events'
  localUri: string
  type: 'image' | 'video'
  mimeType?: string
}): Promise<UploadResult> {
  const { bucket, localUri, type, mimeType } = params

  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      return { url: '', path: '', error: new Error('User must be authenticated to upload media.') }
    }

    const ext = type === 'video' ? 'mp4' : 'jpg'
    const cleanMime = mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg')
    const fileName = `${auth.user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

    // Fetch local file as blob/arrayBuffer in React Native / Expo
    const response = await fetch(localUri)
    const blob = await response.blob()

    // Validate size
    if (type === 'image' && blob.size > MAX_IMAGE_SIZE_BYTES) {
      return { url: '', path: '', error: new Error('Image exceeds 10MB limit.') }
    }
    if (type === 'video' && blob.size > MAX_VIDEO_SIZE_BYTES) {
      return { url: '', path: '', error: new Error('Video exceeds 50MB limit.') }
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: cleanMime,
        upsert: false,
      })

    if (uploadError) {
      return { url: '', path: '', error: uploadError }
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)

    return {
      url: urlData.publicUrl,
      path: fileName,
      error: null,
    }
  } catch (err: any) {
    return {
      url: '',
      path: '',
      error: err instanceof Error ? err : new Error(err?.message || 'Failed to upload media.'),
    }
  }
}
