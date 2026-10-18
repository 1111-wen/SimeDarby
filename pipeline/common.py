"""Shared helpers for the FloodSafe Route data pipeline."""
import json
import os
import numpy as np
import rasterio
from rasterio import features
from shapely.geometry import shape, mapping, LineString
from shapely.ops import transform
from pyproj import Transformer



def load_roads(path):
    with open(path) as fh:
        return json.load(fh)


def sample_line_max(raster, line_lnglat, spacing_m=10.0):
    """Highest raster value along a road (lng/lat LineString), sampling every `spacing_m` metres."""
    to_r = Transformer.from_crs("EPSG:4326", raster.crs, always_xy=True).transform
    line = transform(to_r, LineString(line_lnglat))
    n = max(2, int(line.length / spacing_m) + 1)
    pts = [line.interpolate(i / (n - 1), normalized=True) for i in range(n)]
    vals = [v[0] for v in raster.sample([(p.x, p.y) for p in pts])]
    vals = [0.0 if (v is None or np.isnan(v) or v == raster.nodata or v < 0) else float(v) for v in vals]
    return max(vals) if vals else 0.0


# Depth bands for flooded-area polygons. The app colours them by depth using Walk or Drive thresholds.
BANDS = [0.05, 0.10, 0.15, 0.30, 0.60]


def depth_to_extent(depth, transform_affine, crs, simplify_m=5.0):
    """Turn a depth grid into GeoJSON polygons banded by depth (in lng/lat), each with its mean depth_m."""
    edges = BANDS + [np.inf]
    cls = np.zeros(depth.shape, dtype=np.uint8)
    for i in range(len(BANDS)):
        cls[(depth >= edges[i]) & (depth < edges[i + 1])] = i + 1
    to_ll = Transformer.from_crs(crs, "EPSG:4326", always_xy=True).transform
    feats = []
    for geom, val in features.shapes(cls, mask=cls > 0, transform=transform_affine):
        g = shape(geom).simplify(simplify_m)
        band = depth[cls == val]
        feats.append({"type": "Feature", "geometry": mapping(transform(to_ll, g)),
                      "properties": {"depth_m": round(float(np.nanmean(band)), 2) if band.size else BANDS[int(val) - 1]}})
    return {"type": "FeatureCollection", "features": feats}


def write_scenario(out_dir, sid, name, rain_mm_hr, step_min, depths, extent, synthetic, generated):
    os.makedirs(os.path.join(out_dir, "scenarios"), exist_ok=True)
    data = {"scenario": sid, "name": name, "rain_mm_hr": rain_mm_hr, "generated": generated,
            "step_min": step_min, "synthetic": synthetic, "depths": depths, "extent": extent}
    with open(os.path.join(out_dir, "scenarios", f"{sid}.json"), "w") as fh:
        json.dump(data, fh, separators=(",", ":"))
    idx_path = os.path.join(out_dir, "scenarios", "index.json")
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {"scenarios": []}
    index["scenarios"] = [s for s in index["scenarios"] if s["id"] != sid]
    index["scenarios"].append({"id": sid, "file": f"{sid}.json", "rain_mm_hr": rain_mm_hr})
    index["scenarios"].sort(key=lambda s: s["rain_mm_hr"] or 0)
    with open(idx_path, "w") as fh:
        json.dump(index, fh, indent=2)
