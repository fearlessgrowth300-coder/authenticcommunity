export type AiConfig = {
  provider: 'gemini'
  generativeModel: string
  embeddingModel: string
  embeddingDimension: number
  enabled: boolean
  publicContentOnly: boolean
  multimodalPublicContent: boolean
  maxRetries: number
  classificationMaxChars: number
  requestTimeoutMs: number
}

export const AI_CONFIG: Readonly<AiConfig> = Object.freeze({
  provider: 'gemini',
  generativeModel: 'gemini-3.5-flash-lite',
  embeddingModel: 'gemini-embedding-2',
  embeddingDimension: 768,
  enabled: true,
  publicContentOnly: true,
  multimodalPublicContent: false,
  maxRetries: 2,
  classificationMaxChars: 8_000,
  requestTimeoutMs: 20_000,
})

type EnvironmentReader = (name: string) => string | undefined

export function loadAiConfig(readEnvironment: EnvironmentReader): AiConfig & { apiKey: string | null } {
  const enabledValue = readEnvironment('AI_ENABLED')
  return {
    ...AI_CONFIG,
    enabled: enabledValue == null ? AI_CONFIG.enabled : enabledValue === 'true',
    apiKey: readEnvironment('GEMINI_API_KEY') || null,
  }
}
