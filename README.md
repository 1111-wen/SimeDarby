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

### 2. 🔮 Interactive Flood Prediction & Timeline Navigation
Located in the bottom-middle of the screen, the **`🔮 Predict`** button toggles a multi-hour flood progression forecast:
- **9:00 AM (Baseline / Current):** Clear access, road depths at 0 cm, normal retention.
- **9:30 AM (+30 min — Flood Onset):** Bandar Bukit Raja Wetland inundates (highlighted in red). Alert marker: *"Estimate to flood in 20 mins (9:20 AM)"*. Primary route avoids high risk, and suggested alternative routes appear in faded purple (`15 mins`, `16 mins (unsafe)`, `18 mins`).
- **10:00 AM (+60 min — Peak Flood):** Peak inundation across wetland corridor; high-risk bypasses remain active.
- **10:30 AM (+90 min — Receding):** Wetland transitions to moderate risk (highlighted in orange); route badge updates to `16 mins (moderate)`.
- **11:00 AM (+120 min — Safe):** Runoff clears; wetland returns to safe natural blue, and the 16-minute route returns to safe `16 mins`.
- **Dismiss on demand:** Clicking `🔮 Predict` again dismisses the time selections and returns to 9:00 AM baseline.

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
- **Interactive Quick Filter Bar:** Located directly under the trip planner, users can filter by category (`All`, `🏢 Shelters`, `🏥 Hospitals`, `🚒 Rescue`) to instantly fit map bounds and highlight matching facilities.
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
