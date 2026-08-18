import { VerificationProvider } from './types'
import { MockVerificationProvider } from './MockVerificationProvider'
import { StripeIdentityVerificationProvider } from './StripeIdentityVerificationProvider'

export class VerificationProviderFactory {
  private static providers: Map<string, VerificationProvider> = new Map()

  static {
    this.register(new MockVerificationProvider())
    this.register(new StripeIdentityVerificationProvider())
  }

  public static register(provider: VerificationProvider): void {
    this.providers.set(provider.name, provider)
  }

  public static getProvider(name?: string): VerificationProvider {
    const defaultName = name || 'mock'
    const provider = this.providers.get(defaultName)

    if (!provider) {
      throw new Error(
        `Verification provider "${defaultName}" is not registered. Available: ${Array.from(
          this.providers.keys()
        ).join(', ')}`
      )
    }

    return provider
  }
}
