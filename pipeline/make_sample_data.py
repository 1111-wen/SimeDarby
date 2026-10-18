"""
Create SYNTHETIC sample data so the web app runs before the real pipeline is ready.

Everything this script writes is invented: a grid of roads with a stream and two bridges,
sample places and relief centres, and three made-up rainfall scenarios. The roads will NOT
line up with the real basemap. Use it for testing the app only, and say so in any demo.

Usage (no extra packages needed):
    python make_sample_data.py --out ../web/data/sample
"""
import argparse
import json
import math
import os
from datetime import datetime, timezone, timedelta

CENTER = (101.462, 3.087)          # lng, lat (match web/js/config.js)
COLS, ROWS, BLOCK_M = 8, 6, 120
STREAM_U, BRIDGE_ROWS, FOOTBRIDGE_ROW = 4.5, (1, 4), 3
STEP_MIN, DURATION_MIN = 10, 180
SCENARIOS = [
    ("moderate", "Moderate rain (sample, ~30 mm/h)", 30, 0.35),
    ("heavy", "Heavy rain (sample, ~60 mm/h)", 60, 0.62),
    ("extreme", "Extreme rain (sample, ~100 mm/h)", 100, 1.00),
]
H_NAMES = ["Jalan Anggerik", "Jalan Bakawali", "Jalan Cempaka", "Jalan Dahlia", "Jalan Kenanga", "Jalan Melur"]
V_NAMES = [f"Lorong {k}" for k in range(1, 9)]

DLAT = BLOCK_M / 111320.0
DLNG = BLOCK_M / (111320.0 * math.cos(math.radians(CENTER[1])))


def to_lnglat(u, v):
    """Grid coordinates (u west->east, v north->south) to lng/lat around CENTER."""
    return [round(CENTER[0] + (u - (COLS - 1) / 2) * DLNG, 7),
            round(CENTER[1] - (v - (ROWS - 1) / 2) * DLAT, 7)]


def valley(u):
    return math.exp(-((u - STREAM_U) ** 2) / 0.12)


def elev(u, v):
    """Invented ground height (m): high in the west, low by the river in the east, a basin and a stream valley."""
    return (2.4 - 0.26 * u + 0.12 * abs(v - 2.5)
            - 0.7 * math.exp(-((u - 4.2) ** 2 + (v - 3.8) ** 2) / 2.2) - 0.9 * valley(u))


def smooth(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def depth(u, v, t, peak):
    """Invented flood depth (m) at minute t: low ground floods first, water spreads uphill over time."""
    if t <= 0:
        return 0.0
    e = elev(u, v) + 0.9 * valley(u) * 0.55
    s = min(1.0, max(0.0, (1.5 - e) / 1.1))
    if s <= 0:
        return 0.0
    arrival = 15 + 115 * (1 - s)
    recede = 1 - 0.45 * smooth(140, 180, t) if t > 140 else 1.0
    return peak * (s ** 1.3) * smooth(arrival, arrival + 45, t) * recede


def build_roads():
    feats, k = [], 0
    for j in range(ROWS):
        for i in range(COLS):
            if i < COLS - 1:
                crosses = i == 4
                if not crosses or j in BRIDGE_ROWS:
                    k += 1
                    name = ("North bridge" if j == 1 else "South bridge") if crosses else H_NAMES[j]
                    feats.append(road(f"r{k:03d}", name, crosses, (i, j), (i + 1, j)))
                elif j == FOOTBRIDGE_ROW:
                    k += 1  # pedestrian footbridge: walkers can cross here, cars can't
                    feats.append(road(f"r{k:03d}", "Footbridge", True, (i, j), (i + 1, j), walk=True, drive=False))
            if j < ROWS - 1:
                k += 1
                feats.append(road(f"r{k:03d}", V_NAMES[i], False, (i, j), (i, j + 1)))
    return {"type": "FeatureCollection", "features": feats}


def road(rid, name, bridge, a, b, walk=True, drive=True, oneway=False):
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    coords = [to_lnglat(*a), to_lnglat(*mid), to_lnglat(*b)]
    return {"type": "Feature",
            "geometry": {"type": "LineString", "coordinates": coords},
            "properties": {"id": rid, "name": name, "bridge": bridge, "walk": walk, "drive": drive,
                           "oneway": oneway, "length_m": BLOCK_M, "_a": a, "_b": b}}


def edge_depth(f, t, peak):
    (ai, aj), (bi, bj) = f["properties"]["_a"], f["properties"]["_b"]
    fs = (0, 1) if f["properties"]["bridge"] else (0, 0.5, 1)  # bridge deck: check its approaches
    return max(depth(ai + (bi - ai) * x, aj + (bj - aj) * x, t, peak) for x in fs)


def extent(t, peak, res=0.25):
    """Flooded-area polygons (squares) with depth class, for one time step."""
    feats = []
    u = -0.25
    while u < COLS - 0.75:
        v = -0.25
        while v < ROWS - 0.75:
            cu, cv = u + res / 2, v + res / 2
            d = depth(cu, cv, t, peak)
            if d >= 0.05:
                ring = [to_lnglat(u, v), to_lnglat(u + res, v), to_lnglat(u + res, v + res), to_lnglat(u, v + res), to_lnglat(u, v)]
                feats.append({"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [ring]},
                              "properties": {"depth_m": round(d, 2)}})
            v += res
        u += res
    return {"type": "FeatureCollection", "features": feats}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="../web/data/sample")
    out = ap.parse_args().out
    os.makedirs(os.path.join(out, "scenarios"), exist_ok=True)

    roads = build_roads()
    generated = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes")
    index = {"scenarios": []}
    steps = range(0, DURATION_MIN + 1, STEP_MIN)
    for sid, name, mmhr, peak in SCENARIOS:
        depths = {f["properties"]["id"]: [round(edge_depth(f, t, peak), 3) for t in steps] for f in roads["features"]}
        scen = {"scenario": sid, "name": name, "rain_mm_hr": mmhr, "generated": generated,
                "step_min": STEP_MIN, "synthetic": True, "depths": depths,
                "extent": [extent(t, peak) for t in steps]}
        with open(os.path.join(out, "scenarios", f"{sid}.json"), "w") as fh:
            json.dump(scen, fh, separators=(",", ":"))
        index["scenarios"].append({"id": sid, "file": f"{sid}.json", "rain_mm_hr": mmhr})
    with open(os.path.join(out, "scenarios", "index.json"), "w") as fh:
        json.dump(index, fh, indent=2)

    for f in roads["features"]:
        f["properties"].pop("_a"); f["properties"].pop("_b")
    with open(os.path.join(out, "roads.geojson"), "w") as fh:
        json.dump(roads, fh, separators=(",", ":"))

    places = [
        {"name": "Home, Jalan Kenanga (sample)", "coord": to_lnglat(6, 4), "type": "place"},
        {"name": "Home, Jalan Bakawali (sample)", "coord": to_lnglat(1, 2), "type": "place"},
        {"name": "Relief centre A (sample)", "coord": to_lnglat(0, 1), "type": "relief_centre", "verified": False},
        {"name": "Relief centre B (sample)", "coord": to_lnglat(1, 5), "type": "relief_centre", "verified": False},
        {"name": "School, Jalan Anggerik (sample)", "coord": to_lnglat(3, 0), "type": "place"},
        {"name": "Shop lots, Lorong 8 (sample)", "coord": to_lnglat(7, 1), "type": "place"},
        {"name": "Bus stop, Jalan Melur (sample)", "coord": to_lnglat(6, 5), "type": "place"},
    ]
    with open(os.path.join(out, "places.json"), "w") as fh:
        json.dump(places, fh, indent=2)
    print(f"Wrote synthetic sample data to {out}")


if __name__ == "__main__":
    main()
