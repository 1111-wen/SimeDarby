# FloodSafe Route — Bandar Bukit Raja Sponge Township

A flood-aware map and evacuation routing progressive web app (PWA) for **Bandar Bukit Raja (BBR), Klang, Selangor**, piloted around **Taman Kyra, Taman Casira and Jalan Makyong**, areas with reported floods in 2023 and 2024.

Built for the **Sime Darby Property University Hackathon 2026** ("Township of Tomorrow" — People & Sustainability themes). Designed to work for flood-prone townships across Malaysia.

> **Safety Disclaimer:** This application is a prototype demonstrating hydrodynamic flood simulation, AI river stage forecasting, and sponge township integration. It supports official emergency notices and never replaces them. Always follow PDRM, Bomba, APM, and NADMA directives, and dial 999 in an emergency.

> **Data Status:** Roads, buildings, water bodies, and drains are verified OpenStreetMap and OpenFreeMap vector geometries. The river-level forecasting model is trained on **real JPS Infobanjir telemetry records** from 3 companion stations across Q4 2024. Road surface inundation depths are computed from Sg. Binjai river levels and Digital Elevation Model (DEM) ground elevations.

---

## What It Does & Key Capabilities

### 1. 🌿💧⚙️ Sponge City Framework (MSMA / JPS Guidelines)
- **🌿 Green Infrastructure:** Urban parks, community rain gardens, bioswales, and porous ground covers.
- **💧 Blue Infrastructure:** 125-acre Bandar Bukit Raja Wetland system, retention lakes, detention ponds, and widened stream corridors.
- **🚰 Gray Infrastructure:** Reinforced Concrete Box Culverts (RCBC), monsoon U-drains, and roadside intake sumps.
- **Township HUD:** Live retention meter tracking total stored stormwater volume ($m^3$) and capacity percentage.

### 2. 🔮 Sg. Binjai di Pekan Meru AI Forecasting & Multi-Station Hydrology (25/11/2024 to 05/12/2024)
- **Why 3 Stations Predict Sg. Binjai Only:**
  1. **Connected River Basin Network (Upstream vs. Downstream):** Sg. Binjai di Pekan Meru (3112401) is upstream; Sg. Rasau (3014001) and Sg. Klang (3014004) are downstream.
  2. **Downstream Backwater Effect:** When downstream Sg. Klang and Sg. Rasau are full, water draining from upstream Sg. Binjai cannot discharge freely, causing water to pile up at Pekan Meru.
  3. **XGBoost Mathematical Weighting:** Trained on thousands of hours of historical telemetry, XGBoost evaluates upstream rainfall accumulation ($1\text{h}\dots24\text{h}$) and downstream river levels to compute a single, highly accurate 3-hour ahead forecast specifically for **Sungai Binjai**.
- **241-Hour Verified Scrubber Window (25 Nov 2024 00:00 to 05 Dec 2024 00:00):**
  - `🌤️ 25 Nov (Normal)`: Baseline flow (~3.22 m).
  - `⚠️ 27 Nov 23:00 (Alert)`: Pre-monsoon storm runoff pushing stage past 3.52 m.
  - `🌧️ 28 Nov 20:00 (Danger)`: Heavy downpour pushing stage into JPS Danger category (4.62 m).
  - `🚨 29 Nov 04:00 (Peak Crest)`: Actual flood crest at **4.76 m (JPS Danger $\ge 4.50\text{m}$)**, accurately anticipated by XGBoost at **4.72 m** with zero phase lag.
  - `📉 01 Dec (Recession)`: Post-surge drainage as water recedes to 3.55 m.
  - `🌊 05 Dec (Safe Flow)`: Safe baseline flow (2.97 m).

### 3. 📍 AI Area & Time Flood Inundation Engine (Topographic DEM Calculation)
- **River Water Level vs Road Surface Inundation Depth:**
  $$\text{Road Surface Depth } d_{\text{road}} = \max\left(0, \text{River Stage} - Z_{\text{ground elevation}}\right)$$
  - **Pekan Meru Riverbank Dip (Elev: 3.80m):** Floods when river stage $\ge 4.20\text{m}$ (depth up to 60 cm).
  - **Jalan Makyong 5A/5B Residential Dip (Elev: 4.20m):** Floods when river stage $\ge 4.40\text{m}$ (depth up to 45 cm, impassable).
  - **Jalan Meru Commercial Junction (Elev: 4.40m):** Floods when river stage $\ge 4.50\text{m}$ (depth up to 50 cm).
  - **BBR Wetland Lake Perimeter (Elev: 4.10m):** Overtopping retention perimeter at 4.30m (depth 35 cm).
  - **Masjid Bandar Bukit Raja PPS & Persiaran BBR (Elev: 5.60m):** **100% Safe & Immune** throughout 100-year events ($0\text{ cm}$ depth).

### 4. 🏃 FloodShield: Time-Critical Evacuation Prioritisation
- *"Our system goes beyond visualising floodwater and identifying routes that are safe at the present moment. It estimates when critical access roads may become unsafe and compares this with the time required for residents to evacuate. By identifying residential blocks with the smallest remaining evacuation windows, FloodShield can prioritise time-critical warnings and recommend alternative routes before neighbourhoods risk becoming isolated."*
- **Evacuation Urgency Comparison (Area A vs Area B):**
  - **Area A (Jalan Makyong Residential Block):** Road floods in 30 minutes, residents need 20 minutes to evacuate $\rightarrow$ **Only 10 minutes of spare time** (High urgency — warn residents first!).
  - **Area B (Taman Kyra & Casira):** Road floods in 90 minutes, residents need 20 minutes to evacuate $\rightarrow$ **70 minutes of spare time** (Lower urgency — more time to prepare).
  - **Key Decision:** Area A needs to act much sooner because its escape route could become unsafe earlier.

### 5. 🚨 Emergency Facilities Directory & Evacuation Routing
- **Shelters:** Masjid Bandar Bukit Raja (official PPS relief centre), Dewan MBDK Klang, Grace Community Services.
- **Hospitals:** Columbia Asia Hospital Klang, HTAR Klang, Klinik Dr Rosli Bukit Raja.
- **Rescue:** Bomba Klang Utara, Bomba Klang Selatan.
- One-click navigation and dynamic flood-avoidance bypass routing.

### 6. 🗺️ 3D Perspective & Top-Down Camera Views + Map Legend
- Interactive 3D building extrusions and top-down orthographic toggle.
- Floating legend explaining routes, risk tiers, and sponge assets.

---

## Project Structure

```
SimeDarby/
├── README.md               Project documentation and technical overview
├── DATA_SOURCES.md         Every data source, assumption and telemetry inventory
├── run_all.bat             One-click launcher for frontend + backend
├── colab.ipynb             JPS data preparation and XGBoost model training
├── backend/
│   ├── app.py              Flask prediction API (/predict endpoint on port 5000)
│   └── models/             Trained XGBoost model (.joblib) & feature columns
├── web/
│   ├── index.html          PWA interface and interactive map
│   ├── css/styles.css      Responsive layout, FloodShield modal, dark mode
│   ├── js/
│   │   ├── app.js          MapLibre setup, time scrubbers, routing UI
│   │   ├── inundation.js   Hydraulic elevation mapping & FloodShield evacuation engine
│   │   ├── sponge.js       Sponge city infrastructure layers & retention meter
│   │   ├── routing.js      Dijkstra pathfinding with dynamic flood avoidance
│   │   ├── flood.js        Scenario loading and risk evaluation
│   │   ├── config.js       Application configuration & thresholds
│   │   └── rain.js         Rainfall simulation hooks
│   └── data/
│       ├── binjai_telemetry_25nov_05dec.json  241-hour verified JPS telemetry dataset
│       └── bbr/            BBR road network, places, and emergency facilities
└── sime/                   Raw JPS Infobanjir telemetry CSVs and Colab model weights
```

---

## Running Locally

**One Click (Windows):**
Double-click `run_all.bat`. It starts the Flask AI backend on `http://localhost:5000`, the web frontend on `http://localhost:8000`, and opens your browser.

**Manually:**
```bash
# 1. Start AI Backend
pip install flask flask-cors joblib pandas xgboost scikit-learn
python backend/app.py

# 2. Start Web Frontend (in separate terminal)
cd web
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## Credits & Attribution

- **Cartography & Road Network:** © OpenStreetMap contributors (ODbL). Vector tiles powered by OpenFreeMap / OpenMapTiles.
- **Rendering Engine:** MapLibre GL JS v4.7.1.
- **Hydrological Guidelines:** Jabatan Pengairan dan Saliran (JPS) Malaysia & Urban Stormwater Management Manual for Malaysia (MSMA 2nd Ed.).
- **Telemetry Records:** Official JPS Infobanjir Selangor (Station 3112401 Sg. Binjai, Station 3014001 Sg. Rasau, Station 3014004 Sg. Klang).
- **Township Design:** Modeled after Sime Darby Property's Bandar Bukit Raja master development in Klang, Selangor.
