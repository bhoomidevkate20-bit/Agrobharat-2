import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import EarningsSummary from '../components/EarningsSummary'
import ReputationBadge from '../components/ReputationBadge'
import RateOrderModal from '../components/RateOrderModal'

const DELIVERY_CHARGE = 40
const PAYMENT_METHODS = ['UPI (GPay / PhonePe / Paytm)', 'Credit / Debit Card', 'Cash on Delivery']

export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [filters, setFilters] = useState({ location: '', maxPrice: '', grade: '' })
  const [checkout, setCheckout] = useState(null) // { listing, quantity }
  const [checkoutStep, setCheckoutStep] = useState('review') // review | payment
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('')
  const [successBanner, setSuccessBanner] = useState('')
  const [rateOrder, setRateOrder] = useState(null)
  const [ratedOrderIds, setRatedOrderIds] = useState(new Set())

  async function loadListings() {
    const { data } = await supabase.from('listings').select('*').eq('status', 'approved')
    setListings(data ?? [])
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, listing:listings(crop_type, location, owner_id, owner_role)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])

    const { data: myRatings } = await supabase.from('ratings').select('order_id').eq('rater_id', user.id)
    setRatedOrderIds(new Set((myRatings ?? []).map((r) => r.order_id)))
  }

  useEffect(() => { loadListings(); loadOrders() }, [user])

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filters.location && !l.location.toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.maxPrice && l.price_per_kg > Number(filters.maxPrice)) return false
      if (filters.grade && l.grade !== filters.grade) return false
      return true
    })
  }, [listings, filters])

  function startCheckout(listing) {
    setCheckout({ listing, quantity: Math.min(10, listing.quantity_kg) })
    setCheckoutStep('review')
    setAddress(profile?.location ?? 'Indapur Road, Indapur, Pune, Maharashtra')
    setPaymentMethod(PAYMENT_METHODS[0])
    setStatus('')
    setSuccessBanner('')
  }

  async function placeOrder() {
    if (!checkout || !address) return
    const productPrice = checkout.listing.price_per_kg * checkout.quantity
    const { data: placed, error } = await supabase.from('orders').insert({
      listing_id: checkout.listing.id,
      buyer_id: user.id,
      quantity_kg: checkout.quantity,
      product_price: productPrice,
      delivery_charge: DELIVERY_CHARGE,
      delivery_address: address,
      payment_method: paymentMethod
    }).select().single()

    if (error) { setStatus(error.message); return }

    setSuccessBanner(`✓ Order successfully placed for ${checkout.quantity}kg ${checkout.listing.crop_type}! Total: ₹${productPrice + DELIVERY_CHARGE}`)
    setCheckout(null)
    loadOrders()
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-['DM_Sans']">
      {successBanner && (
        <div className="mb-6 bg-emerald-100 border border-emerald-400 text-emerald-900 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <p className="font-semibold text-sm">{successBanner}</p>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-700 hover:text-emerald-950 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-10">
        <section className="md:col-span-2">
          <div className="mb-6 max-w-xs"><EarningsSummary /></div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-leaf-dark font-semibold">Grain Catalog</h2>
            <span className="text-xs text-soil font-medium">{filtered.length} verified listings available</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 text-sm">
            <input
              placeholder="🔍 Search location..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="border border-soil/30 px-3 py-2 bg-paper rounded-lg flex-1 min-w-[140px]"
            />
            <input
              type="number"
              placeholder="Max ₹/kg"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-28"
            />
            <select
              value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              className="border border-soil/30 px-3 py-2 bg-paper rounded-lg"
            >
              <option value="">All Grades</option>
              <option value="A">Grade A (Certified)</option>
              <option value="B">Grade B (Certified)</option>
              <option value="C">Grade C</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((l) => (
              <div key={l.id} className="border border-soil/20 bg-husk/30 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl text-leaf-dark font-bold">{l.crop_type}</h3>
                    {l.grade && (
                      <span className="bg-emerald-800 text-white font-bold text-[11px] px-2 py-0.5 rounded-full">
                        Grade {l.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink/70 mt-1">📍 {l.location}</p>
                  <div className="mt-2">
                    <ReputationBadge profileId={l.owner_id} compact />
                  </div>
                  <p className="text-lg font-bold text-emerald-950 mt-3">
                    ₹{l.price_per_kg} <span className="text-xs font-normal text-ink/60">/ kg · {l.quantity_kg}kg in stock</span>
                  </p>
                  {l.moisture_pct && (
                    <p className="text-xs text-soil mt-0.5">Moisture: {l.moisture_pct}%</p>
                  )}
                </div>
                <button
                  onClick={() => startCheckout(l)}
                  className="mt-4 bg-leaf text-paper font-semibold text-sm py-2 rounded-lg hover:bg-leaf-dark transition-colors shadow-sm"
                >
                  Buy Now →
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-stone-50 rounded-xl border border-stone-200">
                <p className="text-ink/60">No listings match your filters.</p>
                <button
                  onClick={() => setFilters({ location: '', maxPrice: '', grade: '' })}
                  className="mt-2 text-xs font-bold text-leaf underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </section>

        <section>
          {checkout && checkoutStep === 'review' && (
            <div className="border border-leaf bg-emerald-50/30 rounded-xl p-5 mb-8 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-xl text-leaf-dark font-bold">Checkout</h3>
                <button onClick={() => setCheckout(null)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
              </div>
              <p className="text-xs font-medium text-emerald-900 mb-3">{checkout.listing.crop_type} (Grade {checkout.listing.grade ?? '—'})</p>

              <label className="text-xs font-bold uppercase tracking-wider text-ink/70">Quantity (kg)</label>
              <input
                type="number" min="1" max={checkout.listing.quantity_kg} value={checkout.quantity}
                onChange={(e) => setCheckout({ ...checkout, quantity: Number(e.target.value) })}
                className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full my-2 text-sm"
              />

              <label className="text-xs font-bold uppercase tracking-wider text-ink/70">Delivery Address</label>
              <textarea
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete street address and PIN code"
                className="border border-soil/30 px-3 py-2 bg-paper rounded-lg w-full my-2 text-sm" rows={2}
              />

              <div className="text-sm border-t border-soil/20 pt-3 mt-2 flex flex-col gap-1.5">
                <div className="flex justify-between text-ink/80"><span>Produce Subtotal:</span><span>₹{checkout.listing.price_per_kg * checkout.quantity}</span></div>
                <div className="flex justify-between text-ink/80"><span>Delivery Charge:</span><span>₹{DELIVERY_CHARGE}</span></div>
                <div className="flex justify-between font-bold text-emerald-950 border-t border-soil/20 pt-2 text-base">
                  <span>Grand Total:</span><span>₹{checkout.listing.price_per_kg * checkout.quantity + DELIVERY_CHARGE}</span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutStep('payment')}
                disabled={!address || checkout.quantity <= 0}
                className="bg-leaf text-paper font-semibold py-2.5 w-full mt-4 rounded-lg hover:bg-leaf-dark transition-colors disabled:opacity-50 shadow"
              >
                Proceed to Payment →
              </button>
            </div>
          )}

          {checkout && checkoutStep === 'payment' && (
            <div className="border border-leaf bg-emerald-50/30 rounded-xl p-5 mb-8 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-xl text-leaf-dark font-bold">Select Payment</h3>
                <button onClick={() => setCheckout(null)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
              </div>
              <p className="text-xs text-ink/60 mb-3">Choose preferred payment option</p>

              <div className="flex flex-col gap-2 mb-4">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m} className={`flex items-center gap-2.5 text-xs font-medium border rounded-lg px-3 py-2.5 cursor-pointer transition ${paymentMethod === m ? 'border-leaf bg-lime-100/60 font-bold' : 'border-soil/20 bg-paper'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                    {m}
                  </label>
                ))}
              </div>

              <div className="text-sm border-t border-soil/20 pt-2 flex justify-between font-bold text-emerald-950">
                <span>Total Payable:</span>
                <span>₹{checkout.listing.price_per_kg * checkout.quantity + DELIVERY_CHARGE}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setCheckoutStep('review')} className="flex-1 border border-soil/30 rounded-lg py-2 text-xs font-semibold">← Back</button>
                <button onClick={placeOrder} className="flex-1 bg-leaf text-paper rounded-lg py-2 text-xs font-bold hover:bg-leaf-dark transition-colors shadow">
                  Confirm & Pay
                </button>
              </div>
              {status && <p className="text-xs text-rust font-semibold mt-2">{status}</p>}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-leaf-dark font-semibold">Order History</h2>
            <span className="text-xs text-soil font-semibold">{orders.length} orders</span>
          </div>

          <div className="flex flex-col gap-3 font-body text-sm">
            {orders.map((o) => (
              <div key={o.id} className="border border-soil/20 bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-emerald-950 text-sm">{o.listing?.crop_type ?? 'Grain Produce'}</span>
                    <span className="text-xs text-ink/60 block">{o.quantity_kg}kg · {o.payment_method ?? 'UPI'}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : o.status === 'out_for_delivery' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-100 text-stone-700'}`}>
                    {o.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-ink/70 text-xs mt-2 flex justify-between items-center border-t border-stone-100 pt-2">
                  <span>Total: <b>₹{o.total_amount}</b></span>
                  {o.status === 'delivered' && !ratedOrderIds.has(o.id) && (
                    <button
                      onClick={() => setRateOrder(o)}
                      className="bg-turmeric/20 text-soil font-bold text-xs px-2.5 py-1 rounded hover:bg-turmeric/40 transition"
                    >
                      ★ Rate Order
                    </button>
                  )}
                  {ratedOrderIds.has(o.id) && (
                    <span className="text-emerald-700 font-semibold text-xs">✓ Rated</span>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-ink/60 text-xs text-center py-6">No orders placed yet.</p>}
          </div>
        </section>

        {rateOrder && (
          <RateOrderModal
            order={rateOrder}
            onClose={() => setRateOrder(null)}
            onDone={() => { setRateOrder(null); setSuccessBanner('✓ Thank you! Your rating and review have been recorded.'); loadOrders() }}
          />
        )}
      </div>
    </div>
  )
}
