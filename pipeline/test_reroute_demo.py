import json
import math
import heapq

def haversine(c1, c2):
    R = 6371000
    lng1, lat1 = math.radians(c1[0]), math.radians(c1[1])
    lng2, lat2 = math.radians(c2[0]), math.radians(c2[1])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
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
    e = {"id": str(p["id"]), "name": p.get("name"), "drive": p.get("drive", True), "walk": p.get("walk", True), "oneway": p.get("oneway", False), "length": p.get("length_m", 0), "hw": p.get("highway")}
    edges[e["id"]] = e
    nodes[ak]["edges"].append({"to": bk, "edge": e["id"], "forward": True})
    nodes[bk]["edges"].append({"to": ak, "edge": e["id"], "forward": False})

with open("web/data/bbr/places.json", "r", encoding="utf-8") as f:
    places = json.load(f)

def route(c1, c2, blocked):
    def nearest(coord):
        best, bd = None, float("inf")
        for nid, n in nodes.items():
            usable = any(edges[x["edge"]]["drive"] and (x["forward"] or not edges[x["edge"]]["oneway"]) and x["edge"] not in blocked for x in n["edges"])
            if not usable: continue
            d = haversine(n["coord"], coord)
            if d < bd: bd, best = d, nid
        return best
    s = nearest(c1)
    t = nearest(c2)
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

# Test trips with Makyong 6 blocked vs open
m6_edges = {"e447", "e332", "e333"}
for p1 in [places[0], places[1], places[2]]: # Kyra, Casira, Krista
    for p2 in [places[6]]: # Masjid
        p_norm = route(p1["coord"], p2["coord"], set())
        p_re = route(p1["coord"], p2["coord"], m6_edges)
        print(f"{p1['name']} -> {p2['name']}:")
        print(f"  Normal: {len(p_norm)} edges")
        print(f"  Reroute: {len(p_re)} edges (distinct: {p_norm != p_re})")
        r_names = []
        for eid in p_re:
            n = edges[eid]["name"]
            if not r_names or r_names[-1] != n: r_names.append(n)
        print("  Reroute path:", " -> ".join(r_names[:5]), "...", " -> ".join(r_names[-3:]))
