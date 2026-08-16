import { Heart, UsersRound } from 'lucide-react'
export function Brand({ compact=false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 text-white shadow-sm"><UsersRound className="h-6 w-6"/><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-coral ring-2 ring-white"/></div>
    {!compact && <div><div className="text-base font-extrabold leading-tight text-brand-ink">Authentic Community</div><div className="flex items-center gap-1 text-xs font-medium text-brand-500">Find your people <Heart className="h-3 w-3 fill-brand-coral text-brand-coral"/></div></div>}
  </div>
}
