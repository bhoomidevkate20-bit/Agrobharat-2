import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button" key={n} onClick={() => onChange(n)}
          className={n <= value ? 'text-turmeric text-xl' : 'text-ink/20 text-xl'}
        >★</button>
      ))}
    </div>
  )
}

export default function RateOrderModal({ order, onClose, onDone }) {
  const { user } = useAuth()
  const [quality, setQuality] = useState(5)
  const [quantityAccuracy, setQuantityAccuracy] = useState(5)
  const [timeliness, setTimeliness] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setSubmitting(true)
    setError('')

    const rows = []
    // Rate the seller (farmer/fpo who owns the listing)
    if (order.listing?.owner_id) {
      rows.push({
        order_id: order.id,
        rater_id: user.id,
        ratee_id: order.listing.owner_id,
        ratee_role: order.listing.owner_role ?? 'farmer',
        quality, quantity_accuracy: quantityAccuracy, timeliness, comment
      })
    }

    // Rate the delivery agent too, if one was assigned to this order.
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('delivery_agent_id')
      .eq('order_id', order.id)
      .not('delivery_agent_id', 'is', null)
      .maybeSingle()

    if (delivery?.delivery_agent_id) {
      rows.push({
        order_id: order.id,
        rater_id: user.id,
        ratee_id: delivery.delivery_agent_id,
        ratee_role: 'delivery_agent',
        quality: timeliness, // for a delivery agent, "quality" of service maps to timeliness/handling
        quantity_accuracy: quantityAccuracy,
        timeliness,
        comment
      })
    }

    const { error: err } = await supabase.from('ratings').insert(rows)
    setSubmitting(false)
    if (err) { setError(err.message); return }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper max-w-sm w-full p-6 font-body">
        <h3 className="font-display text-xl text-leaf-dark mb-1">Rate this order</h3>
        <p className="text-sm text-ink/60 mb-4">{order.listing?.crop_type} · {order.quantity_kg}kg</p>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm mb-1">Product quality</p>
            <Stars value={quality} onChange={setQuality} />
          </div>
          <div>
            <p className="text-sm mb-1">Quantity accuracy</p>
            <Stars value={quantityAccuracy} onChange={setQuantityAccuracy} />
          </div>
          <div>
            <p className="text-sm mb-1">Timely delivery</p>
            <Stars value={timeliness} onChange={setTimeliness} />
          </div>
          <textarea
            placeholder="Optional comment" value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border border-soil/30 px-3 py-2 bg-paper" rows={2}
          />
        </div>

        {error && <p className="text-rust text-sm mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-soil/30 py-2">Cancel</button>
          <button
            onClick={submit} disabled={submitting}
            className="flex-1 bg-leaf text-paper py-2 hover:bg-leaf-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit rating'}
          </button>
        </div>
      </div>
    </div>
  )
}
