import { Bell, CalendarDays, Compass, Home, MessageCircle, Plus, Search, Settings, UserRound, UsersRound } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Brand } from './Brand'

const nav = [
  { to:'/home', label:'Home', icon:Home },
  { to:'/discover', label:'Discover', icon:Compass },
  { to:'/events', label:'Events', icon:CalendarDays },
  { to:'/messages', label:'Messages', icon:MessageCircle },
  { to:'/profile', label:'Profile', icon:UserRound },
]

export function AppShell({ children, title, subtitle, action }: { children: ReactNode, title?: string, subtitle?: string, action?: ReactNode }) {
  const navigate = useNavigate()
  return <div className="min-h-screen bg-brand-canvas">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-brand-line bg-white p-5 lg:block">
      <Brand/>
      <nav className="mt-8 space-y-1">
        {nav.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-600':'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-5 w-5"/>{label}</NavLink>)}
      </nav>
      <div className="my-5 border-t border-brand-line"/>
      <NavLink to="/communities" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><UsersRound className="h-5 w-5"/>Communities</NavLink>
      <NavLink to="/notifications" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Bell className="h-5 w-5"/>Notifications</NavLink>
      <NavLink to="/settings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings className="h-5 w-5"/>Settings</NavLink>
      <button onClick={()=>navigate('/create')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"><Plus className="h-4 w-4"/>Create</button>
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 border-b border-brand-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="lg:hidden"><Brand compact/></div>
          <div className="min-w-0 flex-1">
            {title && <h1 className="truncate text-lg font-extrabold text-brand-ink sm:text-xl">{title}</h1>}
            {subtitle && <p className="hidden text-xs text-brand-muted sm:block">{subtitle}</p>}
          </div>
          <button className="hidden items-center gap-2 rounded-xl border border-brand-line bg-white px-3 py-2 text-sm text-brand-muted md:flex"><Search className="h-4 w-4"/>Search</button>
          {action}
          <button onClick={()=>navigate('/notifications')} className="relative grid h-10 w-10 place-items-center rounded-xl border border-brand-line bg-white"><Bell className="h-5 w-5"/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-coral"/></button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 pb-28 sm:px-6 lg:pb-8">{children}</main>
    </div>

    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-brand-line bg-white/95 px-2 pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {nav.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} className={({isActive})=>`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold ${isActive?'text-brand-500':'text-slate-500'}`}><Icon className="h-5 w-5"/>{label}</NavLink>)}
      </div>
    </nav>
  </div>
}
