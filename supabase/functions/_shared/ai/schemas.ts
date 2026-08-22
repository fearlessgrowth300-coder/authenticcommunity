export type ContentTopic = { topic: string; confidence: number }

export type ContentEnrichment = {
  topics: ContentTopic[]
  language: string
  location_scope: 'local' | 'regional' | 'country' | 'global' | 'unknown'
  content_type: string
  quality_hints: {
    informational: number
    conversation_potential: number
  }
  safety_flags: string[]
}

const LOCATION_SCOPES = new Set(['local', 'regional', 'country', 'global', 'unknown'])
const ALLOWED_SAFETY_FLAGS = new Set(['spam', 'harassment', 'threat', 'scam', 'sexual_content', 'hate', 'none'])

function finiteUnit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

export function parseContentEnrichment(value: unknown): ContentEnrichment {
  if (!value || typeof value !== 'object') throw new Error('Invalid enrichment object')
  const candidate = value as Record<string, unknown>
  if (!Array.isArray(candidate.topics) || candidate.topics.length > 12) throw new Error('Invalid topics')

  const topics = candidate.topics.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Invalid topic')
    const topic = (entry as Record<string, unknown>).topic
    const confidence = (entry as Record<string, unknown>).confidence
    if (typeof topic !== 'string' || !/^[a-z0-9][a-z0-9 _-]{0,79}$/i.test(topic) || !finiteUnit(confidence)) {
      throw new Error('Invalid topic fields')
    }
    return { topic: topic.trim().toLowerCase(), confidence }
  })

  if (typeof candidate.language !== 'string' || candidate.language.length > 20) throw new Error('Invalid language')
  if (typeof candidate.location_scope !== 'string' || !LOCATION_SCOPES.has(candidate.location_scope)) {
    throw new Error('Invalid location scope')
  }
  if (typeof candidate.content_type !== 'string' || candidate.content_type.length > 80) throw new Error('Invalid content type')
  const quality = candidate.quality_hints as Record<string, unknown> | undefined
  if (!quality || !finiteUnit(quality.informational) || !finiteUnit(quality.conversation_potential)) {
    throw new Error('Invalid quality hints')
  }
  if (!Array.isArray(candidate.safety_flags) || candidate.safety_flags.length > 8) throw new Error('Invalid safety flags')
  const safetyFlags = candidate.safety_flags.map((flag) => {
    if (typeof flag !== 'string' || !ALLOWED_SAFETY_FLAGS.has(flag)) throw new Error('Invalid safety flag')
    return flag
  }).filter((flag) => flag !== 'none')

  return {
    topics,
    language: candidate.language,
    location_scope: candidate.location_scope as ContentEnrichment['location_scope'],
    content_type: candidate.content_type,
    quality_hints: {
      informational: quality.informational as number,
      conversation_potential: quality.conversation_potential as number,
    },
    safety_flags: safetyFlags,
  }
}

