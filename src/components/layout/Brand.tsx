import { Sparkles } from 'lucide-react'

export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-soft">
        <Sparkles className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-soft">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <div className="text-base font-extrabold tracking-tight text-brand-ink">
          Authentic
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
          Community
        </div>
      </div>
    </div>
  )
}
