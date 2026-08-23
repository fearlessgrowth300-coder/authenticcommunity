import { AI_CONFIG } from './config.ts'
import { AiError } from './errors.ts'

const SECRET_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:access|refresh|id)[_-]?token\b\s*[:=]\s*\S+/gi,
  /\b(?:password|passcode|otp|one[-_ ]time code)\b\s*[:=]\s*\S+/gi,
  /\b(?:api[_-]?key|secret[_-]?key)\b\s*[:=]\s*\S+/gi,
]

const SENSITIVE_FIELD_NAMES = new Set([
  'password', 'otp', 'access_token', 'refresh_token', 'authorization',
  'phone', 'phone_number', 'government_id', 'identity_document', 'face_data',
  'liveness_data', 'biometric_data', 'latitude', 'longitude', 'exact_location',
  'home_address', 'payment_details', 'reporter_id', 'private_message',
  'religion', 'ethnicity', 'sexual_orientation', 'medical_condition',
  'political_ideology', 'financial_condition', 'criminal_history',
])

export type PublicAiInput = {
  text: string
  itemType: 'post' | 'video' | 'story' | 'profile' | 'community' | 'event'
  visibility: string
  city?: string | null
  country?: string | null
  extra?: Record<string, unknown>
}

function cleanText(value: string): string {
  return SECRET_PATTERNS.reduce((result, pattern) => result.replace(pattern, '[REDACTED]'), value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .trim()
    .slice(0, AI_CONFIG.classificationMaxChars)
}

export function sanitizePublicAiInput(input: PublicAiInput): Record<string, unknown> {
  const allowedVisibility = new Set(['public'])
  if (!allowedVisibility.has(input.visibility)) {
    throw new AiError('AI_UNSAFE_INPUT', 'Only public content may be sent for AI enrichment.')
  }

  const safeExtra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input.extra || {})) {
    if (SENSITIVE_FIELD_NAMES.has(key.toLowerCase())) continue
    if (typeof value === 'string') safeExtra[key] = cleanText(value).slice(0, 500)
    else if (typeof value === 'number' || typeof value === 'boolean') safeExtra[key] = value
    else if (Array.isArray(value)) {
      safeExtra[key] = value
        .filter((entry): entry is string => typeof entry === 'string')
        .slice(0, 20)
        .map((entry) => cleanText(entry).slice(0, 100))
    }
  }

  return {
    item_type: input.itemType,
    text: cleanText(input.text),
    city: input.city ? cleanText(input.city).slice(0, 100) : null,
    country: input.country ? cleanText(input.country).slice(0, 100) : null,
    ...safeExtra,
  }
}

export function sanitizeSafeMetadata(metadata: Record<string, unknown> | undefined) {
  const allowed = new Set([
    'dwell_time_ms', 'watch_time_ms', 'watch_percent', 'is_complete',
    'source', 'query_category', 'network_type', 'result_count',
  ])
  const sanitized: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(metadata || {})) {
    if (!allowed.has(key)) continue
    if (typeof value === 'string') sanitized[key] = value.slice(0, 120)
    if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value
    if (typeof value === 'boolean') sanitized[key] = value
  }
  return sanitized
}

