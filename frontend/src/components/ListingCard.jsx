export default function ListingCard({ listing, action }) {
  return (
    <div className="border border-soil/20 bg-husk/40 p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <h3 className="font-display text-xl text-leaf-dark">{listing.crop_type}</h3>
        {listing.grade && <span className="grade-chip">Grade {listing.grade}</span>}
      </div>
      <p className="font-body text-sm text-ink/70">{listing.location}</p>
      <div className="flex items-baseline gap-1 font-body">
        <span className="text-lg text-ink">₹{listing.price_per_kg}</span>
        <span className="text-xs text-ink/60">/ kg</span>
      </div>
      <p className="font-body text-xs text-ink/60">
        {listing.quantity_kg} kg available
        {listing.expiry_date ? ` · best before ${listing.expiry_date}` : ''}
      </p>
      {listing.status !== 'approved' && (
        <span className="text-xs text-rust font-body">Status: {listing.status.replace('_', ' ')}</span>
      )}
      {action}
    </div>
  )
}
