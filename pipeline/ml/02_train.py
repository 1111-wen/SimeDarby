"""
Step 2: train the ML "surrogate" model that copies HEC-RAS, and test it fairly.

Fair test: whole RUNS are held out (never seen in training), so the score shows how well
the model predicts a NEW storm, not just new time steps of a storm it already saw.

Usage:
    python 02_train.py --data dataset.csv --out model
    python 02_train.py --data dataset_sample.csv --out model_sample   # synthetic test

Outputs (in --out):
    model_now.joblib, model_next30.joblib   one model per target
    metrics.json                            errors and risk-level accuracy, for your pitch
"""
import argparse
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import GroupKFold

MODERATE, HIGH = 0.10, 0.30
TARGETS = {"now": "depth_now_m", "next30": "depth_max_next30_m"}
NOT_FEATURES = {"run_id", "edge_id", *TARGETS.values()}


def level(d):
    return np.where(d >= HIGH, 2, np.where(d >= MODERATE, 1, 0))  # 0 none, 1 moderate, 2 high


def evaluate(y_true, y_pred):
    lt, lp = level(y_true), level(y_pred)
    high = lt == 2
    return {
        "mae_cm": round(float(np.mean(np.abs(y_true - y_pred)) * 100), 2),
        "risk_level_accuracy": round(float(np.mean(lt == lp)), 3),
        # Safety matters most: of the roads that really were high risk, how many did we catch?
        "high_risk_recall": round(float(np.mean(lp[high] == 2)), 3) if high.any() else None,
        # And how often did we call a road safe when it was actually high risk? (should be ~0)
        "missed_high_as_safe": int(np.sum((lt == 2) & (lp == 0))),
    }


def make_model():
    return HistGradientBoostingRegressor(max_iter=400, learning_rate=0.06, max_leaf_nodes=31,
                                         min_samples_leaf=20, l2_regularization=0.1, random_state=0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default="model")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    df = pd.read_csv(a.data)
    features = [c for c in df.columns if c not in NOT_FEATURES]
    groups = df["run_id"]
    n_runs = groups.nunique()
    print(f"{len(df):,} rows, {n_runs} runs, features: {features}")
    if n_runs < 5:
        print("WARNING: fewer than 5 runs. Scores will be unreliable. Aim for 10-15 runs minimum, 30-50 ideally.")

    metrics = {"runs": int(n_runs), "rows": int(len(df)), "features": features, "targets": {}}
    for name, target in TARGETS.items():
        y = df[target].values
        # Cross-validation that holds out whole runs
        folds = min(5, n_runs) if n_runs >= 2 else None
        cv = []
        if folds:
            for tr, te in GroupKFold(n_splits=folds).split(df, y, groups):
                m = make_model().fit(df.iloc[tr][features], y[tr])
                pred = np.clip(m.predict(df.iloc[te][features]), 0, None)
                cv.append(evaluate(y[te], pred) | {"held_out_runs": sorted(groups.iloc[te].unique().tolist())})
        final = make_model().fit(df[features], y)
        joblib.dump({"model": final, "features": features, "target": target}, os.path.join(a.out, f"model_{name}.joblib"))
        metrics["targets"][name] = {"target": target, "cross_validation": cv}
        if cv:
            mean_mae = np.mean([c["mae_cm"] for c in cv])
            print(f"[{name}] average error on unseen storms: {mean_mae:.1f} cm")
            for c in cv:
                print(f"   held out {c['held_out_runs']}: MAE {c['mae_cm']} cm, risk accuracy {c['risk_level_accuracy']}, "
                      f"high-risk recall {c['high_risk_recall']}, missed high-as-safe {c['missed_high_as_safe']}")

    with open(os.path.join(a.out, "metrics.json"), "w") as fh:
        json.dump(metrics, fh, indent=2)
    print(f"Saved models and metrics to {a.out}/")


if __name__ == "__main__":
    main()
