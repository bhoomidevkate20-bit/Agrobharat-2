import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabaseClient'

export default function SubscriptionGate({ children, label }) {
  const { profile, user } = useAuth()
  const { t } = useLanguage()

  async function subscribe() {
    // Mock activation — no real payment gateway wired up yet.
    // Swap this for a real payment confirmation before going live.
    await supabase.from('profiles').update({ is_subscribed: true }).eq('id', user.id)
    window.location.reload()
  }

  if (profile?.is_subscribed) return children

  return (
    <div className="border border-dashed border-soil/30 bg-husk/30 p-6 text-center font-body">
      <p className="text-ink/70 text-sm mb-3">
        {label ?? t('subscribeToUnlock')}
      </p>
      <button
        onClick={subscribe}
        className="bg-turmeric text-ink font-medium px-5 py-2 hover:opacity-90 transition-opacity"
      >
        {t('subscribe')} — ₹299/month
      </button>
    </div>
  )
}
