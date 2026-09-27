import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LANGUAGES } from '../lib/i18n'

const DEMO_ROLES = [
  { role: 'farmer', label: '🌾 Farmer (Ramesh)', email: 'farmer.demo@agrobharat.org' },
  { role: 'inspector', label: '🔍 Inspector (Dr. Sharma)', email: 'inspector.demo@agrobharat.org' },
  { role: 'fpo', label: '🏢 FPO (Sahyadri)', email: 'fpo.demo@agrobharat.org' },
  { role: 'customer', label: '🛒 Buyer (Pooja Traders)', email: 'customer.demo@agrobharat.org' },
  { role: 'delivery_agent', label: '🚚 Delivery (Vikram)', email: 'delivery.demo@agrobharat.org' }
]

export default function Navbar() {
  const { user, profile, signIn, signOut } = useAuth()
  const { lang, changeLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [switching, setSwitching] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleSwitchRole(e) {
    const email = e.target.value
    if (!email) return
    setSwitching(true)
    const { data, error } = await signIn({ email, password: 'Password123!' })
    setSwitching(false)
    if (!error && data?.user) {
      const selected = DEMO_ROLES.find((d) => d.email === email)
      if (selected) navigate(`/dashboard/${selected.role}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fbfaf5f2] backdrop-blur font-['DM_Sans']">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-600 text-xl text-white font-bold shadow-sm transition group-hover:scale-105">✦</span>
          <span>
            <b className="text-xl text-emerald-950 font-['Playfair_Display']">Agro Bharat</b>
            <small className="block text-[10px] tracking-[.18em] text-lime-700 font-semibold">GRAIN MARKETPLACE</small>
          </span>
        </Link>

        <nav className="flex items-center gap-2.5 sm:gap-3.5 text-sm font-semibold">
          {/* AI Intelligence Hub Link */}
          <Link
            to="/market-ai"
            className="px-2.5 py-1 text-emerald-950 hover:text-emerald-900 bg-lime-200/70 hover:bg-lime-300 border border-lime-400/80 rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <span>✨</span> Market AI
          </Link>

          {/* Quick Demo Switcher in Navbar */}
          <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1">
            <span className="text-[11px] font-bold text-emerald-950 hidden sm:inline">Role:</span>
            <select
              disabled={switching}
              value={user ? (DEMO_ROLES.find(d => d.role === profile?.role)?.email ?? '') : ''}
              onChange={handleSwitchRole}
              className="text-xs bg-transparent border-0 font-medium text-emerald-950 focus:outline-none cursor-pointer"
              title="Instant role switch for demo"
            >
              <option value="" disabled>⚡ Switch Role…</option>
              {DEMO_ROLES.map((d) => (
                <option key={d.role} value={d.email}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={lang}
            onChange={(e) => changeLanguage(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-emerald-900 shadow-sm"
            title="Preferred language"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>

          {!user && (
            <>
              <Link to="/login" className="px-3 py-1.5 text-emerald-900 hover:bg-lime-50 rounded-xl transition text-xs sm:text-sm">{t('login')}</Link>
              <Link
                to="/signup"
                className="rounded-xl bg-emerald-800 px-3.5 py-1.5 text-white shadow hover:bg-emerald-900 transition text-xs sm:text-sm font-medium"
              >
                {t('join')}
              </Link>
            </>
          )}

          {user && profile && (
            <div className="flex items-center gap-2">
              <Link to={`/dashboard/${profile.role}`} className="text-emerald-900 hover:text-lime-700 text-xs sm:text-sm font-bold">
                {profile.full_name?.split(' ')[0]}
              </Link>
              <span className="rounded-full bg-lime-200/70 border border-lime-600/40 text-emerald-950 text-[10px] font-bold px-2 py-0.5 capitalize hidden md:inline">
                {profile.role.replace('_', ' ')}
              </span>
              <button onClick={handleSignOut} className="text-orange-700 hover:underline text-xs">
                {t('logout')}
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
