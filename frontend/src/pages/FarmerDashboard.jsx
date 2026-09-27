import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ListingCard from '../components/ListingCard'
import IncomingOrders from '../components/IncomingOrders'
import EarningsSummary from '../components/EarningsSummary'
import ReputationBadge from '../components/ReputationBadge'
import SubscriptionGate from '../components/SubscriptionGate'
import AgmarknetPanel from '../components/AgmarknetPanel'
import TransactionEasyPanel from '../components/TransactionEasyPanel'
import { useLanguage } from '../context/LanguageContext'
import { SUPPORTED_CROPS, predictCropPrice } from '../lib/aiPriceModel'

export default function FarmerDashboard() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [listings, setListings] = useState([])
  const [bidsByListing, setBidsByListing] = useState({})
  const [form, setForm] = useState({
    crop_type: 'Sharbati Wheat',
    quantity_kg: '',
    price_per_kg: '',
    location: profile?.location ?? 'Baramati, Pune',
    moisture_pct: '',
    harvested_date: ''
  })
  const [status, setStatus] = useState('')

  // Determine matching crop for AI suggestion
  const matchedCrop = useMemo(() => {
    const text = (form.crop_type || '').toLowerCase()
    return SUPPORTED_CROPS.find(c => text.includes(c.id) || text.includes(c.name.toLowerCase().split(' ')[0])) || SUPPORTED_CROPS[0]
  }, [form.crop_type])

  const aiPrediction = useMemo(() => {
    return predictCropPrice({ cropId: matchedCrop.id, horizonDays: 7 })
  }, [matchedCrop])

  async function loadListings() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setListings(data ?? [])

    if (data?.length) {
      const { data: bids } = await supabase
        .from('bids')
        .select('*, bidder:profiles!bids_bidder_id_fkey(full_name, role)')
        .in('listing_id', data.map((l) => l.id))
      const grouped = {}
      for (const b of bids ?? []) {
        grouped[b.listing_id] = [...(grouped[b.listing_id] ?? []), b]
      }
      setBidsByListing(grouped)
    }
  }

  useEffect(() => { loadListings() }, [user])

  async function handleCreate(e) {
    e.preventDefault()
    setStatus('Saving…')
    const { error } = await supabase.from('listings').insert({
      owner_id: user.id,
      owner_role: 'farmer',
      crop_type: form.crop_type,
      quantity_kg: Number(form.quantity_kg),
      price_per_kg: Number(form.price_per_kg),
      location: form.location || profile?.location || 'Baramati, Pune',
      moisture_pct: form.moisture_pct ? Number(form.moisture_pct) : null,
      harvested_date: form.harvested_date || null
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus('Listing submitted — pending field inspection.')
    setForm({ crop_type: 'Sharbati Wheat', quantity_kg: '', price_per_kg: '', location: profile?.location ?? '', moisture_pct: '', harvested_date: '' })
    loadListings()
  }

  async function respondToBid(bidId, newStatus) {
    await supabase.from('bids').update({ status: newStatus }).eq('id', bidId)
    loadListings()
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 font-['DM_Sans']">
      <div
        className="rounded-2xl overflow-hidden mb-6 h-36 bg-cover bg-center relative shadow-md"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/60 to-transparent flex flex-col justify-center px-8">
          <span className="text-lime-300 text-xs font-bold uppercase tracking-wider mb-1">Krishi Dashboard</span>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl text-paper font-bold">Welcome back, {profile?.full_name}</h1>
          <p className="text-xs text-stone-300 mt-1">Manage harvests, accept FPO bids, and check AI price projections.</p>
        </div>
      </div>

      {/* AI Intelligence Announcement Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-lime-500/15 via-emerald-500/10 to-transparent border border-lime-500/30 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-500 text-emerald-950 text-xl font-bold">✨</span>
          <div>
            <b className="text-sm text-emerald-950 block">AI Price & Weather Risk Intelligence Active</b>
            <span className="text-xs text-slate-600">Gradient boosted price forecast ({aiPrediction.sentiment}) and Open-Meteo rainfall advisory available.</span>
          </div>
        </div>
        <Link
          to="/market-ai"
          className="bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
        >
          Open AI Market Hub →
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <EarningsSummary />
        <div className="md:col-span-2 border border-soil/20 bg-white rounded-xl p-4 font-body shadow-sm">
          <p className="text-xs uppercase tracking-wide text-soil mb-1 font-bold">{t('reputation')}</p>
          <ReputationBadge profileId={user.id} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <h2 className="font-['Playfair_Display'] text-2xl text-leaf-dark font-bold mb-4">List your harvest</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 font-body bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <label className="text-xs font-semibold text-slate-700">Crop Commodity</label>
            <select
              value={form.crop_type}
              onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
              className="border border-soil/30 px-3 py-2 bg-paper rounded-lg text-sm"
            >
              {SUPPORTED_CROPS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* Smart AI Price Suggestion Badge */}
            <div className="bg-lime-50 border border-lime-300/80 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>✨</span> AI Suggests: <b>₹{aiPrediction.predictedPerKg}/kg</b> (₹{aiPrediction.predictedPrice}/qtl)
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, price_per_kg: String(aiPrediction.predictedPerKg) })}
                  className="bg-lime-500 hover:bg-lime-400 text-emerald-950 font-bold px-2.5 py-1 rounded-lg transition text-[11px] shadow-sm"
                >
                  Use AI Price
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Trend: <b>{aiPrediction.sentiment}</b> ({aiPrediction.pctChange >= 0 ? `+${aiPrediction.pctChange}%` : `${aiPrediction.pctChange}%`} 7d projection)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Quantity (kg)</label>
                <input required type="number" placeholder="e.g. 500" value={form.quantity_kg}
                  onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                  className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Price per kg (₹)</label>
                <input required type="number" step="0.5" placeholder="e.g. 34" value={form.price_per_kg}
                  onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                  className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full text-sm mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Farm Gate Location</label>
              <input required placeholder="Village, Taluka, District" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full text-sm mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Moisture % (Optional)</label>
                <input type="number" step="0.1" placeholder="e.g. 10.5" value={form.moisture_pct}
                  onChange={(e) => setForm({ ...form, moisture_pct: e.target.value })}
                  className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Harvest Date</label>
                <input type="date" value={form.harvested_date}
                  onChange={(e) => setForm({ ...form, harvested_date: e.target.value })}
                  className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full text-sm mt-1" />
              </div>
            </div>

            <button className="bg-leaf text-paper font-semibold py-2.5 rounded-lg hover:bg-leaf-dark transition-colors shadow mt-2">
              Submit listing for inspection →
            </button>
            {status && <p className="text-xs font-medium text-emerald-800 bg-emerald-50 p-2 rounded">{status}</p>}
          </form>

          <h3 className="font-['Playfair_Display'] text-xl text-leaf-dark font-bold mt-10 mb-3">{t('liveNews')}</h3>
          <SubscriptionGate>
            <AgmarknetPanel />
          </SubscriptionGate>
        </section>

        <section>
          <h2 className="font-['Playfair_Display'] text-2xl text-leaf-dark font-bold mb-4">Your listings & bids</h2>
          <div className="flex flex-col gap-4">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                action={
                  <div className="mt-2 border-t border-soil/10 pt-2">
                    {(bidsByListing[l.id] ?? []).length === 0 && (
                      <p className="text-xs text-ink/50 font-body">No bids yet.</p>
                    )}
                    {(bidsByListing[l.id] ?? []).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm font-body py-1">
                        <span>{b.bidder?.full_name} ({b.bidder?.role}) — ₹{b.offered_price_per_kg}/kg × {b.quantity_kg}kg</span>
                        {b.status === 'pending' ? (
                          <span className="flex gap-2">
                            <button onClick={() => respondToBid(b.id, 'accepted')} className="text-leaf hover:underline font-bold">Accept</button>
                            <button onClick={() => respondToBid(b.id, 'rejected')} className="text-rust hover:underline">Reject</button>
                          </span>
                        ) : (
                          <span className="text-xs text-ink/50 capitalize font-medium">{b.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                }
              />
            ))}
            {listings.length === 0 && <p className="font-body text-ink/60">No listings yet — add your first harvest.</p>}
          </div>

          <h2 className="font-['Playfair_Display'] text-2xl text-leaf-dark font-bold mt-10 mb-4">{t('orderHistory')}</h2>
          <IncomingOrders listingIds={listings.map((l) => l.id)} />

          <div className="mt-10">
            <SubscriptionGate label="Subscribe to add your payment details for buyers.">
              <TransactionEasyPanel />
            </SubscriptionGate>
          </div>
        </section>
      </div>
    </div>
  )
}
