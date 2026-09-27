import { useEffect, useState } from 'react'
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

function FieldInspectorPanel({ profile, userId, onSaved }) {
  const [inspectors, setInspectors] = useState([])
  const [selected, setSelected] = useState(profile?.field_inspector_id ?? '')
  const [status, setStatus] = useState('')

  useEffect(() => {
    supabase.from('inspector_directory').select('*').then(({ data }) => setInspectors(data ?? []))
  }, [])

  const assigned = inspectors.find((i) => i.id === profile?.field_inspector_id)

  async function save() {
    setStatus('Saving…')
    const { error } = await supabase.from('profiles').update({ field_inspector_id: selected || null }).eq('id', userId)
    setStatus(error ? error.message : 'Saved.')
    onSaved?.()
  }

  return (
    <div className="border border-soil/20 p-5 font-body">
      <h3 className="font-display text-lg text-leaf-dark mb-1">Certified Field Inspector</h3>
      <p className="text-xs text-ink/60 mb-3">
        Required for every FPO. The inspector manages their own ID and qualification — you can only choose who is assigned.
      </p>

      {assigned ? (
        <div className="border border-soil/20 bg-husk/40 p-3 mb-3 text-sm">
          <p className="font-medium text-leaf-dark">{assigned.full_name}</p>
          <p className="text-ink/70">Certified ID: {assigned.certified_id ?? 'Not yet set by inspector'}</p>
          <p className="text-ink/70">Qualification: {assigned.qualification ?? 'Not yet set by inspector'}</p>
        </div>
      ) : (
        <p className="text-rust text-sm mb-3">No field inspector assigned yet — required before listings can be inspected.</p>
      )}

      <select
        value={selected} onChange={(e) => setSelected(e.target.value)}
        className="border border-soil/30 px-3 py-2 bg-paper w-full mb-2 text-sm"
      >
        <option value="">Select an inspector…</option>
        {inspectors.map((i) => (
          <option key={i.id} value={i.id}>{i.full_name} ({i.location ?? 'location not set'})</option>
        ))}
      </select>
      <button onClick={save} className="bg-leaf text-paper text-sm px-4 py-2 hover:bg-leaf-dark transition-colors">
        Assign inspector
      </button>
      {status && <p className="text-xs text-soil mt-2">{status}</p>}
    </div>
  )
}

export default function FPODashboard() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [farmerListings, setFarmerListings] = useState([])
  const [ownListings, setOwnListings] = useState([])
  const [incomingBids, setIncomingBids] = useState({})
  const [bidDrafts, setBidDrafts] = useState({})
  const [form, setForm] = useState({ crop_type: '', quantity_kg: '', price_per_kg: '', location: '' })
  const [status, setStatus] = useState('')

  async function loadAll() {
    const { data: available } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .eq('owner_role', 'farmer')
      .order('created_at', { ascending: false })
    setFarmerListings(available ?? [])

    const { data: mine } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setOwnListings(mine ?? [])

    if (mine?.length) {
      const { data: bids } = await supabase
        .from('bids')
        .select('*, bidder:profiles!bids_bidder_id_fkey(full_name, role)')
        .in('listing_id', mine.map((l) => l.id))
      const grouped = {}
      for (const b of bids ?? []) grouped[b.listing_id] = [...(grouped[b.listing_id] ?? []), b]
      setIncomingBids(grouped)
    }
  }

  useEffect(() => { loadAll() }, [user])

  async function placeBid(listingId) {
    const draft = bidDrafts[listingId]
    if (!draft?.quantity_kg || !draft?.offered_price_per_kg) return
    await supabase.from('bids').insert({
      listing_id: listingId,
      bidder_id: user.id,
      bidder_role: 'fpo',
      quantity_kg: Number(draft.quantity_kg),
      offered_price_per_kg: Number(draft.offered_price_per_kg)
    })
    setBidDrafts({ ...bidDrafts, [listingId]: {} })
    setStatus('Bid placed.')
  }

  async function handleCreateBulkListing(e) {
    e.preventDefault()
    const { error } = await supabase.from('listings').insert({
      owner_id: user.id,
      owner_role: 'fpo',
      crop_type: form.crop_type,
      quantity_kg: Number(form.quantity_kg),
      price_per_kg: Number(form.price_per_kg),
      location: form.location
    })
    setStatus(error ? error.message : 'Bulk listing submitted for inspection.')
    if (!error) {
      setForm({ crop_type: '', quantity_kg: '', price_per_kg: '', location: '' })
      loadAll()
    }
  }

  async function respondToBid(bidId, newStatus) {
    await supabase.from('bids').update({ status: newStatus }).eq('id', bidId)
    loadAll()
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-14">
      <div className="grid md:grid-cols-3 gap-4">
        <EarningsSummary />
        <div className="border border-soil/20 p-4 font-body">
          <p className="text-xs uppercase tracking-wide text-soil mb-1">{t('reputation')}</p>
          <ReputationBadge profileId={user.id} />
        </div>
        <div />
      </div>

      <FieldInspectorPanel profile={profile} userId={user.id} onSaved={loadAll} />

      <section>
        <h2 className="font-display text-2xl text-leaf-dark mb-4">Source from farmer listings</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {farmerListings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              action={
                <div className="mt-2 border-t border-soil/10 pt-2 flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input
                      type="number" placeholder="Qty (kg)"
                      value={bidDrafts[l.id]?.quantity_kg ?? ''}
                      onChange={(e) => setBidDrafts({ ...bidDrafts, [l.id]: { ...bidDrafts[l.id], quantity_kg: e.target.value } })}
                      className="border border-soil/30 px-2 py-1 text-sm w-1/2"
                    />
                    <input
                      type="number" placeholder="₹/kg offer"
                      value={bidDrafts[l.id]?.offered_price_per_kg ?? ''}
                      onChange={(e) => setBidDrafts({ ...bidDrafts, [l.id]: { ...bidDrafts[l.id], offered_price_per_kg: e.target.value } })}
                      className="border border-soil/30 px-2 py-1 text-sm w-1/2"
                    />
                  </div>
                  <button onClick={() => placeBid(l.id)} className="bg-leaf text-paper text-sm py-1.5 hover:bg-leaf-dark transition-colors">
                    Place bid
                  </button>
                </div>
              }
            />
          ))}
          {farmerListings.length === 0 && <p className="font-body text-ink/60">No approved farmer listings yet.</p>}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-2xl text-leaf-dark mb-4">Create a bulk listing</h2>
          <form onSubmit={handleCreateBulkListing} className="flex flex-col gap-3 font-body">
            <input required placeholder="Crop type" value={form.crop_type}
              onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
              className="border border-soil/30 px-3 py-2 bg-paper" />
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Quantity (kg)" value={form.quantity_kg}
                onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                className="border border-soil/30 px-3 py-2 bg-paper" />
              <input required type="number" placeholder="Price per kg (₹)" value={form.price_per_kg}
                onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                className="border border-soil/30 px-3 py-2 bg-paper" />
            </div>
            <input required placeholder="Location" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="border border-soil/30 px-3 py-2 bg-paper" />
            <button className="bg-leaf text-paper py-3 hover:bg-leaf-dark transition-colors">Submit for inspection</button>
          </form>
          {status && <p className="text-sm text-soil mt-2">{status}</p>}

          <h3 className="font-display text-xl text-leaf-dark mt-10 mb-3">{t('liveNews')}</h3>
          <SubscriptionGate>
            <AgmarknetPanel />
          </SubscriptionGate>
        </div>

        <div>
          <h2 className="font-display text-2xl text-leaf-dark mb-4">Your listings & incoming bids</h2>
          <div className="flex flex-col gap-4">
            {ownListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                action={
                  <div className="mt-2 border-t border-soil/10 pt-2">
                    {(incomingBids[l.id] ?? []).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm font-body py-1">
                        <span>{b.bidder?.full_name} ({b.bidder?.role}) — ₹{b.offered_price_per_kg}/kg × {b.quantity_kg}kg</span>
                        {b.status === 'pending' ? (
                          <span className="flex gap-2">
                            <button onClick={() => respondToBid(b.id, 'accepted')} className="text-leaf hover:underline">Accept</button>
                            <button onClick={() => respondToBid(b.id, 'rejected')} className="text-rust hover:underline">Reject</button>
                          </span>
                        ) : (
                          <span className="text-xs text-ink/50 capitalize">{b.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                }
              />
            ))}
          </div>

          <h2 className="font-display text-2xl text-leaf-dark mt-10 mb-4">{t('orderHistory')}</h2>
          <IncomingOrders listingIds={ownListings.map((l) => l.id)} />

          <div className="mt-10">
            <SubscriptionGate label="Subscribe to add your payment details for buyers.">
              <TransactionEasyPanel />
            </SubscriptionGate>
          </div>
        </div>
      </section>
    </div>
  )
}
