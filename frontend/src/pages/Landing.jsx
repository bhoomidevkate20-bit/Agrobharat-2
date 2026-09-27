import { Link } from 'react-router-dom'
import TickerStrip from '../components/TickerStrip'
import AgmarknetPanel from '../components/AgmarknetPanel'
import { useLanguage } from '../context/LanguageContext'

export default function Landing() {
  const { t } = useLanguage()
  return (
    <div>
      <TickerStrip />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(105deg, #153526e8 0%, #153526c9 47%, #15352638 72%), url('https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?auto=format&fit=crop&w=1800&q=85') center/cover"
        }}
      >
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.2fr_.8fr] lg:py-24">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-200/10 px-3 py-2 text-xs font-bold text-lime-200 font-['DM_Sans']">
              <span className="pulse-dot h-2 w-2 rounded-full bg-lime-300" /> LIVE GRAIN MARKETPLACE
            </div>
            <h1 className="max-w-3xl text-5xl leading-[1.06] text-white sm:text-6xl font-['Playfair_Display'] font-semibold">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-200 font-['DM_Sans']">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 font-['DM_Sans']">
              <Link
                to="/signup"
                className="rounded-xl bg-lime-400 px-5 py-3 font-bold text-emerald-950 shadow-lg transition hover:-translate-y-1"
              >
                {t('startSelling')}
              </Link>
              <Link
                to="/market-ai"
                className="rounded-xl border border-lime-300 bg-lime-400/20 px-5 py-3 font-bold text-lime-200 backdrop-blur hover:bg-lime-400/30 transition flex items-center gap-2"
              >
                <span>✨</span> AI Price Predictor
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur hover:bg-white/20 transition"
              >
                {t('haveAccount')}
              </Link>
            </div>
            <div className="mt-12 grid max-w-lg grid-cols-3 border-t border-white/20 pt-6 text-white font-['DM_Sans']">
              <div><b className="text-2xl">18k+</b><small className="block text-stone-300">Farmers</small></div>
              <div><b className="text-2xl">250+</b><small className="block text-stone-300">FPO partners</small></div>
              <div><b className="text-2xl">₹38Cr</b><small className="block text-stone-300">Traded value</small></div>
            </div>
          </div>

          {/* Right half: live Agmarknet feed */}
          <div className="relative z-10">
            <AgmarknetPanel />
          </div>
        </div>
      </section>

      {/* AI Market Intelligence Feature Spotlight */}
      <section className="bg-gradient-to-b from-stone-50 to-white py-16 border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-700/20 bg-lime-100 px-3 py-1 text-xs font-bold text-emerald-900 mb-3 font-['DM_Sans']">
                <span>✦</span> PROPRIETARY ML MODELS
              </div>
              <h2 className="text-4xl text-emerald-950 font-['Playfair_Display'] font-semibold leading-tight">
                Predict Next Week's Modal Price Before You Sell
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed font-['DM_Sans']">
                Powered by Gradient Boosted Decision Trees (XGBoost) and Meta Prophet seasonal decomposition, Agro Bharat ingests 30-day historical Agmarknet rates, daily mandi arrival volumes, and Open-Meteo hyperlocal rainfall deviations to project accurate price trajectories and fair win-win trade corridors.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-3 text-xs font-['DM_Sans']">
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <b className="text-emerald-900 text-sm block mb-1">📈 7d / 14d / 30d Forecast</b>
                  <p className="text-slate-500">Tree ensembles model price shocks with 95% confidence corridors.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <b className="text-emerald-900 text-sm block mb-1">⚖️ Win-Win Recommender</b>
                  <p className="text-slate-500">Splits middleman margins: Farmer earns +18%, Buyer saves -14%.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <b className="text-emerald-900 text-sm block mb-1">🌦️ Weather Risk Advisory</b>
                  <p className="text-slate-500">Live 7-day precipitation probability to prevent moisture spoilage.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <b className="text-emerald-900 text-sm block mb-1">📦 Prophet Demand Cycles</b>
                  <p className="text-slate-500">Detects festive spikes (Diwali, Makar Sankranti) for optimal timing.</p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/market-ai"
                  className="rounded-xl bg-leaf px-6 py-3 font-bold text-white shadow-md hover:bg-leaf-dark transition inline-flex items-center gap-2 font-['DM_Sans'] text-sm"
                >
                  Explore AI Price Predictor & Weather Advisory →
                </Link>
              </div>
            </div>

            <div className="bg-emerald-950 text-white p-7 md:p-8 rounded-3xl shadow-xl relative overflow-hidden font-['DM_Sans'] border border-emerald-800">
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
                <div>
                  <span className="text-lime-300 font-bold text-xs">LIVE MODEL OUTPUT</span>
                  <p className="text-lg font-bold">Sharbati Wheat (Pune Mandi)</p>
                </div>
                <span className="bg-lime-400 text-emerald-950 text-xs font-bold px-3 py-1 rounded-full">
                  Bullish ↗ (+6.2%)
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-stone-300">Current Modal Mandi Rate:</span>
                  <span className="font-bold text-base">₹2,450 / quintal (₹24.5/kg)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-stone-300">Predicted 7-Day Target:</span>
                  <span className="font-bold text-base text-lime-300">₹2,602 / quintal (₹26.0/kg)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-stone-300">Win-Win Direct Farm Gate Rate:</span>
                  <span className="font-bold text-base text-emerald-300">₹31.5 / kg (+28% upside)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-300">Hyperlocal Rain Risk (Open-Meteo):</span>
                  <span className="font-bold text-emerald-400">Low (22% probability)</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                <span>Model: XGBoost Regressor v2.4</span>
                <span>Trained on Agmarknet 3-yr dataset</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="market" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-widest text-lime-700 font-['DM_Sans']">SMARTER GRAIN COMMERCE</p>
            <h2 className="mt-2 text-4xl text-emerald-950 font-['Playfair_Display'] font-semibold">
              Every grain, connected to its best market.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-slate-600 font-['DM_Sans']">
              List your harvest, get it graded by a field inspector, compare FPO
              offers, and arrange delivery — in one connected marketplace.
            </p>
            <div className="mt-7 grid gap-3 font-['DM_Sans']">
              <div className="flex gap-4 rounded-2xl bg-lime-50 p-4">
                <span className="text-2xl">◌</span>
                <span>
                  <b>Verified grading</b>
                  <small className="mt-1 block text-slate-500">Every listing is checked before it reaches a buyer.</small>
                </span>
              </div>
              <div className="flex gap-4 rounded-2xl bg-orange-50 p-4">
                <span className="text-2xl">⌘</span>
                <span>
                  <b>Bulk demand matching</b>
                  <small className="mt-1 block text-slate-500">Small farmer lots, matched to large FPO orders.</small>
                </span>
              </div>
              <div className="flex gap-4 rounded-2xl bg-emerald-50 p-4">
                <span className="text-2xl">↝</span>
                <span>
                  <b>Trusted logistics</b>
                  <small className="mt-1 block text-slate-500">Move grain reliably from farm gate to buyer.</small>
                </span>
              </div>
            </div>
          </div>
          <div className="relative min-h-[400px] overflow-hidden rounded-[28px]">
            <img
              className="absolute h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1592982537447-6f2a6a0aa065?auto=format&fit=crop&w=1000&q=85"
              alt="Farmer holding grain"
            />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-emerald-950/90 p-5 text-white backdrop-blur font-['DM_Sans']">
              <b>&ldquo;I sold my wheat without a middleman taking a cut.&rdquo;</b>
              <p className="mt-1 text-sm text-stone-300">— Ramesh Patil, wheat farmer, Kolhapur</p>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="bg-emerald-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-xs font-bold tracking-widest text-lime-300 font-['DM_Sans']">FOR THE PEOPLE WHO GROW INDIA</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <h2 className="text-4xl font-['Playfair_Display'] font-semibold">Simple tools. Stronger outcomes.</h2>
            <Link to="/signup" className="rounded-xl bg-lime-400 px-5 py-3 font-bold text-emerald-950 font-['DM_Sans']">
              Create free account
            </Link>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-4 font-['DM_Sans']">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="text-3xl">🌾</span>
              <h3 className="mt-4 font-bold">Farmers</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">List your harvest and receive offers directly.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="text-3xl">🏢</span>
              <h3 className="mt-4 font-bold">FPOs</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">Source from members, bulk-list, sell at scale.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="text-3xl">🛒</span>
              <h3 className="mt-4 font-bold">Customers</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">Source verified produce by grade, price, distance.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="text-3xl">🚚</span>
              <h3 className="mt-4 font-bold">Delivery Agents</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300">Pick up open jobs near you, on your schedule.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
