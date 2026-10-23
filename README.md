# FloodSafe Route — Bandar Bukit Raja Sponge Township

A real-time flood intelligence, sponge infrastructure visualization, and residential evacuation routing progressive web app (PWA) designed for **Bandar Bukit Raja (BBR), Klang, Selangor**.

Built for the **Sime Darby Property University Hackathon 2026** ("Township of Tomorrow" — People & Sustainability themes).

> **Safety Disclaimer:** This application is a prototype demonstrating hydrodynamic flood simulation and sponge township integration. It supports official emergency notices and never replaces them. Always follow PDRM, Bomba, APM, and NADMA directives, and dial 999 in an emergency.

---

## Key Capabilities

### 1. 🌿💧⚙️ Sponge City Framework (MSMA / JPS Guidelines)
Models and monitors multi-tier stormwater retention infrastructure across Bandar Bukit Raja:
- **🌿 Green Infrastructure:** Urban parks, community rain gardens, bioswales, and porous ground covers.
- **💧 Blue Infrastructure:** 125-acre Bandar Bukit Raja Wetland system, retention lakes, detention ponds, and widened stream corridors.
- **🚰 Gray Infrastructure:** Reinforced Concrete Box Culverts (RCBC), monsoon U-drains, and roadside intake sumps.
- **Township HUD:** Live retention meter tracking total stored stormwater volume ($m^3$) and capacity percentage.

### 2. 🔮 Sungai Binjai di Pekan Meru AI Forecasting & Telemetry Verification (25/11/2024 to 05/12/2024)
The application is configured to monitor **Water Level at Sungai Binjai di Pekan Meru (Station 3112401) only** across the crucial 10-day late-monsoon window from **25/11/2024 00:00 to 05/12/2024 00:00** (241 continuous hourly intervals):

- **🌊 Why Measurements from 3 Different Stations Predict Sg. Binjai Only:**
  1. **Connected River Basin Network (Upstream vs. Downstream):**
     - Sg. Binjai di Pekan Meru is located upstream in the catchment.
     - Sg. Rasau di Tugu Keris and Sg. Klang di Bandar Klang are downstream companion water bodies.
     - **Downstream Backwater Effect:** If Sg. Klang and Sg. Rasau are already full (elevated stage), water draining from upstream Sg. Binjai cannot discharge freely. This causes water to "pile up" upstream at Pekan Meru, causing rapid level surges.
  2. **How XGBoost Translates 3 Stations into 1 Output:**
     - The machine learning model functions as an intelligent hydrologic weighting engine trained on thousands of hours of historical telemetry:
       - *"IF Sg. Binjai is at 2.9m AND it rained 15mm, AND downstream Sg. Klang is high (1.95m), THEN Sg. Binjai's level will spike rapidly to 3.5m in 3 hours because the water cannot escape."*
       - *"IF Sg. Binjai is at 2.9m AND it rained 15mm, BUT Sg. Klang is low (1.2m), THEN the water drains freely, and the level only rises to 3.1m."*
     - Downstream telemetry provides the boundary capacity condition, allowing XGBoost to output a single, highly accurate 3-hour ahead forecast specifically for **Sungai Binjai**.

- **📅 241-Hour Scrubber Window (25 Nov 2024 00:00 to 05 Dec 2024 00:00):**
  - `🌤️ 25 Nov (Normal)`: Stable baseline flow (Sg. Binjai ~3.22 m, roads dry and safe).
  - `⚠️ 27 Nov 23:00 (Alert)`: Pre-monsoon storm runoff pushing Sg. Binjai past the JPS Alert threshold (3.52 m).
  - `🌧️ 28 Nov 20:00 (Danger)`: Sustained heavy monsoon downpour pushing stage past JPS Danger category (4.62 m).
  - `🚨 29 Nov 04:00 (Peak Crest)`: Historical flood crest where **Actual water level peaks at 4.76 m (JPS DANGER $\ge 4.50\text{ m}$)** and **XGBoost anticipates the crest with zero phase lag at 4.72 m**. Road depressions submerge up to 55 cm, triggering emergency elevated bypass rerouting.
  - `📉 01 Dec (Recession)`: Post-surge drainage as water discharges through retention culverts back to safe levels (3.55 m $\rightarrow$ 2.97 m).
  - `🌊 05 Dec (Safe Flow)`: Safe normal flow (2.97 m).

- **🌊 River Water Level vs. 🚗 Road Surface Inundation Depth (Hydrology to Hydraulics):**
  - *Judge Inquiry:* "Telemetry measures river water level in meters; how does FloodSafe know roads are flooded?"
  - *Engineering Solution:* FloodSafe bridges macro-catchment hydrology with micro-topographic hydraulics:
    $$\text{Road Surface Depth } d_{\text{road}} = \max\left(0, \text{River Stage / Basin WSE} - Z_{\text{road elevation}}\right)$$
    - **Macro River Stage (Sg. Binjai Telemetry):** Classifies catchment saturation using official JPS thresholds (`NORMAL < 3.50m`, `ALERT 3.50–4.19m`, `WARNING 4.20–4.49m`, `DANGER ≥ 4.50m`).
    - **Backwater & Overtopping Hydraulics (MSMA / DEM):** When Sg. Binjai exceeds 3.50 m, outfalls are backwater-locked, pooling localized runoff along low-lying depressions (Jalan Makyong at elevation $Z \approx 3.8\text{ m}$). When stage exceeds bank elevation ($Z_{\text{bank}} \approx 4.4\text{ m}$), river overtopping floods roads up to $40\text{--}55\text{ cm}$.
    - **Micro Passability Standards:** Driving risk is partitioned into **Moderate Risk** ($10\text{--}30\text{ cm}$, traction warning) and **High Risk** ($\ge 30\text{ cm}$, vehicle stall / blocked route).
- **📍 AI Area & Time Flood Inundation Engine (Which Area Floods at Which Time):**
  - Uses the Sg. Binjai XGBoost forecasted rate of rise ($\Delta H / \Delta t$) combined with ground elevations from the Digital Elevation Model (DEM) to compute exact flood arrival times:
    - **🏛️ Pekan Meru Low-Lying Riverbank & Market Dip (Elev: 3.80m, Trigger: 4.20m):** First to flood via backwater locking; breaches in ~45 mins during surge ($15\text{--}60\text{ cm}$).
    - **🏘️ Jalan Makyong 5A/5B Residential Dips (Elev: 4.20m, Trigger: 4.40m):** Breaches in ~105 mins ($25\text{--}45\text{ cm}$, impassable).
    - **🏢 Jalan Meru Commercial Junction & Gateway (Elev: 4.40m, Trigger: 4.50m):** Breaches in ~135 mins during extreme crest ($25\text{--}50\text{ cm}$).
    - **🏞️ BBR Wetland Lake Perimeter (Elev: 4.10m, Trigger: 4.30m):** Overtopping retention perimeter into boardwalks ($35\text{ cm}$).
    - **🛡️ Persiaran Bukit Raja High Ground & Masjid BBR (Elev: 5.60m):** **100% Safe & Immune** throughout 100-year events ($0\text{ cm}$ depth).
  - **Dynamic Timetable UI:** Accessible both from the bottom **Predict** panel and the top **25/11–05/12 Telemetry Scrubber** drawer, displaying location, exact flood time, water depth, and recommended safe bypass routes.
  - **Interactive Map Markers:** MapLibre markers pulse in red when flooded or predicting flood, orange for moderate ponding, and green shield for safe high ground. Clicking any card pans and zooms directly to that area!
- **Dynamic Rolling Forecast Horizon:**
  - As time elapses or when user scrubs forward using Fast Forward, past forecast slots are automatically removed, and new upcoming slots roll in dynamically (maintaining 5 forward-looking 30-minute intervals).
  - *Example at 9:30 AM:* The passed `9:00 AM` slot is deleted, and `11:30 AM` is added (`9:30 AM Flooded`, `10:00 AM Flooded`, `10:30 AM Flooded`, `11:00 AM Moderate`, `11:30 AM Safe`).
  - *Example at 9:33 AM:* `9:30 AM` has passed and is pruned; upcoming slots are `10:00 AM`, `10:30 AM`, `11:00 AM`, `11:30 AM`, and `12:00 PM`.
- **Forecast Intelligence Briefing:** Replacing generic disclaimers, each forecast displays a comprehensive **Forecast Intelligence Briefing**:
  - **🌊 Water Level & Severity:** Telemetry height (m), JPS danger threshold comparison, and exact road water depths (cm).
  - **📍 Where Will Be Flooded:** Specific flooded corridors (e.g. Bandar Bukit Raja Wetland Lake perimeter, Jalan Makyong 5A/6 dip).
  - **🚫 Which Routes Are Unsafe:** Impassable vs cautioned roads with designated safe elevated bypass alternatives.
- **⏩ Fast Forward Feature (Located next to Top Current Time):**
  - **Manual Slide-Through & Dynamic Route Evolution:** Located right beside `🕒 Current Time: 9:00 AM` in the top bar, clicking **`⏩ Fast Forward`** toggles an interactive demo range slider. The user manually scrubs through from minute 0 (`9:00 AM`) to 120 (`11:00 AM`) in exact 1-minute steps (`9:01 AM`, `9:02 AM`, etc.).
  - **Dynamic Route State Changes During Fast-Forward:** As you slide through:
    - **15 mins Safe Route (Non-shaded Purple):** Stays on the map and dynamically reroutes around rising water; travel time increases from `15 mins` $\rightarrow$ `17 mins (detour)` $\rightarrow$ `21 mins (safe bypass)` as water rises, and returns to `15 mins` as water recedes.
    - **16 mins Wetland Route (Shaded):** Passes low-lying Jalan Makyong. At $\min \ge 25$, it dynamically turns **danger red** on the map with pill **`🚫 16 mins (Flooded 40cm - Impassable)`**, and at peak crest **`🚫 16 mins (Peak Flood 58cm - Blocked)`**, before receding back to amber/green.
    - **18 mins Northern Route (Shaded):** Dynamically updates travel time and runoff warnings (`18 mins` $\rightarrow$ `19 mins ⚠️ runoff` $\rightarrow$ `22 mins ⚠️ high caution`).
  - **Continuous Telemetry Interpolation:** Sg. Binjai water level ($3.65\text{m} \rightarrow 4.55\text{m} \rightarrow 4.80\text{m}$), Sponge City retention meter ($68\% \rightarrow 88\%$), and stored volume ($54,400\text{ m}^3 \rightarrow 70,400\text{ m}^3$) update smoothly for every minute scrubbed.
  - **⚡ Dynamic AI Escalation at 9:30 AM:** As time fast-forwards to 9:30 AM, **10:30 AM** dynamically escalates from Moderate to **`Flooded`** (red danger badge) and **11:00 AM** escalates from Safe to **`Moderate`** (orange warning badge). Sliding back to 9:00 AM restores baseline conditions.

### 3. 🚨 Critical Emergency Facilities Directory & Map Pinpoints
Pinpoints verified, real-world emergency infrastructure across Bandar Bukit Raja and Klang district with interactive custom MapLibre markers, category color coding, and one-click evacuation routing:
- **🏢 Emergency Shelters (Purple):**
  - **Dewan Majlis Bandaraya Diraja Klang (MBDK)** *(Dewan Hamzah)* — Capacity ~1,500 evacuees.
  - **Grace Community Services** — Food bank & community emergency relief center.
  - **Masjid Bandar Bukit Raja** — Verified official PPS shelter with APM / NADMA.
- **🏥 Hospitals & Clinics (Crimson Red):**
  - **Columbia Asia Hospital Klang** — 24/7 Emergency Department & multi-specialty care.
  - **Hospital Tengku Ampuan Rahimah (HTAR)** — Lead public general hospital and Level 1 trauma centre for Klang district.
  - **Klinik Dr Rosli Bukit Raja** — 24-hour local community triage clinic on Jalan Makyong 5A.
- **🚒 Search & Rescue Operations (Safety Orange):**
  - **Klang Utara Fire and Rescue Station (BBP Sungai Pinang)** — Water Rescue Unit (PPDA), Hotline: `+603-3342 4444`.
  - **Klang Selatan Fire and Rescue Station (BBP Kota Raja)** — Search and Rescue Command, Hotline: `+603-3371 4444`.
- **Interactive Quick Filter Bar:** Located directly under the trip planner, users can filter by category (`All`, `🏢 Shelters`, `🏥 Hospitals`, `🚒 Rescue`) with strict mutual visibility (clicking Shelters completely hides Hospitals and Rescue, and vice-versa) while automatically framing map bounds to the active category.
- **Direct Regional Evacuation Routing:** Clicking `📍 Route Here` or `🚩 Start Here` on any facility card generates seamless, turn-by-turn routing through safe neighborhood roads and connects via arterial corridors without network blocking.

### 4. 🏛️ Residential Evacuation Decision System
- **Verified Relief Centres:** Direct, safe routing to designated Pusat Pemindahan Sementara (PPS) shelters, such as **Masjid Bandar Bukit Raja** (verified with APM / NADMA criteria).
- **Zero High-Risk Routing:** Flood-aware Dijkstra routing actively bypasses inundated road segments, recalculating safe alternative corridors.
- **Dual Travel Modes:** Separate safety depth thresholds for **Walk** (moderate: 5 cm, high: 15 cm) and **Drive** (moderate: 10 cm, high: 30 cm).

### 5. 🏙️ 3D & Top View Perspective
- Extruded 3D OpenStreetMap buildings with realistic structural heights.
- Seamless synchronization between tilted 3D perspective and Top-down orthographic camera views.
- Fully visible culverts, sumps, lakes, and route markers in both modes.

### 6. 🗺️ Bottom-Right Floating Legend
- Dedicated floating button anchored at the bottom-right corner.
- Toggles a clean popup explaining routes (purple primary vs. faded suggested), risk tiers (moderate, high, floodwater), sponge infrastructure assets, and emergency facility pins (Shelters, Hospitals, Rescue).

---

## Project Structure

```
SimeDarby/
├── README.md               Project overview, architecture, and demo guide
├── DATA_SOURCES.md         Data sources, engineering assumptions, and validation
├── run_all.bat             1-Click launcher (starts AI Backend + Web Frontend + opens browser)
├── run_backend.bat         1-Click launcher for Flask AI backend (port 5000)
├── run_frontend.bat        1-Click launcher for Web Frontend (port 8000)
├── backend/                Python AI Prediction REST API
│   ├── app.py              Flask REST API exposing /predict with JPS Selangor thresholds
│   └── models/             Directory for trained XGBoost .joblib files
│       └── README.md       Instructions for dropping Colab models
├── web/                    App shell and client logic (static, no build step required)
│   ├── index.html          Semantic HTML5 layout and control anchors
│   ├── manifest.webmanifest PWA manifest (installable on mobile and desktop)
│   ├── sw.js               Service Worker with network-first caching and offline fallback
│   ├── icons/              Vector application icons
│   ├── css/
│   │   └── styles.css      Clean responsive styling, dark mode support, and animations
│   ├── js/
│   │   ├── app.js          Main controller: MapLibre GL, timeline events, and layer controls
│   │   ├── config.js       Township coordinates, travel thresholds, and API URLs
│   │   ├── flood.js        HEC-RAS depth interpolation, risk calculation, & AI backend client
│   │   ├── sponge.js       Sponge city infrastructure modeling (Green, Blue, Gray)
│   │   ├── evac.js         Evacuation decision engine and shelter verification
│   │   ├── routing.js      Flood-weighted Dijkstra graph search
│   │   ├── geo.js          Geodesic calculations and place search
│   │   └── rain.js         Rainfall scenario orchestration
│   └── data/
│       ├── bbr/            Bandar Bukit Raja road network, places, and flood scenarios
│       └── sample/         Synthetic test datasets
└── pipeline/               Data processing and hydrodynamic export scripts
    ├── 01_download_roads.py     OpenStreetMap road and footpath extraction
    ├── 02_hecras_to_scenario.py Converts HEC-RAS 2D rasters to web scenario JSON
    ├── 02b_synthetic_bathtub.py Elevation-based flood fallback model
    ├── common.py                Shared geospatial utilities
    └── ml/                      Surrogate machine learning model for rapid flood forecasting
        ├── 01_build_dataset.py
        ├── 02_train.py
        └── 03_predict_scenario.py
```

---

## Quick Start (Run Locally)

### Option 1: 1-Click Launch (Recommended)
Double-click `run_all.bat` in the root folder. It will:
1. Start the **Flask AI Backend Server** on `http://localhost:5000`.
2. Start the **Web Frontend Server** on `http://localhost:8000`.
3. Automatically open your default browser to `http://localhost:8000`.

### Option 2: Manual Terminal Launch
1. **Start AI Backend:**
   ```bash
   python backend/app.py
   ```
2. **Start Web Frontend:**
   ```bash
   cd web
   python -m http.server 8000
   ```
3. Open [http://localhost:8000](http://localhost:8000) in your browser.

> **Tip:** For mobile device testing on the same local Wi-Fi, open `http://<YOUR_LOCAL_IP>:8000`. GPS ("Use my location") requires `localhost` or HTTPS.

---

## 🤖 AI & JPS Multi-Station Hydrologic Backend (`backend/app.py`)

The application integrates real-time machine learning predictions derived from three key JPS Selangor telemetry stations along the Klang River basin:
- **Station 3112401 — Sg. Binjai di Pekan Meru** (Target Station: Stage + Rainfall)
- **Station 3014001 — Sg. Rasau di Tugu Keris** (Downstream backwater telemetry)
- **Station 3014004 — Sg. Klang di Bandar Klang** (Tidal & confluence telemetry)

### Dual-Engine Resilience:
1. **Trained XGBoost Mode:** If `real_xgboost_flood_model.joblib` and `real_feature_columns.joblib` are placed in `backend/models/`, the backend loads the exact model trained in Google Colab (`colab.ipynb`).
2. **Calibrated Formula Mode (Zero Setup Fallback):** If the `.joblib` files are not yet present, `backend/app.py` runs a calibrated multi-station hydrologic regression directly derived from the notebook parameters. The app runs seamlessly right out of the box with zero configuration!

### Official JPS Selangor River Thresholds:
- **NORMAL (< 3.50m):** Green indicator, 18% - 65% township sponge retention.
- **ALERT (3.50m - 4.19m):** Amber indicator, 70% - 79% retention, preparatory notice.
- **WARNING (4.20m - 4.49m):** Orange indicator, 80% - 89% retention, emergency services on standby.
- **DANGER (≥ 4.50m):** Red indicator, 90% - 100% retention, evacuation routing active.

---

## Step-by-Step Demo Guide

1. **Township Overview:**
   - Observe Bandar Bukit Raja in **3D View** (tilted bearing) with extruded buildings, the 125-acre wetland retention lake, and stormwater culverts.
   - Note the **Top Middle Clock** displaying `9:00 AM` and the **Sponge Township HUD** showing normal storage (~18%).
2. **Toggle Flood Prediction:**
   - Click the **`🔮 Predict`** button in the bottom-middle of the screen.
   - The forecast time selections (`9:00 AM`, `9:30 AM Flooded`, `10:00 AM Flooded`, `10:30 AM Moderate`, `11:00 AM Safe`) appear in a single row without container boxes or scrollbars.
3. **Inspect Peak Flood (9:30 AM):**
   - Click **`9:30 AM Flooded`**:
     - Bandar Bukit Raja Wetland lake turns red.
     - Marker alert displays: *"Estimate to flood in 20 mins (9:20 AM)"*.
     - Alternative suggested routes appear in faded purple.
     - The route passing through the wetland is tagged `16 mins (unsafe)`, while safe bypass routes are labeled with their clean ETAs (e.g. `15 mins`, `18 mins`).
4. **Observe Flood Receding (10:30 AM & 11:00 AM):**
   - Click **`10:30 AM Moderate`**: The wetland transitions to orange (moderate risk), and the route updates to `16 mins (moderate)`.
   - Click **`11:00 AM Safe`**: The wetland returns to safe natural blue, and the route badge updates to safe `16 mins`.
5. **Dismiss Prediction:**
   - Click the **`🔮 Predict`** button again. The time selections disappear cleanly, and conditions return to the 9:00 AM baseline.
6. **Open Map Legend:**
   - Click the **`🗺️ Legend`** button in the bottom-right corner to review symbology for routes, risk levels, and sponge assets (culverts, wetlands, parks). Click anywhere outside or the close button to dismiss.

---

## Technical Architecture & Engineering Standards

- **Hydrologic & Hydraulic Calibration:** Calibrated against MSMA 2nd Edition standards and historical records from JPS Selangor Station #3014002 (Batu Belah, Klang).
- **Route Optimization:** Custom modified Dijkstra implementation that applies asymptotic cost penalties to moderate-risk segments and strictly prunes high-risk roads ($>15\text{ cm}$ walk / $>30\text{ cm}$ drive).
- **PWA Performance:** Service Worker with network-first strategy ensures zero-delay caching, background telemetry synchronization, and offline accessibility during network outages.

---

## Credits & Attribution

- **Cartography & Roads:** © OpenStreetMap contributors (ODbL). Vector tiles powered by OpenFreeMap / OpenMapTiles.
- **Rendering Engine:** MapLibre GL JS v4.7.1.
- **Hydrological Guidelines:** Jabatan Pengairan dan Saliran (JPS) Malaysia & Urban Stormwater Management Manual for Malaysia (MSMA 2nd Ed.).
- **Township Design:** Modeled after Sime Darby Property's Bandar Bukit Raja master development in Klang, Selangor.
