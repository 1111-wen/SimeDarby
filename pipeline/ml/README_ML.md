# ML surrogate model: what the team needs to provide

The ML model is a fast copy of HEC-RAS. HEC-RAS is accurate but takes minutes to hours per
run; the model learns from many HEC-RAS runs and then predicts flooding for **any** rainfall
in seconds, including amounts HEC-RAS never ran.

```
HEC-RAS (set up once) ──run many times──▶ depth rasters per run
        │                                        │
        │                       02_hecras_to_scenario.py (one per run)
        ▼                                        ▼
  same roads.geojson                    scenario JSON per run ──┐
                                                                ▼
                       ml/01_build_dataset.py ──▶ dataset.csv ──▶ ml/02_train.py ──▶ model + metrics
                                                                                  │
                                         ml/03_predict_scenario.py (any rainfall) ◀┘ ──▶ app scenario
```

## 1. What the HEC-RAS teammates must deliver

**One model, many runs.** Set up the neighbourhood once (terrain, mesh, roughness, boundaries)
and keep it **identical** for every run. Only the rainfall changes.

**Run matrix (suggested).** Each cell = one run.

| Intensity (mm/h) → | 20 | 40 | 60 | 80 | 100 |
| --- | --- | --- | --- | --- | --- |
| Duration 30 min | run | run | run | run | run |
| Duration 60 min | run | run | run | run | run |
| Duration 120 min | run | run | run | run | run |

- Minimum to show the idea works: **10–15 runs.** Good: **30–50 runs.**
- Choose values that match MSMA design storms for the area where possible, and say which.
- Use a constant-intensity ("block") storm for each run to start. Other storm shapes can be added later
  (extend `rain_features()` in `01_build_dataset.py`).

**For every run:**
1. Simulate the rain **plus at least 60 minutes after it stops** (so the model learns how water drains).
2. Save results every **10 minutes**.
3. In RAS Mapper, export the **Depth** layer as one GeoTIFF per time step into a folder per run,
   named in time order: `depth_000.tif`, `depth_010.tif`, … (same CRS and extent for all runs).
4. Convert it:
   ```bash
   python ../02_hecras_to_scenario.py --roads ../../web/data/bbr/roads.geojson --rasters ./runs/r60_120 \
     --step-min 10 --rain-mm-hr 60 --id r60_120 --name "60 mm/h for 120 min" --out ../../web/data/bbr
   ```
5. Add one line to `runs.csv` (copy `runs_template.csv`):

   | run_id | scenario_file | rain_mm_hr | duration_min | pattern | notes |
   | --- | --- | --- | --- | --- | --- |
   | r60_120 | ../../web/data/bbr/scenarios/r60_120.json | 60 | 120 | block | MSMA-based, HEC-RAS 6.x |

**Shared files (same for every run):**
- `roads.geojson` from `01_download_roads.py`. Don't re-download between runs, or road IDs change.
- The **same elevation GeoTIFF** used as the HEC-RAS terrain (optional but strongly recommended).
- A GeoJSON of **rivers, streams and lakes** (optional). Export from OpenStreetMap, for example with
  QGIS QuickOSM (`natural=water`, `waterway=*`) or `osmnx.features_from_bbox`.

## 2. What the model learns

Each training row is **one road, at one time step, in one run.**

| Column | Type | Meaning |
| --- | --- | --- |
| `t_min` | input | Minutes since rain started |
| `rain_mm_hr` | input | Rain intensity of the storm |
| `duration_min` | input | How long it rains |
| `raining_now` | input | 1 while raining, 0 after |
| `cum_rain_mm` | input | Total rain so far |
| `min_since_rain_stopped` | input | Minutes since the rain stopped (draining phase) |
| `lng`, `lat` | input | Road location (midpoint) |
| `bridge`, `length_m` | input | Road type and length |
| `elev_min`, `elev_mean` | input (with `--dem`) | Lowest and average ground height along the road |
| `elev_rel` | input (with `--dem`) | Height compared with roads within 300 m (low spots flood first) |
| `dist_water_m` | input (with `--water`) | Distance to the nearest river, stream or lake |
| `depth_now_m` | **target** | Water depth on the road now |
| `depth_max_next30_m` | **target** | Deepest water on the road in the next 30 minutes (what the app's risk uses) |

## 3. Run it

```bash
cd pipeline/ml
pip install -r ../requirements.txt

python 01_build_dataset.py --runs runs.csv --roads ../../web/data/bbr/roads.geojson \
  --dem ../bbr_fabdem.tif --water ../bbr_water.geojson --out dataset.csv
python 02_train.py --data dataset.csv --out model
python 03_predict_scenario.py --model model --roads ../../web/data/bbr/roads.geojson \
  --dem ../bbr_fabdem.tif --water ../bbr_water.geojson \
  --rain-mm-hr 75 --duration-min 90 --id ml_75 --out ../../web/data/bbr
```

Test the scripts now with the synthetic sample (no HEC-RAS needed):
```bash
python 01_build_dataset.py --runs runs_sample.csv --roads ../../web/data/sample/roads.geojson --out dataset_sample.csv
python 02_train.py --data dataset_sample.csv --out model_sample
```

## 4. Reading the results (for the pitch)

`02_train.py` tests on **whole storms the model never saw**, so the numbers are honest.

- **mae_cm:** average depth error in cm. Lower is better.
- **risk_level_accuracy:** how often the model gets none / moderate / high right.
- **high_risk_recall:** of the roads that really were high risk, how many the model caught. **Most important for safety.**
- **missed_high_as_safe:** roads that were high risk but the model called safe. **Should be 0.** If not, don't use
  the model for routing yet; keep using HEC-RAS scenarios directly.

Example pitch line: "Tested on storms it never saw, the model's average error was X cm and it caught Y% of
high-risk roads, with zero high-risk roads called safe."

## 5. Limits to state

- The model is only as good as HEC-RAS and its elevation data.
- It only knows this one neighbourhood; a new area needs new HEC-RAS runs.
- It predicts road depths only (no flood-area polygons) in `03_predict_scenario.py`.
- Live sensors would let it correct itself in real time (roadmap).
