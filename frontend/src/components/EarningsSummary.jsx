import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function EarningsSummary() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user || !profile) return
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()

      if (profile.role === 'customer') {
        const { data } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('buyer_id', user.id)
          .gte('created_at', yearStart)
        setTotal((data ?? []).reduce((sum, o) => sum + Number(o.total_amount), 0))
      }

      if (profile.role === 'farmer' || profile.role === 'fpo') {
        const { data: listings } = await supabase.from('listings').select('id').eq('owner_id', user.id)
        const ids = (listings ?? []).map((l) => l.id)
        if (ids.length) {
          const { data: orders } = await supabase
            .from('orders')
            .select('product_price')
            .in('listing_id', ids)
            .eq('status', 'delivered')
          setTotal((orders ?? []).reduce((sum, o) => sum + Number(o.product_price), 0))
        }
      }

      if (profile.role === 'delivery_agent') {
        const { data: deliveries } = await supabase
          .from('deliveries')
          .select('order:orders(delivery_charge)')
          .eq('delivery_agent_id', user.id)
          .eq('status', 'delivered')
        setTotal((deliveries ?? []).reduce((sum, d) => sum + Number(d.order?.delivery_charge ?? 0), 0))
      }

      setLoading(false)
    }
    load()
  }, [user, profile])

  if (!profile) return null

  const label = profile.role === 'customer' ? t('yearlySpend') : t('netEarnings')

  return (
    <div className="border border-soil/20 bg-husk/40 p-4 font-body">
      <p className="text-xs uppercase tracking-wide text-soil">{label}</p>
      <p className="text-2xl text-leaf-dark font-display">
        {loading ? '…' : `₹${total.toLocaleString('en-IN')}`}
      </p>
      <p className="text-xs text-ink/50 mt-1">
        {profile.role === 'customer' ? 'Calendar year to date' : 'From delivered orders only'}
      </p>
    </div>
  )
}
