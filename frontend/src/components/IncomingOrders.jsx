import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function IncomingOrders({ listingIds }) {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])

  async function load() {
    if (!listingIds?.length) { setOrders([]); return }
    const { data } = await supabase
      .from('orders')
      .select('*, listing:listings(crop_type, location)')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
  }

  useEffect(() => { load() }, [JSON.stringify(listingIds)])

  async function confirmAndDispatch(order) {
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
    await supabase.from('deliveries').insert({
      order_id: order.id,
      pickup_location: profile?.location ?? 'Farm gate',
      dropoff_location: order.delivery_address,
      weight_kg: order.quantity_kg
    })
    load()
  }

  if (!orders.length) return <p className="font-body text-ink/60 text-sm">No incoming orders yet.</p>

  return (
    <div className="flex flex-col gap-3 font-body text-sm">
      {orders.map((o) => (
        <div key={o.id} className="border border-soil/20 p-3 flex items-center justify-between">
          <div>
            <div>{o.listing?.crop_type} · {o.quantity_kg}kg → {o.delivery_address}</div>
            <div className="text-xs text-ink/50 capitalize">{o.status.replace('_', ' ')}</div>
          </div>
          {o.status === 'placed' && (
            <button onClick={() => confirmAndDispatch(o)} className="bg-leaf text-paper text-xs px-3 py-1.5 hover:bg-leaf-dark transition-colors">
              Confirm & dispatch
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
