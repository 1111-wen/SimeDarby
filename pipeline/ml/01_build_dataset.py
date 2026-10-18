"""
Step 1: turn many HEC-RAS runs into one training table.

Each row = one road, at one time step, in one run:
    inputs  -> rainfall so far + road features
    targets -> water depth on that road now, and 30 minutes from now

INPUTS YOU NEED
  --runs           CSV listing every HEC-RAS run (see runs_template.csv):
                   run_id, scenario_file, rain_mm_hr, duration_min, pattern, notes
                   scenario_file = output of 02_hecras_to_scenario.py for that run
  --roads          roads.geojson (from 01_download_roads.py), the SAME file used for every run
  --dem            (optional) elevation GeoTIFF, e.g. FABDEM. Adds ground height features.
  --water          (optional) GeoJSON of rivers/streams/lakes. Adds distance-to-water.

Usage:
    python 01_build_dataset.py --runs runs.csv --roads ../../web/data/bbr/roads.geojson \
        --dem ../bbr_fabdem.tif --water ../bbr_water.geojson --out dataset.csv

Test with the synthetic sample (no DEM needed):
    python 01_build_dataset.py --runs runs_sample.csv --roads ../../web/data/sample/roads.geojson --out dataset_sample.csv
"""
import argparse
import json
import math
import os
import numpy as np
import pandas as pd

AHEAD_MIN = 30  # predict this far ahead (keep in sync with CONFIG.horizonMin in the app)


def line_midpoint(coords):
    return coords[len(coords) // 2] if len(coords) % 2 else [
        (coords[len(coords) // 2 - 1][0] + coords[len(coords) // 2][0]) / 2,
        (coords[len(coords) // 2 - 1][1] + coords[len(coords) // 2][1]) / 2]


def road_features(roads, dem_path=None, water_path=None):
    rows = []
    for f in roads["features"]:
        c = f["geometry"]["coordinates"]
        mid = line_midpoint(c)
        rows.append({"edge_id": str(f["properties"]["id"]), "lng": mid[0], "lat": mid[1],
                     "bridge": int(bool(f["properties"].get("bridge"))),
                     "length_m": float(f["properties"].get("length_m") or 0),
                     "_coords": c})
    df = pd.DataFrame(rows)

    if dem_path:
        import rasterio
        from pyproj import Transformer
        with rasterio.open(dem_path) as dem:
            tr = Transformer.from_crs("EPSG:4326", dem.crs, always_xy=True).transform
            def stats(coords):
                pts = [tr(x, y) for x, y in coords]
                vals = [v[0] for v in dem.sample(pts)]
                vals = [v for v in vals if v is not None and not np.isnan(v) and v != dem.nodata]
                return (min(vals), float(np.mean(vals))) if vals else (np.nan, np.nan)
            s = df["_coords"].apply(stats)
            df["elev_min"] = [a for a, _ in s]
            df["elev_mean"] = [b for _, b in s]
        # How low is this road compared with roads within 300 m? Low spots flood first.
        local = []
        for i, r in df.iterrows():
            d = np.hypot((df["lng"] - r["lng"]) * 111320 * math.cos(math.radians(r["lat"])), (df["lat"] - r["lat"]) * 111320)
            near = df.loc[d < 300, "elev_min"]
            local.append(r["elev_min"] - near.mean() if len(near) else 0.0)
        df["elev_rel"] = local

    if water_path:
        from shapely.geometry import shape, Point
        from shapely.ops import unary_union
        water = unary_union([shape(f["geometry"]) for f in json.load(open(water_path))["features"]])
        k = 111320
        df["dist_water_m"] = [Point(r.lng, r.lat).distance(water) * k for r in df.itertuples()]

    return df.drop(columns=["_coords"])


def rain_features(t, rain_mm_hr, duration_min):
    """Rain so far for a block storm (constant intensity). Extend here for other storm patterns."""
    raining = 1 if t < duration_min else 0
    cum_mm = rain_mm_hr * min(t, duration_min) / 60.0
    since_stop = max(0.0, t - duration_min)
    return {"t_min": t, "rain_mm_hr": rain_mm_hr, "duration_min": duration_min,
            "raining_now": raining, "cum_rain_mm": cum_mm, "min_since_rain_stopped": since_stop}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", required=True)
    ap.add_argument("--roads", required=True)
    ap.add_argument("--dem")
    ap.add_argument("--water")
    ap.add_argument("--out", default="dataset.csv")
    a = ap.parse_args()

    runs = pd.read_csv(a.runs)
    base = os.path.dirname(os.path.abspath(a.runs))
    roads = json.load(open(a.roads))
    rf = road_features(roads, a.dem, a.water).set_index("edge_id")

    rows = []
    for run in runs.itertuples():
        path = run.scenario_file if os.path.isabs(run.scenario_file) else os.path.join(base, run.scenario_file)
        sc = json.load(open(path))
        step = sc["step_min"]
        ahead = AHEAD_MIN // step
        for edge_id, series in sc["depths"].items():
            if edge_id not in rf.index:
                continue
            feats = rf.loc[edge_id].to_dict()
            for k, d in enumerate(series):
                t = k * step
                d_ahead = max(series[k:k + ahead + 1])  # deepest water in the next 30 min
                rows.append({"run_id": run.run_id, "edge_id": edge_id, **rain_features(t, run.rain_mm_hr, run.duration_min),
                             **feats, "depth_now_m": d, "depth_max_next30_m": d_ahead})
        print(f"Added run {run.run_id}: {len(sc['depths'])} roads x {len(next(iter(sc['depths'].values())))} steps")

    df = pd.DataFrame(rows)
    df.to_csv(a.out, index=False)
    print(f"Saved {len(df):,} rows and {df.shape[1]} columns to {a.out}")


if __name__ == "__main__":
    main()
