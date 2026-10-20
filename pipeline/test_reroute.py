import json
import math
import heapq

def haversine(c1, c2):
    R = 6371000
    lng1, lat1 = math.radians(c1[0]), math.radians(c1[1])
    lng2, lat2 = math.radians(c2[0]), math.radians(c2[1])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lng2-lng1)/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def key(c):
    return f"{c[0]:.6f},{c[1]:.6f}"

with open("web/data/bbr/roads.geojson", "r", encoding="utf-8") as f:
    roads = json.load(f)

nodes, edges = {}, {}
for f in roads["features"]:
    coords = f["geometry"]["coordinates"]
    p = f["properties"]
    ak, bk = key(coords[0]), key(coords[-1])
    if ak not in nodes: nodes[ak] = {"coord": coords[0], "edges": []}
    if bk not in nodes: nodes[bk] = {"coord": coords[-1], "edges": []}
    e = {"id": str(p["id"]), "name": p.get("name"), "drive": p.get("drive", True), "walk": p.get("walk", True), "oneway": p.get("oneway", False), "length": p.get("length_m", 0), "hw": p.get("highway"), "bridge": p.get("bridge", False)}
    edges[e["id"]] = e
    nodes[ak]["edges"].append({"to": bk, "edge": e["id"], "forward": True})
    nodes[bk]["edges"].append({"to": ak, "edge": e["id"], "forward": False})

with open("web/data/bbr/places.json", "r", encoding="utf-8") as f:
    places = json.load(f)

p_casira = places[1]["coord"]
p_masjid = places[6]["coord"]

def route(blocked):
    def nearest(coord):
        best, bd = None, float("inf")
        for nid, n in nodes.items():
            usable = any(edges[x["edge"]]["drive"] and (x["forward"] or not edges[x["edge"]]["oneway"]) and x["edge"] not in blocked for x in n["edges"])
            if not usable: continue
            d = haversine(n["coord"], coord)
            if d < bd: bd, best = d, nid
        return best
    s = nearest(p_casira)
    t = nearest(p_masjid)
    dist = {s: 0}
    prev = {}
    heap = [(0, s)]
    while heap:
        d, u = heapq.heappop(heap)
        if u == t: break
        if d > dist.get(u, float("inf")): continue
        for x in nodes[u]["edges"]:
            if x["edge"] in blocked: continue
            e = edges[x["edge"]]
            if not (e["drive"] and (x["forward"] or not e["oneway"])): continue
            nd = d + e["length"]
            if nd < dist.get(x["to"], float("inf")):
                dist[x["to"]] = nd
                prev[x["to"]] = (u, x["edge"])
                heapq.heappush(heap, (nd, x["to"]))
    if t not in dist: return None
    path, curr = [], t
    while curr in prev:
        pu, pe = prev[curr]
        path.append(pe)
        curr = pu
    path.reverse()
    return path

normal = route(set())
print(f"Normal route has {len(normal)} edges:")
for eid in normal:
    e = edges[eid]
    print(f"  {eid}: {e['name']} ({e['hw']}, len={e['length']}m, bridge={e['bridge']})")

# Let us test blocking segments within Makyong or along Batu Belah
# For example, if Jalan Makyong 6 is flooded, can route enter via Jalan Makyong 1 or 3 or 4?
blocked_m6 = {eid for eid in normal if "Makyong 6" in (edges[eid]["name"] or "")}
print(f"\nTesting blocking Makyong 6 ({blocked_m6}):")
reroute_m6 = route(blocked_m6)
if reroute_m6:
    print(f"Reroute succeeded with {len(reroute_m6)} edges:")
    names = []
    for eid in reroute_m6:
        n = edges[eid]["name"]
        if not names or names[-1] != n: names.append(n)
    print(" -> ".join(names))
else:
    print("Blocked!")

# What if Persiaran Sungai Keramat is flooded?
blocked_sk = {eid for eid in normal if "Sungai Keramat" in (edges[eid]["name"] or "")}
print(f"\nTesting blocking Persiaran Sungai Keramat ({blocked_sk}):")
reroute_sk = route(blocked_sk)
if reroute_sk:
    print(f"Reroute succeeded with {len(reroute_sk)} edges:")
    names = []
    for eid in reroute_sk:
        n = edges[eid]["name"]
        if not names or names[-1] != n: names.append(n)
    print(" -> ".join(names))
else:
    print("Blocked!")
