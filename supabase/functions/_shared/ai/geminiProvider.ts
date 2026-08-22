import { AI_CONFIG, type AiConfig } from './config.ts'
import { AiError } from './errors.ts'
import type { AiProvider, EmbeddingResult, StructuredGenerationRequest, StructuredGenerationResult } from './provider.ts'

type Fetcher = typeof fetch

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini'
  readonly generativeModel: string
  readonly embeddingModel: string

  constructor(
    private readonly apiKey: string,
    private readonly config: AiConfig = AI_CONFIG,
    private readonly fetcher: Fetcher = fetch,
  ) {
    if (!apiKey) throw new AiError('AI_NOT_CONFIGURED', 'Gemini API key is missing.')
    this.generativeModel = config.generativeModel
    this.embeddingModel = config.embeddingModel
  }

  async generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.generativeModel}:generateContent`
    const response = await this.requestWithRetry(endpoint, {
      systemInstruction: { parts: [{ text: request.systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: request.input }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: request.temperature ?? 0.1,
        maxOutputTokens: request.maxOutputTokens ?? 1_200,
      },
    })
    const body = await response.json()
    const text = body.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
    if (!text) throw new AiError('AI_INVALID_RESPONSE', 'Gemini returned no structured content.')
    try {
      return {
        value: JSON.parse(text),
        inputUnits: Number(body.usageMetadata?.promptTokenCount || 0),
        outputUnits: Number(body.usageMetadata?.candidatesTokenCount || 0),
        model: this.generativeModel,
      }
    } catch {
      throw new AiError('AI_INVALID_RESPONSE', 'Gemini returned malformed JSON.')
    }
  }

  async embed(
    text: string,
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY' = 'RETRIEVAL_DOCUMENT',
  ): Promise<EmbeddingResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent`
    const response = await this.requestWithRetry(endpoint, {
      model: `models/${this.embeddingModel}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: this.config.embeddingDimension,
    })
    const body = await response.json()
    const values = body.embedding?.values
    if (!Array.isArray(values) || values.length !== this.config.embeddingDimension || values.some((v: unknown) => typeof v !== 'number')) {
      throw new AiError('AI_INVALID_RESPONSE', 'Gemini returned an invalid embedding.')
    }
    return {
      values,
      inputUnits: Number(body.usageMetadata?.promptTokenCount || 0),
      model: this.embeddingModel,
    }
  }

  private async requestWithRetry(endpoint: string, body: unknown): Promise<Response> {
    let lastError: unknown
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs)
      try {
        const response = await this.fetcher(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
        if (response.ok) return response
        if (response.status === 429) {
          lastError = new AiError('AI_RATE_LIMITED', 'Gemini rate limit reached.', true)
        } else if (response.status >= 500) {
          lastError = new AiError('AI_PROVIDER_ERROR', 'Gemini service unavailable.', true)
        } else {
          throw new AiError('AI_PROVIDER_ERROR', `Gemini request rejected (${response.status}).`)
        }
      } catch (error) {
        if (error instanceof AiError && !error.retryable) throw error
        lastError = error instanceof DOMException && error.name === 'AbortError'
          ? new AiError('AI_TIMEOUT', 'Gemini request timed out.', true)
          : error
      } finally {
        clearTimeout(timeout)
      }
      if (attempt < this.config.maxRetries) await new Promise((resolve) => setTimeout(resolve, 200 * (2 ** attempt)))
    }
    if (lastError instanceof AiError) throw lastError
    throw new AiError('AI_PROVIDER_ERROR', 'Gemini request failed.', true)
  }
}

