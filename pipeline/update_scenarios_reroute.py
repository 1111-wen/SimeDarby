import json
import math
from datetime import datetime, timezone, timedelta

with open("web/data/bbr/roads.geojson", "r", encoding="utf-8") as f:
    roads_fc = json.load(f)

# Roads in Jalan Makyong 6 that will flood
makyong_6_roads = []
for f in roads_fc["features"]:
    eid = f["properties"]["id"]
    name = (f["properties"].get("name") or "").lower()
    if "makyong 6" in name:
        makyong_6_roads.append(eid)

print(f"Jalan Makyong 6 roads: {len(makyong_6_roads)} ({makyong_6_roads})")

# Minor canal bank service tracks (low-lying)
canal_low_tracks = []
for f in roads_fc["features"]:
    eid = f["properties"]["id"]
    name = (f["properties"].get("name") or "").lower()
    c = f["geometry"]["coordinates"]
    mid_lat = sum(pt[1] for pt in c) / len(c)
    mid_lng = sum(pt[0] for pt in c) / len(c)
    # Only service tracks right on the water edge of Sungai Puloh
    if "sungai puloh" in name and f["properties"].get("highway") == "service":
        canal_low_tracks.append(eid)

print(f"Canal low service tracks: {len(canal_low_tracks)}")

steps = 19
step_min = 10
generated_time = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes")

def build_scenario(sc_id, name, rain_mm_hr, m6_max_depth, track_max_depth):
    depths = {}
    for eid in [f["properties"]["id"] for f in roads_fc["features"]]:
        depths[eid] = [0.0] * steps

    extents = []
    for step_idx in range(steps):
        t = step_idx * step_min
        # Hydrograph curve: starts rising at t=20, reaches peak at t=60-90, recedes after t=120
        if t < 15:
            curve = 0.0
        elif t <= 60:
            curve = math.sin((t - 15) / 45.0 * (math.pi / 2.0))
        elif t <= 110:
            curve = 1.0 - 0.05 * ((t - 60) / 50.0)
        else:
            curve = max(0.0, 0.95 - 0.95 * ((t - 110) / 70.0))

        d_m6 = round(m6_max_depth * curve, 3)
        d_track = round(track_max_depth * curve, 3)

        for eid in makyong_6_roads:
            depths[eid][step_idx] = d_m6
        for eid in canal_low_tracks:
            depths[eid][step_idx] = d_track

        # Extent polygon around Jalan Makyong 6
        extent_features = []
        if d_m6 >= 0.05:
            extent_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [101.4265, 3.0880],
                        [101.4285, 3.0882],
                        [101.4283, 3.0892],
                        [101.4263, 3.0890],
                        [101.4265, 3.0880]
                    ]]
                },
                "properties": {
                    "level": "high" if d_m6 >= 0.30 else "moderate",
                    "depth_m": d_m6
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

# Heavy rain: Makyong 6 reaches 0.38m (HIGH RISK, >0.30m) at t=45-90 min!
# Persiaran Batu Belah and Makyong 4 stay open, enabling the purple route to reroute!
heavy_data = build_scenario("heavy", "Heavy rain (~60 mm/h)", 60, 0.38, 0.45)
with open("web/data/bbr/scenarios/heavy.json", "w", encoding="utf-8") as f:
    json.dump(heavy_data, f, separators=(",", ":"))

# Moderate: Makyong 6 reaches 0.12m (Moderate risk for walk, light for drive)
mod_data = build_scenario("moderate", "Moderate rain (~30 mm/h)", 30, 0.14, 0.20)
with open("web/data/bbr/scenarios/moderate.json", "w", encoding="utf-8") as f:
    json.dump(mod_data, f, separators=(",", ":"))

# Extreme: Makyong 6 reaches 0.55m
ext_data = build_scenario("extreme", "Extreme storm (~90 mm/h, 100-yr ARI)", 90, 0.55, 0.65)
with open("web/data/bbr/scenarios/extreme.json", "w", encoding="utf-8") as f:
    json.dump(ext_data, f, separators=(",", ":"))

print("Regenerated heavy.json, moderate.json, extreme.json.")
