import urllib.request
import json

bbox = "3.087,101.399,3.110,101.4335"
query = f"""[out:json][timeout:25];
(
  way["natural"="water"]({bbox});
  relation["natural"="water"]({bbox});
  way["water"]({bbox});
  way["landuse"="basin"]({bbox});
  way["landuse"="reservoir"]({bbox});
  way["leisure"="park"]({bbox});
  way["leisure"="garden"]({bbox});
  way["landuse"="grass"]({bbox});
  way["natural"="wetland"]({bbox});
  way["natural"="wood"]({bbox});
  node["natural"="tree"]({bbox});
);
out body;
>;
out skel qt;"""

url = "https://overpass.kumi.systems/api/interpreter"
req = urllib.request.Request(url, data=query.encode("utf-8"), headers={"User-Agent": "FloodSafeRoute/1.0"})
try:
    resp = urllib.request.urlopen(req, timeout=30)
    data = json.loads(resp.read().decode("utf-8"))
    elements = data.get("elements", [])
    print("Overpass elements received:", len(elements))
    ways = [el for el in elements if el["type"] == "way" and "tags" in el]
    nodes = [el for el in elements if el["type"] == "node" and "tags" in el]
    print(f"Tagged ways: {len(ways)}, Tagged nodes: {len(nodes)}")
    for w in ways[:20]:
        print("Way:", w["id"], w.get("tags"))
    # Save raw response
    with open("pipeline/cache/overpass_sponge_raw.json", "w", encoding="utf-8") as f:
        json.dump(data, f)
except Exception as e:
    print("Overpass query failed:", e)
