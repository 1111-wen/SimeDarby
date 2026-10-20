import json
import math
from datetime import datetime, timezone, timedelta

with open("web/data/bbr/roads.geojson", "r", encoding="utf-8") as f:
    roads_fc = json.load(f)

# Find roads that are low-lying near Sungai Puloh canal (lat ~3.0928) or low Makyong sections
low_corridor_1 = [] # Persiaran Batu Belah KU5 & Jalan Sungai Puloh low canal dip
low_corridor_2 = [] # Jalan Makyong 6 low dip near canal
general_roads = []

for f in roads_fc["features"]:
    eid = f["properties"]["id"]
    name = (f["properties"].get("name") or "").lower()
    c = f["geometry"]["coordinates"]
    mid_lat = sum(pt[1] for pt in c) / len(c)
    mid_lng = sum(pt[0] for pt in c) / len(c)
    is_bridge = f["properties"].get("bridge", False)

    # Low corridor 1: Persiaran Batu Belah low section and Sungai Puloh canal bank
    if not is_bridge and ("sungai puloh" in name or ("batu belah" in name and 3.0910 <= mid_lat <= 3.0935 and mid_lng >= 101.430)):
        low_corridor_1.append(eid)
    elif not is_bridge and ("makyong 6" in name and 3.0880 <= mid_lat <= 3.0895):
        low_corridor_2.append(eid)
    else:
        general_roads.append(eid)

print(f"Low corridor 1 (canal dip): {len(low_corridor_1)} roads")
print(f"Low corridor 2 (Makyong 6 dip): {len(low_corridor_2)} roads")
print(f"General roads: {len(general_roads)} roads")

steps = 19 # 0 to 180 min by 10 min
step_min = 10
duration_min = 180
generated_time = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes")

def build_scenario(sc_id, name, rain_mm_hr, max_c1, max_c2):
    depths = {}
    # Time curve: rise between t=20 and t=90, peak at t=90-110, gradual recession
    for eid in [f["properties"]["id"] for f in roads_fc["features"]]:
        depths[eid] = [0.0] * steps

    extents = []
    for step_idx in range(steps):
        t = step_idx * step_min
        # Hydrograph curve
        if t < 20:
            curve = 0.0
        elif t <= 90:
            curve = math.sin((t - 20) / 70.0 * (math.pi / 2.0))
        elif t <= 120:
            curve = 1.0 - 0.15 * ((t - 90) / 30.0)
        else:
            curve = max(0.0, 0.85 - 0.85 * ((t - 120) / 60.0))

        # Assign depths
        d_c1 = round(max_c1 * curve, 3)
        d_c2 = round(max_c2 * curve, 3)

        for eid in low_corridor_1:
            depths[eid][step_idx] = d_c1
        for eid in low_corridor_2:
            depths[eid][step_idx] = d_c2

        # Extent polygon
        extent_features = []
        if d_c1 >= 0.05:
            extent_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [101.4315, 3.0920],
                        [101.4342, 3.0920],
                        [101.4340, 3.0935],
                        [101.4313, 3.0933],
                        [101.4315, 3.0920]
                    ]]
                },
                "properties": {
                    "level": "high" if d_c1 >= 0.30 else "moderate",
                    "depth_m": d_c1
                }
            })
        if d_c2 >= 0.05:
            extent_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [101.4270, 3.0882],
                        [101.4285, 3.0884],
                        [101.4283, 3.0894],
                        [101.4268, 3.0892],
                        [101.4270, 3.0882]
                    ]]
                },
                "properties": {
                    "level": "high" if d_c2 >= 0.30 else "moderate",
                    "depth_m": d_c2
                }
            })
        extents.append({
            "type": "FeatureCollection",
            "features": extent_features
        })

    data = {
        "scenario": sc_id,
        "name": name,
        "rain_mm_hr": rain_mm_hr,
        "generated": generated_time,
        "step_min": step_min,
        "synthetic": True,
        "depths": depths,
        "extent": extents
    }
    return data

# Moderate: max 0.12m on c1, 0.08m on c2 (Moderate risk for walk, drivable)
sc_moderate = build_scenario("moderate", "Moderate rain (~30 mm/h)", 30, 0.12, 0.08)
with open("web/data/bbr/scenarios/moderate.json", "w", encoding="utf-8") as f:
    json.dump(sc_moderate, f, separators=(",", ":"))

# Heavy: max 0.42m on c1, 0.38m on c2 (High risk for both, triggers reroute via Makyong 4)
sc_heavy = build_scenario("heavy", "Heavy rain (~60 mm/h)", 60, 0.42, 0.38)
with open("web/data/bbr/scenarios/heavy.json", "w", encoding="utf-8") as f:
    json.dump(sc_heavy, f, separators=(",", ":"))

# Extreme: max 0.65m on c1, 0.55m on c2
sc_extreme = build_scenario("extreme", "Extreme storm (~90 mm/h, 100-yr ARI)", 90, 0.65, 0.55)
with open("web/data/bbr/scenarios/extreme.json", "w", encoding="utf-8") as f:
    json.dump(sc_extreme, f, separators=(",", ":"))

# Update index.json
index_data = {
    "scenarios": [
        {"id": "dry", "file": "dry.json", "rain_mm_hr": 0, "name": "No rain (baseline)"},
        {"id": "moderate", "file": "moderate.json", "rain_mm_hr": 30, "name": "Moderate rain (~30 mm/h)"},
        {"id": "heavy", "file": "heavy.json", "rain_mm_hr": 60, "name": "Heavy rain (~60 mm/h)"},
        {"id": "extreme", "file": "extreme.json", "rain_mm_hr": 90, "name": "Extreme storm (~90 mm/h, 100-yr ARI)"}
    ]
}
with open("web/data/bbr/scenarios/index.json", "w", encoding="utf-8") as f:
    json.dump(index_data, f, indent=2)

print("Saved moderate.json, heavy.json, extreme.json and updated index.json successfully.")
