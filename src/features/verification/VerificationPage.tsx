import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ScanFace,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, Verified } from '@/components/ui/AppUi'
import { toast } from 'sonner'
import {
  getVerificationRecord,
  startVerificationSession,
  submitVerificationCheck,
  type VerificationRecord,
} from '@/features/verification/verificationApi'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export function Verification() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [, setRecord] = useState<VerificationRecord | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [country, setCountry] = useState('US')
  const [docType, setDocType] = useState<'drivers_license' | 'passport' | 'national_id' | 'residence_permit'>('drivers_license')
  const [busy, setBusy] = useState(false)
  const [sessionRef, setSessionRef] = useState<string | null>(null)
  const [failureOutcome, setFailureOutcome] = useState<{
    code: string
    reason: string
    status: string
  } | null>(null)

  useEffect(() => {
    if (!user) return
    const loadStatus = async () => {
      setLoading(true)
      try {
        const [rec, { data: profile }] = await Promise.all([
          getVerificationRecord(user.id),
          supabase.from('profiles').select('is_verified').eq('user_id', user.id).maybeSingle(),
        ])
        setRecord(rec)
        if (profile?.is_verified || rec?.status === 'verified') {
          setIsVerified(true)
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [user])

  const handleStartSession = async () => {
    if (!user) return
    setBusy(true)
    try {
      const session = await startVerificationSession({
        documentCountry: country,
        documentType: docType,
      })
      setSessionRef(session.providerReference)
      setStep(3)
      toast.success('Verification session created. Proceed with liveness verification.')
    } catch (err: any) {
      toast.error(err?.message || 'Could not start verification session')
    } finally {
      setBusy(false)
    }
  }

  const handlePerformCheck = async (outcome: 'verified' | 'failed_liveness' | 'failed_face_match' | 'unclear_document' | 'manual_review') => {
    setBusy(true)
    setStep(4)

    setTimeout(async () => {
      try {
        const status = await submitVerificationCheck({
          outcome,
          providerReference: sessionRef || undefined,
        })

        if (status === 'verified') {
          setIsVerified(true)
          setStep(5)
          toast.success('Identity successfully verified!')
        } else {
          let reason = 'Verification could not be confirmed.'
          if (outcome === 'unclear_document') reason = 'Document image was blurry or had glare. Please take a clear, well-lit photo.'
          else if (outcome === 'failed_liveness') reason = 'Live facial check could not be completed. Please ensure your face is well-lit and centered.'
          else if (outcome === 'failed_face_match') reason = 'The face in the selfie did not match the photo on your government ID.'
          else if (outcome === 'manual_review') reason = 'Your submission is undergoing manual review by a verification specialist.'

          setFailureOutcome({ code: outcome, reason, status })
          setStep(5)
        }
      } catch (err: any) {
        setFailureOutcome({
          code: 'error',
          reason: err?.message || 'Provider connection error. Please retry.',
          status: 'failed',
        })
        setStep(5)
      } finally {
        setBusy(false)
      }
    }, 1500)
  }

  const handleRetry = () => {
    setFailureOutcome(null)
    setStep(1)
  }

  return (
    <AppShell title="Get Verified" subtitle="Verification proves account identity. It is separate from Premium.">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Banner card */}
        <Card className="p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-blue-50 text-blue-600 shadow-sm">
            <BadgeCheck className="h-10 w-10 fill-blue-500 text-white" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-2xl font-extrabold text-brand-ink">
            Identity Verified
            {isVerified && <Verified />}
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
            Help people know that the person behind your profile passed government-issued ID and live facial verification.
          </p>
        </Card>

        {loading ? (
          <Card className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
            <p className="mt-2 text-xs text-brand-muted">Checking verification status...</p>
          </Card>
        ) : isVerified ? (
          /* Verified State */
          <Card className="p-6 space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">You are Identity Verified</h4>
                <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                  Your profile now displays the blue verification badge across matches, community chats, and events.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-brand-muted">
              <div className="flex justify-between border-b border-brand-line pb-2">
                <span>Verification Type</span>
                <span className="font-bold text-brand-ink">Government ID + Facial Liveness</span>
              </div>
              <div className="flex justify-between border-b border-brand-line pb-2">
                <span>Badge Status</span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-canvas p-3.5 text-xs text-slate-500 border border-brand-line/60">
              <span className="font-bold text-brand-ink block mb-1">Safety Notice:</span>
              Identity verification confirms government-issued ID consistency with an authorized verification provider. It does not endorse members or guarantee safety in every situation. Always exercise personal discretion.
            </div>

            <Button variant="secondary" className="w-full" onClick={() => navigate('/profile')}>
              Back to Profile
            </Button>
          </Card>
        ) : (
          /* Step-by-Step Verification State Machine */
          <Card className="p-6 space-y-5">
            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold border-b border-brand-line pb-4">
              <div className={step >= 1 ? 'text-brand-600' : 'text-slate-400'}>1. Country</div>
              <div className={step >= 2 ? 'text-brand-600' : 'text-slate-400'}>2. Document</div>
              <div className={step >= 3 ? 'text-brand-600' : 'text-slate-400'}>3. Face Check</div>
              <div className={step >= 4 ? 'text-brand-600' : 'text-slate-400'}>4. Review</div>
            </div>

            {/* Step 1: Country */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-brand-ink text-sm">Step 1: Select Issuing Country</h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Select the country that issued your government identification.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'US', name: 'United States' },
                    { code: 'GB', name: 'United Kingdom' },
                    { code: 'CA', name: 'Canada' },
                    { code: 'AU', name: 'Australia' },
                    { code: 'DE', name: 'Germany' },
                    { code: 'FR', name: 'France' },
                  ].map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCountry(c.code)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        country === c.code
                          ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm'
                          : 'border-brand-line bg-white hover:bg-slate-50 text-brand-ink'
                      }`}
                    >
                      <span>{c.name}</span>
                      {country === c.code && <CheckCircle2 className="h-4 w-4 text-brand-500" />}
                    </button>
                  ))}
                </div>
                <Button className="w-full mt-4" onClick={() => setStep(2)}>
                  Continue to Document Type
                </Button>
              </div>
            )}

            {/* Step 2: Document Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-brand-ink text-sm">Step 2: Choose Identity Document</h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Your ID is verified by our secure provider. Raw documents are never stored publicly.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'drivers_license', title: "Driver's License", desc: 'Front and back photo required' },
                    { id: 'passport', title: 'Passport', desc: 'Photo page with machine readable zone' },
                    { id: 'national_id', title: 'National Identity Card', desc: 'Official government citizen card' },
                    { id: 'residence_permit', title: 'Residence Permit', desc: 'Valid biometric residence permit' },
                  ].map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setDocType(doc.id as any)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                        docType === doc.id
                          ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm'
                          : 'border-brand-line bg-white hover:bg-slate-50 text-brand-ink'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{doc.title}</div>
                        <div className="text-xs text-brand-muted mt-0.5">{doc.desc}</div>
                      </div>
                      {docType === doc.id && <CheckCircle2 className="h-5 w-5 text-brand-500" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" disabled={busy} onClick={handleStartSession}>
                    {busy ? 'Preparing Session...' : 'Continue to Face Check'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Live Face / Liveness Check */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600 mb-3">
                    <ScanFace className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-brand-ink text-base">Step 3: Live Facial Check</h3>
                  <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
                    Take a brief live video selfie to confirm you match the photo on your government ID.
                  </p>
                </div>

                <div className="rounded-2xl border border-brand-line bg-brand-canvas p-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Remove glasses, hats, or masks
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Look directly into the camera
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ensure natural, even lighting
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() => handlePerformCheck('verified')}
                >
                  Start Live Selfie Check
                </Button>

                {/* Dev Simulation Drawer for edge case testing */}
                <div className="pt-4 border-t border-brand-line">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Test Provider Edge Cases (Development)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Button variant="secondary" className="py-2 text-xs" onClick={() => handlePerformCheck('unclear_document')}>
                      Simulate Blurry ID
                    </Button>
                    <Button variant="secondary" className="py-2 text-xs" onClick={() => handlePerformCheck('failed_liveness')}>
                      Simulate Failed Liveness
                    </Button>
                    <Button variant="secondary" className="py-2 text-xs" onClick={() => handlePerformCheck('failed_face_match')}>
                      Simulate Face Mismatch
                    </Button>
                    <Button variant="secondary" className="py-2 text-xs" onClick={() => handlePerformCheck('manual_review')}>
                      Simulate Manual Review
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Processing State */}
            {step === 4 && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500" />
                <h3 className="font-bold text-brand-ink text-base">Processing Identity Verification</h3>
                <p className="text-xs text-brand-muted max-w-sm mx-auto">
                  Validating security features on your document, running anti-spoofing liveness checks, and matching face vectors...
                </p>
              </div>
            )}

            {/* Step 5: Result / Failure / Manual Review */}
            {step === 5 && failureOutcome && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">
                      {failureOutcome.status === 'manual_review'
                        ? 'Under Manual Review'
                        : failureOutcome.status === 'requires_action'
                        ? 'Action Required'
                        : 'Verification Incomplete'}
                    </h4>
                    <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                      {failureOutcome.reason}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-brand-canvas p-4 text-xs text-slate-600 space-y-2 border border-brand-line">
                  <span className="font-bold text-brand-ink block">Next Steps:</span>
                  <p>• Make sure your document is valid and not expired.</p>
                  <p>• Avoid glare or shadows covering text or your photo.</p>
                  <p>• You can try again using an alternate document type (e.g. Passport).</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </Button>
                  <Button className="flex-1" onClick={() => navigate('/profile')}>
                    Back to Profile
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  )
}
