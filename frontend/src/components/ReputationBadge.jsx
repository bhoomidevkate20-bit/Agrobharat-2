import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ReputationBadge({ profileId, compact = false }) {
  const [rep, setRep] = useState(null)

  useEffect(() => {
    let active = true
    supabase
      .from('reputation_summary')
      .select('*')
      .eq('ratee_id', profileId)
      .maybeSingle()
      .then(({ data }) => { if (active) setRep(data) })
    return () => { active = false }
  }, [profileId])

  if (!rep) {
    return <span className="text-xs text-ink/40 font-body">No ratings yet</span>
  }

  if (compact) {
    return (
      <span className="grade-chip">
        ★ {rep.avg_quality ?? '—'} · {rep.orders_rated} orders
      </span>
    )
  }

  return (
    <div className="font-body text-xs text-ink/70 flex flex-col gap-0.5">
      <span>★ Quality {rep.avg_quality ?? '—'}/5 · Quantity accuracy {rep.avg_quantity_accuracy ?? '—'}/5 · Timeliness {rep.avg_timeliness ?? '—'}/5</span>
      <span className="text-ink/50">{rep.orders_rated} completed order{rep.orders_rated === 1 ? '' : 's'} rated</span>
    </div>
  )
}
