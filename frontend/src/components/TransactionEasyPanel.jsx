import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabaseClient'

export default function TransactionEasyPanel() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [form, setForm] = useState({
    upi_id: profile?.upi_id ?? '',
    payment_phone: profile?.payment_phone ?? '',
    qr_image_url: profile?.qr_image_url ?? ''
  })
  const [status, setStatus] = useState('')

  async function save() {
    setStatus('Saving…')
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setStatus(error ? error.message : 'Saved.')
  }

  return (
    <div className="border border-soil/20 p-5 font-body">
      <h3 className="font-display text-lg text-leaf-dark mb-1">{t('makeTransactionEasy')}</h3>
      <p className="text-xs text-ink/60 mb-4">
        Shown to buyers so they can pay you directly — add whichever you use.
      </p>
      <div className="flex flex-col gap-3">
        <input
          placeholder="UPI ID (e.g. yourname@okhdfcbank)" value={form.upi_id}
          onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
          className="border border-soil/30 px-3 py-2 bg-paper text-sm"
        />
        <input
          placeholder="Phone number linked to UPI" value={form.payment_phone}
          onChange={(e) => setForm({ ...form, payment_phone: e.target.value })}
          className="border border-soil/30 px-3 py-2 bg-paper text-sm"
        />
        <input
          placeholder="QR code image URL (optional)" value={form.qr_image_url}
          onChange={(e) => setForm({ ...form, qr_image_url: e.target.value })}
          className="border border-soil/30 px-3 py-2 bg-paper text-sm"
        />
        {form.qr_image_url && (
          <img src={form.qr_image_url} alt="Payment QR" className="w-28 h-28 object-contain border border-soil/20" />
        )}
        <button onClick={save} className="bg-leaf text-paper text-sm py-2 hover:bg-leaf-dark transition-colors">
          Save payment details
        </button>
        {status && <p className="text-xs text-soil">{status}</p>}
      </div>
    </div>
  )
}
