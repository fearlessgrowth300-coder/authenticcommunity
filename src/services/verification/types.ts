/**
 * Production Identity Verification Provider Types & Interface
 */

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'requires_action'
  | 'manual_review'
  | 'verified'
  | 'failed'
  | 'expired'
  | 'revoked'

export type DocumentType =
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'residence_permit'

export type VerificationFailureCode =
  | 'unclear_document'
  | 'expired_document'
  | 'unsupported_document'
  | 'failed_liveness'
  | 'failed_face_match'
  | 'name_mismatch'
  | 'underage'
  | 'provider_unavailable'
  | 'manual_review_required'
  | 'unknown_error'

export interface CreateSessionParams {
  userId: string
  userEmail?: string
  documentCountry: string
  documentType: DocumentType
  returnUrl?: string
  metadata?: Record<string, any>
}

export interface CreateSessionResult {
  sessionId: string
  provider: string
  providerReference: string
  clientSecret?: string
  url?: string
  status: VerificationStatus
}

export interface VerificationSessionResult {
  providerReference: string
  status: VerificationStatus
  identityVerified: boolean
  livenessVerified: boolean
  faceMatchVerified: boolean
  failureCode?: VerificationFailureCode
  failureReason?: string
  documentCountry?: string
  documentType?: DocumentType
  verifiedAt?: string
  expiresAt?: string
  rawDetails?: Record<string, any>
}

export interface WebhookResult {
  handled: boolean
  userId?: string
  providerReference: string
  status: VerificationStatus
  identityVerified: boolean
  livenessVerified: boolean
  faceMatchVerified: boolean
  failureCode?: VerificationFailureCode
  failureReason?: string
  verifiedAt?: string
}

export interface VerificationProvider {
  readonly name: string
  createSession(params: CreateSessionParams): Promise<CreateSessionResult>
  getSession(providerReference: string): Promise<VerificationSessionResult>
  handleWebhook(payload: any, signature?: string, rawBody?: string): Promise<WebhookResult>
}
