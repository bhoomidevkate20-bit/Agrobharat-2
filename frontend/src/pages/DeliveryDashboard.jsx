import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import EarningsSummary from '../components/EarningsSummary'
import ReputationBadge from '../components/ReputationBadge'
import RouteOptimizer from '../components/RouteOptimizer'
import SubscriptionGate from '../components/SubscriptionGate'
import TransactionEasyPanel from '../components/TransactionEasyPanel'
import { useLanguage } from '../context/LanguageContext'

const NEXT_STATUS = {
  accepted: 'picked_up',
  picked_up: 'delivered'
}

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState([])
  const [mine, setMine] = useState([])

  async function load() {
    const { data: openJobs } = await supabase.from('deliveries').select('*').eq('status', 'open')
    setOpen(openJobs ?? [])

    const { data: myJobs } = await supabase
      .from('deliveries')
      .select('*')
      .eq('delivery_agent_id', user.id)
      .order('created_at', { ascending: false })
    setMine(myJobs ?? [])
  }

  useEffect(() => { load() }, [user])

  async function accept(job) {
    await supabase.from('deliveries').update({ delivery_agent_id: user.id, status: 'accepted' }).eq('id', job.id)
    load()
  }

  async function decline(job) {
    await supabase.from('deliveries').update({ status: 'declined' }).eq('id', job.id)
    load()
  }

  async function advance(job) {
    const next = NEXT_STATUS[job.status]
    if (!next) return
    await supabase.from('deliveries').update({ status: next }).eq('id', job.id)
    if (next === 'delivered') {
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', job.order_id)
    } else if (next === 'picked_up') {
      await supabase.from('orders').update({ status: 'out_for_delivery' }).eq('id', job.order_id)
    }
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <EarningsSummary />
        <div className="border border-soil/20 p-4 font-body">
          <p className="text-xs uppercase tracking-wide text-soil mb-1">{t('reputation')}</p>
          <ReputationBadge profileId={user.id} />
        </div>
      </div>

      <RouteOptimizer jobs={mine} />

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <h2 className="font-display text-2xl text-leaf-dark mb-4">Open delivery jobs</h2>
          <div className="flex flex-col gap-3 font-body text-sm">
            {open.map((j) => (
              <div key={j.id} className="border border-soil/20 p-4">
                <p>{j.pickup_location} → {j.dropoff_location}</p>
                <p className="text-ink/60 text-xs">{j.weight_kg} kg</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => accept(j)} className="bg-leaf text-paper text-xs px-3 py-1.5 hover:bg-leaf-dark transition-colors">Accept</button>
                  <button onClick={() => decline(j)} className="border border-rust text-rust text-xs px-3 py-1.5">Decline</button>
                </div>
              </div>
            ))}
            {open.length === 0 && <p className="text-ink/60">No open jobs right now.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-leaf-dark mb-4">{t('yourJobs')}</h2>
          <div className="flex flex-col gap-3 font-body text-sm">
            {mine.map((j) => (
              <div key={j.id} className="border border-soil/20 p-4">
                <p>{j.pickup_location} → {j.dropoff_location}</p>
                <p className="text-ink/60 text-xs capitalize">{j.status.replace('_', ' ')} · {j.weight_kg} kg</p>
                {NEXT_STATUS[j.status] && (
                  <button onClick={() => advance(j)} className="bg-leaf text-paper text-xs px-3 py-1.5 mt-2 hover:bg-leaf-dark transition-colors">
                    Mark as {NEXT_STATUS[j.status].replace('_', ' ')}
                  </button>
                )}
              </div>
            ))}
            {mine.length === 0 && <p className="text-ink/60">No accepted jobs yet.</p>}
          </div>

          <div className="mt-10">
            <SubscriptionGate label="Subscribe to add your payment details for cash collections.">
              <TransactionEasyPanel />
            </SubscriptionGate>
          </div>
        </section>
      </div>
    </div>
  )
}
