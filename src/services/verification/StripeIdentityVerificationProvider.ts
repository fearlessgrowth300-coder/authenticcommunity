import {
  VerificationProvider,
  CreateSessionParams,
  CreateSessionResult,
  VerificationSessionResult,
  WebhookResult,
} from './types'

/**
 * Stripe Identity Verification Provider Integration
 */
export class StripeIdentityVerificationProvider implements VerificationProvider {
  public readonly name = 'stripe_identity'
  private apiKey: string | undefined
  private webhookSecret: string | undefined

  constructor(apiKey?: string, webhookSecret?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env?.STRIPE_SECRET_KEY : undefined)
    this.webhookSecret =
      webhookSecret || (typeof process !== 'undefined' ? process.env?.STRIPE_WEBHOOK_SECRET : undefined)
  }

  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    if (!this.apiKey) {
      throw new Error(
        'Stripe API key (STRIPE_SECRET_KEY) is not configured in backend environment.'
      )
    }

    // In a real Stripe environment, calls https://api.stripe.com/v1/identity/verification_sessions
    // with type: 'document', options: { document: { require_matching_selfie: true } }
    const providerReference = `vs_${Date.now()}`
    return {
      sessionId: `stripe_sess_${Date.now()}`,
      provider: this.name,
      providerReference,
      clientSecret: `vs_secret_${Date.now()}`,
      url: `https://verify.stripe.com/${providerReference}`,
      status: 'pending',
    }
  }

  async getSession(providerReference: string): Promise<VerificationSessionResult> {
    if (!this.apiKey) {
      throw new Error('Stripe API key is not configured.')
    }

    return {
      providerReference,
      status: 'pending',
      identityVerified: false,
      livenessVerified: false,
      faceMatchVerified: false,
    }
  }

  async handleWebhook(payload: any, signature?: string, _rawBody?: string): Promise<WebhookResult> {
    if (this.webhookSecret && !signature) {
      throw new Error('Missing Stripe webhook signature header (stripe-signature).')
    }

    const event = payload
    const session = event?.data?.object
    const providerReference = session?.id || 'unknown'
    const status = session?.status

    if (status === 'verified') {
      return {
        handled: true,
        userId: session?.metadata?.userId,
        providerReference,
        status: 'verified',
        identityVerified: true,
        livenessVerified: true,
        faceMatchVerified: true,
        verifiedAt: new Date().toISOString(),
      }
    }

    if (status === 'requires_input') {
      const unverifiedReason = session?.last_error?.code || 'unclear_document'
      return {
        handled: true,
        userId: session?.metadata?.userId,
        providerReference,
        status: 'requires_action',
        identityVerified: false,
        livenessVerified: false,
        faceMatchVerified: false,
        failureCode: 'unclear_document',
        failureReason: session?.last_error?.reason || 'Please provide a clearer ID document photo.',
      }
    }

    if (status === 'canceled') {
      return {
        handled: true,
        userId: session?.metadata?.userId,
        providerReference,
        status: 'failed',
        identityVerified: false,
        livenessVerified: false,
        faceMatchVerified: false,
        failureCode: 'unknown_error',
        failureReason: 'Verification session was canceled.',
      }
    }

    return {
      handled: true,
      userId: session?.metadata?.userId,
      providerReference,
      status: 'pending',
      identityVerified: false,
      livenessVerified: false,
      faceMatchVerified: false,
    }
  }
}
