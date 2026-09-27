import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

function MyCredentials() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    certified_id: profile?.certified_id ?? '',
    qualification: profile?.qualification ?? ''
  })
  const [status, setStatus] = useState('')

  async function save() {
    setStatus('Saving…')
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setStatus(error ? error.message : 'Saved — visible on FPO dashboards that assign you.')
  }

  return (
    <div className="border border-soil/20 p-5 font-body mb-8 max-w-xl">
      <h3 className="font-display text-lg text-leaf-dark mb-1">My certification</h3>
      <p className="text-xs text-ink/60 mb-3">
        Only you can edit this. FPOs that assign you as their field inspector will see it, read-only.
      </p>
      <div className="flex flex-col gap-3">
        <input
          placeholder="Certified inspector ID" value={form.certified_id}
          onChange={(e) => setForm({ ...form, certified_id: e.target.value })}
          className="border border-soil/30 px-3 py-2 bg-paper text-sm"
        />
        <input
          placeholder="Qualification (e.g. B.Sc Agriculture, FSSAI grading cert.)" value={form.qualification}
          onChange={(e) => setForm({ ...form, qualification: e.target.value })}
          className="border border-soil/30 px-3 py-2 bg-paper text-sm"
        />
        <button onClick={save} className="bg-leaf text-paper text-sm py-2 hover:bg-leaf-dark transition-colors">
          Save credentials
        </button>
        {status && <p className="text-xs text-soil">{status}</p>}
      </div>
    </div>
  )
}

export default function InspectorDashboard() {
  const [pending, setPending] = useState([])
  const [drafts, setDrafts] = useState({})

  async function load() {
    const { data } = await supabase.from('listings').select('*').eq('status', 'pending_inspection')
    setPending(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function submitGrade(listing) {
    const draft = drafts[listing.id]
    if (!draft?.grade) return
    await supabase.from('listings').update({
      grade: draft.grade,
      expiry_date: draft.expiry_date || null,
      status: 'approved'
    }).eq('id', listing.id)
    load()
  }

  async function reject(listing) {
    await supabase.from('listings').update({ status: 'rejected' }).eq('id', listing.id)
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <MyCredentials />
      <h2 className="font-display text-2xl text-leaf-dark mb-4">Listings awaiting inspection</h2>
      <div className="flex flex-col gap-4 font-body text-sm">
        {pending.map((l) => (
          <div key={l.id} className="border border-soil/20 p-4">
            <p className="font-display text-lg text-leaf-dark">{l.crop_type} — {l.quantity_kg}kg</p>
            <p className="text-ink/60 text-xs">{l.location} · moisture {l.moisture_pct ?? '—'}%</p>
            <div className="flex gap-2 mt-3">
              <select
                value={drafts[l.id]?.grade ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [l.id]: { ...drafts[l.id], grade: e.target.value } })}
                className="border border-soil/30 px-2 py-1"
              >
                <option value="">Grade</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
              <input
                type="date"
                value={drafts[l.id]?.expiry_date ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [l.id]: { ...drafts[l.id], expiry_date: e.target.value } })}
                className="border border-soil/30 px-2 py-1"
              />
              <button onClick={() => submitGrade(l)} className="bg-leaf text-paper px-3 py-1.5 hover:bg-leaf-dark transition-colors">Approve</button>
              <button onClick={() => reject(l)} className="border border-rust text-rust px-3 py-1.5">Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-ink/60">Nothing waiting on inspection.</p>}
      </div>
    </div>
  )
}
