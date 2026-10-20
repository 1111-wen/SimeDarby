import json
import math
from datetime import datetime, timezone, timedelta

with open("web/data/bbr/roads.geojson", "r", encoding="utf-8") as f:
    roads_fc = json.load(f)

# Find roads in Jalan Makyong 4 that will flood
makyong_4_roads = []
for f in roads_fc["features"]:
    eid = f["properties"]["id"]
    name = (f["properties"].get("name") or "").lower()
    if "makyong 4" in name:
        makyong_4_roads.append(eid)

print(f"Jalan Makyong 4 roads: {len(makyong_4_roads)} ({makyong_4_roads[:8]}...)")

steps = 19
step_min = 10
generated_time = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes")

def build_scenario(sc_id, name, rain_mm_hr, m4_max_depth):
    depths = {}
    for eid in [f["properties"]["id"] for f in roads_fc["features"]]:
        depths[eid] = [0.0] * steps

    extents = []
    for step_idx in range(steps):
        t = step_idx * step_min
        # Hydrograph curve:
        # t < 15: dry (0m)
        # t = 20-30: minor runoff (0.05 - 0.12m)
        # t = 40: reaching 0.22m
        # t = 50: reaches 0.35m (HIGH RISK, >0.30m) -> triggers visible reroute!
        # t = 60-100: stays high (0.35 - 0.38m)
        # t > 110: recedes
        if t < 15:
            curve = 0.0
        elif t <= 50:
            curve = math.sin((t - 15) / 35.0 * (math.pi / 2.0))
        elif t <= 100:
            curve = 1.0 - 0.05 * ((t - 50) / 50.0)
        else:
            curve = max(0.0, 0.95 - 0.95 * ((t - 100) / 80.0))

        d_m4 = round(m4_max_depth * curve, 3)

        for eid in makyong_4_roads:
            depths[eid][step_idx] = d_m4

        # Extent polygon around Jalan Makyong 4
        extent_features = []
        if d_m4 >= 0.05:
            extent_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [101.4265, 3.0910],
                        [101.4320, 3.0912],
                        [101.4318, 3.0926],
                        [101.4263, 3.0924],
                        [101.4265, 3.0910]
                    ]]
                },
                "properties": {
                    "level": "high" if d_m4 >= 0.30 else "moderate",
                    "depth_m": d_m4
                }
            })
        extents.append({
            "type": "FeatureCollection",
            "features": extent_features
        })

    return {
        "scenario": sc_id,
        "name": name,
        "rain_mm_hr": rain_mm_hr,
        "generated": generated_time,
        "step_min": step_min,
        "synthetic": True,
        "depths": depths,
        "extent": extents
    }

# Heavy rain: Makyong 4 reaches 0.38m (HIGH RISK, >0.30m) at t=45-90 min!
# Makyong 6 stays safe, so purple route visibly diverts to Makyong 6!
heavy_data = build_scenario("heavy", "Heavy rain (~60 mm/h)", 60, 0.38)
with open("web/data/bbr/scenarios/heavy.json", "w", encoding="utf-8") as f:
    json.dump(heavy_data, f, separators=(",", ":"))

# Moderate: Makyong 4 reaches 0.12m (Moderate risk for walk, drivable for cars)
mod_data = build_scenario("moderate", "Moderate rain (~30 mm/h)", 30, 0.12)
with open("web/data/bbr/scenarios/moderate.json", "w", encoding="utf-8") as f:
    json.dump(mod_data, f, separators=(",", ":"))

# Extreme: Makyong 4 reaches 0.50m
ext_data = build_scenario("extreme", "Extreme storm (~90 mm/h, 100-yr ARI)", 90, 0.50)
with open("web/data/bbr/scenarios/extreme.json", "w", encoding="utf-8") as f:
    json.dump(ext_data, f, separators=(",", ":"))

print("Successfully written heavy.json, moderate.json, extreme.json.")
