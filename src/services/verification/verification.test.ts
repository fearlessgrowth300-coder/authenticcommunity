import { describe, it, expect, beforeEach } from 'vitest'
import { VerificationProviderFactory } from './ProviderFactory'
import { MockVerificationProvider } from './MockVerificationProvider'
import { StripeIdentityVerificationProvider } from './StripeIdentityVerificationProvider'

describe('Identity Verification Provider Architecture', () => {
  beforeEach(() => {
    // Ensure default providers are registered
    VerificationProviderFactory.register(new MockVerificationProvider())
    VerificationProviderFactory.register(new StripeIdentityVerificationProvider('test_key', 'test_secret'))
  })

  it('resolves the default mock provider correctly', () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    expect(provider.name).toBe('mock')
  })

  it('resolves the Stripe Identity provider correctly', () => {
    const provider = VerificationProviderFactory.getProvider('stripe_identity')
    expect(provider.name).toBe('stripe_identity')
  })

  it('creates a pending verification session with mock provider', async () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    const result = await provider.createSession({
      userId: 'user-1234-uuid',
      userEmail: 'user@example.com',
      documentCountry: 'US',
      documentType: 'drivers_license',
    })

    expect(result.provider).toBe('mock')
    expect(result.status).toBe('pending')
    expect(result.providerReference).toBeDefined()
    expect(result.clientSecret).toBeDefined()
    expect(result.url).toContain(result.providerReference)
  })

  it('processes verified outcome in development mode', async () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    const webhookResult = await provider.handleWebhook({
      userId: 'user-1234-uuid',
      outcome: 'verified',
      providerReference: 'ref_123',
    })

    expect(webhookResult.handled).toBe(true)
    expect(webhookResult.status).toBe('verified')
    expect(webhookResult.identityVerified).toBe(true)
    expect(webhookResult.livenessVerified).toBe(true)
    expect(webhookResult.faceMatchVerified).toBe(true)
    expect(webhookResult.verifiedAt).toBeDefined()
  })

  it('handles failed liveness check outcome cleanly', async () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    const webhookResult = await provider.handleWebhook({
      userId: 'user-1234-uuid',
      outcome: 'failed_liveness',
      providerReference: 'ref_123',
    })

    expect(webhookResult.handled).toBe(true)
    expect(webhookResult.status).toBe('failed')
    expect(webhookResult.livenessVerified).toBe(false)
    expect(webhookResult.failureCode).toBe('failed_liveness')
    expect(webhookResult.failureReason).toContain('Liveness')
  })

  it('handles failed face match outcome cleanly', async () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    const webhookResult = await provider.handleWebhook({
      userId: 'user-1234-uuid',
      outcome: 'failed_face_match',
      providerReference: 'ref_123',
    })

    expect(webhookResult.handled).toBe(true)
    expect(webhookResult.status).toBe('failed')
    expect(webhookResult.faceMatchVerified).toBe(false)
    expect(webhookResult.failureCode).toBe('failed_face_match')
  })

  it('handles unclear document requiring user action', async () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    const webhookResult = await provider.handleWebhook({
      userId: 'user-1234-uuid',
      outcome: 'unclear_document',
      providerReference: 'ref_123',
    })

    expect(webhookResult.handled).toBe(true)
    expect(webhookResult.status).toBe('requires_action')
    expect(webhookResult.failureCode).toBe('unclear_document')
  })

  it('handles manual review queue outcome', async () => {
    const provider = VerificationProviderFactory.getProvider('mock')
    const webhookResult = await provider.handleWebhook({
      userId: 'user-1234-uuid',
      outcome: 'manual_review',
      providerReference: 'ref_123',
    })

    expect(webhookResult.handled).toBe(true)
    expect(webhookResult.status).toBe('manual_review')
    expect(webhookResult.failureCode).toBe('manual_review_required')
  })

  it('Stripe provider validates webhook structure', async () => {
    const provider = VerificationProviderFactory.getProvider('stripe_identity')
    const webhookResult = await provider.handleWebhook(
      {
        data: {
          object: {
            id: 'vs_stripe_123',
            status: 'verified',
            metadata: { userId: 'user-5678' },
          },
        },
      },
      'test_signature_valid'
    )

    expect(webhookResult.handled).toBe(true)
    expect(webhookResult.status).toBe('verified')
    expect(webhookResult.identityVerified).toBe(true)
    expect(webhookResult.userId).toBe('user-5678')
  })

  it('Stripe provider throws error if signature header is missing when secret is configured', async () => {
    const provider = new StripeIdentityVerificationProvider('test_key', 'test_secret')
    await expect(
      provider.handleWebhook({ data: { object: { id: 'vs_123', status: 'verified' } } })
    ).rejects.toThrow('Missing Stripe webhook signature')
  })
})
