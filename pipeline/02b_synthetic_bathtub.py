"""
Step 2 (fallback): make a SYNTHETIC scenario from an elevation model when HEC-RAS results
aren't ready yet. It uses a simple "bathtub" method: a water level rises over time and
everything lower than it is flooded. It ignores drains, flow direction and rain falling on
the ground, so it is only a placeholder. Mark it as synthetic in your submission.

Elevation: FABDEM (buildings and trees removed) or Copernicus GLO-30, clipped to your area.

Usage:
    python 02b_synthetic_bathtub.py --roads ../web/data/bbr/roads.geojson --dem bbr_fabdem.tif \
        --rise-m 1.2 --duration-min 180 --step-min 10 --rain-mm-hr 60 \
        --id heavy --name "Heavy rain (synthetic bathtub)" --out ../web/data/bbr
"""
import argparse
from datetime import datetime, timezone, timedelta
import numpy as np
import rasterio
from rasterio.io import MemoryFile
from common import load_roads, sample_line_max, depth_to_extent, write_scenario


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--roads", required=True)
    ap.add_argument("--dem", required=True)
    ap.add_argument("--rise-m", type=float, default=1.0, help="how far the water rises above the lowest ground")
    ap.add_argument("--duration-min", type=int, default=180)
    ap.add_argument("--step-min", type=int, default=10)
    ap.add_argument("--rain-mm-hr", type=float, required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    roads = load_roads(a.roads)
    with rasterio.open(a.dem) as dem:
        z = dem.read(1, masked=True).astype("float32")
        profile = dem.profile
        z_min = float(z.min())
        depths = {str(f["properties"]["id"]): [] for f in roads["features"]}
        extent = []
        for t in range(0, a.duration_min + 1, a.step_min):
            frac = min(1.0, t / (a.duration_min * 0.6))           # rise over the first 60% of the storm
            level = z_min + a.rise_m * (frac * frac * (3 - 2 * frac))
            d = np.clip(level - z.filled(np.inf), 0, None).astype("float32")
            profile.update(dtype="float32", count=1, nodata=-1)
            with MemoryFile() as mem:
                with mem.open(**profile) as tmp:
                    tmp.write(d, 1)
                    for f in roads["features"]:
                        depths[str(f["properties"]["id"])].append(round(sample_line_max(tmp, f["geometry"]["coordinates"]), 3))
            extent.append(depth_to_extent(d, dem.transform, dem.crs))
            print(f"t={t} min, water level {level:.2f} m")

    generated = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="minutes")
    write_scenario(a.out, a.id, a.name, a.rain_mm_hr, a.step_min, depths, extent, True, generated)
    print(f"Wrote SYNTHETIC scenario '{a.id}'.")


if __name__ == "__main__":
    main()
