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

### 3. 🏛️ Residential Evacuation Decision System
- **Verified Relief Centres:** Direct, safe routing to designated Pusat Pemindahan Sementara (PPS) shelters, such as **Masjid Bandar Bukit Raja** (verified with APM / NADMA criteria).
- **Zero High-Risk Routing:** Flood-aware Dijkstra routing actively bypasses inundated road segments, recalculating safe alternative corridors.
- **Dual Travel Modes:** Separate safety depth thresholds for **Walk** (moderate: 5 cm, high: 15 cm) and **Drive** (moderate: 10 cm, high: 30 cm).

### 4. 🏙️ 3D & Top View Perspective
- Extruded 3D OpenStreetMap buildings with realistic structural heights.
- Seamless synchronization between tilted 3D perspective and Top-down orthographic camera views.
- Fully visible culverts, sumps, lakes, and route markers in both modes.

### 5. 🗺️ Bottom-Right Floating Legend
- Dedicated floating button anchored at the bottom-right corner.
- Toggles a clean popup explaining routes (purple primary vs. faded suggested), risk tiers (moderate, high, floodwater), and sponge infrastructure assets.

---

## Project Structure

```
SimeDarby/
├── README.md               Project overview, architecture, and demo guide
├── DATA_SOURCES.md         Data sources, engineering assumptions, and validation
├── web/                    App shell and client logic (static, no build step required)
│   ├── index.html          Semantic HTML5 layout and control anchors
│   ├── manifest.webmanifest PWA manifest (installable on mobile and desktop)
│   ├── sw.js               Service Worker with network-first caching and offline fallback
│   ├── icons/              Vector application icons
│   ├── css/
│   │   └── styles.css      Clean responsive styling, dark mode support, and animations
│   ├── js/
│   │   ├── app.js          Main controller: MapLibre GL, timeline events, and layer controls
│   │   ├── config.js       Township coordinates, travel thresholds, and speeds
│   │   ├── flood.js        HEC-RAS depth interpolation and edge risk calculation
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

The web client is plain, standards-compliant HTML/CSS/JavaScript with zero build or bundler dependencies.

Serve the `web` folder with any static HTTP server:

```bash
cd web
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

> **Tip:** For mobile device testing on the same local Wi-Fi, open `http://<YOUR_LOCAL_IP>:8000`. GPS ("Use my location") requires `localhost` or HTTPS.

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
