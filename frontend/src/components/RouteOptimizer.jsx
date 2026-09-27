import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function RouteOptimizer({ jobs }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState([])

  const candidates = jobs.filter((j) => j.status === 'accepted' || j.status === 'picked_up')

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function openRoute() {
    const chosen = candidates.filter((j) => selected.includes(j.id))
    if (chosen.length === 0) return

    const stops = chosen.map((j) => j.dropoff_location)
    const origin = encodeURIComponent(chosen[0].pickup_location)
    const destination = encodeURIComponent(stops[stops.length - 1])
    const waypoints = stops.slice(0, -1).map(encodeURIComponent).join('|')

    const url = new URL('https://www.google.com/maps/dir/')
    url.searchParams.set('api', '1')
    url.searchParams.set('origin', origin)
    url.searchParams.set('destination', destination)
    url.searchParams.set('travelmode', 'driving')
    if (waypoints) url.searchParams.set('waypoints', `optimize:true|${waypoints}`)

    window.open(url.toString(), '_blank')
  }

  if (candidates.length < 2) return null

  return (
    <div className="border border-soil/20 p-4 font-body mb-4">
      <p className="text-sm font-medium text-leaf-dark mb-2">{t('selectJobs')}</p>
      <div className="flex flex-col gap-2 mb-3">
        {candidates.map((j) => (
          <label key={j.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(j.id)} onChange={() => toggle(j.id)} />
            {j.pickup_location} → {j.dropoff_location}
          </label>
        ))}
      </div>
      <button
        onClick={openRoute}
        disabled={selected.length === 0}
        className="bg-leaf text-paper text-sm px-4 py-2 hover:bg-leaf-dark transition-colors disabled:opacity-50"
      >
        {t('planRoute')} ({selected.length})
      </button>
      <p className="text-xs text-ink/50 mt-2">
        Opens Google Maps with all selected stops, reordered for the shortest driving route.
      </p>
    </div>
  )
}
