"""
Step 2: convert HEC-RAS 2D results into an app scenario.

In HEC-RAS RAS Mapper, export the Depth layer as GeoTIFF for each output time step
(for example every 10 minutes) into one folder, named so they sort in time order:
    depth_000.tif, depth_010.tif, depth_020.tif, ...

Usage:
    python 02_hecras_to_scenario.py --roads ../web/data/bbr/roads.geojson \
        --rasters ./hecras_heavy --step-min 10 --rain-mm-hr 60 \
        --id heavy --name "Heavy rain (~60 mm/h)" --out ../web/data/bbr
"""
import argparse
import glob
import os
from datetime import datetime, timezone, timedelta
import numpy as np
import rasterio
from common import load_roads, sample_line_max, depth_to_extent, write_scenario


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--roads", required=True)
    ap.add_argument("--rasters", required=True, help="folder of depth GeoTIFFs, one per time step")
    ap.add_argument("--step-min", type=int, required=True)
    ap.add_argument("--rain-mm-hr", type=float, required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    roads = load_roads(a.roads)
    files = sorted(glob.glob(os.path.join(a.rasters, "*.tif")))
    if not files:
        raise SystemExit("No .tif files found in " + a.rasters)

    depths = {str(f["properties"]["id"]): [] for f in roads["features"]}
    extent = []
    for path in files:
        with rasterio.open(path) as r:
            grid = r.read(1, masked=True).filled(0).astype("float32")
            grid[grid < 0] = 0
            for f in roads["features"]:
                depths[str(f["properties"]["id"])].append(round(sample_line_max(r, f["geometry"]["coordinates"]), 3))
            extent.append(depth_to_extent(grid, r.transform, r.crs))
        print("Processed", os.path.basename(path))

    generated = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes")
    write_scenario(a.out, a.id, a.name, a.rain_mm_hr, a.step_min, depths, extent, False, generated)
    print(f"Wrote scenario '{a.id}' with {len(files)} time steps.")


if __name__ == "__main__":
    main()
