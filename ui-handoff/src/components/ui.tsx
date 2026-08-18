import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50'
  const styles = {
    primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
    secondary: 'border border-brand-500 bg-white text-brand-600 hover:bg-brand-50',
    ghost: 'text-brand-600 hover:bg-brand-50',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-brand-line bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Chip({
  children,
  tone = 'indigo',
  active = false,
  onClick,
  className = '',
}: {
  children: ReactNode
  tone?: 'indigo' | 'green' | 'coral' | 'amber' | 'gray'
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  const map = {
    indigo: active
      ? 'bg-brand-500 text-white border-brand-500'
      : 'bg-brand-50 text-brand-600 border-indigo-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    coral: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-slate-50 text-slate-600 border-slate-200',
  }
  const style = `inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
    map[tone]
  } ${onClick ? 'cursor-pointer hover:brightness-95 active:scale-[.98]' : ''} ${className}`
  return onClick ? (
    <button type="button" onClick={onClick} className={style}>
      {children}
    </button>
  ) : (
    <span className={style}>{children}</span>
  )
}

export function Avatar({
  src,
  name,
  size = 'md',
  online = false,
}: {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
}) {
  const sizeClass = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  }[size]
  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClass} overflow-hidden rounded-full bg-brand-50 ring-2 ring-white shadow-sm`}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center font-bold text-brand-600">
            {name.slice(0, 1)}
          </div>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  )
}

/**
 * Blue Identity Verified Badge with informational modal on click/tap
 */
export function Verified({
  label = 'Identity Verified',
  interactive = true,
}: {
  label?: string
  interactive?: boolean
}) {
  const [open, setOpen] = useState(false)

  const badge = (
    <span
      title={label}
      onClick={
        interactive
          ? e => {
              e.stopPropagation()
              setOpen(true)
            }
          : undefined
      }
      className={`inline-flex items-center text-blue-500 ${
        interactive ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''
      }`}
    >
      <CheckCircle2 className="h-4 w-4 fill-blue-500 text-white drop-shadow-sm" />
    </span>
  )

  if (!interactive) return badge

  return (
    <>
      {badge}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 shadow-2xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 mb-2">
            <CheckCircle2 className="h-9 w-9 fill-blue-500 text-white" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-extrabold text-brand-ink text-center">
              Identity Verified
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p className="font-medium text-brand-ink">
              This member completed identity verification.
            </p>
            <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-500 leading-relaxed text-left border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">Safety Notice:</span>
              Identity verification confirms government-issued ID and facial liveness consistency with an authorized verification provider. It does not endorse the member or guarantee safety in every situation. Always exercise good personal judgment when meeting new people.
            </div>
            <p className="text-xs text-brand-muted">
              Identity verification is separate from Premium membership.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition"
          >
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      {action}
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-brand-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-brand-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50'
