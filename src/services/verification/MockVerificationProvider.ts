import {
  VerificationProvider,
  CreateSessionParams,
  CreateSessionResult,
  VerificationSessionResult,
  WebhookResult,
  VerificationStatus,
} from './types'

/**
 * Mock Verification Provider for Development, Testing, and Staging.
 *
 * SAFETY INVARIANT:
 * The development/mock provider MUST NOT create a verified blue badge in production mode.
 */
export class MockVerificationProvider implements VerificationProvider {
  public readonly name = 'mock'

  private isProduction(): boolean {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      return true
    }
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
        return true
      }
    } catch {
      // fallback
    }
    return false
  }

  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    const sessionId = `mock_sess_${params.userId.slice(0, 8)}_${Date.now()}`
    const providerReference = `mock_ref_${Date.now()}`

    return {
      sessionId,
      provider: this.name,
      providerReference,
      clientSecret: `mock_secret_${Date.now()}`,
      url: `https://verify.authenticcommunity.dev/session/${providerReference}`,
      status: 'pending',
    }
  }

  async getSession(providerReference: string): Promise<VerificationSessionResult> {
    if (this.isProduction()) {
      return {
        providerReference,
        status: 'failed',
        identityVerified: false,
        livenessVerified: false,
        faceMatchVerified: false,
        failureCode: 'provider_unavailable',
        failureReason: 'Mock verification provider is disabled in production environments.',
      }
    }

    return {
      providerReference,
      status: 'verified',
      identityVerified: true,
      livenessVerified: true,
      faceMatchVerified: true,
      verifiedAt: new Date().toISOString(),
    }
  }

  async handleWebhook(
    payload: any,
    _signature?: string,
    _rawBody?: string
  ): Promise<WebhookResult> {
    if (this.isProduction()) {
      return {
        handled: false,
        providerReference: payload?.providerReference || 'unknown',
        status: 'failed',
        identityVerified: false,
        livenessVerified: false,
        faceMatchVerified: false,
        failureCode: 'provider_unavailable',
        failureReason: 'Mock webhook execution rejected in production mode.',
      }
    }

    const outcome = payload?.outcome || 'verified'
    const providerReference = payload?.providerReference || `mock_ref_${Date.now()}`
    const userId = payload?.userId

    if (outcome === 'failed_liveness') {
      return {
        handled: true,
        userId,
        providerReference,
        status: 'failed',
        identityVerified: true,
        livenessVerified: false,
        faceMatchVerified: false,
        failureCode: 'failed_liveness',
        failureReason: 'Liveness check was not completed successfully. Please ensure good lighting.',
      }
    }

    if (outcome === 'failed_face_match') {
      return {
        handled: true,
        userId,
        providerReference,
        status: 'failed',
        identityVerified: true,
        livenessVerified: true,
        faceMatchVerified: false,
        failureCode: 'failed_face_match',
        failureReason: 'Face does not match the photo on the identity document.',
      }
    }

    if (outcome === 'unclear_document') {
      return {
        handled: true,
        userId,
        providerReference,
        status: 'requires_action',
        identityVerified: false,
        livenessVerified: false,
        faceMatchVerified: false,
        failureCode: 'unclear_document',
        failureReason: 'Document image was blurry or obstructed. Please upload a clear photo.',
      }
    }

    if (outcome === 'manual_review') {
      return {
        handled: true,
        userId,
        providerReference,
        status: 'manual_review',
        identityVerified: false,
        livenessVerified: true,
        faceMatchVerified: false,
        failureCode: 'manual_review_required',
        failureReason: 'Verification requires manual specialist review.',
      }
    }

    return {
      handled: true,
      userId,
      providerReference,
      status: 'verified',
      identityVerified: true,
      livenessVerified: true,
      faceMatchVerified: true,
      verifiedAt: new Date().toISOString(),
    }
  }
}
