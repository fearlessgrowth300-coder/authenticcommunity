export type StructuredGenerationRequest = {
  task: string
  systemInstruction: string
  input: string
  maxOutputTokens?: number
  temperature?: number
}

export type StructuredGenerationResult = {
  value: unknown
  inputUnits: number
  outputUnits: number
  model: string
}

export type EmbeddingResult = {
  values: number[]
  inputUnits: number
  model: string
}

export interface AiProvider {
  readonly name: string
  readonly generativeModel: string
  readonly embeddingModel: string
  generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult>
  embed(text: string, taskType?: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY'): Promise<EmbeddingResult>
}

