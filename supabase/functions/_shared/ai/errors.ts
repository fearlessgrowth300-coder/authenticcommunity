export type AiErrorCode =
  | 'AI_DISABLED'
  | 'AI_NOT_CONFIGURED'
  | 'AI_TIMEOUT'
  | 'AI_RATE_LIMITED'
  | 'AI_PROVIDER_ERROR'
  | 'AI_INVALID_RESPONSE'
  | 'AI_UNSAFE_INPUT'

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message)
    this.name = 'AiError'
  }
}

export function publicAiErrorMessage(error: unknown): string {
  if (!(error instanceof AiError)) return 'AI assistance is temporarily unavailable.'
  if (error.code === 'AI_NOT_CONFIGURED') return 'AI assistance has not been configured.'
  if (error.code === 'AI_RATE_LIMITED') return 'AI assistance is busy. Please try again later.'
  return 'AI assistance is temporarily unavailable.'
}

