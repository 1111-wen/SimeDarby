# FloodSafe Route — Bandar Bukit Raja Sponge Township
 
A flood-aware map and evacuation routing web app (PWA) for **Bandar Bukit Raja (BBR), Klang, Selangor**, piloted around **Taman Kyra, Taman Casira and Jalan Makyong**, areas with reported floods in 2023 and 2024.
 
Built for the **Sime Darby Property University Hackathon 2026** ("Township of Tomorrow", People theme). Designed to work for flood-prone townships across Malaysia.
 
> **Safety:** this is a prototype. It supports official warnings and never replaces them. Always follow PDRM, Bomba, APM and NADMA, and call 999 in an emergency.
 
> **Data status (prototype):** roads, buildings, water bodies and drains are real OpenStreetMap data. The river-level model is trained on **real JPS Public Infobanjir records** (three stations, Oct–Dec 2024, a short sample). **Road flood depths and the station readings used in the Predict timeline are simulated**, based on reported floods in the area. Nothing here is a live or official forecast. See [`DATA_SOURCES.md`](DATA_SOURCES.md).
 
---
 
## What it does
 
1. **Shows a 3D map** of real streets, buildings, water bodies and sponge infrastructure in Bandar Bukit Raja.
2. **Predicts flooding** in two ways:
   - **Road flood scenarios:** water depth on every road segment, every 10 minutes, for moderate, heavy and extreme rain.
   - **River level forecast:** an XGBoost model predicts the water level at Sg. Binjai 3 hours ahead from three JPS stations.
3. **Marks risk** on roads and areas: **yellow (moderate)** and **red (high)**, with separate limits for walking and driving.
4. **Recommends the safest route** from the user's location to a destination, avoiding roads that are flooded or will flood within 30 minutes, and **reroutes live** as water rises.
5. **Supports evacuation decisions:** time until roads flood, nearby relief centres, hospitals and rescue stations, and clear "stay where you are" advice when no safe route exists.
6. **Shows township resilience:** an estimate of how full the sponge infrastructure (wetlands, ponds, drains) is.
---
 
## Key features
 
### 1. 🗺️ 3D flood map and safe routing
- Real OpenStreetMap roads (1,704 segments) with walk, drive, one-way and bridge information.
- **Walk / Drive modes** with separate risk limits:
  - **Walk:** moderate from 5 cm, high from 15 cm.
  - **Drive:** moderate from 10 cm, high from 30 cm.
- Flood-aware routing (Dijkstra) blocks high-risk roads and avoids moderate-risk roads where possible.
- Set start and destination by GPS, by typing a place, by tapping the map ("Start here" / "Go here"), or by dragging the pins.
- Turn-by-turn directions, travel time, and a message explaining why the route changed.
- Gated-community roads are treated as drivable (406 roads fixed; see `road_fixes.txt`).
### 2. 🔮 Predict timeline (demo scenario)
- The **Predict** button shows forecast times (9:00, 9:30, 10:00, 10:30, 11:00 AM).
- Shows the wetland and roads changing risk over time, alerts such as "estimated to flood in 20 minutes", and faded alternative routes with their travel times.
- **Note:** the times, alerts and station readings in this timeline are a **scripted demo scenario**, not live data.
### 3. 🏛️ Evacuation decision support
- Scans each road on the route for current depth, peak depth and **time until it floods**.
- Recommends whether to go now or switch to a relief centre.
### 4. 🚨 Emergency facilities
- Relief centres, hospitals and fire and rescue stations in and around Klang, with colour-coded pins, a filter bar, and **Route Here / Start Here** buttons.
- **Masjid Bandar Bukit Raja** was used as a temporary relief centre (PPS) in the June 2023 flash flood (APM Selangor, via Buletin TV3). Relief centres are opened by the authorities for each event, so users should check official announcements.
- Facility details and contact numbers are listed in `web/data/bbr/places.json` with their sources. **Verify contact numbers before any public release.**
### 5. 🌿💧⚙️ Sponge township layer
- **Green:** parks and green areas. **Blue:** wetlands, ponds and lakes. **Grey:** drains and culverts. All from OpenStreetMap.
- A storage meter estimates how full the system is. The Warning (75%) and Danger (85%) levels are **our own assumptions**, not MSMA values.
### 6. Interface
- 3D and top views, a floating legend, dark mode, and installable as a phone app (PWA).
---
 
## How it works
 
```
1. Collect        JPS river level and rainfall (3 stations) · OpenStreetMap roads, buildings, water, drains · relief centres
      ↓
2. Predict        XGBoost: river level 3 hours ahead · flood scenarios: depth on every road every 10 min
      ↓
3. Assess risk    each road: safe / moderate / high, for walking and driving · time until it floods
      ↓
4. Route          flood-aware routing avoids roads flooding within 30 min · reroutes as water rises
      ↓
5. Guide          map, safe route, warnings, nearest relief centre or "stay where you are"
```
 
---
 
## Project structure
 
```
SimeDarby/
├── README.md               This file
├── DATA_SOURCES.md         Every data source, assumption and simulated dataset
├── run_all.bat             Starts backend + frontend and opens the browser (Windows)
├── run_backend.bat         Starts the Flask backend (port 5000)
├── run_frontend.bat        Starts the web app (port 8000)
├── colab.ipynb             Data preparation and XGBoost model training (Google Colab)
├── road_fixes.txt          Roads changed from walk-only to drivable (gated communities)
├── backend/
│   ├── app.py              Flask API: /predict (3-hour river level forecast + JPS alert level)
│   └── models/             Put the trained .joblib model files here
├── web/                    The app (static files, no build step)
│   ├── index.html, css/styles.css, manifest.webmanifest, sw.js, icons/
│   ├── js/
│   │   ├── app.js          Map, UI, Predict timeline, live updates
│   │   ├── config.js       Map centre, Walk/Drive limits, data folder, backend URL
│   │   ├── flood.js        Flood scenarios, risk per road, backend client
│   │   ├── routing.js      Road graph, snapping, flood-aware routing
│   │   ├── evac.js         Evacuation decision support
│   │   ├── sponge.js       Sponge township layer and storage meter
│   │   ├── geo.js          GPS, distance, place search
│   │   └── rain.js         Demo storm player, live rain hook (roadmap)
│   └── data/
│       ├── bbr/            Bandar Bukit Raja roads, places and flood scenarios
│       └── sample/         Small synthetic test dataset
└── pipeline/               Data scripts (roads, scenarios, HEC-RAS conversion, ML)
    ├── 01_download_roads.py       Real roads and footpaths from OpenStreetMap
    ├── 02_hecras_to_scenario.py   HEC-RAS 2D depth maps → app scenario
    ├── 02b_synthetic_bathtub.py   Elevation-based placeholder scenario
    ├── make_bbr_scenarios.py      Current simulated BBR scenarios
    └── ml/                        Optional surrogate model trained on HEC-RAS runs
```
 
---
 
## Run locally
 
**One click (Windows):** double-click `run_all.bat`. It starts the backend on http://localhost:5000, the app on http://localhost:8000, and opens your browser.
 
**Manually:**
```bash
pip install flask flask-cors joblib pandas xgboost
python backend/app.py
 
cd web
python -m http.server 8000
```
Then open http://localhost:8000.
 
- GPS ("Use my location") needs `localhost` or HTTPS, and the user's permission.
- If changes don't appear: F12 → Application → Service Workers → **Unregister**, then **Ctrl + Shift + R**.
---
 
## 🤖 River level prediction backend (`backend/app.py`)
 
The backend predicts the water level at Sg. Binjai **3 hours ahead** from three JPS Selangor stations in the Klang River basin:
 
| Station | ID | Role |
| --- | --- | --- |
| Sg. Binjai di Pekan Meru | 3112401 | Target station: water level and rainfall |
| Sg. Rasau di Tugu Keris | 3014001 | Downstream water level |
| Sg. Klang di Bandar Klang | 3014004 | Main river and tidal influence |
 
**Model:** XGBoost regressor trained in `colab.ipynb` on **real JPS Public Infobanjir records** downloaded for the three stations (15-minute readings, Oct–Dec 2024; about 1,000 rows after filtering). The notebook also contains a simulated two-year dataset used while building the pipeline.
 
**Results on held-out real data (from `colab.ipynb`):**
 
| Model | MAE | RMSE |
| --- | --- | --- |
| Persistence (assume level stays the same) | 0.030 m | 0.159 m |
| Linear Regression | 0.065 m | 0.158 m |
| Random Forest | 0.393 m | 0.628 m |
| XGBoost | 0.410 m | 0.653 m |
 
With this short sample, the simple baselines beat XGBoost. A longer record (several monsoon seasons) is needed before the model can be trusted; this is on the roadmap.
 
**Two modes:**
1. **Trained model:** if `real_xgboost_flood_model.joblib` and `real_feature_columns.joblib` are in `backend/models/`, the backend uses them.
2. **Fallback formula:** if they're missing, the backend uses a simple hand-built formula so the app still runs. Its output is illustrative only.
**Prototype status:** in the Predict timeline, the app sends **fixed demo station readings** for each time step. Live telemetry is on the roadmap.
 
**JPS alert levels used to classify the forecast (Sg. Binjai):**
| Level | Water level |
| --- | --- |
| Normal | below 3.50 m |
| Alert | 3.50–4.19 m |
| Warning | 4.20–4.49 m |
| Danger | 4.50 m and above |
 
---
 
## Demo guide
 
1. **Overview:** open the app in 3D view over Bandar Bukit Raja. The clock shows 9:00 AM and the sponge meter shows normal storage.
2. **Plan a trip:** From **Taman Kyra** → To **Masjid Bandar Bukit Raja (relief centre)**, in **Drive** mode.
3. **Predict:** click **🔮 Predict**, then **9:30 AM Flooded**. The wetland turns red, an alert shows the estimated flood time, and alternative routes appear with their travel times.
4. **Receding:** click **10:30 AM Moderate** (orange), then **11:00 AM Safe** (blue).
5. **Walk vs Drive:** switch to **Walk** and see stricter limits change the route.
6. **Facilities:** use the filter bar (Shelters, Hospitals, Rescue) and **Route Here**.
7. **Legend:** click **🗺️ Legend** (bottom right) to explain the symbols.
---
 
## Technical notes
 
- **Routing:** Dijkstra on the OpenStreetMap road graph. High-risk roads are blocked; moderate-risk roads cost extra. Pins snap to the nearest point on a usable road.
- **Risk look-ahead:** a road counts as risky now if it will reach the limit within 30 minutes.
- **PWA:** a service worker caches the app shell; flood data is fetched network-first.
- **Thresholds:** walking and driving limits follow commonly cited flood-safety guidance and are assumptions to agree with authorities.
## Limitations
 
- Road flood depths and Predict timeline readings are **simulated**.
- The river-level model is trained on a short real record and does not yet beat a simple baseline.
- The fallback formula is used unless the trained model files are added.
- Some buildings and roads are missing from OpenStreetMap, especially in newer housing phases.
- Relief centres shown were used in past floods; which centres open is decided by the authorities for each event.
## Roadmap
 
- HEC-RAS 2D flood modelling for the study area, replacing the simulated road scenarios.
- Train on several years of JPS records, and connect live rainfall and river levels.
- Water-level sensors at key drains and ponds.
- Push alerts and offline maps (native app).
- More townships across Malaysia.
---
 
## Credits
 
- **Map data:** © OpenStreetMap contributors (ODbL). Vector tiles: OpenFreeMap / OpenMapTiles.
- **Map rendering:** MapLibre GL JS 4.7.1.
- **River data:** JPS Public Infobanjir (Jabatan Pengairan dan Saliran Malaysia).
- **Guidelines:** Urban Stormwater Management Manual for Malaysia (MSMA 2nd Ed.), JPS.
- **Study area:** Bandar Bukit Raja, Klang, a Sime Darby Property township.
 
