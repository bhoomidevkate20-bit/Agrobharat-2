const SAMPLE_RATES = [
  ['Wheat', '₹31.00/kg', '+1.1%'],
  ['Onion', '₹24.00/kg', '+4.3%'],
  ['Bajra', '₹34.00/kg', '-0.7%'],
  ['Jowar', '₹38.00/kg', '+2.8%'],
  ['Turmeric', '₹142.00/kg', '+0.9%'],
  ['Soybean', '₹43.20/kg', '-1.2%']
]

export default function TickerStrip() {
  const items = [...SAMPLE_RATES, ...SAMPLE_RATES]
  return (
    <div className="overflow-hidden bg-emerald-950 text-lime-100">
      <div className="ticker-track flex w-max gap-10 py-2 text-xs font-bold font-['DM_Sans']">
        <span className="flex items-center gap-2 pl-4">
          <span className="pulse-dot h-2 w-2 rounded-full bg-lime-300" /> LIVE MARKET INTELLIGENCE
        </span>
        {items.map(([name, price, change], i) => (
          <span key={i}>
            {name.toUpperCase()} {price}{' '}
            <em className={change.startsWith('-') ? 'text-orange-300 not-italic' : 'text-lime-300 not-italic'}>
              {change.startsWith('-') ? '↓' : '↑'} {change.replace('-', '')}
            </em>
          </span>
        ))}
      </div>
    </div>
  )
}
