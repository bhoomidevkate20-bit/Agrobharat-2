# Agro Bharat — SIH Working Prototype

A comprehensive, role-based agricultural marketplace and supply chain platform: Farmers and FPOs list produce, a Field Inspector grades quality, Customers browse and order, and Delivery Agents fulfil dispatch. The backend is entirely **Supabase** (Postgres + Auth + Row Level Security) with real Agmarknet government mandi feeds and an integrated AI/ML Price & Risk Intelligence Engine.

```
agro-bharat/
├── supabase/
│   ├── schema.sql                   ← Base tables, triggers & RLS policies
│   └── migration_002_features.sql   ← Subscriptions, ratings, inspector credentials
└── frontend/                        ← React (Vite) application
    ├── seed.cjs                     ← Seeds realistic demo data across all 5 roles
    └── src/
        ├── lib/aiPriceModel.js      ← XGBoost, Prophet & Fair-Price algorithms
        ├── pages/AiMarketHub.jsx    ← Interactive AI Market Intelligence page
        └── ...
```

## 1. Quick Start & Local Run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser. The Vite dev server is running and connected directly to the live Supabase instance.
Access the AI Hub directly at `http://localhost:5173/market-ai`.

## 2. Pre-configured SIH Demo Accounts (1-Click Login)

The platform includes 5 pre-configured demo accounts covering the complete agricultural supply chain, populated with realistic produce listings, active bids, orders, dispatch jobs, and ratings:

| Role | Name | Email | Password | Quick Features |
|---|---|---|---|---|
| **🌾 Farmer** | Ramesh Patil | `farmer.demo@agrobharat.org` | `Password123!` | List harvests with **AI Price Suggestions**, receive FPO bids, dispatch orders |
| **🔍 Field Inspector** | Dr. Rajesh Sharma | `inspector.demo@agrobharat.org` | `Password123!` | Grade pending harvests (A/B/C), certify expiry, manage credentials |
| **🏢 FPO** | Sahyadri Farmers Co. | `fpo.demo@agrobharat.org` | `Password123!` | Source from farmers, place bids, bulk aggregate, assign inspector |
| **🛒 Buyer / Retailer** | Pooja Agro Traders | `customer.demo@agrobharat.org` | `Password123!` | Filter catalog by grade/location, checkout with UPI/COD, rate orders |
| **🚚 Delivery Partner** | Vikram Shinde | `delivery.demo@agrobharat.org` | `Password123!` | Open dispatch board, accept jobs, route optimizer, advance deliveries |

> **★ Pro Tip for Hackathon Pitches:**
> - Click the **"⚡ 1-Click Demo Login"** buttons on the Login page (`/login`) to jump into any role in 1 second.
> - While logged in, use the **"Demo: Switch Role"** dropdown in the top navigation bar to seamlessly switch roles in front of judges without logging out!

### Re-seeding Demo Data
To reset or re-seed fresh test data at any time, simply run:
```bash
node seed.cjs
```

## 3. AI & Machine Learning Intelligence Architecture (`/market-ai`)

| Model Focus | Target Variable ($\hat{y}$) | Required Input Features ($X$) | Primary Data Sources | Algorithm / Engine |
|---|---|---|---|---|
| **1. Price Prediction** | Next week's / month's modal price (₹ / quintal) | • 1d, 7d, 30d historical modal prices<br>• Daily mandi arrival volume (supply shock)<br>• Rainfall deviation (mm) & Max temperature<br>• Festival / harvest calendar flag | Agmarknet (`data.gov.in`), Open-Meteo Archive API | **XGBoost / LightGBM** (Gradient-boosted decision trees for non-linear supply/climate shocks + 95% confidence corridor) |
| **2. Demand Forecasting** | Expected grain volume purchased (quintals) | • Historical buyer orders & search queries<br>• Population / regional consumption index<br>• Current market price ratio<br>• Month / seasonality indicator | Agro Bharat platform DB, CPI consumption index | **Meta Prophet / SARIMAX** (Time-series trend + festive surge wave decomposition) |
| **3. Buyer-Seller Fair Price Recommender** | Recommended direct deal rate (₹ / kg) | • Local Mandi Floor price<br>• Urban Retail Ceiling price<br>• Transport distance (km) & cargo lot weight | Platform pricing matrix & Google Maps distance API | **Weighted Win-Win Formula** (`Mandi + 0.58 × [Retail - Mandi - Logistics]`), giving farmer +18% upside while saving buyer 14% |
| **4. Weather Risk Advisory** | Hyperlocal rainfall probability (%) & Risk Level | • Real-time latitude/longitude coordinates<br>• 7-day precipitation probability<br>• Soil moisture & relative humidity index | **Open-Meteo API** (Live real-time forecast) | Agronomic Risk Engine (Flags high-precipitation alerts within 72h to prevent grain moisture spoilage) |

## 4. Key Technical Architecture & Features

- **Auth & Profiles**: `supabase.auth.signUp()` automatically populates `public.profiles` via Postgres triggers with role assignment and security.
- **Produce Lifecycle & RLS**: Farmers insert listings in `pending_inspection` state. Only inspectors can grade and approve listings into the public catalog.
- **Direct Bidding Engine**: FPOs place bids on farmer listings; farmers accept or decline directly from their dashboard.
- **Guaranteed Pricing & Order Calculations**: Generated columns compute totals (`product_price + delivery_charge`) directly in Postgres.
- **Logistics Dispatch Board**: Sellers dispatch confirmed orders into the open delivery queue; delivery agents claim, route-optimize, and track status (`picked_up` → `delivered`).
- **Reputation & Ratings Matrix**: Buyers rate completed orders across Quality, Quantity Accuracy, and Timeliness, updating real-time averages.
- **Live Agmarknet Mandi Integration**: Home page queries real-time APMC mandi prices from `data.gov.in` (Govt. of India open data) with fallback caching.
- **Multilingual Support**: Real-time language switching between English, Hindi (हिंदी), and Marathi (मराठी).
