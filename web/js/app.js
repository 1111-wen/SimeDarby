// FloodSafe Route: main app. Wires the map, flood scenarios, routing and the UI together.
import { CONFIG } from "./config.js";
import { loadScenarios, pickScenario, level } from "./flood.js";
import { buildGraph, snapToEdge, insertPoint, route, safeCost, routeLine, steps, roadLabel } from "./routing.js";
import { locate, watch, search, haversine } from "./geo.js";
import { DemoStorm, startLiveRain } from "./rain.js";

const $ = id => document.getElementById(id);
const ui = {
  eta: $("eta"), dist: $("dist"), sub: $("routeSub"), warn: $("warn"), steps: $("steps"), meta: $("meta"),
  clock: $("clock"), toast: $("toast"), time: $("time"), rainBtn: $("rainBtn"), scenarioSel: $("scenarioSel"),
  fromIn: $("fromIn"), toIn: $("toIn"), note: $("note"), dataNote: $("dataNote")
};
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const OFF_NETWORK_M = 400; // further than this from any mapped road = outside the mapped area

const state = {
  mode: CONFIG.defaultMode,
  graph: null, roads: null, places: [], scenarios: [], scenario: null,
  t: 0, hasRain: false, from: null, to: null, lastRouteKey: null, lastEdges: [], lastNames: new Map(), watchId: null, storm: null
};

const th = () => CONFIG.modes[state.mode];

// Flooded-area colour by depth, using the current mode's thresholds.
const areaColor = () => ["step", ["coalesce", ["get", "depth_m"], 0], "rgba(0,0,0,0)", th().moderate, css("--moderate"), th().high, css("--high")];

// ---------------- Map
const map = new maplibregl.Map({
  container: "map", style: CONFIG.styleUrl, center: CONFIG.center, zoom: CONFIG.zoom,
  pitch: CONFIG.pitch, bearing: CONFIG.bearing, maxPitch: 70, attributionControl: { compact: true }
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
// The free basemap is missing a few small icons; add blank ones so MapLibre stops warning.
map.on("styleimagemissing", e => {
  if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
});

const emptyFC = { type: "FeatureCollection", features: [] };
function addLayers() {
  // 3D buildings from OpenStreetMap (OpenMapTiles schema), unless the style already has them.
  const hasExtrusion = map.getStyle().layers.some(l => l.type === "fill-extrusion");
  if (map.getSource("openmaptiles") && !hasExtrusion) {
    map.addLayer({
      id: "fs-buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14,
      paint: {
        "fill-extrusion-color": css("--building"),
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.85
      }
    });
  }
  map.addSource("fs-risk-area", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-risk-area", type: "fill", source: "fs-risk-area", paint: {
    "fill-color": areaColor(), "fill-opacity": 0.3 } });

  map.addSource("fs-water", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-water", type: "fill-extrusion", source: "fs-water", paint: {
    "fill-extrusion-color": css("--water"), "fill-extrusion-height": ["*", ["coalesce", ["get", "depth_m"], 0.2], 3],
    "fill-extrusion-opacity": 0.55 } });

  map.addSource("fs-roads", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-roads-risk", type: "line", source: "fs-roads", filter: ["!=", ["get", "level"], "none"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": ["match", ["get", "level"], "high", css("--high"), css("--moderate")], "line-width": 6 } });

  map.addSource("fs-connector", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-connector", type: "line", source: "fs-connector", layout: { "line-cap": "round" },
    paint: { "line-color": css("--route"), "line-width": 3, "line-dasharray": [1, 1.5] } });

  map.addSource("fs-route", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-route-case", type: "line", source: "fs-route", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": css("--routecase"), "line-width": 11 } });
  map.addLayer({ id: "fs-route", type: "line", source: "fs-route", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": css("--route"), "line-width": 7 } });

  map.addSource("fs-places", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-centres", type: "circle", source: "fs-places", filter: ["==", ["get", "type"], "relief_centre"],
    paint: { "circle-radius": 8, "circle-color": css("--centre"), "circle-stroke-width": 3, "circle-stroke-color": css("--panel") } });
  map.addLayer({ id: "fs-centre-labels", type: "symbol", source: "fs-places", filter: ["==", ["get", "type"], "relief_centre"],
    layout: { "text-field": ["get", "name"], "text-offset": [0, 1.4], "text-size": 13, "text-font": ["Noto Sans Bold"] },
    paint: { "text-color": css("--centre"), "text-halo-color": css("--panel"), "text-halo-width": 2 } });

  // Tap the map to choose: start here, or go here.
  map.on("click", e => {
    const c = [e.lngLat.lng, e.lngLat.lat];
    const box = document.createElement("div"); box.className = "pickpop";
    const popup = new maplibregl.Popup({ closeButton: false, offset: 10, maxWidth: "none" });
    const btn = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = () => { fn(); popup.remove(); }; return b; };
    box.append(
      btn("Start here", () => { setFrom({ name: "Pinned start", coord: c }); ui.note.textContent = "Starting point set on the map. Drag the pin to adjust."; }),
      btn("Go here", () => setTo({ name: "Pinned destination", coord: c }))
    );
    popup.setLngLat(c).setDOMContent(box).addTo(map);
  });
}
function applyTheme() {
  if (!map.isStyleLoaded()) return;
  const set = (id, prop, val) => map.getLayer(id) && map.setPaintProperty(id, prop, val);
  set("fs-buildings", "fill-extrusion-color", css("--building"));
  set("fs-risk-area", "fill-color", areaColor());
  set("fs-water", "fill-extrusion-color", css("--water"));
  set("fs-roads-risk", "line-color", ["match", ["get", "level"], "high", css("--high"), css("--moderate")]);
  set("fs-route-case", "line-color", css("--routecase"));
  set("fs-route", "line-color", css("--route"));
  set("fs-connector", "line-color", css("--route"));
  set("fs-centres", "circle-color", css("--centre"));
  set("fs-centres", "circle-stroke-color", css("--panel"));
  set("fs-centre-labels", "text-color", css("--centre"));
  set("fs-centre-labels", "text-halo-color", css("--panel"));
}

const pinEl = cls => { const d = document.createElement("div"); d.className = "pin " + cls; return d; };
// Pins can be dragged to fine-tune the start or destination.
const fromMarker = new maplibregl.Marker({ element: pinEl("from"), draggable: true });
const toMarker = new maplibregl.Marker({ element: pinEl("to"), draggable: true });
fromMarker.on("dragend", () => { const l = fromMarker.getLngLat(); setFrom({ name: "Pinned start", coord: [l.lng, l.lat] }); });
toMarker.on("dragend", () => { const l = toMarker.getLngLat(); setTo({ name: "Pinned destination", coord: [l.lng, l.lat] }); });

// ---------------- Data
async function loadData() {
  const base = CONFIG.dataBase;
  const [roads, places, scenarios] = await Promise.all([
    fetch(`${base}/roads.geojson`).then(r => r.json()),
    fetch(`${base}/places.json`).then(r => r.json()),
    loadScenarios(base)
  ]);
  state.roads = roads; state.graph = buildGraph(roads); state.places = places; state.scenarios = scenarios;
  state.scenario = scenarios[Math.min(1, scenarios.length - 1)];

  const dl = $("places");
  places.forEach(p => { const o = document.createElement("option"); o.value = p.name; dl.appendChild(o); });
  ui.scenarioSel.innerHTML = "";
  scenarios.forEach(s => { const o = document.createElement("option"); o.value = s.id; o.textContent = s.name; ui.scenarioSel.appendChild(o); });
  ui.scenarioSel.value = state.scenario.id;
  ui.time.max = String(Math.round(state.scenario.durationMin));
  map.getSource("fs-places").setData({ type: "FeatureCollection", features: places.map(p => ({
    type: "Feature", geometry: { type: "Point", coordinates: p.coord }, properties: { name: p.name, type: p.type } })) });

  ui.dataNote.textContent = scenarios.some(s => s.synthetic)
    ? "This build uses SYNTHETIC sample data: roads, places and flood depths are invented for testing. Replace them with the pipeline output before any real use."
    : "Flood predictions come from pre-computed HEC-RAS scenarios. See DATA_SOURCES.md for every source and assumption.";

  const start = places.find(p => p.type !== "relief_centre") || places[0];
  const dest = places.find(p => p.type === "relief_centre") || places[places.length - 1];
  setFrom(start, false); setTo(dest, false);
  update(false);
}

// ---------------- Trip
function setFrom(p, run = true) {
  state.from = p; ui.fromIn.value = p.name; fromMarker.setLngLat(p.coord).addTo(map);
  state.lastRouteKey = null; if (run) update(false);
}
function setTo(p, run = true) {
  state.to = p; ui.toIn.value = p.name; toMarker.setLngLat(p.coord).addTo(map);
  state.lastRouteKey = null; if (run) update(false);
}

let toastTimer = null;
function toast(msg) {
  ui.toast.textContent = msg; ui.toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 4500);
}
const fmtLen = m => m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m / 10) * 10 + " m";

// ---------------- Main update: recolour roads and areas, recompute the route
function update(fromTick) {
  if (!state.graph || !state.from || !state.to) return;
  const sc = state.scenario, t = state.t, mode = state.mode, T = th(), { moderate, high } = T;
  const modeOk = e => mode === "walk" ? e.walk : e.drive;

  // Risk per road (looks ahead CONFIG.horizonMin minutes)
  const risk = new Map();
  for (const e of state.graph.edges.values()) risk.set(e.id, state.hasRain ? sc.risk(e.id, t) : 0);
  map.getSource("fs-roads").setData({ type: "FeatureCollection", features: state.roads.features.map(f => {
    const e = state.graph.edges.get(String(f.properties.id));
    const lv = e && modeOk(e) ? level(risk.get(e.id) || 0, T) : "none"; // only colour roads usable in this mode
    return { ...f, properties: { ...f.properties, level: lv } };
  }) });

  // Floodwater now, and risk areas over the look-ahead window
  map.getSource("fs-water").setData(state.hasRain ? sc.extentAt(t) : emptyFC);
  map.getSource("fs-risk-area").setData(state.hasRain ? sc.extentAt(Math.min(t + CONFIG.horizonMin, sc.durationMin)) : emptyFC);

  // Snap trip ends to the nearest point ON a usable road (not just the nearest junction)
  const g = state.graph;
  const sa = snapToEdge(g, state.from.coord, mode), sb = snapToEdge(g, state.to.coord, mode);
  ui.warn.hidden = true;
  if (!sa || !sb || sa.distM > OFF_NETWORK_M || sb.distM > OFF_NETWORK_M) {
    return showNoRoute("Outside the mapped area", "This map covers one neighbourhood. Pick a place inside it.", null, fromTick);
  }
  if (haversine(sa.point, sb.point) < 15) return showNoRoute("You’re there", "Pick a different destination.", null, fromTick);

  // Is the start point itself already under deep water?
  const startDepth = state.hasRain ? sc.depth(sa.edge.baseId || sa.edge.id, t) : 0;
  const cm = Math.round(high * 100);
  if (startDepth >= high) {
    return showNoRoute(mode === "drive" ? "Don’t drive out now" : "Stay where you are",
      `Water around you is already ${cm} cm or deeper.`,
      mode === "drive"
        ? "Never drive into floodwater. Stay somewhere high and safe, and call 999 if you need help."
        : "Move to a higher floor if you can and call 999 for help. Follow instructions from Bomba and the authorities.",
      fromTick, "Your area is now flooded. Stay where you are.");
  }

  // Temporarily split the roads at both points, route, then undo the split.
  const undoA = insertPoint(g, sa, "__start"), undoB = insertPoint(g, sb, "__end");
  let path, line, stepList, baseIds, names;
  try {
    path = route(g, "__start", "__end", safeCost(risk, T), mode);
    if (path) {
      line = routeLine(g, path, "__start");
      stepList = steps(g, path, risk);
      baseIds = path.edgeIds.map(id => g.edges.get(id).baseId || id);
      names = new Map(path.edgeIds.map(id => { const e = g.edges.get(id); return [e.baseId || id, roadLabel(e)]; }));
      path.parts = path.edgeIds.map(id => ({ base: g.edges.get(id).baseId || id, length: g.edges.get(id).length }));
    }
  } finally { undoB(); undoA(); }

  // Warn if a pin is far from any mapped road (often a road missing from OpenStreetMap)
  const far = Math.max(sa.distM, sb.distM);
  if (far > 60) ui.note.textContent = `A pin is ${Math.round(far)} m from the nearest mapped ${mode === "drive" ? "car road" : "road or path"}. The dashed line shows where the route joins the road.`;

  // Short dashed links from each pin to the road it was snapped to
  map.getSource("fs-connector").setData({ type: "FeatureCollection", features: [
    { type: "Feature", geometry: { type: "LineString", coordinates: [state.from.coord, sa.point] }, properties: {} },
    { type: "Feature", geometry: { type: "LineString", coordinates: [sb.point, state.to.coord] }, properties: {} }
  ] });

  if (!path) {
    return showNoRoute("No safe route right now", `Every ${mode === "drive" ? "drivable" : "walkable"} way to ${state.to.name} crosses high-risk roads.`,
      mode === "drive"
        ? "Don’t drive through floodwater. Wait somewhere high and safe, try Walk mode for a short trip, or choose a relief centre. Call 999 in an emergency."
        : "Wait somewhere safe and high, or choose a relief centre as your destination. Call 999 in an emergency.",
      fromTick, "Your route is now cut off by flooding.");
  }

  // Route card
  const mins = Math.max(1, Math.round(path.lengthM / 1000 / T.speedKmh * 60));
  const modLen = path.parts.reduce((s2, p2) => s2 + ((risk.get(p2.base) || 0) >= moderate ? p2.length : 0), 0);
  ui.eta.textContent = `${mins} min`;
  ui.dist.textContent = `${fmtLen(path.lengthM)} ${mode === "drive" ? "driving" : "walking"}`;
  ui.sub.innerHTML = "";
  const badge = document.createElement("span");
  if (modLen === 0) { badge.className = "badge ok"; badge.textContent = state.hasRain ? "Avoids all flood-risk roads" : "No rain yet. Fastest route shown"; }
  else { badge.className = "badge mod"; badge.textContent = `${fmtLen(modLen)} on moderate-risk roads. No high-risk roads`; }
  ui.sub.appendChild(badge);

  // Directions
  ui.steps.innerHTML = "";
  stepList.forEach((st, i) => {
    const li = document.createElement("li"), dot = document.createElement("span"), txt = document.createElement("span"), len = document.createElement("small");
    const lv = level(st.risk, T);
    dot.className = "rk"; dot.style.background = lv === "moderate" ? css("--moderate") : css("--route");
    txt.textContent = (i === 0 ? "Start on " : st.bridge ? "Cross " : "Continue on ") + st.name + (lv === "moderate" ? " (moderate risk)" : "");
    len.textContent = fmtLen(st.lengthM);
    li.append(dot, txt, len); ui.steps.appendChild(li);
  });
  const end = document.createElement("li"), endDot = document.createElement("span"), endTxt = document.createElement("span");
  endDot.className = "rk"; endDot.style.background = css("--dest"); endTxt.textContent = `Arrive at ${state.to.name}`;
  end.append(endDot, endTxt, document.createElement("small")); ui.steps.appendChild(end);

  // Live reroute message
  const key = baseIds.join(",");
  if (fromTick && state.lastRouteKey && state.lastRouteKey !== key) {
    const cut = state.lastEdges.find(id => (risk.get(id) || 0) >= moderate && !baseIds.includes(id));
    const cutName = cut && (state.lastNames.get(cut) || "A road on your route");
    toast(cut ? `Route updated: ${cutName} is ${(risk.get(cut) || 0) >= high ? "flooding" : "at risk"}. New route ${mins} min.`
              : "Route updated to avoid rising water.");
  }
  state.lastRouteKey = key; state.lastEdges = baseIds; state.lastNames = names;
  map.getSource("fs-route").setData(line);
  updateMeta();
}

function showNoRoute(title, sub, warn, fromTick, tickToast) {
  map.getSource("fs-route").setData(emptyFC);
  if (title === "Outside the mapped area" || title === "You’re there") map.getSource("fs-connector").setData(emptyFC);
  ui.eta.textContent = title; ui.dist.textContent = ""; ui.sub.textContent = sub; ui.steps.innerHTML = "";
  if (warn) { ui.warn.textContent = warn; ui.warn.hidden = false; }
  if (fromTick && state.lastRouteKey && tickToast) toast(tickToast);
  state.lastRouteKey = null; state.lastEdges = [];
  updateMeta();
}

function updateMeta() {
  const sc = state.scenario;
  ui.clock.textContent = state.hasRain ? `${state.storm && state.storm.running ? "Raining, " : ""}+${Math.round(state.t)} min` : "No rain";
  ui.meta.textContent = state.hasRain
    ? `Scenario: ${sc.name}${sc.synthetic ? " (synthetic)" : ""}. Generated ${new Date(sc.generated).toLocaleString()}.`
    : "No rain yet. Tap Start demo rain to play a storm scenario.";
}

// ---------------- Controls
$("trip").addEventListener("submit", e => e.preventDefault());
ui.fromIn.addEventListener("change", async () => {
  const p = await search(ui.fromIn.value, state.places);
  if (p) { setFrom(p); ui.note.textContent = "Starting point entered manually."; }
  else ui.note.textContent = "No match. Try a place from the list.";
});
ui.toIn.addEventListener("change", async () => {
  const p = await search(ui.toIn.value, state.places);
  if (p) setTo(p); else ui.note.textContent = "No match. Try a place from the list.";
});
$("gpsBtn").addEventListener("click", async () => {
  ui.note.textContent = "Finding your location…";
  try {
    const c = await locate();
    setFrom({ name: "Your location", coord: c });
    ui.note.textContent = "Using your current location.";
    map.easeTo({ center: c });
    if (state.watchId === null) state.watchId = watch(c2 => { state.from = { name: "Your location", coord: c2 }; fromMarker.setLngLat(c2); update(true); });
  } catch (err) { ui.note.textContent = err.message; }
});
$("swapBtn").addEventListener("click", () => { const a = state.from; setFrom(state.to, false); setTo(a); });

ui.scenarioSel.addEventListener("change", () => {
  state.scenario = state.scenarios.find(s => s.id === ui.scenarioSel.value);
  ui.time.max = String(Math.round(state.scenario.durationMin));
  if (state.storm) state.storm.durationMin = state.scenario.durationMin;
  update(true);
});
ui.time.addEventListener("input", () => { state.t = +ui.time.value; state.hasRain = state.hasRain || state.t > 0; update(true); });
ui.rainBtn.addEventListener("click", () => {
  if (!state.storm) state.storm = new DemoStorm(state.scenario.durationMin, t => { state.t = t; ui.time.value = String(Math.round(t)); update(true); if (!state.storm.running) setRainBtn(false); });
  if (state.storm.running) { state.storm.stop(); setRainBtn(false); updateMeta(); }
  else { state.hasRain = true; state.storm.t = state.t; setRainBtn(true); state.storm.start(); }
});
function setRainBtn(on) { ui.rainBtn.setAttribute("aria-pressed", String(on)); ui.rainBtn.textContent = on ? "Stop demo rain" : "Start demo rain"; }

// Walk / Drive switch
document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
  state.mode = b.dataset.mode;
  document.querySelectorAll("[data-mode]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  if (map.getLayer("fs-risk-area")) map.setPaintProperty("fs-risk-area", "fill-color", areaColor());
  $("riskNote").textContent = riskNote();
  state.lastRouteKey = null; update(false);
}));
function riskNote() {
  const w = CONFIG.modes.walk, d = CONFIG.modes.drive, c = x => Math.round(x * 100);
  return `Risk levels. Walking: moderate from ${c(w.moderate)} cm, high from ${c(w.high)} cm. Driving: moderate from ${c(d.moderate)} cm, high from ${c(d.high)} cm. Roads that will reach these depths within ${CONFIG.horizonMin} minutes are marked now. Your route avoids high-risk roads completely and avoids moderate-risk roads where it can. These thresholds are assumptions.`;
}
$("riskNote").textContent = riskNote();
document.querySelectorAll("[data-mode]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.mode === state.mode)));

const cam3d = $("cam3d"), camTop = $("camTop");
cam3d.addEventListener("click", () => { cam3d.setAttribute("aria-pressed", "true"); camTop.setAttribute("aria-pressed", "false"); map.easeTo({ pitch: CONFIG.pitch, bearing: CONFIG.bearing }); });
camTop.addEventListener("click", () => { camTop.setAttribute("aria-pressed", "true"); cam3d.setAttribute("aria-pressed", "false"); map.easeTo({ pitch: 0, bearing: 0 }); });

// Live rainfall (off by default): switch to the matching scenario and run in real time.
startLiveRain(mm => {
  const sc = pickScenario(state.scenarios, mm);
  if (!state.hasRain) { state.hasRain = true; state.liveStart = Date.now(); }
  state.scenario = sc; ui.scenarioSel.value = sc.id;
  state.t = Math.min(sc.durationMin, (Date.now() - state.liveStart) / 60000);
  update(true);
});

// ---------------- Start
map.on("load", async () => {
  addLayers();
  try { await loadData(); }
  catch (e) { ui.eta.textContent = "Couldn’t load map data"; ui.sub.textContent = `Check that ${CONFIG.dataBase} contains roads.geojson, places.json and scenarios/index.json.`; console.error(e); }
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
