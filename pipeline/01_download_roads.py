"""
Step 1: download real roads AND footpaths for your neighbourhood from OpenStreetMap and save
them in the format the app expects (roads.geojson). Each road is marked as walkable, drivable
or both, and one-way streets keep their direction, so the app can route in Walk or Drive mode.

Usage:
    python 01_download_roads.py --bbox 101.399 3.0905 101.4225 3.110 --out ../web/data/bbr
    (bbox = west south east north, in degrees)

Run this ONCE and keep the file: every flood scenario is matched to these road IDs.
Data: (c) OpenStreetMap contributors, ODbL. Credit OpenStreetMap in the app and submission.
"""
import argparse
import json
import os
import osmnx as ox

DRIVE_TYPES = {"motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
               "secondary", "secondary_link", "tertiary", "tertiary_link", "unclassified",
               "residential", "living_street", "service", "road"}
NO_WALK_TYPES = {"motorway", "motorway_link", "trunk", "trunk_link"}
NO_DRIVE_SERVICE = {"parking_aisle", "drive-through", "emergency_access"}


def first(v):
    return v[0] if isinstance(v, list) and v else v


def is_yes(v):
    v = first(v)
    return v not in (None, "", "no", "nan", "None", False) and str(v).lower() not in ("no", "nan", "none", "false")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bbox", nargs=4, type=float, required=True, metavar=("WEST", "SOUTH", "EAST", "NORTH"))
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    west, south, east, north = a.bbox

    ox.settings.useful_tags_way = list(set(ox.settings.useful_tags_way + ["bridge", "foot", "motor_vehicle", "access", "service"]))
    # osmnx 2.x takes bbox=(west, south, east, north); 1.x takes north, south, east, west.
    try:
        G = ox.graph_from_bbox(bbox=(west, south, east, north), network_type="all", simplify=True)
    except TypeError:
        G = ox.graph_from_bbox(north, south, east, west, network_type="all", simplify=True)
    edges = ox.graph_to_gdfs(G, nodes=False).reset_index()

    seen, feats = set(), []
    for row in edges.itertuples(index=False):
        r = row._asdict()
        hw = str(first(r.get("highway")))
        oneway = bool(first(r.get("oneway"))) and hw not in ("footway", "path", "pedestrian", "steps", "cycleway")
        coords = [list(c) for c in r["geometry"].coords]
        # Two-way roads appear twice in the directed graph (u->v and v->u): keep one copy.
        pair = (min(r["u"], r["v"]), max(r["u"], r["v"]), round(float(r["length"]), 1))
        if not oneway:
            if pair in seen:
                continue
            seen.add(pair)
        drive = hw in DRIVE_TYPES and str(first(r.get("access"))) not in ("no", "private") \
            and str(first(r.get("motor_vehicle"))) != "no" and str(first(r.get("service"))) not in NO_DRIVE_SERVICE
        walk = hw not in NO_WALK_TYPES and str(first(r.get("foot"))) != "no"
        if not (walk or drive):
            continue
        name = first(r.get("name"))
        feats.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": coords},   # drawn in travel direction for one-ways
            "properties": {"id": f"e{len(feats)}", "name": name if isinstance(name, str) else "Unnamed road",
                           "highway": hw, "walk": walk, "drive": drive, "oneway": oneway and drive,
                           "bridge": is_yes(r.get("bridge")), "length_m": round(float(r["length"]), 1)}
        })

    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, "roads.geojson"), "w") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh, separators=(",", ":"))
    nw = sum(f["properties"]["walk"] for f in feats); nd = sum(f["properties"]["drive"] for f in feats)
    print(f"Saved {len(feats)} segments ({nw} walkable, {nd} drivable) to {a.out}/roads.geojson")

    places_path = os.path.join(a.out, "places.json")
    if not os.path.exists(places_path):
        here = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(here, "places_template.json")) as src, open(places_path, "w") as dst:
            dst.write(src.read())
        print(f"Created {places_path} from places_template.json. Edit it with real, verified places.")


if __name__ == "__main__":
    main()
