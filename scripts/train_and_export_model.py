import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb
import joblib

def load_and_parse_jps_station_local(filepath, column_prefix):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    header_idx = 0
    for i, line in enumerate(lines[:15]):
        if 'No.' in line or 'Date/Time' in line or 'Time' in line:
            header_idx = i
            break
    df = pd.read_csv(filepath, skiprows=header_idx)
    df.columns = [c.strip().replace('"', '') for c in df.columns]
    datetime_cols = [c for c in df.columns if 'Date' in c or 'Time' in c or 'Clock' in c]
    datetime_col = datetime_cols[0] if datetime_cols else df.columns[1]
    
    # Try parsing format %d/%m/%Y %H:%M
    df['Timestamp'] = pd.to_datetime(df[datetime_col], format="%d/%m/%Y %H:%M", errors='coerce')
    df.dropna(subset=['Timestamp'], inplace=True)
    df.set_index('Timestamp', inplace=True)
    
    wl_cols = [c for c in df.columns if 'Level' in c or 'WL' in c or 'Water' in c or 'm' in c.lower()]
    rf_cols = [c for c in df.columns if 'Rain' in c or 'RF' in c or 'Rainfall' in c or 'mm' in c.lower()]
    
    selected_cols = {}
    if wl_cols:
        selected_cols[wl_cols[-1]] = f'{column_prefix}_level'
    if rf_cols:
        selected_cols[rf_cols[-1]] = f'{column_prefix}_rain'
        
    df = df[list(selected_cols.keys())].rename(columns=selected_cols)
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

print("Loading raw telemetry files from sime/...")
df_binjai = load_and_parse_jps_station_local('sime/Sg.BinjaidiPekanMeru.csv', 'binjai')
df_rasau = load_and_parse_jps_station_local('sime/Sg.RasaudiTuguKeris.csv', 'rasau')
df_klang = load_and_parse_jps_station_local('sime/Sg.KlangdiBandarKlang.csv', 'klang')

print(f"Loaded: Binjai={df_binjai.shape}, Rasau={df_rasau.shape}, Klang={df_klang.shape}")

merged_df = df_binjai.join([df_rasau, df_klang], how='outer')
merged_df = merged_df.ffill().bfill()

start_date = pd.to_datetime('2024-10-01 00:00:00')
end_date = pd.to_datetime('2024-12-31 23:59:00')
local_df = merged_df.loc[start_date:end_date].copy()

# Feature engineering matching colab.ipynb
for h in [1, 3, 6, 12, 24]:
    local_df[f'rain_cum_{h}h'] = local_df['binjai_rain'].rolling(window=h, min_periods=1).sum()
    
for lag in [1, 3, 6]:
    local_df[f'binjai_lvl_lag_{lag}h'] = local_df['binjai_level'].shift(lag)
    local_df[f'binjai_lvl_diff_{lag}h'] = local_df['binjai_level'] - local_df[f'binjai_lvl_lag_{lag}h']

# Target: 3-hour ahead prediction (note: in 15-min data, 3 hours ahead is shift(-12); in hourly it is shift(-3))
# Let's check: in colab.ipynb cell 10, shift(-3) was used on local_df.
local_df['target_3h'] = local_df['binjai_level'].shift(-3)

# Short-term difference & acceleration features from cell 11
local_df['binjai_diff_15m'] = local_df['binjai_level'] - local_df['binjai_level'].shift(1)
local_df['binjai_accel_15m'] = local_df['binjai_diff_15m'] - local_df['binjai_diff_15m'].shift(1)
local_df['binjai_diff_15m'] = local_df['binjai_diff_15m'].fillna(0.0)
local_df['binjai_accel_15m'] = local_df['binjai_accel_15m'].fillna(0.0)

local_df.dropna(inplace=True)

model_features = [
    'binjai_level', 'binjai_rain', 'rasau_level', 'klang_level',
    'rain_cum_1h', 'rain_cum_3h', 'rain_cum_6h', 'rain_cum_12h', 'rain_cum_24h',
    'binjai_lvl_lag_1h', 'binjai_lvl_lag_3h', 'binjai_lvl_lag_6h',
    'binjai_lvl_diff_1h', 'binjai_lvl_diff_3h', 'binjai_lvl_diff_6h',
    'binjai_diff_15m', 'binjai_accel_15m'
]

X_real = local_df[model_features]
y_real = local_df['target_3h']

n_samples = len(local_df)
tr_idx = int(n_samples * 0.7)
val_idx = int(n_samples * 0.85)

X_tr, y_tr = X_real.iloc[:tr_idx], y_real.iloc[:tr_idx]
X_te, y_te = X_real.iloc[val_idx:], y_real.iloc[val_idx:]

print(f"Training XGBoost regressor on {len(X_tr)} training samples...")
xgb_model = xgb.XGBRegressor(n_estimators=50, max_depth=5, learning_rate=0.1, random_state=42)
xgb_model.fit(X_tr, y_tr)

# Quick evaluation on test set
from sklearn.metrics import mean_absolute_error, mean_squared_error
preds_te = xgb_model.predict(X_te)
mae = mean_absolute_error(y_te, preds_te)
rmse = np.sqrt(mean_squared_error(y_te, preds_te))
print(f"XGBoost Test Performance -> MAE: {mae:.4f}m | RMSE: {rmse:.4f}m")

# Save model and feature columns directly to backend/models and sime
os.makedirs('backend/models', exist_ok=True)
joblib.dump(xgb_model, 'backend/models/real_xgboost_flood_model.joblib')
joblib.dump(model_features, 'backend/models/real_feature_columns.joblib')
joblib.dump(xgb_model, 'sime/real_xgboost_flood_model.joblib')
joblib.dump(model_features, 'sime/real_feature_columns.joblib')

print("SUCCESS: Serialized model and feature columns successfully!")
