import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

export function Button({ children, variant='primary', className='', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'danger' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50'
  const styles = {
    primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
    secondary: 'border border-brand-500 bg-white text-brand-600 hover:bg-brand-50',
    ghost: 'text-brand-600 hover:bg-brand-50',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100'
  }
  return <button className={`${base} ${styles[variant]} ${className}`} {...props}>{children}</button>
}

export function Card({ children, className='' }: { children: ReactNode, className?: string }) {
  return <div className={`rounded-2xl border border-brand-line bg-white shadow-sm ${className}`}>{children}</div>
}

export function Chip({ children, tone='indigo', active=false }: { children: ReactNode, tone?: 'indigo'|'green'|'coral'|'amber'|'gray', active?: boolean }) {
  const map = {
    indigo: active ? 'bg-brand-500 text-white border-brand-500' : 'bg-brand-50 text-brand-600 border-indigo-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    coral: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-slate-50 text-slate-600 border-slate-200'
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${map[tone]}`}>{children}</span>
}

export function Avatar({ src, name, size='md', online=false }: { src?: string, name: string, size?: 'sm'|'md'|'lg'|'xl', online?: boolean }) {
  const sizeClass = { sm:'h-9 w-9', md:'h-11 w-11', lg:'h-16 w-16', xl:'h-24 w-24' }[size]
  return <div className="relative shrink-0"><div className={`${sizeClass} overflow-hidden rounded-full bg-brand-50 ring-2 ring-white shadow-sm`}>{src ? <img src={src} alt={name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center font-bold text-brand-600">{name.slice(0,1)}</div>}</div>{online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"/>}</div>
}

export function Verified({ label='Verified' }: { label?: string }) { return <span title={label} className="inline-flex text-brand-500"><CheckCircle2 className="h-4 w-4 fill-brand-500 text-white"/></span> }

export function SectionHeader({ title, action }: { title: string, action?: ReactNode }) { return <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-brand-ink">{title}</h2>{action}</div> }

export function Field({ label, children, hint }: { label: string, children: ReactNode, hint?: string }) { return <label className="block space-y-1.5"><span className="text-sm font-semibold text-brand-ink">{label}</span>{children}{hint && <span className="block text-xs text-brand-muted">{hint}</span>}</label> }

export const inputClass = 'w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-50'
