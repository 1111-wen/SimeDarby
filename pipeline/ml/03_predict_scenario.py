"""
Step 3: use the trained model to predict flooding for ANY rainfall (even amounts HEC-RAS never ran)
and save it as an app scenario. The app loads it like any other scenario.

Usage:
    python 03_predict_scenario.py --model model --roads ../../web/data/bbr/roads.geojson \
        --dem ../bbr_fabdem.tif --water ../bbr_water.geojson \
        --rain-mm-hr 75 --duration-min 90 --id ml_75 --out ../../web/data/bbr

Use the SAME --dem and --water you used in 01_build_dataset.py, so the features match.
"""
import argparse
import importlib.util
import json
import os
from datetime import datetime, timezone, timedelta
import joblib
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("build", os.path.join(HERE, "01_build_dataset.py"))
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--roads", required=True)
    ap.add_argument("--dem")
    ap.add_argument("--water")
    ap.add_argument("--rain-mm-hr", type=float, required=True)
    ap.add_argument("--duration-min", type=int, required=True)
    ap.add_argument("--after-min", type=int, default=60, help="keep predicting this long after rain stops")
    ap.add_argument("--step-min", type=int, default=10)
    ap.add_argument("--id", required=True)
    ap.add_argument("--name")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    bundle = joblib.load(os.path.join(a.model, "model_now.joblib"))
    model, features = bundle["model"], bundle["features"]
    roads = json.load(open(a.roads))
    rf = build.road_features(roads, a.dem, a.water)

    times = list(range(0, a.duration_min + a.after_min + 1, a.step_min))
    frames = []
    for t in times:
        f = rf.copy()
        for k, v in build.rain_features(t, a.rain_mm_hr, a.duration_min).items():
            f[k] = v
        frames.append(f)
    X = pd.concat(frames, ignore_index=True)
    missing = [c for c in features if c not in X.columns]
    if missing:
        raise SystemExit(f"Missing features {missing}. Pass the same --dem/--water used for training.")
    pred = np.clip(model.predict(X[features]), 0, None).reshape(len(times), len(rf))
    pred[0, :] = 0.0  # no water before rain starts

    depths = {eid: [round(float(pred[k, i]), 3) for k in range(len(times))] for i, eid in enumerate(rf["edge_id"])}
    scen = {"scenario": a.id, "name": a.name or f"ML prediction ({a.rain_mm_hr:g} mm/h for {a.duration_min} min)",
            "rain_mm_hr": a.rain_mm_hr, "step_min": a.step_min, "ml_predicted": True, "synthetic": False,
            "generated": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes"),
            "depths": depths, "extent": []}

    os.makedirs(os.path.join(a.out, "scenarios"), exist_ok=True)
    with open(os.path.join(a.out, "scenarios", f"{a.id}.json"), "w") as fh:
        json.dump(scen, fh, separators=(",", ":"))
    idx_path = os.path.join(a.out, "scenarios", "index.json")
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {"scenarios": []}
    index["scenarios"] = [s for s in index["scenarios"] if s["id"] != a.id] + [{"id": a.id, "file": f"{a.id}.json", "rain_mm_hr": a.rain_mm_hr}]
    index["scenarios"].sort(key=lambda s: s["rain_mm_hr"] or 0)
    with open(idx_path, "w") as fh:
        json.dump(index, fh, indent=2)
    print(f"Saved ML scenario '{a.id}' ({len(depths)} roads x {len(times)} steps). Road risk only; no flood-area polygons.")


if __name__ == "__main__":
    main()
