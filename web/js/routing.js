// Road graph and flood-aware routing (Dijkstra with a binary heap).
import { haversine } from "./geo.js";

const key = ([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`;

// roadsFC: GeoJSON FeatureCollection of LineStrings with properties
// { id, name, length_m, bridge, walk, drive, oneway }. One-way roads are drawn in their travel direction.
export function buildGraph(roadsFC) {
  const nodes = new Map(); // nodeId -> { id, coord, edges: [{ to, edge }] }
  const edges = new Map(); // edgeId -> { id, name, bridge, length, coords, a, b }
  const node = c => {
    const k = key(c);
    if (!nodes.has(k)) nodes.set(k, { id: k, coord: c, edges: [] });
    return nodes.get(k);
  };
  for (const f of roadsFC.features) {
    const coords = f.geometry && f.geometry.coordinates;
    if (!coords || coords.length < 2) continue;
    const a = node(coords[0]), b = node(coords[coords.length - 1]);
    let length = f.properties.length_m;
    if (!length) {
      length = 0;
      for (let i = 1; i < coords.length; i++) length += haversine(coords[i - 1], coords[i]);
    }
    const p = f.properties;
    const e = {
      id: String(p.id),
      name: p.name || "Unnamed road",
      bridge: !!p.bridge, highway: p.highway || null,
      walk: p.walk !== false, drive: p.drive !== false, oneway: !!p.oneway,
      length, coords, a: a.id, b: b.id
    };
    edges.set(e.id, e);
    a.edges.push({ to: b.id, edge: e.id, forward: true });
    b.edges.push({ to: a.id, edge: e.id, forward: false });
  }
  return { nodes, edges };
}

// Can this road be used in this mode, in this direction?
export function allowed(e, mode, forward = true) {
  if (mode === "walk") return e.walk;
  return e.drive && (forward || !e.oneway);
}

// Nearest junction that has at least one road usable in this mode.
export function nearestNode(graph, lngLat, mode = "drive") {
  let best = null, bd = Infinity;
  for (const n of graph.nodes.values()) {
    if (!n.edges.some(x => allowed(graph.edges.get(x.edge), mode, true) || allowed(graph.edges.get(x.edge), mode, false))) continue;
    const d = haversine(n.coord, lngLat);
    if (d < bd) { bd = d; best = n; }
  }
  return best ? { node: best, distanceM: bd } : null;
}

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

// costFn(edge) returns a cost in metres, or Infinity to block that road.
export function route(graph, srcId, dstId, costFn, mode = "drive") {
  const dist = new Map([[srcId, 0]]), prev = new Map(), heap = new Heap();
  heap.push([0, srcId]);
  while (heap.size) {
    const [d, u] = heap.pop();
    if (u === dstId) break;
    if (d > (dist.get(u) ?? Infinity)) continue;
    for (const { to, edge, forward } of graph.nodes.get(u).edges) {
      const e = graph.edges.get(edge);
      if (!allowed(e, mode, forward)) continue;
      const c = costFn(e);
      if (c === Infinity) continue;
      const nd = d + c;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd); prev.set(to, { from: u, edge }); heap.push([nd, to]);
      }
    }
  }
  if (!dist.has(dstId)) return null;
  const edgeIds = [];
  let c = dstId;
  while (prev.has(c)) { const p = prev.get(c); edgeIds.push(p.edge); c = p.from; }
  edgeIds.reverse();
  return { edgeIds, lengthM: edgeIds.reduce((s, id) => s + graph.edges.get(id).length, 0) };
}

// ---- Snapping: attach a start/destination to the nearest point ON a road, not just the nearest junction.
function project(p, a, b) {
  // flat projection in metres around p (fine at neighbourhood scale)
  const k = 111320, kx = k * Math.cos(p[1] * Math.PI / 180);
  const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * k, bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * k;
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)) : 0;
  const x = ax + t * dx, y = ay + t * dy;
  return { t, dist: Math.hypot(x, y), point: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])] };
}

export function snapToEdge(graph, lngLat, mode = "drive") {
  let best = null;
  for (const e of graph.edges.values()) {
    if (e.temp || !(allowed(e, mode, true) || allowed(e, mode, false))) continue;
    for (let i = 0; i < e.coords.length - 1; i++) {
      const pr = project(lngLat, e.coords[i], e.coords[i + 1]);
      if (!best || pr.dist < best.distM) best = { edge: e, seg: i, point: pr.point, distM: pr.dist };
    }
  }
  return best;
}

// Temporarily split a road at the snapped point so routing can start/end exactly there.
// Returns the new node id and an undo function.
export function insertPoint(graph, snap, key) {
  const e = snap.edge, P = snap.point;
  const coordsA = [...e.coords.slice(0, snap.seg + 1), P], coordsB = [P, ...e.coords.slice(snap.seg + 1)];
  const geo = c => c.reduce((s, x, i) => i ? s + haversine(c[i - 1], x) : 0, 0);
  const total = geo(e.coords) || 1, la = geo(coordsA);
  const lenA = e.length * la / total, lenB = e.length - lenA;
  const base = e.baseId || e.id;
  const A = { ...e, id: `${e.id}#${key}a`, baseId: base, coords: coordsA, a: e.a, b: key, length: lenA, temp: true };
  const B = { ...e, id: `${e.id}#${key}b`, baseId: base, coords: coordsB, a: key, b: e.b, length: lenB, temp: true };
  graph.edges.set(A.id, A); graph.edges.set(B.id, B);
  graph.nodes.set(key, { id: key, coord: P, edges: [{ to: e.a, edge: A.id, forward: false }, { to: e.b, edge: B.id, forward: true }] });
  const na = graph.nodes.get(e.a), nb = graph.nodes.get(e.b);
  na.edges.push({ to: key, edge: A.id, forward: true });
  nb.edges.push({ to: key, edge: B.id, forward: false });
  return () => {
    graph.edges.delete(A.id); graph.edges.delete(B.id); graph.nodes.delete(key);
    na.edges = na.edges.filter(x => x.edge !== A.id); nb.edges = nb.edges.filter(x => x.edge !== B.id);
  };
}

// Safest route: block high-risk roads completely, avoid moderate-risk roads where possible.
// th = { moderate, high } for the current travel mode.
export function safeCost(riskById, th) {
  const { moderate, high } = th;
  return e => {
    const r = riskById.get(e.baseId || e.id) || 0;
    if (r >= high) return Infinity;
    return e.length * (1 + (r >= moderate ? 2.5 : 0) + 4 * r);
  };
}

export function routeLine(graph, path, srcId) {
  const out = [];
  let at = srcId;
  for (const id of path.edgeIds) {
    const e = graph.edges.get(id);
    const seg = e.a === at ? e.coords : [...e.coords].reverse();
    out.push(...(out.length ? seg.slice(1) : seg));
    at = e.a === at ? e.b : e.a;
  }
  return { type: "Feature", geometry: { type: "LineString", coordinates: out }, properties: {} };
}

// Turn-by-turn style steps, merging consecutive segments of the same road.
const ROAD_TYPES = { residential: "local road", service: "service road", footway: "footpath", path: "path",
  pedestrian: "walkway", steps: "steps", track: "track", living_street: "local road", unclassified: "minor road", cycleway: "cycle path" };
export const roadLabel = e => e.name && e.name !== "Unnamed road" ? e.name : (ROAD_TYPES[e.highway] ? `the ${ROAD_TYPES[e.highway]}` : "the unnamed road");

export function steps(graph, path, riskById) {
  const out = [];
  for (const id of path.edgeIds) {
    const e = graph.edges.get(id), last = out[out.length - 1], r = riskById.get(e.baseId || id) || 0;
    const name = roadLabel(e);
    if (last && (last.name === name || e.length < 25)) { last.lengthM += e.length; last.risk = Math.max(last.risk, r); }
    else out.push({ name, bridge: e.bridge, lengthM: e.length, risk: r });
  }
  return out;
}
