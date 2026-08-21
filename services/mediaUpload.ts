import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
  error: Error | null
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

/**
 * Base64 string to ArrayBuffer helper for React Native
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Upload an image or video file to Supabase Storage.
 * Uses 'community-posts' bucket for post media, 'stories' for stories, 'avatars' for profile pictures.
 */
export async function uploadMediaFile(params: {
  bucket?: 'community-posts' | 'stories' | 'avatars' | 'event-photos'
  localUri: string
  base64?: string | null
  type: 'image' | 'video'
  mimeType?: string
}): Promise<UploadResult> {
  const { bucket = 'community-posts', localUri, base64, type, mimeType } = params

  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      return { url: '', path: '', error: new Error('User must be authenticated to upload media.') }
    }

    const ext = type === 'video' ? 'mp4' : 'jpg'
    const cleanMime = mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg')
    const fileName = `${auth.user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

    let fileBody: any

    if (base64) {
      fileBody = base64ToArrayBuffer(base64)
    } else {
      // In React Native / Expo, FormData is the most reliable native multipart upload method
      const formData = new FormData()
      formData.append('file', {
        uri: localUri,
        name: fileName.split('/').pop() || `media.${ext}`,
        type: cleanMime,
      } as any)
      fileBody = formData
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBody, {
        contentType: cleanMime,
        upsert: true,
      })

    if (uploadError) {
      // If error occurred with FormData, try fetch arrayBuffer fallback
      try {
        const fetchRes = await fetch(localUri)
        const arrayBuf = await fetchRes.arrayBuffer()
        const retry = await supabase.storage
          .from(bucket)
          .upload(fileName, arrayBuf, {
            contentType: cleanMime,
            upsert: true,
          })
        if (retry.error) throw retry.error
      } catch (retryErr: any) {
        return { url: '', path: '', error: new Error(uploadError.message || retryErr.message) }
      }
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
