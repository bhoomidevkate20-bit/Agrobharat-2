import { useState, useEffect, useMemo } from 'react'
import {
  SUPPORTED_CROPS,
  MANDI_LOCATIONS,
  predictCropPrice,
  calculateFairPrice,
  forecastDemand,
  fetchWeatherAdvisory
} from '../lib/aiPriceModel'

export default function AiMarketHub() {
  const [selectedCropId, setSelectedCropId] = useState('wheat')
  const [selectedLocationId, setSelectedLocationId] = useState('pune')
  const [horizonDays, setHorizonDays] = useState(7)
  const [arrivalVolumeRatio, setArrivalVolumeRatio] = useState(1.0)
  const [rainfallDevMm, setRainfallDevMm] = useState(0)

  // Fair price calculator inputs
  const [calcQuantity, setCalcQuantity] = useState(250)
  const [calcDistance, setCalcDistance] = useState(45)

  // Weather state
  const [weatherData, setWeatherData] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(true)

  // Active Tab: 'price' | 'fairPrice' | 'demand' | 'weather'
  const [activeTab, setActiveTab] = useState('price')

  // Run Price Prediction Model
  const prediction = useMemo(() => {
    return predictCropPrice({
      cropId: selectedCropId,
      locationId: selectedLocationId,
      horizonDays,
      arrivalVolumeRatio,
      rainfallDevMm
    })
  }, [selectedCropId, selectedLocationId, horizonDays, arrivalVolumeRatio, rainfallDevMm])

  // Run Fair Price Recommender
  const fairPrice = useMemo(() => {
    return calculateFairPrice({
      cropId: selectedCropId,
      quantityKg: calcQuantity,
      distanceKm: calcDistance
    })
  }, [selectedCropId, calcQuantity, calcDistance])

  // Run Demand Forecast
  const demandForecast = useMemo(() => {
    return forecastDemand({ cropId: selectedCropId, weeksAhead: 4 })
  }, [selectedCropId])

  // Fetch Live Weather for selected location
  useEffect(() => {
    let active = true
    setLoadingWeather(true)
    fetchWeatherAdvisory(selectedLocationId).then((w) => {
      if (active) {
        setWeatherData(w)
        setLoadingWeather(false)
      }
    })
    return () => { active = false }
  }, [selectedLocationId])

  // SVG Chart Dimensions & Math
  const minVal = Math.min(...prediction.trajectory.map(t => t.lower), prediction.historical.d30) * 0.98
  const maxVal = Math.max(...prediction.trajectory.map(t => t.upper)) * 1.02
  const svgWidth = 600
  const svgHeight = 220
  const paddingX = 40
  const paddingY = 25

  const points = prediction.trajectory.map((pt, idx) => {
    const x = paddingX + (idx / (prediction.trajectory.length - 1)) * (svgWidth - paddingX * 2)
    const y = svgHeight - paddingY - ((pt.price - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2)
    const yUpper = svgHeight - paddingY - ((pt.upper - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2)
    const yLower = svgHeight - paddingY - ((pt.lower - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2)
    return { ...pt, x, y, yUpper, yLower }
  })

  // Confidence Corridor Polygon Area
  const upperPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yUpper}`).join(' ')
  const lowerPath = [...points].reverse().map((p) => `L ${p.x} ${p.yLower}`).join(' ')
  const areaCorridor = `${upperPath} ${lowerPath} Z`

  // Main Trajectory Polyline
  const trajectoryPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 font-['DM_Sans'] text-ink">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-leaf p-7 md:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-lime-300/10 px-3.5 py-1 text-xs font-bold text-lime-300 mb-3">
            <span className="pulse-dot h-2 w-2 rounded-full bg-lime-300" />
            AI & MACHINE LEARNING INTELLIGENCE
          </div>
          <h1 className="text-3xl md:text-5xl font-['Playfair_Display'] font-semibold leading-tight">
            Agricultural Price & Risk Intelligence
          </h1>
          <p className="mt-3 text-stone-200 text-sm md:text-base leading-relaxed">
            Gradient Boosted Decision Trees (XGBoost) price forecasting, Meta Prophet-style seasonal demand curves, and Open-Meteo hyperlocal weather risk advisory.
          </p>
        </div>

        {/* Global Controls */}
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-lime-300 block mb-1">Select Crop</label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-sm text-white font-medium focus:bg-emerald-900 focus:outline-none"
            >
              {SUPPORTED_CROPS.map(c => <option key={c.id} value={c.id} className="text-ink bg-white">{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-lime-300 block mb-1">Regional Mandi Hub</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-sm text-white font-medium focus:bg-emerald-900 focus:outline-none"
            >
              {MANDI_LOCATIONS.map(l => <option key={l.id} value={l.id} className="text-ink bg-white">{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-lime-300 block mb-1">Forecast Horizon</label>
            <div className="grid grid-cols-3 gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setHorizonDays(d)}
                  className={`text-xs font-bold py-1.5 rounded-lg transition ${horizonDays === d ? 'bg-lime-400 text-emerald-950 shadow' : 'text-stone-300 hover:text-white'}`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-200 pb-3">
        {[
          { id: 'price', label: '📈 XGBoost Price Prediction' },
          { id: 'fairPrice', label: '⚖️ Win-Win Fair Price Recommender' },
          { id: 'demand', label: '📦 Prophet Seasonal Demand' },
          { id: 'weather', label: '🌦️ Hyperlocal Weather Advisory' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm ${activeTab === t.id ? 'bg-leaf text-paper' : 'bg-white text-ink/70 hover:bg-lime-50 hover:text-emerald-950 border border-stone-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRICE PREDICTION */}
      {activeTab === 'price' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Forecast Graph */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-950 font-['Playfair_Display']">
                    {prediction.crop.name} Price Trajectory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Target: Next {horizonDays} days modal price (₹/quintal) · 95% Confidence Corridor
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${prediction.pctChange >= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                  {prediction.sentiment}
                </span>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Current Mandi Rate</p>
                  <p className="text-xl font-bold text-emerald-950 mt-1">₹{prediction.currentPrice}</p>
                  <p className="text-[11px] text-slate-400">₹{prediction.currentPricePerKg} / kg</p>
                </div>

                <div className="bg-lime-50 border border-lime-200 p-3 rounded-2xl">
                  <p className="text-[11px] text-lime-800 font-semibold uppercase">AI Forecast ({horizonDays}d)</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">₹{prediction.predictedPrice}</p>
                  <p className="text-[11px] text-lime-700 font-bold">₹{prediction.predictedPerKg} / kg</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Expected Shift</p>
                  <p className={`text-xl font-bold mt-1 ${prediction.pctChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {prediction.pctChange >= 0 ? `+${prediction.pctChange}%` : `${prediction.pctChange}%`}
                  </p>
                  <p className="text-[11px] text-slate-400">vs today's modal</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">95% Range (Tree σ)</p>
                  <p className="text-base font-bold text-slate-800 mt-1">₹{prediction.lowerBound} - ₹{prediction.upperBound}</p>
                  <p className="text-[11px] text-slate-400">±₹{(prediction.upperBound - prediction.predictedPrice)}</p>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="bg-gradient-to-b from-stone-50/60 to-white rounded-2xl border border-stone-100 p-3 overflow-hidden">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75].map((ratio, i) => (
                    <line
                      key={i}
                      x1={paddingX}
                      x2={svgWidth - paddingX}
                      y1={paddingY + ratio * (svgHeight - paddingY * 2)}
                      y2={paddingY + ratio * (svgHeight - paddingY * 2)}
                      stroke="#e5e7eb"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* 95% Confidence Corridor Shaded Area */}
                  <path d={areaCorridor} fill="#84cc16" fillOpacity="0.14" />

                  {/* Prediction Trajectory Line */}
                  <path d={trajectoryPath} fill="none" stroke="#2f5233" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Points */}
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r={i === points.length - 1 ? 5 : 3.5} fill="#2f5233" stroke="#fff" strokeWidth="2" />
                      <text x={pt.x} y={svgHeight - 8} fontSize="10" textAnchor="middle" fill="#64748b" fontWeight="600">
                        {pt.day}
                      </text>
                      <text x={pt.x} y={pt.y - 10} fontSize="10" textAnchor="middle" fill="#1f3a22" fontWeight="700">
                        ₹{pt.price}
                      </text>
                    </g>
                  ))}
                </svg>
                <div className="flex justify-between items-center text-[11px] text-slate-400 px-2 mt-1">
                  <span>● Shaded zone: 95% Confidence Corridor (Tree Ensembles)</span>
                  <span>Source: Agmarknet + Open-Meteo Feature Store</span>
                </div>
              </div>
            </div>

            {/* What-If Simulation Controls */}
            <div className="mt-6 pt-5 border-t border-stone-200">
              <h3 className="text-sm font-bold text-emerald-950 mb-3">🧪 Run "What-If" Market Shock Scenario</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-600">Mandi Arrival Volume (Supply Shock):</span>
                    <span className="font-bold text-emerald-900">{Math.round((arrivalVolumeRatio - 1) * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0.7" max="1.3" step="0.05"
                    value={arrivalVolumeRatio}
                    onChange={(e) => setArrivalVolumeRatio(Number(e.target.value))}
                    className="w-full accent-lime-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>-30% (Scarcity Surge)</span>
                    <span>Normal (1.0x)</span>
                    <span>+30% (Supply Glut)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-600">Rainfall / Monsoon Deviation (mm):</span>
                    <span className="font-bold text-emerald-900">{rainfallDevMm > 0 ? `+${rainfallDevMm}mm` : `${rainfallDevMm}mm`}</span>
                  </div>
                  <input
                    type="range" min="-40" max="60" step="5"
                    value={rainfallDevMm}
                    onChange={(e) => setRainfallDevMm(Number(e.target.value))}
                    className="w-full accent-lime-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>-40mm (Drought Stress)</span>
                    <span>0mm</span>
                    <span>+60mm (Excess Rain)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Feature Importance & Agronomic Advice */}
          <div className="flex flex-col gap-5">
            {/* Feature Importance (Shapley Values) */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime-100 text-lime-800 text-sm font-bold">⌘</span>
                <div>
                  <h3 className="font-bold text-emerald-950 text-base">Key Price Drivers (SHAP)</h3>
                  <p className="text-[11px] text-slate-400">Gradient boosted decision tree feature attribution</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {prediction.featureAttributions.map((f, i) => (
                  <div key={i} className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-700">{f.name}</span>
                      <span className={`font-bold ${f.direction === 'up' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {f.impactRs >= 0 ? `+₹${f.impactRs}/qtl` : `-₹${Math.abs(f.impactRs)}/qtl`}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${f.direction === 'up' ? 'bg-emerald-600' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Math.max(15, Math.abs(f.impactRs) / 3))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-slate-500">
                Data sources: <b>Agmarknet</b> 30-day historical modal price, <b>data.gov.in</b> daily arrivals, and <b>Open-Meteo</b> meteorological deviations.
              </div>
            </div>

            {/* Farmer Trading Recommendation */}
            <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💡</span>
                <h3 className="font-bold text-lime-300 text-sm uppercase tracking-wider">AI Selling Advisory</h3>
              </div>
              <p className="text-sm text-stone-200 leading-relaxed mt-2">
                {prediction.pctChange > 3 ? (
                  <>Prices are trending <b>upward (+{prediction.pctChange}%)</b> due to strong festive demand and moderate arrivals. <b>Recommendation:</b> If you have proper moisture-proof storage, hold stock for 7–10 days to maximize realization.</>
                ) : prediction.pctChange < -3 ? (
                  <>Prices are expected to face <b>downward pressure ({prediction.pctChange}%)</b> as regional harvest arrivals surge. <b>Recommendation:</b> List harvest immediately on Agro Bharat to lock in prevailing rates before market supply gluts peak.</>
                ) : (
                  <>Market prices remain <b>stable (±{Math.abs(prediction.pctChange)}%)</b> in the current trading band. <b>Recommendation:</b> Sell in structured lots via FPO direct bidding to eliminate local commission agents.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WIN-WIN FAIR PRICE RECOMMENDER */}
      {activeTab === 'fairPrice' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-bold text-emerald-950 font-['Playfair_Display'] mb-1">
              Buyer-Seller Fair Price Recommender
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Weighted economic formula eliminating middleman margins: Farmer receives above local mandi, Buyer pays below retail supermarket.
            </p>

            {/* Sliders */}
            <div className="grid sm:grid-cols-2 gap-5 mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-200">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">Lot Quantity:</span>
                  <span className="font-bold text-emerald-900">{calcQuantity} kg ({calcQuantity / 100} quintals)</span>
                </div>
                <input
                  type="range" min="50" max="2000" step="50"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  className="w-full accent-lime-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">Transport Distance:</span>
                  <span className="font-bold text-emerald-900">{calcDistance} km</span>
                </div>
                <input
                  type="range" min="5" max="300" step="5"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(Number(e.target.value))}
                  className="w-full accent-lime-600 cursor-pointer"
                />
              </div>
            </div>

            {/* The 3-Tier Price Spectrum */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Price Spectrum (₹ / kg)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-stone-100 border border-stone-300 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Local Mandi Floor</p>
                  <p className="text-2xl font-bold text-slate-800 my-1">₹{fairPrice.mandiFloorRate}</p>
                  <p className="text-[11px] text-slate-500">Local APMC baseline</p>
                </div>

                <div className="bg-lime-100 border-2 border-lime-500 p-4 rounded-2xl shadow-md scale-105 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-900 text-lime-300 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ★ Win-Win AI Recommended
                  </span>
                  <p className="text-[10px] font-bold text-emerald-900 uppercase">Agro Bharat Fair Rate</p>
                  <p className="text-3xl font-extrabold text-emerald-950 my-1">₹{fairPrice.recommendedFairPrice}</p>
                  <p className="text-[11px] text-emerald-800 font-semibold">Per Kg Direct Deal</p>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-orange-800 uppercase">City Retail Ceiling</p>
                  <p className="text-2xl font-bold text-orange-950 my-1">₹{fairPrice.retailCeilingRate}</p>
                  <p className="text-[11px] text-orange-700">Urban market price</p>
                </div>
              </div>
            </div>

            {/* Economic Dividends */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900">🌾 Farmer Direct Upside</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1">+₹{fairPrice.farmerGainTotal.toLocaleString()}</p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  <b>+{fairPrice.farmerGainPct}%</b> higher profit than selling at local APMC distress rates.
                </p>
              </div>

              <div className="bg-lime-50 border border-lime-200 p-4 rounded-2xl">
                <p className="text-xs font-bold text-lime-900">🛒 Buyer / Wholesale Savings</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1">-₹{fairPrice.buyerSavingTotal.toLocaleString()}</p>
                <p className="text-xs text-lime-800 mt-0.5">
                  <b>-{fairPrice.buyerSavingPct}%</b> lower cost than sourcing through middlemen channels.
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Logic */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-emerald-950 text-base mb-2">Cost & Margin Breakdown</h3>
              <p className="text-xs text-slate-500 mb-4">How the win-win division is calculated:</p>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-slate-600">Transport Logistics ({calcDistance}km):</span>
                  <span className="font-bold text-slate-900">₹{fairPrice.transportCostTotal} (₹{fairPrice.transportCostPerKg}/kg)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-slate-600">Local Mandi Floor Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{(fairPrice.mandiFloorRate * calcQuantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-slate-600">Fair Deal Subtotal:</span>
                  <span className="font-bold text-emerald-800">₹{(fairPrice.recommendedFairPrice * calcQuantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-slate-600">Retail City Equivalent:</span>
                  <span className="font-bold text-slate-900">₹{(fairPrice.retailCeilingRate * calcQuantity).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-husk/40 p-4 rounded-2xl border border-soil/20 text-xs">
              <p className="font-bold text-leaf-dark mb-1">Formula Architecture:</p>
              <p className="text-ink/70">
                <code>Recommended = Mandi + 0.58 × (Retail - Mandi - Logistics)</code>
              </p>
              <p className="text-[11px] text-ink/50 mt-2">
                Guarantees incentives for both sides to transact on Agro Bharat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROPHET SEASONAL DEMAND */}
      {activeTab === 'demand' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-950 font-['Playfair_Display']">
                Meta Prophet Seasonal Demand Forecast
              </h2>
              <p className="text-xs text-slate-500">
                Decomposing grain consumption cycles into yearly trend, festive surges, and regional consumption indices.
              </p>
            </div>
            {demandForecast.isFestiveSeason && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                🎉 Active Festive Demand Period
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {demandForecast.weeklyForecast.map((w, idx) => (
              <div key={idx} className="bg-stone-50 border border-stone-200 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 block mb-1">{w.week} Projection</span>
                <p className="text-3xl font-extrabold text-emerald-950">{w.expectedDemandQuintals}</p>
                <p className="text-xs text-slate-500 mt-1">Quintals anticipated</p>
                <span className="inline-block mt-3 text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                  {w.status}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-lime-50/60 border border-lime-200 p-5 rounded-2xl text-xs text-emerald-950 leading-relaxed">
            <b className="block text-sm mb-1 text-emerald-900">Demand Modeling Insight:</b>
            Grain consumption for <b>{demandForecast.crop.name}</b> experiences cyclical peaks around post-harvest milling and festive calendar spikes. By monitoring platform search volume and historical buyer purchases, Agro Bharat ensures FPOs and Farmers know when to aggregate lots for maximum sales liquidity.
          </div>
        </div>
      )}

      {/* TAB 4: HYPERLOCAL WEATHER ADVISORY */}
      {activeTab === 'weather' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-emerald-950 font-['Playfair_Display']">
                  Hyperlocal Weather Risk Advisory
                </h2>
                {weatherData?.isLive && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    ● Live Open-Meteo Feed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Real-time meteorological monitoring for {weatherData?.location.name} (Lat: {weatherData?.location.lat}, Lon: {weatherData?.location.lon})
              </p>
            </div>
            {weatherData && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${weatherData.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                Risk Level: {weatherData.riskLevel}
              </span>
            )}
          </div>

          {loadingWeather ? (
            <p className="text-center py-10 text-sm text-slate-400">Loading hyperlocal weather data…</p>
          ) : weatherData && (
            <div>
              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Current Temperature</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">{weatherData.currentTemp}°C</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Relative Humidity</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">{weatherData.humidity}%</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Peak 7d Rain Prob.</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">{weatherData.maxRainProb}%</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Cumulative Rain</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">{weatherData.totalRainMm} mm</p>
                </div>
              </div>

              {/* Action Advisory Box */}
              <div className={`p-5 rounded-2xl border text-sm leading-relaxed mb-6 ${weatherData.riskLevel === 'HIGH ALERT' ? 'bg-red-50 border-red-200 text-red-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'}`}>
                <b className="block font-bold mb-1">📢 Agronomic Advisory:</b>
                {weatherData.advisory}
              </div>

              {/* 7-Day Precipitation Bars */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">7-Day Rain Probability (%)</h3>
                <div className="grid grid-cols-7 gap-2">
                  {weatherData.dailyRainProb.map((prob, i) => (
                    <div key={i} className="flex flex-col items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-center">
                      <span className="text-[10px] text-slate-400 font-semibold">Day +{i + 1}</span>
                      <div className="w-full bg-stone-200 h-16 rounded-lg my-1.5 flex items-end overflow-hidden p-0.5">
                        <div
                          className={`w-full rounded-md transition-all ${prob > 60 ? 'bg-rose-500' : (prob > 30 ? 'bg-amber-500' : 'bg-lime-500')}`}
                          style={{ height: `${Math.max(10, prob)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{prob}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
