"""
FloodSafe Route AI — Local Prediction Server
Bridges the Colab XGBoost Hydrology Model to the Frontend Progressive Web App.

Telemetry Inputs:
- Sg. Binjai di Pekan Meru (3112401): Water Level (m) & Rainfall (mm)
- Sg. Rasau di Tugu Keris (3014001): Water Level (m)
- Sg. Klang di Bandar Klang (3014004): Water Level (m)
"""

import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for local development and frontend access
CORS(app)

# Paths for serialized Colab model assets
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "real_xgboost_flood_model.joblib")
FEATURE_PATH = os.path.join(MODEL_DIR, "real_feature_columns.joblib")

# Check if model files exist
xgb_model = None
feature_columns = None

try:
    import joblib
    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURE_PATH):
        xgb_model = joblib.load(MODEL_PATH)
        feature_columns = joblib.load(FEATURE_PATH)
        print(f"[OK] Loaded trained XGBoost model from: {MODEL_PATH}")
    else:
        print(f"[INFO] Serialized .joblib model not found in {MODEL_DIR}.")
        print("[INFO] Server will use calibrated MSMA hydrologic regression formula from colab.ipynb.")
except Exception as e:
    print(f"[WARN] Could not load joblib model: {e}. Using calibrated fallback formula.")

def classify_jps_threshold(level_m):
    """
    Official JPS Selangor thresholds for Sg. Binjai di Pekan Meru (Station 3112401)
    """
    if level_m < 3.50:
        return "NORMAL"
    elif level_m < 4.20:
        return "ALERT"
    elif level_m < 4.50:
        return "WARNING"
    else:
        return "DANGER"

def predict_water_level(binjai_lvl, binjai_rn, rasau_lvl, klang_lvl, cum_rain_3h=None):
    """
    Predict water level 3 hours ahead.
    If XGBoost joblib model is present, runs model.predict().
    Otherwise, applies the calibrated three-station hydrologic regression from colab.ipynb.
    """
    if cum_rain_3h is None:
        cum_rain_3h = binjai_rn * 2.2  # estimated 3-hour storm accumulation

    # 1. Use real XGBoost model if weights are available
    if xgb_model is not None and feature_columns is not None:
        try:
            import pandas as pd
            input_dict = {
                'binjai_level': [binjai_lvl],
                'binjai_rain': [binjai_rn],
                'rasau_level': [rasau_lvl],
                'klang_level': [klang_lvl],
                'rain_cum_1h': [binjai_rn],
                'rain_cum_3h': [cum_rain_3h],
                'rain_cum_6h': [cum_rain_3h * 1.5],
                'rain_cum_12h': [cum_rain_3h * 1.8],
                'rain_cum_24h': [cum_rain_3h * 2.0],
                'binjai_lvl_lag_1h': [binjai_lvl],
                'binjai_lvl_lag_3h': [max(1.8, binjai_lvl - 0.2)],
                'binjai_lvl_lag_6h': [max(1.8, binjai_lvl - 0.4)],
                'binjai_lvl_diff_1h': [0.0],
                'binjai_lvl_diff_3h': [0.2],
                'binjai_lvl_diff_6h': [0.4]
            }
            # Fill any missing columns from feature_columns
            for col in feature_columns:
                if col not in input_dict:
                    input_dict[col] = [0.0]
            df_in = pd.DataFrame(input_dict)[feature_columns]
            pred = float(xgb_model.predict(df_in)[0])
            return round(pred, 3), "real_xgboost_joblib"
        except Exception as err:
            print(f"[WARN] Error running XGBoost predict: {err}. Using calibrated formula.")

    # 2. Calibrated multi-station hydrologic formula (from colab.ipynb parameters)
    # Base response: antecedent stage decay + cumulative runoff coefficient + downstream backwater pressure
    rain_runoff_impact = (cum_rain_3h * 0.048) + (binjai_rn * 0.025)
    downstream_backwater = max(0.0, (rasau_lvl - 2.10) * 0.18) + max(0.0, (klang_lvl - 1.95) * 0.12)
    predicted = (0.88 * binjai_lvl) + (0.12 * 1.80) + rain_runoff_impact + downstream_backwater
    predicted = max(1.20, min(6.50, predicted))
    return round(predicted, 3), "calibrated_hydrology_model"

@app.route("/", methods=["GET"])
def health_check():
    # If opened directly in a web browser, serve a user-friendly status dashboard
    if "text/html" in request.headers.get("Accept", ""):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FloodSafe Route — AI Backend</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    h1 { font-size: 24px; margin: 0 0 8px 0; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
    p { color: #94a3b8; line-height: 1.6; margin: 8px 0 20px 0; font-size: 14.5px; }
    .status-pill { display: inline-flex; align-items: center; gap: 6px; background: #064e3b; color: #34d399; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid #059669; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; }
    .btn { display: block; text-align: center; background: #2563eb; color: #fff; text-decoration: none; font-weight: 700; padding: 14px 20px; border-radius: 10px; font-size: 15px; transition: background .2s; margin: 24px 0 16px 0; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
    .btn:hover { background: #1d4ed8; }
    .box { background: #0f172a; border-radius: 10px; padding: 16px; border: 1px solid #334155; margin-top: 16px; font-size: 13px; }
    .box-title { font-weight: 700; color: #e2e8f0; margin-bottom: 8px; }
    .station-list { list-style: none; padding: 0; margin: 0; }
    .station-list li { padding: 6px 0; border-bottom: 1px solid #1e293b; color: #cbd5e1; display: flex; justify-content: space-between; }
    .station-list li:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h1>🤖 AI Hydrologic Backend</h1>
      <span class="status-pill"><span class="dot"></span> Online</span>
    </div>
    <p>This server is the <b>background prediction API (Port 5000)</b>. It calculates 3-hour ahead flood stage predictions from JPS telemetry stations and sends them to the interactive map.</p>
    
    <a href="http://localhost:8000" class="btn">🚀 Open FloodSafe Map Application (Port 8000)</a>

    <div class="box">
      <div class="box-title">Connected JPS Selangor Telemetry Stations:</div>
      <ul class="station-list">
        <li><span>🌊 Station 3112401</span> <b>Sg. Binjai di Pekan Meru (Target)</b></li>
        <li><span>📉 Station 3014001</span> <b>Sg. Rasau di Tugu Keris (Downstream)</b></li>
        <li><span>⚓ Station 3014004</span> <b>Sg. Klang di Bandar Klang (Confluence)</b></li>
      </ul>
    </div>
  </div>
</body>
</html>"""
        return html, 200, {"Content-Type": "text/html; charset=utf-8"}

    return jsonify({
        "status": "online",
        "service": "FloodSafe Route AI Backend",
        "model_loaded": xgb_model is not None,
        "model_path": MODEL_PATH if xgb_model is not None else None,
        "stations": [
            {"id": "3112401", "name": "Sg. Binjai di Pekan Meru", "type": "Water Level & Rainfall"},
            {"id": "3014001", "name": "Sg. Rasau di Tugu Keris", "type": "Downstream Water Level"},
            {"id": "3014004", "name": "Sg. Klang di Bandar Klang", "type": "Confluence Water Level"}
        ],
        "endpoints": {
            "/predict": "GET — Forecast water level 3 hours ahead and compute JPS risk category"
        }
    })

@app.route("/predict", methods=["GET"])
def predict_endpoint():
    try:
        # Parse query parameters with sensible real-world defaults (normal conditions)
        binjai_lvl = float(request.args.get("binjai_level", 2.10))
        binjai_rn = float(request.args.get("binjai_rain", 0.0))
        rasau_lvl = float(request.args.get("rasau_level", 2.05))
        klang_lvl = float(request.args.get("klang_level", 1.90))
        cum_rain_3h = float(request.args.get("cum_rain_3h", binjai_rn * 2.0))

        predicted_lvl, source = predict_water_level(binjai_lvl, binjai_rn, rasau_lvl, klang_lvl, cum_rain_3h)
        category = classify_jps_threshold(predicted_lvl)

        # Sponge township retention calculation based on predicted river stage
        # Normal (<3.5m): 18-65%, Alert (3.5-4.2m): 70-79%, Warning (4.2-4.5m): 80-89%, Danger (>=4.5m): 90-100%
        if category == "NORMAL":
            retention_pct = int(18 + (predicted_lvl / 3.50) * 45)
        elif category == "ALERT":
            retention_pct = int(70 + ((predicted_lvl - 3.50) / 0.70) * 9)
        elif category == "WARNING":
            retention_pct = int(80 + ((predicted_lvl - 4.20) / 0.30) * 9)
        else:
            retention_pct = min(100, int(90 + ((predicted_lvl - 4.50) / 0.50) * 10))

        color_map = {
            "NORMAL": "#2e7d32",
            "ALERT": "#f57f17",
            "WARNING": "#e65100",
            "DANGER": "#c62828"
        }
        badge_map = {
            "NORMAL": "badge-safe",
            "ALERT": "badge-alert",
            "WARNING": "badge-warning",
            "DANGER": "badge-danger"
        }

        response = {
            "status": "success",
            "station": "Sg. Binjai di Pekan Meru (Station 3112401)",
            "downstream_telemetry": {
                "Sg_Rasau_m": rasau_lvl,
                "Sg_Klang_m": klang_lvl
            },
            "forecast_horizon_hours": 3,
            "current_level_m": binjai_lvl,
            "current_rain_mm_hr": binjai_rn,
            "predicted_level_m": predicted_lvl,
            "risk_category": category,
            "risk_color": color_map[category],
            "badge_class": badge_map[category],
            "applicable_official_threshold_category": category,
            "sponge_retention_pct": retention_pct,
            "model_source": source,
            "jps_thresholds": {
                "normal": "< 3.50m",
                "alert": "3.50m - 4.19m",
                "warning": "4.20m - 4.49m",
                "danger": ">= 4.50m"
            }
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n=======================================================")
    print(f" FloodSafe Route AI Backend running on http://127.0.0.1:{port}")
    print(f" Endpoint: http://127.0.0.1:{port}/predict")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
