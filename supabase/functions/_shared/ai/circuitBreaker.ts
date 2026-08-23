import { AiError } from './errors.ts'

export class AiCircuitBreaker {
  private consecutiveFailures = 0
  private openUntil = 0

  constructor(
    private readonly failureThreshold = 5,
    private readonly cooldownMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  assertCanRequest() {
    if (this.openUntil === 0) return
    if (this.now() >= this.openUntil) {
      this.openUntil = 0
      this.consecutiveFailures = 0
      return
    }
    throw new AiError('AI_PROVIDER_ERROR', 'AI provider circuit is temporarily open.', true)
  }

  recordSuccess() {
    this.consecutiveFailures = 0
    this.openUntil = 0
  }

  recordFailure() {
    this.consecutiveFailures += 1
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.openUntil = this.now() + this.cooldownMs
    }
  }

  get state() {
    return this.openUntil > this.now() ? 'open' : 'closed'
  }
}

export const geminiCircuitBreaker = new AiCircuitBreaker()
