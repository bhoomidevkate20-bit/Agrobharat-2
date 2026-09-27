import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const ROLES = [
  { value: 'customer', label: 'I am a Customer / Wholesale Buyer' },
  { value: 'farmer', label: 'I am a Farmer / Producer' },
  { value: 'fpo', label: 'I am an FPO (Farmer Producer Org)' },
  { value: 'delivery_agent', label: 'I am a Delivery Partner' },
  { value: 'inspector', label: 'I am a Certified Quality Assayer / Inspector' }
]

const DEMO_USERS = [
  { role: 'farmer', label: '🌾 Farmer', name: 'Ramesh Patil', email: 'farmer.demo@agrobharat.org' },
  { role: 'inspector', label: '🔍 Inspector', name: 'Dr. Rajesh Sharma', email: 'inspector.demo@agrobharat.org' },
  { role: 'fpo', label: '🏢 FPO', name: 'Sahyadri FPO', email: 'fpo.demo@agrobharat.org' },
  { role: 'customer', label: '🛒 Customer', name: 'Pooja Traders', email: 'customer.demo@agrobharat.org' },
  { role: 'delivery_agent', label: '🚚 Delivery', name: 'Vikram Shinde', email: 'delivery.demo@agrobharat.org' }
]

export default function AuthPanel({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    fullName: '', phone: '', email: '', password: '', location: '', role: ROLES[0].value
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(e) {
    e?.preventDefault()
    setError('')
    setSubmitting(true)
    const { data, error } = await signIn(loginForm)
    setSubmitting(false)
    if (error) { setError(error.message); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    navigate(`/dashboard/${profile?.role ?? 'customer'}`)
  }

  async function handleQuickDemoLogin(demoEmail) {
    setError('')
    setSubmitting(true)
    const { data, error } = await signIn({ email: demoEmail, password: 'Password123!' })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    navigate(`/dashboard/${profile?.role ?? 'customer'}`)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signUp({
      email: signupForm.email,
      password: signupForm.password,
      fullName: signupForm.fullName,
      phone: signupForm.phone,
      location: signupForm.location,
      role: signupForm.role
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    navigate(`/dashboard/${signupForm.role}`)
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-emerald-950/5 flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-emerald-900 p-9 text-white md:block">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85"
            alt=""
          />
          <div className="relative">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime-400 text-xl text-emerald-950 font-bold">✦</span>
            <h2 className="mt-16 text-4xl font-['Playfair_Display'] font-semibold">Grow with the market.</h2>
            <p className="mt-4 leading-7 text-stone-200 font-['DM_Sans']">
              Pricing transparency, verified grading, and trusted delivery — for every
              grain grower on Agro Bharat.
            </p>

            <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur border border-white/20">
              <p className="text-xs font-bold tracking-wider text-lime-300">★ SIH EVALUATION READY</p>
              <p className="text-xs text-stone-200 mt-1">
                Instant 1-click test roles available on the right for seamless presentation.
              </p>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-9 font-['DM_Sans']">
          {/* Quick Demo Switcher */}
          <div className="mb-6 rounded-2xl bg-lime-50/90 border border-lime-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-950 tracking-wider">⚡ 1-CLICK DEMO LOGIN (SIH):</span>
              <span className="text-[10px] text-lime-800 font-medium">Select role</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_USERS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickDemoLogin(d.email)}
                  className="rounded-lg bg-white border border-lime-600/30 px-2.5 py-1 text-xs font-semibold text-emerald-950 shadow-sm hover:bg-lime-500 hover:text-emerald-950 hover:border-lime-500 transition-all disabled:opacity-50"
                  title={`Sign in as ${d.name}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'login' ? (
            <>
              <p className="text-xs font-bold tracking-widest text-lime-700">WELCOME BACK</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-950">Log in to Agro Bharat</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">Your grain business, all in one place.</p>
              <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
                <input
                  required type="email" placeholder="Email address" value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                <input
                  required type="password" placeholder="Password" value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                {error && <p className="text-xs text-rust font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                <button
                  disabled={submitting}
                  className="w-full rounded-xl bg-emerald-800 p-2.5 font-bold text-white transition hover:bg-emerald-950 disabled:opacity-60 text-sm shadow-md"
                >
                  {submitting ? 'Logging in…' : 'Log in →'}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-500">
                New to Agro Bharat?{' '}
                <button onClick={() => setMode('signup')} className="font-bold text-lime-700">Create account</button>
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold tracking-widest text-lime-700">JOIN THE NETWORK</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-950">Create your account</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">Start trading grain more intelligently.</p>
              <form onSubmit={handleSignup} className="mt-5 space-y-2.5">
                <input
                  required placeholder="Full name" value={signupForm.fullName}
                  onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                <input
                  required type="tel" placeholder="Mobile number" value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                <input
                  required type="email" placeholder="Email address" value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                <input
                  required placeholder="Location (village / city, state)" value={signupForm.location}
                  onChange={(e) => setSignupForm({ ...signupForm, location: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                <input
                  required type="password" placeholder="Password" value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm"
                />
                <select
                  value={signupForm.role}
                  onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:border-lime-600 focus:ring-4 focus:ring-lime-600/10 text-sm bg-white"
                >
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {error && <p className="text-xs text-rust font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                <button
                  disabled={submitting}
                  className="w-full rounded-xl bg-lime-500 p-2.5 font-bold text-emerald-950 transition hover:bg-lime-400 disabled:opacity-60 text-sm shadow-md"
                >
                  {submitting ? 'Creating account…' : 'Create free account →'}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="font-bold text-lime-700">Log in</button>
              </p>
            </>
          )}
          <Link to="/" className="mt-4 block text-center text-xs text-slate-400 hover:text-slate-600">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
