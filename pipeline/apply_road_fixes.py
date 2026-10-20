import json
import os
import datetime

geojson_path = "web/data/bbr/roads.geojson"
with open(geojson_path, "r", encoding="utf-8") as f:
    data = json.load(f)

changed_ids = []
changes_detail = []

for f in data["features"]:
    p = f["properties"]
    if not p["drive"] and p["highway"] in ("residential", "service"):
        p["drive"] = True
        changed_ids.append(p["id"])
        changes_detail.append({
            "id": p["id"],
            "name": p.get("name") or "Unnamed road",
            "highway": p.get("highway"),
            "length_m": p.get("length_m"),
            "oneway": p.get("oneway", False),
            "start_coord": f["geometry"]["coordinates"][0],
            "end_coord": f["geometry"]["coordinates"][-1]
        })

print(f"Total segments updated: {len(changed_ids)}")

# Save updated roads.geojson
with open(geojson_path, "w", encoding="utf-8") as f:
    json.dump(data, f, separators=(",", ":"))

# Freeze copy
frozen_path = "web/data/bbr/roads_frozen_2026-10-20.geojson"
with open(frozen_path, "w", encoding="utf-8") as f:
    json.dump(data, f, separators=(",", ":"))
print(f"Saved frozen copy to {frozen_path}")

# Write road_fixes.txt
fixes_content = [
    "# FloodSafe Route - Manual Road Property Fixes",
    "# Date: 2026-10-20",
    f"# Total IDs changed: {len(changed_ids)}",
    "# Reason: OpenStreetMap access=private tags on gated/guarded neighborhoods wrongly flagged drivable roads as drive=false.",
    "# Action: Changed 'drive': false -> 'drive': true on residential and neighborhood service roads.",
    "# IDs preserved, geometry preserved.",
    "",
    "## Summary of Changed IDs:",
    ", ".join(changed_ids),
    "",
    "## Detailed List:",
    "ID\tHighway\tLength(m)\tOneway\tName"
]

for c in changes_detail:
    fixes_content.append(f"{c['id']}\t{c['highway']}\t{c['length_m']}\t{c['oneway']}\t{c['name']}")

txt_data = "\n".join(fixes_content)
with open("web/data/bbr/road_fixes.txt", "w", encoding="utf-8") as f:
    f.write(txt_data)
with open("road_fixes.txt", "w", encoding="utf-8") as f:
    f.write(txt_data)
with open("pipeline/road_fixes.txt", "w", encoding="utf-8") as f:
    f.write(txt_data)

print("Written road_fixes.txt successfully.")
