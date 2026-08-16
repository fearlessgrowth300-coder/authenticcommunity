import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, Mail, MapPin, Eye, ArrowRight } from 'lucide-react'
import { Brand } from '../components/Brand'
import { Button, Field, inputClass } from '../components/ui'

export function Splash() {
  const navigate = useNavigate()
  return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-400 px-6 text-white">
    <button onClick={()=>navigate('/login')} className="text-center">
      <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[2rem] bg-white/15 shadow-2xl backdrop-blur"><Brand compact/></div>
      <h1 className="text-4xl font-extrabold tracking-tight">Authentic Community Connection</h1>
      <p className="mt-3 text-lg text-white/80">Find your people. Build something real.</p>
      <p className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">Tap to continue <ArrowRight className="h-4 w-4"/></p>
    </button>
  </div>
}

function AuthFrame({children, quote}:{children:ReactNode, quote:string}) {
  return <div className="min-h-screen bg-brand-canvas lg:grid lg:grid-cols-2">
    <div className="hidden min-h-screen flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-400 p-12 text-white lg:flex">
      <Brand/>
      <div className="max-w-lg"><p className="text-4xl font-extrabold leading-tight">“{quote}”</p><p className="mt-5 text-white/75">Built for meaningful friendships, trusted communities and local experiences.</p></div>
      <p className="text-sm text-white/60">Authentic Community Connection</p>
    </div>
    <div className="flex min-h-screen items-center justify-center p-5 sm:p-8">{children}</div>
  </div>
}

export function Login() {
 const navigate=useNavigate()
 return <AuthFrame quote="The internet can introduce us. Real life can make us friends.">
   <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
    <div className="mb-8 lg:hidden"><Brand/></div>
    <h1 className="text-3xl font-extrabold text-brand-ink">Welcome back 👋</h1><p className="mt-2 text-sm text-brand-muted">Reconnect with your people.</p>
    <div className="mt-7 space-y-4"><Field label="Email"><div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/><input className={`${inputClass} pl-10`} placeholder="you@example.com"/></div></Field><Field label="Password"><div className="relative"><input type="password" className={`${inputClass} pr-10`} placeholder="Enter your password"/><Eye className="absolute right-3 top-3.5 h-4 w-4 text-slate-400"/></div></Field></div>
    <div className="mt-3 text-right"><button className="text-xs font-semibold text-brand-600">Forgot password?</button></div>
    <Button className="mt-5 w-full" onClick={()=>navigate('/onboarding/location')}>Sign in</Button>
    <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-brand-line"/>or continue with<span className="h-px flex-1 bg-brand-line"/></div>
    <div className="grid gap-3 sm:grid-cols-2"><Button variant="secondary"><span className="font-black text-red-500">G</span>Google</Button><Button variant="secondary"><Github className="h-4 w-4"/>GitHub</Button></div>
    <p className="mt-7 text-center text-sm text-brand-muted">Don't have an account? <button onClick={()=>navigate('/signup')} className="font-bold text-brand-600">Create one</button></p>
   </div>
 </AuthFrame>
}

export function Signup() {
 const navigate=useNavigate()
 return <AuthFrame quote="Find people who get you, not just people who follow you.">
  <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
   <div className="mb-8 lg:hidden"><Brand/></div>
   <h1 className="text-3xl font-extrabold">Find people who get you.</h1><p className="mt-2 text-sm text-brand-muted">Create an account and we'll personalize your community.</p>
   <div className="mt-7 space-y-4"><Field label="Full name"><input className={inputClass} placeholder="Jane Doe"/></Field><Field label="Email"><input className={inputClass} placeholder="you@example.com"/></Field><Field label="Password" hint="8+ characters, one number and one symbol"><input type="password" className={inputClass} placeholder="Create a strong password"/></Field></div>
   <Button className="mt-6 w-full" onClick={()=>navigate('/onboarding/location')}>Create my account</Button>
   <p className="mt-4 text-xs leading-5 text-brand-muted">By continuing, you agree to the Terms and Community Guidelines.</p>
   <p className="mt-6 text-center text-sm text-brand-muted">Already have an account? <button onClick={()=>navigate('/login')} className="font-bold text-brand-600">Sign in</button></p>
  </div>
 </AuthFrame>
}
