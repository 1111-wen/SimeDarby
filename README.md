# FloodSafe Route

A web app (PWA) that shows which roads will flood next and suggests a safer route, walking
or driving, from where you are to where you need to go. Roads and areas are marked **yellow (moderate risk)**
or **red (high risk)**, and the route updates live as water rises.

Built for the Sime Darby Property University Hackathon 2026 ("Township of Tomorrow", People theme).

> **Safety:** this is a prototype. It supports official warnings and never replaces them.
> Always follow Bomba and the authorities, and call 999 in an emergency.

## What's in this project

```
floodsafe-route/
├── README.md               this file
├── DATA_SOURCES.md         every data source and assumption (required by SDP)
├── web/                    the app (static files, no build step)
│   ├── index.html
│   ├── manifest.webmanifest, sw.js, icons/   PWA files (installable on phones)
│   ├── css/styles.css
│   ├── js/
│   │   ├── config.js       settings: map centre, Walk/Drive thresholds and speeds, data folder
│   │   ├── app.js          map, UI and live updates
│   │   ├── flood.js        loads scenarios; depth and risk per road over time
│   │   ├── routing.js      road graph + flood-aware Dijkstra routing
│   │   ├── geo.js          GPS, distance, place search
│   │   └── rain.js         demo storm player + live rainfall hook (roadmap)
│   └── data/sample/        SYNTHETIC test data (invented, does not match real roads)
└── pipeline/               Python scripts that produce real app data
    ├── make_sample_data.py      regenerate the synthetic sample (no packages needed)
    ├── 01_download_roads.py     real roads + footpaths from OpenStreetMap (walk/drive/one-way flags)
    ├── 02_hecras_to_scenario.py HEC-RAS 2D depth rasters -> app scenario
    ├── 02b_synthetic_bathtub.py elevation model -> placeholder scenario (no HEC-RAS yet)
    ├── common.py, places_template.json, requirements.txt
    └── ml/                       ML surrogate model (see ml/README_ML.md)
        ├── 01_build_dataset.py   many HEC-RAS runs -> one training table
        ├── 02_train.py           train + test on unseen storms
        ├── 03_predict_scenario.py any rainfall -> app scenario
        └── runs_template.csv, runs_sample.csv
```

## Run the app locally

The app is plain HTML/JS. Serve the `web` folder with any static server:

```bash
cd web
python -m http.server 8000
# open http://localhost:8000
```

- GPS ("Use my location") only works on **https** or **localhost**, and only after the user allows it.
- On a phone on the same Wi-Fi, use your laptop's IP (e.g. `http://192.168.1.20:8000`); GPS needs https,
  so for phone testing deploy it (see below) or use a tunnel such as `ngrok http 8000`.
- The sample data is synthetic and placed near `CONFIG.center`; its roads won't line up with the real map.

### Demo flow (for the video)
1. Start from "Home, Jalan Kenanga (sample)" to "Home, Jalan Bakawali (sample)", in **Drive** mode.
2. Choose **Heavy rain** and tap **Start demo rain**.
3. Roads and areas turn yellow, then red. Watch the route switch from the South bridge to the North bridge.
4. Later the route is cut off, and the app tells the user not to drive out and to call 999 if needed.
5. Switch to **Walk**: the stricter walking thresholds make the route change, and get cut off, earlier.

## Make real data for your neighbourhood

```bash
cd pipeline
pip install -r requirements.txt

# 1. Roads from OpenStreetMap (bbox = west south east north)
python 01_download_roads.py --bbox 101.399 3.0905 101.4225 3.110 --out ../web/data/bbr

# 2a. With HEC-RAS 2D results (one depth GeoTIFF per time step, exported from RAS Mapper)
python 02_hecras_to_scenario.py --roads ../web/data/bbr/roads.geojson --rasters ./hecras_heavy \
  --step-min 10 --rain-mm-hr 60 --id heavy --name "Heavy rain (~60 mm/h)" --out ../web/data/bbr

# 2b. Or, until HEC-RAS is ready, a SYNTHETIC placeholder from an elevation model
python 02b_synthetic_bathtub.py --roads ../web/data/bbr/roads.geojson --dem bbr_fabdem.tif \
  --rise-m 1.2 --rain-mm-hr 60 --id heavy --name "Heavy rain (synthetic)" --out ../web/data/bbr

# 3. Edit ../web/data/bbr/places.json with real places and VERIFIED relief centres
```

Repeat step 2 for each rainfall scenario (e.g. moderate, heavy, extreme). Then in
`web/js/config.js` set `dataBase: "./data/bbr"` and `center` to your neighbourhood.

## Data format (what the app reads)

- `roads.geojson`: LineStrings with `properties: { id, name, highway, walk, drive, oneway, bridge, length_m }`.
  One-way roads are drawn in their travel direction.
- `places.json`: `[{ name, coord: [lng, lat], type: "place" | "relief_centre", verified }]`.
- `scenarios/index.json`: `{ scenarios: [{ id, file, rain_mm_hr }] }`.
- `scenarios/<id>.json`:
  ```json
  { "scenario": "heavy", "name": "Heavy rain (~60 mm/h)", "rain_mm_hr": 60,
    "generated": "2026-10-18T17:50+08:00", "step_min": 10, "synthetic": false,
    "depths": { "e12": [0, 0, 0.04, 0.12, 0.31] },
    "extent": [ { "type": "FeatureCollection", "features": [ { "geometry": "...", "properties": { "level": "moderate", "depth_m": 0.18 } } ] } ] }
  ```

## ML surrogate model (phase 2)

Once the team has 10–15+ HEC-RAS runs, `pipeline/ml` trains a fast model that predicts
road flooding for any rainfall. `pipeline/ml/README_ML.md` lists exactly what each HEC-RAS
run must provide.

## How the logic works

- **Risk per road** = the deepest water expected on that road between now and 30 minutes from now.
- **Two travel modes**, each with its own thresholds (assumptions in `config.js`):
  - **Drive:** moderate from 10 cm, high from 30 cm; car roads only, one-way streets respected.
  - **Walk:** moderate from 5 cm, high from 15 cm; includes footpaths and footbridges.
- **Safest route**: high-risk roads are blocked; moderate-risk roads cost extra, so they are used only when needed.
- **Bridges**: risk is taken from the approach roads on each side (the deck sits above the stream).
- **Live updates**: every tick the app recalculates risk and the route; if the route changes, it explains why.
- **No safe route / flooded start**: the app shows a stay-safe message instead of a risky route.
- **Live rain (roadmap)**: `rain.js` polls a rainfall source and `pickScenario()` chooses the closest pre-computed scenario.

## Deploy (free)

Any static host works: GitHub Pages, Netlify or Cloudflare Pages. Publish the `web` folder.
HTTPS from these hosts makes GPS and "Add to Home Screen" work on phones.

## Roadmap

- Live rainfall from public sources, and an ML model that predicts between scenarios.
- Water-level sensors at drains to correct predictions in real time.
- Push alerts and offline maps (native app later).
- More user profiles (e.g. wheelchair users, drivers vs walkers).

## Credits

Map data © OpenStreetMap contributors (ODbL). Basemap tiles: OpenFreeMap / OpenMapTiles.
Map rendering: MapLibre GL JS. Flood modelling: HEC-RAS (US Army Corps of Engineers).
