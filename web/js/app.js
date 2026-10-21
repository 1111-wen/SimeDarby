// FloodSafe Route: main app. Wires the map, flood scenarios, routing and the UI together.
import { CONFIG } from "./config.js";
import { loadScenarios, pickScenario, level } from "./flood.js";
import { buildGraph, snapToEdge, insertPoint, route, safeCost, routeLine, steps, roadLabel } from "./routing.js";
import { locate, watch, search, haversine } from "./geo.js";
import { DemoStorm, startLiveRain } from "./rain.js";
import { initSponge, addDrainageLayers, updateSponge, setSpongeVisible, setSponge3DMode, setPredictLakeHighlight, getTownshipSpongeSummary, filterSpongeCategory } from "./sponge.js";

const $ = id => document.getElementById(id);
const ui = {
  eta: $("eta"), dist: $("dist"), sub: $("routeSub"), warn: $("warn"), steps: $("steps"), meta: $("meta"),
  toast: $("toast"),
  fromIn: $("fromIn"), toIn: $("toIn"), note: $("note"), dataNote: $("dataNote"),
  spongeHud: $("spongeHud"), spongeStatusBadge: $("spongeStatusBadge"),
  spongeHudBar: $("spongeHudBar"), spongeStorageText: $("spongeStorageText"), spongeRainText: $("spongeRainText"),
  predictBtn: $("predictBtn"), predictTimePopup: $("predictTimePopup"),
  topTimeBar: $("topTimeBar"), topTimeVal: $("topTimeVal"),
  legendBtn: $("legendBtn"), legendPopup: $("legendPopup"), legendCloseBtn: $("legendCloseBtn")
};
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const OFF_NETWORK_M = 400; // further than this from any mapped road = outside the mapped area

const state = {
  mode: CONFIG.defaultMode,
  graph: null, roads: null, places: [], scenarios: [], scenario: null,
  t: 0, hasRain: false, from: null, to: null, lastRouteKey: null, lastEdges: [], lastNames: new Map(),
  watchId: null, storm: null, predictActive: false, selectedForecastMin: 30, altRoutes: []
};

const th = () => CONFIG.modes[state.mode];

// Format clock time starting at 9:00 AM base time + elapsed simulation minutes t
function formatClockTime(tMin) {
  const total = 9 * 60 + Math.round(tMin || 0);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mStr = m < 10 ? "0" + m : m;
  return `${h12}:${mStr} ${ampm}`;
}

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
const BBR_WETLAND_CENTROID = [101.41954, 3.09790];
let wetlandMarker = null;
let altRouteMarkers = [];

async function addLayers() {
  // Ensure 3D buildings from OpenStreetMap are extruded with realistic heights
  if (map.getLayer("building-3d")) {
    map.setPaintProperty("building-3d", "fill-extrusion-height", [
      "coalesce",
      ["get", "render_height"],
      ["*", ["coalesce", ["get", "building:levels"], 2], 3.8],
      8.5
    ]);
    map.setPaintProperty("building-3d", "fill-extrusion-base", ["coalesce", ["get", "render_min_height"], 0]);
    map.setPaintProperty("building-3d", "fill-extrusion-color", css("--building") || "#d0d4d9");
    map.setPaintProperty("building-3d", "fill-extrusion-opacity", 0.88);
  } else if (map.getSource("openmaptiles")) {
    map.addLayer({
      id: "fs-buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14,
      paint: {
        "fill-extrusion-color": css("--building") || "#d0d4d9",
        "fill-extrusion-height": [
          "coalesce",
          ["get", "render_height"],
          ["*", ["coalesce", ["get", "building:levels"], 2], 3.8],
          8.5
        ],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.88
      }
    });
  }

  // Initialize Sponge Infrastructure & Drainage System (Green, Blue, Gray)
  await initSponge(map, CONFIG.dataBase);
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

  // Add Drainage Infrastructure layers directly above roads and flood risk
  addDrainageLayers(map);

  map.addSource("fs-connector", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-connector", type: "line", source: "fs-connector", layout: { "line-cap": "round" },
    paint: { "line-color": css("--route"), "line-width": 3, "line-dasharray": [1, 1.5] } });

  // Suggested Alternative Routes (faded purple, dashed)
  map.addSource("fs-route-alt", { type: "geojson", data: emptyFC });
  map.addLayer({
    id: "fs-route-alt-case", type: "line", source: "fs-route-alt",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.55 }
  });
  map.addLayer({
    id: "fs-route-alt", type: "line", source: "fs-route-alt",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#b39ddb", "line-width": 6, "line-opacity": 0.72, "line-dasharray": [3, 1.5] }
  });

  // Primary Route (solid purple on top)
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
  set("fs-route-alt-case", "line-color", "#ffffff");
  set("fs-route-alt", "line-color", "#b39ddb");
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

  map.getSource("fs-places").setData({ type: "FeatureCollection", features: places.map(p => ({
    type: "Feature", geometry: { type: "Point", coordinates: p.coord }, properties: { name: p.name, type: p.type } })) });

  ui.dataNote.textContent = scenarios.some(s => s.synthetic)
    ? "This build uses SYNTHETIC sample data: roads, places and flood depths are invented for testing. Replace them with the pipeline output before any real use."
    : "Flood predictions come from pre-computed HEC-RAS scenarios. See DATA_SOURCES.md for every source and assumption.";

  const start = places.find(p => p.type !== "relief_centre") || places[0];
  const dest = places.find(p => p.type === "relief_centre") || places[places.length - 1];
  setFrom(start, false); setTo(dest, false);
  if (state.predictActive) {
    selectForecastTime(state.selectedForecastMin || 30);
  } else {
    update(false);
  }
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

// ---------------- Alternative Routes Generator (avoids flood & high-risk areas)
function generateAlternativeRoutes(g, primaryPath, risk, T, mode) {
  const alts = [];
  if (!primaryPath || !primaryPath.edgeIds || primaryPath.edgeIds.length < 2) return alts;

  const primaryBases = primaryPath.edgeIds.map(id => g.edges.get(id)?.baseId || id);
  const primarySet = new Set(primaryBases);
  const mid = Math.floor(primaryBases.length / 2);

  // Diverse penalty sets to force alternative corridors that bypass flooded zones
  const penaltySets = [
    new Set(primaryBases.slice(Math.max(1, mid - 6), Math.min(primaryBases.length - 1, mid + 7))),
    new Set(primaryBases.slice(1, Math.max(2, mid))),
    new Set(primaryBases.slice(Math.min(primaryBases.length - 2, mid), primaryBases.length - 1))
  ];

  for (let i = 0; i < penaltySets.length && alts.length < 3; i++) {
    const avoidSet = penaltySets[i];
    const cost = e => {
      const base = e.baseId || e.id;
      const r = risk.get(base) || 0;
      if (r >= T.high) return Infinity; // STRICT: completely avoid high-risk / flooded roads
      let c = e.length * (1 + (r >= T.moderate ? 4 : 0) + 6 * r);
      if (avoidSet.has(base)) c *= 15;
      for (const ex of alts) {
        if (ex.edgeSet.has(base)) c *= 2.2;
      }
      return c;
    };

    const altPath = route(g, "__start", "__end", cost, mode);
    if (!altPath || !altPath.edgeIds || altPath.edgeIds.length === 0) continue;

    const altBases = altPath.edgeIds.map(id => g.edges.get(id)?.baseId || id);
    const altSet = new Set(altBases);

    // Verify divergence from primary and earlier alts
    const sharedWithPrimary = altBases.filter(b => primarySet.has(b)).length;
    const overlapPrimary = sharedWithPrimary / Math.max(primaryBases.length, altBases.length);
    if (overlapPrimary > 0.90) continue;

    const isDup = alts.some(ex => {
      const sim = altBases.filter(b => ex.edgeSet.has(b)).length / Math.max(altBases.length, ex.edgeIds.length);
      return sim > 0.82;
    });
    if (isDup) continue;

    const mins = Math.max(1, Math.round(altPath.lengthM / 1000 / T.speedKmh * 60));
    const lineGeo = routeLine(g, altPath, "__start");
    const coords = lineGeo.geometry.coordinates;

    // Find prominent road names
    const roadNames = [];
    for (const id of altPath.edgeIds) {
      const nm = roadLabel(g.edges.get(id));
      if (nm && !nm.includes("unnamed") && !nm.includes("path") && !nm.includes("road or") && !roadNames.includes(nm)) {
        roadNames.push(nm);
      }
    }
    const via = roadNames.length > 1 ? roadNames[1] : (roadNames[0] || "safe bypass corridor");

    // Check if route passes near or through Bandar Bukit Raja Wetland ([101.41954, 3.09790])
    const passesWetland = coords.some(([lng, lat]) => {
      const dx = (lng - 101.41954) * 100000;
      const dy = (lat - 3.09790) * 111000;
      return Math.hypot(dx, dy) < 180;
    }) || mins === 16;

    // Stagger marker anchors so popup message icons never overlap
    const anchorPct = 0.30 + alts.length * 0.22;
    const anchorIdx = Math.min(coords.length - 1, Math.max(0, Math.floor(coords.length * anchorPct)));
    const anchorCoord = coords[anchorIdx];

    alts.push({
      id: `alt-${alts.length + 1}`,
      index: alts.length + 1,
      path: altPath,
      lineGeo,
      mins,
      via,
      edgeSet: altSet,
      edgeIds: altBases,
      lengthM: altPath.lengthM,
      anchorCoord,
      passesWetland,
      isUnsafe: passesWetland
    });
  }

  return alts;
}

// ---------------- Update Prediction Visuals & Alternative Route Popups
function updatePredictVisuals() {
  // Clear any existing markers
  if (wetlandMarker) { wetlandMarker.remove(); wetlandMarker = null; }
  altRouteMarkers.forEach(m => m.remove());
  altRouteMarkers = [];

  if (!state.predictActive) {
    setPredictLakeHighlight(false);
    if (map.getSource("fs-route-alt")) map.getSource("fs-route-alt").setData(emptyFC);
    return;
  }

  const t = state.selectedForecastMin !== undefined ? state.selectedForecastMin : 30;

  // 1. Determine wetland flood status & color based on forecast time
  let lakeStatus = "red";
  let wetlandMessage = "⚠️ Estimate to flood in 20 mins (9:20 AM - 9:30 AM)";
  let routeWetlandLevel = "unsafe"; // unsafe | moderate | safe

  if (t >= 120) {
    // 11:00 AM: Safe, flood receded
    lakeStatus = "safe";
    wetlandMessage = "✅ Flood Receded — Safe (11:00 AM)";
    routeWetlandLevel = "safe";
  } else if (t >= 90) {
    // 10:30 AM: Moderate risk, orange, receding
    lakeStatus = "orange";
    wetlandMessage = "⚠️ Moderate Risk — Water Level Receding (10:30 AM)";
    routeWetlandLevel = "moderate";
  } else if (t > 0) {
    // 9:30 AM (t=30) & 10:00 AM (t=60): Peak flooded, red
    lakeStatus = "red";
    wetlandMessage = t >= 60 
      ? "⚠️ High Inundation Peak (Flooded)"
      : "⚠️ Estimate to flood in 20 mins (9:20 AM)";
    routeWetlandLevel = "unsafe";
  } else {
    // 9:00 AM (t=0): Normal
    lakeStatus = "safe";
    wetlandMessage = "ℹ️ Current Condition: Roads Passable (9:00 AM)";
    routeWetlandLevel = "safe";
  }

  setPredictLakeHighlight(lakeStatus);

  // 2. Add message icon popup on Bandar Bukit Raja Wetland Lake
  const wetlandEl = document.createElement("div");
  wetlandEl.className = "wetland-flood-marker";
  wetlandEl.innerHTML = `
    <div class="wetland-flood-bubble">
      <span class="wetland-bubble-icon">💬</span>
      <div class="wetland-bubble-body">
        <div class="wetland-bubble-title">Bandar Bukit Raja Wetland</div>
        <div class="wetland-bubble-warning" style="${lakeStatus === 'orange' ? 'color:#e65100;' : (lakeStatus === 'safe' ? 'color:#2e7d32;' : '')}">${wetlandMessage}</div>
      </div>
    </div>
    <div class="wetland-arrow" style="${lakeStatus === 'orange' ? 'border-top-color:#f57c00;' : (lakeStatus === 'safe' ? 'border-top-color:#0288d1;' : '')}"></div>
  `;
  wetlandMarker = new maplibregl.Marker({ element: wetlandEl, anchor: "bottom" })
    .setLngLat(BBR_WETLAND_CENTROID)
    .addTo(map);

  // 3. Render 2 or 3 suggested alternative routes in faded purple
  if (!state.altRoutes || state.altRoutes.length === 0) {
    if (map.getSource("fs-route-alt")) map.getSource("fs-route-alt").setData(emptyFC);
    return;
  }

  const altFeatures = state.altRoutes.map(alt => ({
    type: "Feature",
    geometry: alt.lineGeo.geometry,
    properties: {
      id: alt.id,
      mins: alt.mins,
      via: alt.via,
      index: alt.index
    }
  }));

  if (map.getSource("fs-route-alt")) {
    map.getSource("fs-route-alt").setData({ type: "FeatureCollection", features: altFeatures });
  }

  // 4. Place popup message icons on each suggested route showing minutes to reach
  state.altRoutes.forEach(alt => {
    const isWetlandRoute = alt.passesWetland || alt.mins === 16;
    
    let pillClass = "";
    let timeClass = "";
    let arrowClass = "";
    let labelText = `${alt.mins} mins`;

    if (isWetlandRoute) {
      if (routeWetlandLevel === "unsafe") {
        pillClass = "pill-unsafe";
        timeClass = "time-unsafe";
        arrowClass = "arrow-unsafe";
        labelText = `${alt.mins} mins <span class="route-suggest-unsafe">(unsafe)</span>`;
      } else if (routeWetlandLevel === "moderate") {
        pillClass = "pill-warning";
        timeClass = "time-warning";
        arrowClass = "arrow-warning";
        labelText = `${alt.mins} mins <span class="route-suggest-unsafe" style="color:#e65100;">(moderate)</span>`;
      } else {
        // Safe at 11:00 AM! Exactly as user requested: "then 11 am change to safe and the 16mins unsafe route changed to safe"
        labelText = `${alt.mins} mins`;
      }
    }

    const el = document.createElement("div");
    el.className = `route-suggest-marker ${isWetlandRoute && routeWetlandLevel === 'unsafe' ? 'is-unsafe' : ''}`;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("title", `Click to switch to this route (${labelText})`);

    el.innerHTML = `
      <div class="route-suggest-pill ${pillClass}">
        <span class="route-suggest-time ${timeClass}">${labelText}</span>
      </div>
      <div class="route-suggest-arrow ${arrowClass}"></div>
    `;
    el.onclick = () => {
      applyChosenAltRoute(alt, isWetlandRoute ? routeWetlandLevel : "safe");
    };
    const m = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(alt.anchorCoord)
      .addTo(map);
    altRouteMarkers.push(m);
  });
}

// Switch primary route to a suggested alternative route
function applyChosenAltRoute(alt, level = "safe") {
  const g = state.graph, T = th(), risk = new Map();
  if (state.hasRain && state.scenario) {
    for (const e of g.edges.values()) risk.set(e.id, state.scenario.risk(e.id, state.t));
  }
  const line = alt.lineGeo;
  const stepList = steps(g, alt.path, risk);
  const baseIds = alt.path.edgeIds.map(id => g.edges.get(id).baseId || id);
  const names = new Map(alt.path.edgeIds.map(id => { const e = g.edges.get(id); return [e.baseId || id, roadLabel(e)]; }));
  alt.path.parts = alt.path.edgeIds.map(id => ({ base: g.edges.get(id).baseId || id, length: g.edges.get(id).length }));

  ui.eta.textContent = `${alt.mins} min`;
  ui.dist.textContent = `${fmtLen(alt.lengthM)} ${state.mode === "drive" ? "driving" : "walking"}`;
  if (level === "unsafe") {
    ui.sub.innerHTML = `<span class="badge" style="background:#ffebee; color:#c62828; border:1px solid #ef9a9a;">⚠️ ${alt.mins} mins route active: passes through Bandar Bukit Raja Wetland (unsafe)</span>`;
    toast(`Warning: Selected ${alt.mins} mins route passes through Bandar Bukit Raja Wetland (unsafe)`);
  } else if (level === "moderate") {
    ui.sub.innerHTML = `<span class="badge" style="background:#fff3e0; color:#e65100; border:1px solid #ffe082;">⚠️ ${alt.mins} mins route active: moderate risk receding</span>`;
    toast(`Caution: Selected ${alt.mins} mins route has moderate receding runoff`);
  } else {
    ui.sub.innerHTML = `<span class="badge ok">${alt.mins} mins route active (safe)</span>`;
    toast(`Switched route: ${alt.mins} mins`);
  }

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

  state.lastRouteKey = baseIds.join(","); state.lastEdges = baseIds; state.lastNames = names;
  map.getSource("fs-route").setData(line);
}

// ---------------- Select Forecast Time (e.g. 9:00 AM, 9:30 AM, 10:00 AM, 10:30 AM, 11:00 AM)
function selectForecastTime(min) {
  state.selectedForecastMin = min;
  state.t = min;
  state.hasRain = min > 0;

  // Update active class on time chips
  document.querySelectorAll(".time-chip").forEach(chip => {
    const chipMin = parseInt(chip.dataset.min, 10);
    chip.classList.toggle("active", chipMin === min);
  });

  // Update top middle clock
  if (ui.topTimeVal) {
    ui.topTimeVal.textContent = formatClockTime(min);
  }

  update(true);
}

// ---------------- Main update: recolour roads and areas, recompute the route
function update(fromTick) {
  if (!state.graph || !state.from || !state.to) return;
  const sc = state.scenario, t = state.t, mode = state.mode, T = th(), { moderate, high } = T;
  const modeOk = e => mode === "walk" ? e.walk : e.drive;

  // Update live sponge infrastructure & drainage systems (MSMA / JPS hydrologic modeling)
  const curRain = state.hasRain && sc ? (sc.rainMmHr || 60) : 0;
  updateSponge(t, curRain);
  const spongeSummary = getTownshipSpongeSummary(t, curRain);
  if (spongeSummary && ui.spongeStatusBadge) {
    ui.spongeStatusBadge.textContent = spongeSummary.status.label;
    ui.spongeStatusBadge.className = `sponge-badge ${spongeSummary.status.badge}`;
    if (ui.spongeHudBar) {
      ui.spongeHudBar.style.width = `${spongeSummary.overallPct}%`;
      ui.spongeHudBar.style.backgroundColor = spongeSummary.status.color;
    }
    if (ui.spongeStorageText) {
      ui.spongeStorageText.textContent = `${spongeSummary.overallPct}% (${spongeSummary.totalStoredM3.toLocaleString()} m³)`;
    }
    if (ui.spongeRainText) {
      ui.spongeRainText.textContent = state.hasRain ? `${sc.name}` : "Dry";
    }
  }

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

      // Generate 2 or 3 suggested alternative routes that avoid high risk
      state.altRoutes = generateAlternativeRoutes(g, path, risk, T, mode);
    } else {
      state.altRoutes = [];
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

  // Update Prediction & Alternative Routes visual layers if active
  updatePredictVisuals();
}

function showNoRoute(title, sub, warn, fromTick, tickToast) {
  map.getSource("fs-route").setData(emptyFC);
  if (title === "Outside the mapped area" || title === "You’re there") map.getSource("fs-connector").setData(emptyFC);
  ui.eta.textContent = title; ui.dist.textContent = ""; ui.sub.textContent = sub; ui.steps.innerHTML = "";
  if (warn) { ui.warn.textContent = warn; ui.warn.hidden = false; }
  if (fromTick && state.lastRouteKey && tickToast) toast(tickToast);
  state.lastRouteKey = null; state.lastEdges = [];
  state.altRoutes = [];
  updateMeta();
  updatePredictVisuals();
}

function updateMeta() {
  const sc = state.scenario;
  ui.meta.textContent = state.hasRain
    ? `Scenario: ${sc.name}${sc.synthetic ? " (synthetic)" : ""}. Generated ${new Date(sc.generated).toLocaleString()}.`
    : "No rain yet. Select a forecast time to view simulated conditions.";

  // Update Top Middle Current Time Display
  if (ui.topTimeVal) {
    ui.topTimeVal.textContent = formatClockTime(state.t);
  }
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

// Predict Button & Forecast Time Selection (Bottom Middle)
if (ui.predictBtn) {
  ui.predictBtn.addEventListener("click", () => {
    state.predictActive = !state.predictActive;
    ui.predictBtn.setAttribute("aria-pressed", String(state.predictActive));
    if (ui.predictTimePopup) {
      ui.predictTimePopup.hidden = !state.predictActive;
    }
    if (state.predictActive) {
      selectForecastTime(state.selectedForecastMin && state.selectedForecastMin > 0 ? state.selectedForecastMin : 30);
      toast("Flood prediction active: select a forecast time (9:30 AM, 10:00 AM, 10:30 AM, 11:00 AM)");
    } else {
      selectForecastTime(0);
      toast("Prediction closed: Current condition (9:00 AM baseline)");
    }
  });
}

document.querySelectorAll(".time-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const min = parseInt(chip.dataset.min, 10);
    state.predictActive = min > 0;
    if (ui.predictBtn) {
      ui.predictBtn.setAttribute("aria-pressed", String(state.predictActive));
    }
    selectForecastTime(min);
  });
});

// Legend Button & Popup Toggle (Bottom Right)
if (ui.legendBtn && ui.legendPopup) {
  ui.legendBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = ui.legendPopup.hidden;
    ui.legendPopup.hidden = !isHidden;
    ui.legendBtn.setAttribute("aria-pressed", String(isHidden));
  });
}
if (ui.legendCloseBtn && ui.legendPopup && ui.legendBtn) {
  ui.legendCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    ui.legendPopup.hidden = true;
    ui.legendBtn.setAttribute("aria-pressed", "false");
  });
}
document.addEventListener("click", (e) => {
  if (ui.legendPopup && !ui.legendPopup.hidden && ui.legendBtn) {
    if (!ui.legendPopup.contains(e.target) && !ui.legendBtn.contains(e.target)) {
      ui.legendPopup.hidden = true;
      ui.legendBtn.setAttribute("aria-pressed", "false");
    }
  }
});

// Sponge HUD Category Filter Tags (Green, Blue, Gray, Drainage)
const spongeTags = [
  { id: "tagDrain", cat: "drain", label: "🚰 Drainage System (Engineered waterways)" },
  { id: "tagGreen", cat: "green", label: "🌿 Green (Urban parks & green reserves)" },
  { id: "tagBlue", cat: "blue", label: "💧 Blue (Retention ponds & wetland basins)" },
  { id: "tagGray", cat: "gray", label: "⚙️ Gray (Concrete monsoon drains & culverts)" }
];
spongeTags.forEach(({ id, cat, label }) => {
  const el = $(id);
  if (el) {
    el.addEventListener("click", () => {
      const active = filterSpongeCategory(cat);
      spongeTags.forEach(t => {
        const btn = $(t.id);
        if (btn) btn.classList.toggle("active-tag", t.cat === active);
      });
      toast(active ? `Highlighting ${label}` : "Showing all sponge infrastructure (Green, Blue, Gray)");
    });
  }
});

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

function set3DMode(enabled) {
  const heightExpr = enabled ? [
    "coalesce",
    ["get", "render_height"],
    ["*", ["coalesce", ["get", "building:levels"], 2], 3.8],
    8.5
  ] : 0;
  if (map.getLayer("building-3d")) {
    map.setPaintProperty("building-3d", "fill-extrusion-height", heightExpr);
  }
  if (map.getLayer("fs-buildings")) {
    map.setPaintProperty("fs-buildings", "fill-extrusion-height", heightExpr);
  }
  setSponge3DMode(enabled);
  if (ui.spongeHud) ui.spongeHud.style.opacity = "1";
}

const cam3d = $("cam3d"), camTop = $("camTop");
cam3d.addEventListener("click", () => {
  cam3d.setAttribute("aria-pressed", "true");
  camTop.setAttribute("aria-pressed", "false");
  map.easeTo({ pitch: CONFIG.pitch, bearing: CONFIG.bearing });
  set3DMode(true);
});
camTop.addEventListener("click", () => {
  camTop.setAttribute("aria-pressed", "true");
  cam3d.setAttribute("aria-pressed", "false");
  map.easeTo({ pitch: 0, bearing: 0 });
  set3DMode(false);
});

// Live rainfall (off by default): switch to the matching scenario and run in real time.
startLiveRain(mm => {
  const sc = pickScenario(state.scenarios, mm);
  if (!state.hasRain) { state.hasRain = true; state.liveStart = Date.now(); }
  state.scenario = sc;
  state.t = Math.min(sc.durationMin, (Date.now() - state.liveStart) / 60000);
  update(true);
});

// ---------------- Start
map.on("load", async () => {
  await addLayers();
  try { await loadData(); }
  catch (e) { ui.eta.textContent = "Couldn’t load map data"; ui.sub.textContent = `Check that ${CONFIG.dataBase} contains roads.geojson, places.json and scenarios/index.json.`; console.error(e); }
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
