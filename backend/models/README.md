# Model Directory for FloodSafe Route AI

Place your serialized model assets from Google Colab into this directory:
- `real_xgboost_flood_model.joblib`
- `real_feature_columns.joblib`

### How It Works:
1. When these two `.joblib` files are present, `backend/app.py` automatically detects and loads your trained XGBoost model for predictions.
2. If the `.joblib` files are not yet downloaded, `backend/app.py` seamlessly runs the calibrated multi-station hydrologic regression formula derived from your notebook cells, ensuring continuous uptime.
