// FloodSafe Route: main app. Wires the map, flood scenarios, routing and the UI together.
import { CONFIG } from "./config.js";
import { loadScenarios, pickScenario, level, fetchLiveFloodPrediction } from "./flood.js";
import { buildGraph, snapToEdge, insertPoint, route, safeCost, routeLine, steps, roadLabel } from "./routing.js";
import { locate, watch, search, haversine } from "./geo.js";
import { DemoStorm, startLiveRain } from "./rain.js";
import { initSponge, addDrainageLayers, updateSponge, setSpongeVisible, setSponge3DMode, setPredictLakeHighlight, getTownshipSpongeSummary, filterSpongeCategory } from "./sponge.js";
import { computeAreaFloodSchedule, renderAreaScheduleHtml, renderPredictPanelHtml, formatForecastOffsetTime, initInundationMarkers, updateInundationMarkers, openZonePopup, initRiskSectionControls, renderRiskSectionWidget, VULNERABILITY_ZONES } from "./inundation.js";

const $ = id => document.getElementById(id);
const ui = {
  eta: $("eta"), dist: $("dist"), sub: $("routeSub"), warn: $("warn"), steps: $("steps"), meta: $("meta"),
  toast: $("toast"),
  fromIn: $("fromIn"), toIn: $("toIn"), note: $("note"), dataNote: $("dataNote"),
  spongeHud: $("spongeHud"), spongeStatusBadge: $("spongeStatusBadge"),
  spongeHudBar: $("spongeHudBar"), spongeStorageText: $("spongeStorageText"), spongeRainText: $("spongeRainText"),
  predictBtn: $("predictBtn"), predictTimePopup: $("predictTimePopup"),
  predictPanelSlot: $("predictPanelSlot"),
  areaScheduleContainer: $("areaScheduleContainer"),
  q4AreaScheduleSlot: $("q4AreaScheduleSlot"),
  topTimeBar: $("topTimeBar"), topTimeVal: $("topTimeVal"),
  legendBtn: $("legendBtn"), legendPopup: $("legendPopup"), legendCloseBtn: $("legendCloseBtn"),
  emergBar: $("emergBar"),
  topFfBtn: $("topFfBtn"), topFfPanel: $("topFfPanel"),
  ffSlider: $("ffSlider"),
  chipStatus90: $("chipStatus90"), chipStatus120: $("chipStatus120"),
  timelineModeBtn: $("timelineModeBtn"),
  timelineModeIcon: $("timelineModeIcon"),
  timelineModeLabel: $("timelineModeLabel"),
  ffDemoSection: $("ffDemoSection"),
  ffQ4Section: $("ffQ4Section"),
  demoReadoutVal: $("demoReadoutVal"),
  q4ReadoutVal: $("q4ReadoutVal"),
  q4Slider: $("q4Slider"),
  q4ActualLevel: $("q4ActualLevel"),
  q4ActualBadge: $("q4ActualBadge"),
  q4ActualRain: $("q4ActualRain"),
  q4RoadDepth: $("q4RoadDepth"),
  q4PredLevel: $("q4PredLevel"),
  q4PredBadge: $("q4PredBadge"),
  q4RfLevel: $("q4RfLevel")
};
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const OFF_NETWORK_M = 400; // further than this from any mapped road = outside the mapped area

const state = {
  mode: CONFIG.defaultMode,
  graph: null, roads: null, places: [], scenarios: [], scenario: null,
  t: 0, hasRain: false, from: null, to: null, lastRouteKey: null, lastEdges: [], lastNames: new Map(),
  watchId: null, storm: null, predictActive: false, selectedForecastMin: 0, altRoutes: [],
  primaryRouteLine: null, primaryAnchorCoord: null, primaryRouteData: null,
  forecastShifted: false,
  timelineMode: "q4_2024",
  q4Data: [],
  q4CurrentIndex: 134
};

let emergMarkers = [];
let activeEmergFilter = "all";

const VERIFIED_EMERGENCY_FACILITIES = [
  { name: "Masjid Bandar Bukit Raja (relief centre)", shortName: "Masjid BBR (PPS)", coord: [101.42946, 3.08999], type: "relief_centre", category: "shelter", icon: "🏢", verified: true, address: "Jalan Makyong 5E/KU5, Bandar Bukit Raja, 41050 Klang", desc: "Verified Official PPS Relief Shelter (APM / NADMA)" },
  { name: "Dewan Majlis Bandaraya Diraja Klang (MBDK)", shortName: "Dewan MBDK", coord: [101.443913, 3.044572], type: "emergency_shelter", category: "shelter", icon: "🏢", verified: true, address: "Lorong Perbandaran, Kawasan 1, 41000 Klang", desc: "Major Civic Hall Evacuation Centre (MBDK), Capacity: ~1,500 evacuees" },
  { name: "Grace Community Services", shortName: "Grace Community", coord: [101.465479, 3.054569], type: "emergency_shelter", category: "shelter", icon: "🏢", verified: true, address: "7, Jalan Dendang 1, Pusat Bandar Berkeley, 41300 Klang", desc: "Community Relief Shelter, Soup Kitchen & Emergency Food Bank" },
  { name: "Columbia Asia Hospital Klang", shortName: "Columbia Asia", coord: [101.446590, 3.085915], type: "hospital", category: "hospital", icon: "🏥", verified: true, address: "1, Jalan Mahkota 1/KU 2, Bandar Bukit Raja, 41050 Klang", desc: "24/7 Emergency Department & Multi-Specialty Hospital" },
  { name: "Hospital Tengku Ampuan Rahimah (HTAR)", shortName: "HTAR Klang", coord: [101.442338, 3.026846], type: "hospital", category: "hospital", icon: "🏥", verified: true, address: "Jalan Langat, 41200 Klang", desc: "Lead Public General Hospital & Level 1 Trauma Centre, Klang District" },
  { name: "Klinik Dr Rosli Bukit Raja", shortName: "Klinik Dr Rosli", coord: [101.431770, 3.090409], type: "hospital", category: "hospital", icon: "🩺", verified: true, address: "19G, Jalan Makyong 5A/KU5, Bandar Bukit Raja, 41050 Klang", desc: "24-Hour Community Medical Clinic & Flood Triage Station" },
  { name: "Klang Utara Fire and Rescue Station", shortName: "Bomba Klang Utara", coord: [101.442800, 3.060100], type: "fire_station", category: "rescue", icon: "🚒", verified: true, address: "Batu 1 1/2, Jalan Kapar, Kawasan 18, 41400 Klang", desc: "Balai Bomba dan Penyelamat (BBP) Sungai Pinang, Water Rescue Unit (PPDA)", phone: "+603-3342 4444" },
  { name: "Klang Selatan Fire and Rescue Station", shortName: "Bomba Klang Selatan", coord: [101.447400, 3.042600], type: "fire_station", category: "rescue", icon: "🚒", verified: true, address: "Jalan Gedung Raja Abdullah, Kawasan 1, 41000 Klang", desc: "Balai Bomba dan Penyelamat (BBP) Kota Raja, Search & Rescue Operations Base", phone: "+603-3371 4444" }
];

function getPlaceCategory(p) {
  if (p && p.category) return p.category;
  if (!p) return "shelter";
  if (p.type === "relief_centre" || p.type === "emergency_shelter" || (p.name && p.name.toLowerCase().includes("masjid"))) return "shelter";
  if (p.type === "hospital" || (p.name && (p.name.toLowerCase().includes("hospital") || p.name.toLowerCase().includes("klinik")))) return "hospital";
  if (p.type === "fire_station" || (p.name && (p.name.toLowerCase().includes("fire") || p.name.toLowerCase().includes("bomba")))) return "rescue";
  return "shelter";
}

function getPlaceIcon(p) {
  if (p && p.icon) {
    if ((p.type === "relief_centre" || (p.name && p.name.toLowerCase().includes("masjid"))) && p.icon === "🚒") return "🏢";
    return p.icon;
  }
  const cat = getPlaceCategory(p);
  if (cat === "shelter") return "🏢";
  if (cat === "hospital") return "🏥";
  if (cat === "rescue") return "🚒";
  return "🏢";
}

function isEmergencyPlace(p) {
  if (!p) return false;
  if (p.category === "shelter" || p.category === "hospital" || p.category === "rescue") return true;
  if (p.type === "emergency_shelter" || p.type === "hospital" || p.type === "fire_station" || p.type === "relief_centre") return true;
  const nm = (p.name || "").toLowerCase();
  if (nm.includes("masjid") || nm.includes("hospital") || nm.includes("klinik") || nm.includes("bomba") || nm.includes("fire") || nm.includes("mbdk") || nm.includes("grace")) return true;
  return false;
}

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

  // Suggested Alternative Routes (shaded moderate risk, dashed)
  map.addSource("fs-route-alt", { type: "geojson", data: emptyFC });
  map.addLayer({
    id: "fs-route-alt-case", type: "line", source: "fs-route-alt",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "match", ["get", "level"],
        "flooded", "#ffcdd2",
        "high", "#ffcdd2",
        "moderate", "#ffe082",
        "#ffffff"
      ],
      "line-width": 8,
      "line-opacity": 0.75
    }
  });
  map.addLayer({
    id: "fs-route-alt", type: "line", source: "fs-route-alt",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "match", ["get", "level"],
        "flooded", "#d32f2f",
        "high", "#d32f2f",
        "moderate", "#f57c00",
        "#b39ddb"
      ],
      "line-width": 6,
      "line-opacity": 0.85,
      "line-dasharray": [3, 1.5]
    }
  });

  // Primary Route (solid purple on top - NON-SHADED, SAFE)
  map.addSource("fs-route", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-route-case", type: "line", source: "fs-route", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 11, "line-opacity": 0.95 } });
  map.addLayer({ id: "fs-route", type: "line", source: "fs-route", layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#5B3CC4", "line-width": 7, "line-opacity": 1.0 } });

  map.addSource("fs-places", { type: "geojson", data: emptyFC });
  map.addLayer({ id: "fs-centres", type: "circle", source: "fs-places", filter: ["==", ["get", "type"], "__inactive__"],
    paint: { "circle-radius": 8, "circle-color": css("--centre"), "circle-stroke-width": 3, "circle-stroke-color": css("--panel") } });
  map.addLayer({ id: "fs-centre-labels", type: "symbol", source: "fs-places", filter: ["==", ["get", "type"], "__inactive__"],
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
  set("fs-route-alt-case", "line-color", ["match", ["get", "level"], "flooded", "#ffcdd2", "high", "#ffcdd2", "moderate", "#ffe082", "#ffffff"]);
  set("fs-route-alt", "line-color", ["match", ["get", "level"], "flooded", "#d32f2f", "high", "#d32f2f", "moderate", "#f57c00", "#b39ddb"]);
  set("fs-route-case", "line-color", "#ffffff");
  set("fs-route", "line-color", "#5B3CC4");
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

// ---------------- Emergency Facilities Pinpoints & Filter
function renderEmergencyMarkers() {
  emergMarkers.forEach(m => m.marker.remove());
  emergMarkers = [];

  const emergPlaces = state.places.filter(isEmergencyPlace);
  emergPlaces.forEach(p => {
    const pCat = getPlaceCategory(p);
    const pIcon = getPlaceIcon(p);

    const el = document.createElement("div");
    el.className = `emerg-marker cat-${pCat}`;
    el.dataset.category = pCat;
    el.dataset.name = p.name;

    const container = document.createElement("div");
    container.className = "emerg-marker-container";

    const pin = document.createElement("div");
    pin.className = "emerg-pin";
    const icon = document.createElement("span");
    icon.className = "emerg-icon";
    icon.textContent = pIcon;
    pin.appendChild(icon);

    const badge = document.createElement("div");
    badge.className = "emerg-badge";
    const badgeText = document.createElement("span");
    badgeText.className = "emerg-badge-text";
    badgeText.textContent = p.shortName || p.name;
    badge.appendChild(badgeText);

    container.appendChild(pin);
    container.appendChild(badge);
    el.appendChild(container);

    const catTitle = pCat === "shelter"
      ? "Emergency Evacuation Shelter"
      : pCat === "hospital"
      ? "Hospital & Medical Centre"
      : "Search & Rescue Operations (Bomba)";

    const popupContent = document.createElement("div");
    popupContent.className = "emerg-popup";
    popupContent.innerHTML = `
      <div class="emerg-popup-head cat-${pCat}">
        <span class="emerg-popup-cat-badge">${pIcon} ${catTitle}</span>
        <h4 class="emerg-popup-title">${p.name}</h4>
      </div>
      <div class="emerg-popup-body">
        <div class="emerg-popup-addr"><strong>📍 Address:</strong> ${p.address || 'Klang, Selangor'}</div>
        <div class="emerg-popup-desc"><strong>ℹ️ Operation:</strong> ${p.desc || ''}</div>
        ${p.phone ? `<div class="emerg-popup-phone"><strong>📞 Emergency Hotline:</strong> <a href="tel:${p.phone}">${p.phone}</a></div>` : ''}
        <div class="emerg-popup-actions">
          <button type="button" class="emerg-action-btn btn-to">📍 Route Here</button>
          <button type="button" class="emerg-action-btn btn-from">🚩 Start Here</button>
        </div>
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: [0, -32], closeButton: true, maxWidth: "320px" })
      .setDOMContent(popupContent);

    popup.on("open", () => {
      const btnTo = popupContent.querySelector(".btn-to");
      const btnFrom = popupContent.querySelector(".btn-from");
      if (btnTo) btnTo.onclick = () => { setTo(p); popup.remove(); };
      if (btnFrom) btnFrom.onclick = () => { setFrom(p); popup.remove(); };
    });

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(p.coord)
      .setPopup(popup)
      .addTo(map);

    emergMarkers.push({ marker, place: p, element: el });
  });
}

function filterEmergencyFacilities(cat) {
  if (activeEmergFilter === cat && cat !== "all") {
    cat = "all";
  }
  activeEmergFilter = cat;
  document.querySelectorAll(".emerg-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.cat === cat);
  });

  const matched = [];
  emergMarkers.forEach(({ element, marker, place }) => {
    const pCat = getPlaceCategory(place);
    const isMatch = (cat === "all" || pCat === cat);

    if (isMatch) {
      element.style.display = "";
      element.classList.remove("dimmed");
      if (cat === "all") {
        element.classList.remove("highlighted");
      } else {
        element.classList.add("highlighted");
      }
      matched.push(place.coord);
    } else {
      element.style.display = "none";
      element.classList.add("dimmed");
      element.classList.remove("highlighted");
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
        popup.remove();
      }
    }
  });

  if (matched.length > 0) {
    const bounds = matched.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(matched[0], matched[0]));
    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 90, left: window.innerWidth > 900 ? 380 : 40, right: 60 },
      maxZoom: 14.5,
      duration: 1100
    });
    const label = cat === "all"
      ? "all 8 emergency facilities"
      : cat === "shelter"
      ? "3 emergency shelters"
      : cat === "hospital"
      ? "3 hospitals & clinics"
      : "2 search & rescue stations";
    toast(`Viewing ${label} across Klang & Bandar Bukit Raja`);
  }
}

function fitTripBounds() {
  if (!state.from || !state.to) return;
  const dist = haversine(state.from.coord, state.to.coord);
  if (dist > 1400) {
    const bounds = new maplibregl.LngLatBounds(state.from.coord, state.from.coord).extend(state.to.coord);
    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 120, left: window.innerWidth > 900 ? 380 : 40, right: 60 },
      maxZoom: 14.5,
      duration: 1000
    });
  }
}

// ---------------- Data
async function loadData() {
  const base = CONFIG.dataBase;
  const [roads, rawPlaces, scenarios] = await Promise.all([
    fetch(`${base}/roads.geojson`).then(r => r.json()),
    fetch(`${base}/places.json?v=${Date.now()}`).then(r => r.json()).catch(() => []),
    loadScenarios(base)
  ]);

  // Always ensure all 8 verified emergency facilities are merged and present with accurate metadata
  const places = Array.isArray(rawPlaces) && rawPlaces.length > 0 ? [...rawPlaces] : [];
  VERIFIED_EMERGENCY_FACILITIES.forEach(ef => {
    const idx = places.findIndex(p => p.name === ef.name || p.name.includes(ef.name) || (p.type === "relief_centre" && ef.type === "relief_centre"));
    if (idx >= 0) {
      places[idx] = { ...places[idx], ...ef };
    } else {
      places.push(ef);
    }
  });

  state.roads = roads; state.graph = buildGraph(roads); state.places = places; state.scenarios = scenarios;
  state.scenario = scenarios[Math.min(1, scenarios.length - 1)];

  const dl = $("places");
  dl.innerHTML = "";
  places.forEach(p => { const o = document.createElement("option"); o.value = p.name; dl.appendChild(o); });

  map.getSource("fs-places").setData({ type: "FeatureCollection", features: places.map(p => ({
    type: "Feature", geometry: { type: "Point", coordinates: p.coord }, properties: { name: p.name, type: p.type } })) });

      ui.dataNote.innerHTML = scenarios.some(s => s.synthetic)
        ? "<strong>Data.</strong> Roads, buildings, water bodies and drains come from OpenStreetMap. Places and emergency facilities come from public sources. The river-level model is trained on real JPS Public Infobanjir records (Oct–Dec 2024). Road flood depths and the river readings in the Predict timeline are simulated for this prototype, based on reported floods in Taman Kyra, Taman Casira and Jalan Makyong. They are not live or official forecasts."
        : "<strong>Data.</strong> Roads, buildings, water bodies and drains come from OpenStreetMap. Flood predictions come from pre-computed HEC-RAS scenarios. See DATA_SOURCES.md for every source and assumption.";

  // Render emergency markers on the map
  renderEmergencyMarkers();

  // Initialize Inundation Vulnerability Zone markers (matching shelter/bomba/hospital pin & popup)
  initInundationMarkers(map, zone => {
    toast(`📍 ${zone.name}: Ground Elev ${zone.groundElevationM}m • ${zone.desc}`);
  }, {
    setFrom: p => setFrom(p, true),
    setTo: p => setTo(p, true),
    evacuateFrom: zone => {
      const pps = state.places.find(p => p.type === "relief_centre" || (p.name && p.name.includes("Masjid"))) || {
        name: "Masjid Bandar Bukit Raja (relief centre)",
        coord: [101.42946, 3.08999]
      };
      setFrom({ name: zone.shortName, coord: zone.coord }, false);
      setTo(pps, true);
      toast(`🚗 Routing safe evacuation: ${zone.shortName} ➔ Masjid BBR (PPS)`);
    }
  });

  // Initialize Risk Section Alert button & expandable filter controls
  initRiskSectionControls();

  const start = places.find(p => p.type !== "relief_centre" && !isEmergencyPlace(p)) || places[0];
  const dest = places.find(p => p.type === "relief_centre" || (p.name && p.name.includes("Masjid"))) || places[places.length - 1];
  setFrom(start, false); setTo(dest, false);
  if (state.predictActive) {
    updatePredictModalView();
  } else {
    update(false);
  }
}

// ---------------- Trip
function setFrom(p, run = true) {
  state.from = p; ui.fromIn.value = p.name; fromMarker.setLngLat(p.coord).addTo(map);
  state.lastRouteKey = null;
  if (run) {
    update(false);
    fitTripBounds();
  }
}
function setTo(p, run = true) {
  state.to = p; ui.toIn.value = p.name; toMarker.setLngLat(p.coord).addTo(map);
  state.lastRouteKey = null;
  if (run) {
    update(false);
    fitTripBounds();
  }
}

let toastTimer = null;
function toast(msg) {
  ui.toast.textContent = msg; ui.toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 4500);
}
function dismissToast() {
  if (ui.toast) {
    ui.toast.classList.remove("show");
    clearTimeout(toastTimer);
  }
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

    const assignedMins = alts.length === 0 ? 16 : 18;
    alts.push({
      id: `alt-${alts.length + 1}`,
      index: alts.length + 1,
      path: altPath,
      lineGeo,
      mins: assignedMins,
      via,
      edgeSet: altSet,
      edgeIds: altBases,
      lengthM: altPath.lengthM,
      anchorCoord,
      passesWetland,
      isUnsafe: false,
      level: "moderate",
      isShaded: true
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

  const t = state.selectedForecastMin !== undefined ? state.selectedForecastMin : 0;

  // 1. Determine wetland flood status & color based on forecast time
  let lakeStatus = "red";
  let wetlandMessage = "⚠️ Estimate to flood in 20 mins (9:20 AM - 9:30 AM)";

  if (t >= 105) {
    // 11:00 AM slot
    if (state.forecastShifted) {
      lakeStatus = "orange";
      wetlandMessage = "⚠️ Moderate Risk — Delayed Runoff Receding (11:00 AM)";
    } else {
      lakeStatus = "safe";
      wetlandMessage = "✅ Flood Receded — Safe (11:00 AM)";
    }
  } else if (t >= 75) {
    // 10:30 AM slot
    if (state.forecastShifted) {
      lakeStatus = "red";
      wetlandMessage = "⚠️ High Inundation Sustained — Flooded (10:30 AM)";
    } else {
      lakeStatus = "orange";
      wetlandMessage = "⚠️ Moderate Risk — Water Level Receding (10:30 AM)";
    }
  } else if (t > 0) {
    // 9:30 AM (t=30) & 10:00 AM (t=60): Peak flooded, red
    lakeStatus = "red";
    wetlandMessage = t >= 45 
      ? "⚠️ High Inundation Peak (Flooded)"
      : "⚠️ Estimate to flood in 20 mins (9:20 AM)";
  } else {
    // 9:00 AM (t=0): Present condition — MODERATE RISK instead of safe
    lakeStatus = "orange";
    wetlandMessage = "⚠️ Present Condition: Moderate Risk (9:00 AM)";
  }

  // Natural basemap water & realistic map rendering preserved

  // 3. Dynamic Routes Rendering (15 mins non-shaded, 16 mins & 18 mins shaded)
  // Ensure the 3 routes KEEP CHANGING dynamically as user slides through the fast forward
  if (state.primaryRouteLine && map.getSource("fs-route")) {
    map.getSource("fs-route").setData(state.primaryRouteLine);
  }

  // Determine dynamic Primary Safe Route time and status
  let primaryMins = 15;
  let primaryTag = "safe";
  let primaryTitle = "15 mins safe route (Active)";
  if (t < 15) {
    primaryMins = 15;
    primaryTag = "safe";
    primaryTitle = "15 mins safe route (Active)";
  } else if (t < 25) {
    primaryMins = 17;
    primaryTag = "safe detour";
    primaryTitle = "17 mins safe detour (Avoiding surface pooling)";
  } else if (t < 45) {
    primaryMins = 21;
    primaryTag = "safe elevated bypass";
    primaryTitle = "21 mins safe elevated bypass (Jalan Makyong flooded)";
  } else if (t < 75) {
    primaryMins = 24;
    primaryTag = "only safe corridor";
    primaryTitle = "24 mins elevated southern link (Peak flood crest)";
  } else if (t < 105) {
    primaryMins = state.forecastShifted ? 22 : 18;
    primaryTag = "safe";
    primaryTitle = `${primaryMins} mins safe route (Water receding)`;
  } else {
    primaryMins = 15;
    primaryTag = "safe";
    primaryTitle = "15 mins safe route (All roads clear)";
  }

  // Pill 1: Primary safe route (non-shaded purple)
  const pAnchor = state.primaryAnchorCoord || [101.4320, 3.0910];
  const pEl = document.createElement("div");
  pEl.className = "route-suggest-marker is-safe";
  pEl.setAttribute("role", "button");
  pEl.setAttribute("tabindex", "0");
  pEl.setAttribute("title", primaryTitle);
  pEl.innerHTML = `
    <div class="route-suggest-pill pill-safe">
      <span class="route-suggest-time time-safe">${primaryMins} mins <span class="route-suggest-tag safe">(${primaryTag})</span></span>
    </div>
    <div class="route-suggest-arrow arrow-safe"></div>
  `;
  pEl.onclick = () => {
    applySafeRoute();
  };
  const pMarker = new maplibregl.Marker({ element: pEl, anchor: "bottom" })
    .setLngLat(pAnchor)
    .addTo(map);
  altRouteMarkers.push(pMarker);

  // Dynamic Alternative Routes (16 mins wetland route & 18 mins northern route)
  if (state.altRoutes && state.altRoutes.length > 0 && map.getSource("fs-route-alt")) {
    const altFeatures = state.altRoutes.map((alt, idx) => {
      const isAlt16 = (alt.mins === 16 || alt.passesWetland || idx === 0);
      let lv = "moderate";
      if (isAlt16) {
        if (t >= 25 && t < 75) {
          lv = "flooded"; // Danger Red line & casing!
        } else if (t >= 75 && t < 105) {
          lv = state.forecastShifted ? "flooded" : "moderate";
        } else if (t >= 105) {
          lv = state.forecastShifted ? "moderate" : "moderate";
        } else {
          lv = "moderate";
        }
      } else {
        // 18 mins northern route
        lv = "moderate";
      }

      return {
        type: "Feature",
        geometry: alt.lineGeo.geometry,
        properties: {
          id: alt.id,
          mins: alt.mins,
          via: alt.via,
          index: alt.index,
          level: lv,
          isShaded: true
        }
      };
    });
    map.getSource("fs-route-alt").setData({ type: "FeatureCollection", features: altFeatures });

    // Render Pills 2 & 3 for alternative routes with dynamic time and danger state
    state.altRoutes.forEach((alt, idx) => {
      const isAlt16 = (alt.mins === 16 || alt.passesWetland || idx === 0);
      let markerClass = "is-moderate";
      let pillClass = "pill-moderate";
      let timeClass = "time-moderate";
      let arrowClass = "arrow-moderate";
      let displayTime = `${alt.mins} mins`;
      let tagHtml = `<span class="route-suggest-tag mod">(moderate)</span>`;
      let title = `Click to view this route (${alt.mins} mins moderate risk)`;

      if (isAlt16) {
        if (t < 15) {
          markerClass = "is-moderate";
          pillClass = "pill-moderate";
          timeClass = "time-moderate";
          arrowClass = "arrow-moderate";
          displayTime = "16 mins";
          tagHtml = `<span class="route-suggest-tag mod">(moderate)</span>`;
          title = "16 mins route (Moderate risk ~15cm near wetland)";
        } else if (t < 25) {
          markerClass = "is-moderate";
          pillClass = "pill-warning";
          timeClass = "time-warning";
          arrowClass = "arrow-warning";
          displayTime = "17 mins ⚠️";
          tagHtml = `<span class="route-suggest-tag mod">(rising 25cm)</span>`;
          title = "17 mins route (Water rising to 25cm along Jalan Makyong)";
        } else if (t < 45) {
          markerClass = "is-unsafe";
          pillClass = "pill-unsafe";
          timeClass = "time-unsafe";
          arrowClass = "arrow-unsafe";
          displayTime = "🚫 16 mins";
          tagHtml = `<span class="route-suggest-tag danger">(Flooded 40cm - Impassable)</span>`;
          title = "🚫 16 mins Wetland route: Submerged by 40cm floodwater. Completely impassable!";
        } else if (t < 75) {
          markerClass = "is-unsafe";
          pillClass = "pill-unsafe";
          timeClass = "time-unsafe";
          arrowClass = "arrow-unsafe";
          displayTime = "🚫 16 mins";
          tagHtml = `<span class="route-suggest-tag danger">(Peak Flood 58cm - Blocked)</span>`;
          title = "🚫 16 mins Wetland route: Extreme flood crest (58cm). Strictly closed!";
        } else if (t < 105) {
          if (state.forecastShifted) {
            markerClass = "is-unsafe";
            pillClass = "pill-unsafe";
            timeClass = "time-unsafe";
            arrowClass = "arrow-unsafe";
            displayTime = "🚫 16 mins";
            tagHtml = `<span class="route-suggest-tag danger">(Extended Flood 38cm)</span>`;
            title = "🚫 16 mins route: Extended high inundation (38cm). Impassable.";
          } else {
            markerClass = "is-moderate";
            pillClass = "pill-warning";
            timeClass = "time-warning";
            arrowClass = "arrow-warning";
            displayTime = "16 mins ⚠️";
            tagHtml = `<span class="route-suggest-tag mod">(Receding ~15cm)</span>`;
            title = "16 mins route: Water receding into box culverts. Passable with caution.";
          }
        } else {
          // t >= 105 (11:00 AM)
          if (state.forecastShifted) {
            markerClass = "is-moderate";
            pillClass = "pill-warning";
            timeClass = "time-warning";
            arrowClass = "arrow-warning";
            displayTime = "16 mins ⚠️";
            tagHtml = `<span class="route-suggest-tag mod">(Delayed runoff)</span>`;
            title = "16 mins route: Minor surface runoff. Drive cautiously.";
          } else {
            markerClass = "is-safe";
            pillClass = "pill-safe";
            timeClass = "time-safe";
            arrowClass = "arrow-safe";
            displayTime = "16 mins";
            tagHtml = `<span class="route-suggest-tag safe">(cleared)</span>`;
            title = "16 mins route: Road completely dry and clear.";
          }
        }
      } else {
        // Alt 2: 18 mins northern route
        if (t < 15) {
          displayTime = "18 mins";
          tagHtml = `<span class="route-suggest-tag mod">(moderate)</span>`;
          title = "18 mins Northern connector route";
        } else if (t < 35) {
          displayTime = "19 mins ⚠️";
          tagHtml = `<span class="route-suggest-tag mod">(surface runoff)</span>`;
          title = "19 mins: Surface runoff near monsoon drain. Drive cautiously.";
        } else if (t < 75) {
          displayTime = "22 mins ⚠️";
          tagHtml = `<span class="route-suggest-tag mod">(high caution)</span>`;
          title = "22 mins: Heavy runoff. Traffic slowed.";
        } else if (t < 105) {
          displayTime = "19 mins ⚠️";
          tagHtml = `<span class="route-suggest-tag mod">(caution)</span>`;
          title = "19 mins: Runoff receding into drainage.";
        } else {
          markerClass = "is-safe";
          pillClass = "pill-safe";
          timeClass = "time-safe";
          arrowClass = "arrow-safe";
          displayTime = "18 mins";
          tagHtml = `<span class="route-suggest-tag safe">(safe)</span>`;
          title = "18 mins: Elevated bypass clear and dry.";
        }
      }

      const el = document.createElement("div");
      el.className = `route-suggest-marker ${markerClass}`;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("title", title);
      el.innerHTML = `
        <div class="route-suggest-pill ${pillClass}">
          <span class="route-suggest-time ${timeClass}">${displayTime} ${tagHtml}</span>
        </div>
        <div class="route-suggest-arrow ${arrowClass}"></div>
      `;
      el.onclick = () => {
        if (markerClass === "is-unsafe") {
          toast(`🚫 ${alt.mins} mins route is submerged by floodwater and impassable! Please follow the safe elevated bypass.`);
        } else {
          applyChosenAltRoute(alt, markerClass === "is-safe" ? "safe" : "moderate");
        }
      };
      const m = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(alt.anchorCoord)
        .addTo(map);
      altRouteMarkers.push(m);
    });
  }
}

// Switch back to 15 mins primary safe route
function applySafeRoute() {
  if (!state.primaryRouteData) return;
  const { line, mins, totalLengthM, stepList, baseIds, names, T } = state.primaryRouteData;
  ui.eta.textContent = `${mins} min`;
  ui.dist.textContent = `${fmtLen(totalLengthM)} ${state.mode === "drive" ? "driving" : "walking"}`;
  ui.sub.innerHTML = '<span class="badge ok" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7;">15 mins safe route active • Avoids moderate-risk roads</span>';
  toast(`Switched route: 15 mins (safe)`);

  ui.steps.innerHTML = "";
  stepList.forEach((st, i) => {
    const li = document.createElement("li"), dot = document.createElement("span"), txt = document.createElement("span"), len = document.createElement("small");
    const lv = level(st.risk, T);
    dot.className = "rk"; dot.style.background = lv === "moderate" ? css("--moderate") : css("--route");
    txt.textContent = (i === 0 ? "Start on " : st.bridge ? "Cross " : "Continue on ") + st.name;
    len.textContent = fmtLen(st.lengthM);
    li.append(dot, txt, len); ui.steps.appendChild(li);
  });
  const end = document.createElement("li"), endDot = document.createElement("span"), endTxt = document.createElement("span");
  endDot.className = "rk"; endDot.style.background = css("--dest"); endTxt.textContent = `Arrive at ${state.to.name}`;
  end.append(endDot, endTxt, document.createElement("small")); ui.steps.appendChild(end);

  state.lastRouteKey = baseIds.join(","); state.lastEdges = baseIds; state.lastNames = names;
  map.getSource("fs-route").setData(line);
}

// Switch primary route to a suggested alternative route
function applyChosenAltRoute(alt, level = "moderate") {
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
  ui.sub.innerHTML = `<span class="badge mod" style="background:#fff3e0; color:#e65100; border:1px solid #ffe082;">⚠️ ${alt.mins} mins route active: moderate risk (shaded)</span>`;
  toast(`Switched route: ${alt.mins} mins (moderate risk)`);

  ui.steps.innerHTML = "";
  stepList.forEach((st, i) => {
    const li = document.createElement("li"), dot = document.createElement("span"), txt = document.createElement("span"), len = document.createElement("small");
    const lv = level(st.risk, T);
    dot.className = "rk"; dot.style.background = css("--moderate");
    txt.textContent = (i === 0 ? "Start on " : st.bridge ? "Cross " : "Continue on ") + st.name + " (moderate risk)";
    len.textContent = fmtLen(st.lengthM);
    li.append(dot, txt, len); ui.steps.appendChild(li);
  });
  const end = document.createElement("li"), endDot = document.createElement("span"), endTxt = document.createElement("span");
  endDot.className = "rk"; endDot.style.background = css("--dest"); endTxt.textContent = `Arrive at ${state.to.name}`;
  end.append(endDot, endTxt, document.createElement("small")); ui.steps.appendChild(end);

  state.lastRouteKey = baseIds.join(","); state.lastEdges = baseIds; state.lastNames = names;
  map.getSource("fs-route").setData(line);
}

// ---------------- Fast Forward & Time Scrub Simulation Controller
function getMinuteTelemetry(min, shifted) {
  const anchors = [
    { t: 0,   binjai: 3.65, rasau: 2.85, klang: 2.30, rain: 18.0, pct: 68, vol: 54400, risk: "MODERATE", badge: "badge-warning", color: "#ff9100" },
    { t: 30,  binjai: 4.55, rasau: 4.10, klang: 3.40, rain: 68.0, pct: 88, vol: 70400, risk: "FLOODED",  badge: "badge-danger",  color: "#e53935" },
    { t: 60,  binjai: 4.80, rasau: 4.35, klang: 3.60, rain: 78.0, pct: 84, vol: 67200, risk: "FLOODED",  badge: "badge-danger",  color: "#c62828" },
    {
      t: 90,
      binjai: shifted ? 4.58 : 4.10,
      rasau: shifted ? 4.15 : 3.65,
      klang: shifted ? 3.45 : 3.10,
      rain: shifted ? 42.0 : 28.0,
      pct: shifted ? 86 : 68,
      vol: shifted ? 68800 : 54400,
      risk: shifted ? "FLOODED" : "MODERATE",
      badge: shifted ? "badge-danger" : "badge-warning",
      color: shifted ? "#e53935" : "#ff9100"
    },
    {
      t: 120,
      binjai: shifted ? 4.05 : 3.25,
      rasau: shifted ? 3.40 : 2.70,
      klang: shifted ? 2.95 : 2.40,
      rain: shifted ? 14.0 : 4.0,
      pct: shifted ? 64 : 42,
      vol: shifted ? 51200 : 33600,
      risk: shifted ? "MODERATE" : "SAFE",
      badge: shifted ? "badge-warning" : "badge-safe",
      color: shifted ? "#ff9100" : "#2e7d32"
    },
    {
      t: 150,
      binjai: 2.80, rasau: 2.30, klang: 2.10, rain: 0.0, pct: 28, vol: 22400,
      risk: "SAFE", badge: "badge-safe", color: "#2e7d32"
    },
    {
      t: 180,
      binjai: 2.45, rasau: 2.10, klang: 1.95, rain: 0.0, pct: 18, vol: 14400,
      risk: "SAFE", badge: "badge-safe", color: "#2e7d32"
    },
    {
      t: 210,
      binjai: 2.30, rasau: 1.95, klang: 1.85, rain: 0.0, pct: 14, vol: 11200,
      risk: "SAFE", badge: "badge-safe", color: "#2e7d32"
    }
  ];

  let p1 = anchors[0], p2 = anchors[anchors.length - 1];
  for (let i = 0; i < anchors.length - 1; i++) {
    if (min >= anchors[i].t && min <= anchors[i + 1].t) {
      p1 = anchors[i];
      p2 = anchors[i + 1];
      break;
    }
  }

  const span = p2.t - p1.t;
  const factor = span > 0 ? (min - p1.t) / span : 0;
  const binjai = Number((p1.binjai + (p2.binjai - p1.binjai) * factor).toFixed(2));
  const rasau = Number((p1.rasau + (p2.rasau - p1.rasau) * factor).toFixed(2));
  const klang = Number((p1.klang + (p2.klang - p1.klang) * factor).toFixed(2));
  const rain = Math.round(p1.rain + (p2.rain - p1.rain) * factor);
  const pct = Math.round(p1.pct + (p2.pct - p1.pct) * factor);
  const vol = Math.round(p1.vol + (p2.vol - p1.vol) * factor);

  let risk = "SAFE", badge = "badge-safe", color = "#2e7d32";
  if (binjai >= 4.50) {
    risk = "FLOODED"; badge = "badge-danger"; color = "#e53935";
  } else if (binjai >= 3.50) {
    risk = "MODERATE"; badge = "badge-warning"; color = "#ff9100";
  }

  return { binjai, rasau, klang, rain, pct, vol, risk, badge, color };
}

function updateLiveMinuteTelemetry(min) {
  const telem = getMinuteTelemetry(min, state.forecastShifted);
  if (ui.spongeStatusBadge) {
    ui.spongeStatusBadge.textContent = telem.risk;
    ui.spongeStatusBadge.className = `sponge-badge ${telem.badge}`;
  }
  if (ui.spongeHudBar) {
    ui.spongeHudBar.style.width = `${telem.pct}%`;
    ui.spongeHudBar.style.backgroundColor = telem.color;
  }
  if (ui.spongeStorageText) {
    ui.spongeStorageText.textContent = `${telem.pct}% (Sg. Binjai: ${telem.binjai.toFixed(2)}m • ~${telem.vol.toLocaleString()} m³)`;
  }
  if (ui.spongeRainText) {
    ui.spongeRainText.textContent = `Telemetry: ${telem.rain} mm/h rainfall`;
  }
}

function setForecastShift(shifted, toastUser = true) {
  if (state.forecastShifted === shifted) return;
  state.forecastShifted = shifted;

  if (shifted) {
    if (toastUser) {
      toast("⚡ Fast-Forward Simulation: Inundation escalated! 10:30 AM is now Flooded, 11:00 AM is Moderate.");
    }
  } else {
    if (toastUser) {
      toast("⏪ Timeline reset to baseline condition: 10:30 AM Moderate, 11:00 AM Safe.");
    }
  }

  updatePredictModalView();
  updatePredictVisuals();

  if (state.t >= 75) {
    renderForecastBriefing(state.t);
  }
}

function updatePredictModalView(activeLeadMin = state.selectedForecastLeadMin || 0, activeCategory = state.predictCategoryFilter || "all") {
  state.selectedForecastLeadMin = activeLeadMin;
  state.predictCategoryFilter = activeCategory;

  let currentWl = 2.10, predWl = 2.50, timeLabel = "9:00 AM", baseTimeStr = "9:00 AM";

  if (state.timelineMode === "q4_2024" && state.q4Data && state.q4Data[state.q4CurrentIndex]) {
    const baseIdx = state.q4CurrentIndex;
    const pt = state.q4Data[baseIdx];
    baseTimeStr = pt.date_display;

    // Calculate future telemetry based on activeLeadMin (hourly data interpolation)
    const step = activeLeadMin / 60.0;
    const targetIdx = baseIdx + step;
    const i0 = Math.min(state.q4Data.length - 1, Math.floor(targetIdx));
    const frac = targetIdx - i0;
    const nextIdx = Math.min(state.q4Data.length - 1, i0 + 1);

    const d0 = state.q4Data[i0];
    const d1 = state.q4Data[nextIdx];

    const actWl = d0.actual_level_m + (d1.actual_level_m - d0.actual_level_m) * frac;
    const pWl = d0.pred_xgb_m + (d1.pred_xgb_m - d0.pred_xgb_m) * frac;

    currentWl = Number(actWl.toFixed(2));
    predWl = Number(pWl.toFixed(2));
    timeLabel = formatForecastOffsetTime(baseTimeStr, activeLeadMin);
  } else {
    baseTimeStr = formatClockTime(state.t);
    const forecastMin = state.t + activeLeadMin;
    const telem = getMinuteTelemetry(forecastMin, state.forecastShifted);
    currentWl = telem.binjai;
    if (forecastMin >= 15 && forecastMin < 60) {
      predWl = Number((telem.binjai + 0.65).toFixed(2));
    } else if (forecastMin >= 60 && forecastMin < 90) {
      predWl = Number((telem.binjai + (state.forecastShifted ? 0.45 : -0.25)).toFixed(2));
    } else if (forecastMin >= 90) {
      predWl = Number((telem.binjai - 0.55).toFixed(2));
    } else {
      predWl = Number((telem.binjai + 0.45).toFixed(2));
    }
    timeLabel = formatForecastOffsetTime(baseTimeStr, activeLeadMin);
  }

  const schedule = computeAreaFloodSchedule(currentWl, predWl, timeLabel);

  if (ui.predictPanelSlot) {
    ui.predictPanelSlot.innerHTML = renderPredictPanelHtml(schedule, currentWl, predWl, timeLabel, activeLeadMin, baseTimeStr, activeCategory);
    const closeBtn = document.getElementById("predictCloseBtn");
    if (closeBtn) closeBtn.onclick = () => closePredictModal();

    // Bind forecast time chip clicks
    ui.predictPanelSlot.querySelectorAll(".time-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const lead = parseInt(chip.dataset.lead, 10);
        updatePredictModalView(lead, state.predictCategoryFilter);
      });
    });

    // Bind risk category filter chips under time selection
    ui.predictPanelSlot.querySelectorAll(".predict-cat-chips .risk-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = chip.dataset.cat;
        updatePredictModalView(state.selectedForecastLeadMin, cat);
      });
    });

    bindAreaCardClicks(ui.predictPanelSlot);
  }

  if (ui.q4AreaScheduleSlot) {
    ui.q4AreaScheduleSlot.innerHTML = renderAreaScheduleHtml(schedule);
    bindAreaCardClicks(ui.q4AreaScheduleSlot);
  }

  // Update map polygons and pins according to activeCategory
  updateAreaZonePolygons(schedule, activeCategory);

  // Filter map pins according to activeCategory
  let filteredSchedule = schedule;
  if (activeCategory === "flooded") filteredSchedule = schedule.filter(z => z.status === "CURRENT_FLOOD");
  else if (activeCategory === "high") filteredSchedule = schedule.filter(z => z.status === "PREDICTED_FLOOD");
  else if (activeCategory === "moderate") filteredSchedule = schedule.filter(z => z.status === "WARNING");
  else if (activeCategory === "safe") filteredSchedule = schedule.filter(z => z.status === "SAFE");

  const filteredIds = new Set(filteredSchedule.map(f => f.id));
  zoneMarkers.forEach(({ zone, el, popup }) => {
    if (activeCategory === "all" || filteredIds.has(zone.id)) {
      el.style.display = "";
      el.style.opacity = "1";
    } else {
      el.style.display = "none";
      if (popup && popup.isOpen && popup.isOpen()) popup.remove();
    }
  });
}

function closePredictModal() {
  state.predictActive = false;
  state.predictCategoryFilter = "all";
  if (ui.predictBtn) ui.predictBtn.setAttribute("aria-pressed", "false");
  if (ui.predictTimePopup) {
    ui.predictTimePopup.hidden = true;
    ui.predictTimePopup.style.display = "none";
  }
  // Restore all markers and polygons
  zoneMarkers.forEach(({ el }) => {
    el.style.display = "";
    el.style.opacity = "1";
  });
  updateAreaZonePolygons(currentSchedule, "all");
}

function bindAreaCardClicks(container) {
  if (!container) return;
  container.querySelectorAll(".area-sched-card").forEach(card => {
    card.addEventListener("click", () => {
      const zoneId = card.dataset.zoneId;
      if (zoneId) {
        openZonePopup(zoneId);
      } else {
        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.easeTo({ center: [lng, lat], zoom: 15.5 });
        }
      }
    });
  });
}

function applyTimeScrub(min, fromFastForward = false) {
  min = Math.max(0, Math.min(120, Math.round(min)));
  state.t = min;
  state.hasRain = min > 0;

  if (ui.ffSlider && parseInt(ui.ffSlider.value, 10) !== min) {
    ui.ffSlider.value = min;
  }
  if (ui.topTimeVal) {
    ui.topTimeVal.textContent = formatClockTime(min);
  }
  if (ui.demoReadoutVal) {
    ui.demoReadoutVal.textContent = formatClockTime(min);
  }

  // When fast forwarding past minute 28-30, dynamic flood shift triggers
  if (min >= 28 && !state.forecastShifted) {
    setForecastShift(true, true);
  } else if (min < 15 && state.forecastShifted) {
    setForecastShift(false, false);
  }

  // Update FloodShield prediction and evacuation schedule based on current scrub time
  state.selectedForecastLeadMin = 0;
  updatePredictModalView(0);

  if (min > 0) {
    dismissToast();
  }

  update(true);
  updatePredictVisuals();
  updateLiveMinuteTelemetry(min);
}

// ---------------- Sg. Binjai Telemetry (25/11/2024 00:00 - 05/12/2024 00:00)
async function loadQ4TelemetryData() {
  try {
    const res = await fetch("./data/binjai_telemetry_25nov_05dec.json");
    if (res.ok) {
      state.q4Data = await res.json();
      console.log(`[OK] Loaded ${state.q4Data.length} records for Sg. Binjai (25/11/2024 - 05/12/2024).`);
      applyQ4Telemetry(state.q4CurrentIndex ?? 100);
    }
  } catch (err) {
    console.warn("Could not load Sg. Binjai telemetry dataset:", err);
  }
}

function toggleTimelineMode(forcedMode) {
  const nextMode = forcedMode || (state.timelineMode === "demo" ? "q4_2024" : "demo");
  state.timelineMode = nextMode;

  if (nextMode === "q4_2024") {
    if (ui.timelineModeBtn) {
      ui.timelineModeBtn.classList.add("active-q4");
      if (ui.timelineModeIcon) ui.timelineModeIcon.textContent = "⚡";
      if (ui.timelineModeLabel) ui.timelineModeLabel.textContent = "Demo Run";
    }
    if (ui.ffDemoSection) ui.ffDemoSection.hidden = true;
    if (ui.ffQ4Section) ui.ffQ4Section.hidden = false;
    if (ui.topFfPanel) {
      ui.topFfPanel.hidden = false;
      if (ui.topFfBtn) ui.topFfBtn.setAttribute("aria-pressed", "true");
    }

    const targetIdx = state.q4CurrentIndex ?? 100;
    applyQ4Telemetry(targetIdx);
    toast("Switched to Sg. Binjai JPS Telemetry (25 Nov – 05 Dec 2024). Viewing 29 Nov 4.76m Peak Crest.");
  } else {
    if (ui.timelineModeBtn) {
      ui.timelineModeBtn.classList.remove("active-q4");
      if (ui.timelineModeIcon) ui.timelineModeIcon.textContent = "📅";
      if (ui.timelineModeLabel) ui.timelineModeLabel.textContent = "Oct–Dec 2024";
    }
    if (ui.ffDemoSection) ui.ffDemoSection.hidden = false;
    if (ui.ffQ4Section) ui.ffQ4Section.hidden = true;
    applyTimeScrub(0);
    toast("Switched to Demo Timeline (9:00 AM baseline).");
  }
}

function applyQ4Telemetry(idx) {
  if (!state.q4Data || state.q4Data.length === 0) return;
  idx = Math.max(0, Math.min(state.q4Data.length - 1, Math.round(idx)));
  state.q4CurrentIndex = idx;
  const pt = state.q4Data[idx];
  if (!pt) return;

  if (ui.topTimeVal) {
    ui.topTimeVal.textContent = pt.date_display;
  }
  if (ui.q4ReadoutVal) {
    ui.q4ReadoutVal.textContent = `${pt.date_display} (${pt.date_label})`;
  }
  if (ui.q4Slider && parseInt(ui.q4Slider.value, 10) !== idx) {
    ui.q4Slider.value = idx;
  }

  // Update Telemetry Comparison HUD for Sg. Binjai Only
  if (ui.q4ActualLevel) ui.q4ActualLevel.textContent = `${pt.actual_level_m.toFixed(2)} m`;
  if (ui.q4ActualBadge) {
    ui.q4ActualBadge.textContent = pt.actual_jps.cat;
    ui.q4ActualBadge.className = `sponge-badge ${pt.actual_jps.cls === 'danger' ? 'badge-danger' : pt.actual_jps.cls === 'warning' ? 'badge-warning' : 'badge-safe'}`;
  }
  if (ui.q4ActualRain) ui.q4ActualRain.textContent = `${pt.rain_mm_h.toFixed(1)} mm/h`;
  if (ui.q4RoadDepth) ui.q4RoadDepth.textContent = pt.road_condition;
  if (ui.q4PredLevel) ui.q4PredLevel.textContent = `${pt.pred_xgb_m.toFixed(2)} m`;
  if (ui.q4PredBadge) {
    ui.q4PredBadge.textContent = pt.pred_jps.cat;
    ui.q4PredBadge.className = `sponge-badge ${pt.pred_jps.cls === 'danger' ? 'badge-danger' : pt.pred_jps.cls === 'warning' ? 'badge-warning' : 'badge-safe'}`;
  }
  if (ui.q4RfLevel) ui.q4RfLevel.textContent = `${pt.pred_base_m.toFixed(2)} m (lags 3h)`;

  // Highlight landmark button
  document.querySelectorAll(".q4-landmark-btn").forEach(btn => {
    const btnHour = parseInt(btn.dataset.hour, 10);
    btn.classList.toggle("active", Math.abs(btnHour - idx) < 6);
  });

  // Update Sponge HUD
  if (ui.spongeStatusBadge) {
    ui.spongeStatusBadge.textContent = pt.actual_jps.cat;
    ui.spongeStatusBadge.className = `sponge-badge ${pt.actual_jps.cls === 'danger' ? 'badge-danger' : pt.actual_jps.cls === 'warning' ? 'badge-warning' : 'badge-safe'}`;
  }
  if (ui.spongeHudBar) {
    ui.spongeHudBar.style.width = `${pt.retention_pct}%`;
    ui.spongeHudBar.style.backgroundColor = pt.actual_jps.color;
  }
  if (ui.spongeStorageText) {
    ui.spongeStorageText.textContent = `${pt.retention_pct}% (Sg. Binjai: ${pt.actual_level_m.toFixed(2)}m • Forecast t+3h: ${pt.pred_xgb_m.toFixed(2)}m)`;
  }
  if (ui.spongeRainText) {
    ui.spongeRainText.textContent = `Telemetry: ${pt.rain_mm_h} mm/h rainfall`;
  }

  // Hydraulic Elevation Mapping:
  // Map river stage & rainfall to road depth simulation timestep
  let simMin = 0;
  if (pt.actual_level_m >= 4.50) {
    simMin = 45; // Flash flood crest: Jalan Makyong submerged (40cm), impassable
  } else if (pt.actual_level_m >= 4.20) {
    simMin = 25; // Warning: surface runoff
  } else if (pt.actual_level_m >= 3.50) {
    simMin = 15; // Alert: ponding at low dips
  } else {
    simMin = 0;  // Normal: dry & safe
  }

  state.t = simMin;
  state.hasRain = pt.rain_mm_h > 0 || pt.actual_level_m >= 3.50;
  state.selectedForecastMin = simMin;

  // Dynamic Area & Time Flood Inundation Schedule based on Sg. Binjai telemetry
  state.selectedForecastLeadMin = 0;
  updatePredictModalView(0);

  update(true);
  updatePredictVisuals();
}

// ---------------- Select Forecast Time (e.g. 9:00 AM, 9:30 AM, 10:00 AM, 10:30 AM, 11:00 AM)
function selectForecastTime(min) {
  state.selectedForecastMin = min;

  const chips = document.querySelectorAll("#predictTimePopup .time-chip");
  if (chips.length > 0) {
    chips.forEach(chip => {
      const chipMin = parseInt(chip.dataset.min, 10);
      chip.classList.toggle("active", chipMin === min);
    });
  }

  // Query live ML prediction backend for telemetry validation
  const telemetryByMin = {
    0:   { binjai_level: 3.65, binjai_rain: 18.0, rasau_level: 2.85, klang_level: 2.30, cum_rain_3h: 25 },
    30:  { binjai_level: 4.55, binjai_rain: 68.0, rasau_level: 4.10, klang_level: 3.40, cum_rain_3h: 95 },
    60:  { binjai_level: 4.80, binjai_rain: 78.0, rasau_level: 4.35, klang_level: 3.60, cum_rain_3h: 120 },
    90:  { binjai_level: state.forecastShifted ? 4.58 : 4.10, binjai_rain: 28.0, rasau_level: 3.65, klang_level: 3.10, cum_rain_3h: 125 },
    120: { binjai_level: state.forecastShifted ? 4.05 : 3.25, binjai_rain: 4.0,  rasau_level: 2.70, klang_level: 2.40, cum_rain_3h: 128 },
    150: { binjai_level: 2.80, binjai_rain: 0.0, rasau_level: 2.30, klang_level: 2.10, cum_rain_3h: 128 },
    180: { binjai_level: 2.45, binjai_rain: 0.0, rasau_level: 2.10, klang_level: 1.95, cum_rain_3h: 128 },
    210: { binjai_level: 2.30, binjai_rain: 0.0, rasau_level: 1.95, klang_level: 1.85, cum_rain_3h: 128 }
  };
  let telem;
  if (state.timelineMode === "q4_2024" && state.q4Data && state.q4Data[state.q4CurrentIndex]) {
    const qPt = state.q4Data[state.q4CurrentIndex];
    telem = {
      binjai_level: qPt.actual_level_m,
      binjai_rain: qPt.rain_mm_h,
      rasau_level: qPt.rasau_level_m,
      klang_level: qPt.klang_level_m,
      cum_rain_3h: qPt.rain_mm_h * 2.5
    };
  } else {
    telem = telemetryByMin[min] || getMinuteTelemetry(min, state.forecastShifted);
  }

  updatePredictVisuals();
  renderForecastBriefing(min);
  updateLiveMinuteTelemetry(min);

  fetchLiveFloodPrediction(telem).then(pred => {
    if (pred && pred.status === "success" && ui.spongeStatusBadge) {
      console.log(`🌊 [AI Backend 3h Forecast] Sg. Binjai Level: ${pred.predicted_level_m}m (${pred.risk_category}) via ${pred.model_source}`);
    }
  }).catch(() => {});
}

function renderForecastBriefing(t) {
  let statsHtml = "";
  let whereFloodedHtml = "";
  let unsafeRoutesHtml = "";

  if (t === 30) {
    // 9:30 AM (Flooded - Inundation Onset)
    ui.eta.textContent = "Forecast Condition";
    ui.dist.textContent = "9:30 AM (Flooded)";
    ui.sub.innerHTML = `<span class="badge danger" style="background:#ffebee; color:#c62828; border:1px solid #ef9a9a; font-weight:700;">🚨 JPS DANGER LEVEL — High Flood Inundation</span>`;

    statsHtml = `
      <div class="forecast-card-item">
        <div class="forecast-card-title danger">🌊 Water Level & Danger Severity</div>
        <div class="forecast-card-stat" style="color:#c62828;">4.55 m &bull; DANGER Threshold (&ge;4.50m)</div>
        <div class="forecast-card-desc">
          <strong>Road Water Depth:</strong> 35 &ndash; 45 cm (Severe hazard for all vehicles)<br>
          <strong>Sponge Retention:</strong> 88% capacity (~70,400 m³ absorbed)<br>
          <strong>Status:</strong> Rapid runoff surge from upstream Sg. Binjai catchment
        </div>
      </div>
    `;

    whereFloodedHtml = `
      <div class="forecast-card-item">
        <div class="forecast-card-title danger">📍 Where Will Be Flooded</div>
        <div class="forecast-card-desc">
          &bull; <strong>Bandar Bukit Raja Wetland Lake:</strong> Overtopping northern retention perimeter<br>
          &bull; <strong>Jalan Makyong 5A/6:</strong> Low-lying road dip submerged (~40 cm depth)<br>
          &bull; <strong>Persiaran Sungai Keramat:</strong> Intake swales reaching full capacity
        </div>
      </div>
    `;

    unsafeRoutesHtml = `
      <div class="forecast-card-item">
        <div class="forecast-card-title danger">🚫 Which Routes Are Unsafe</div>
        <div class="forecast-card-desc">
          <div style="margin-bottom:6px;"><span class="forecast-route-tag unsafe">UNSAFE</span> <strong>16 mins Wetland Route:</strong> Inundated by 40 cm floodwater at Jalan Makyong. Completely impassable.</div>
          <div style="margin-bottom:6px;"><span class="forecast-route-tag mod">CAUTION</span> <strong>18 mins Northern Route:</strong> Heavy surface runoff near monsoon drain.</div>
          <div><span class="forecast-route-tag safe">SAFE ALTERNATIVE</span> <strong>South Bypass:</strong> Persiaran Bukit Raja South & Jalan Batu Belah remain elevated, clear and passable.</div>
        </div>
      </div>
    `;
  } else if (t === 60) {
    // 10:00 AM (Peak Flood Inundation)
    ui.eta.textContent = "Forecast Condition";
    ui.dist.textContent = "10:00 AM (Peak Flood)";
    ui.sub.innerHTML = `<span class="badge danger" style="background:#ffebee; color:#c62828; border:1px solid #ef9a9a; font-weight:700;">🚨 PEAK INUNDATION — Severe Flooding Active</span>`;

    statsHtml = `
      <div class="forecast-card-item">
        <div class="forecast-card-title danger">🌊 Water Level & Danger Severity</div>
        <div class="forecast-card-stat" style="color:#c62828;">4.80 m &bull; EXTREME DANGER (Peak Crest)</div>
        <div class="forecast-card-desc">
          <strong>Road Water Depth:</strong> 50 &ndash; 65 cm (Critical danger — strictly impassable)<br>
          <strong>Sponge Retention:</strong> 84% capacity (~67,200 m³ stored)<br>
          <strong>Status:</strong> Peak crest active across Meru & Bukit Raja river corridor
        </div>
      </div>
    `;

    whereFloodedHtml = `
      <div class="forecast-card-item">
        <div class="forecast-card-title danger">📍 Where Will Be Flooded</div>
        <div class="forecast-card-desc">
          &bull; <strong>Full BBR Wetland Corridor:</strong> Completely inundated, surrounding park trails submerged<br>
          &bull; <strong>Jalan Sungai Puloh:</strong> Heavy backwater at monsoon culvert discharge points<br>
          &bull; <strong>Taman Kyra & Meru Intersections:</strong> Surface pooling up to 60 cm
        </div>
      </div>
    `;

    unsafeRoutesHtml = `
      <div class="forecast-card-item">
        <div class="forecast-card-title danger">🚫 Which Routes Are Unsafe</div>
        <div class="forecast-card-desc">
          <div style="margin-bottom:6px;"><span class="forecast-route-tag unsafe">UNSAFE</span> <strong>16 mins Wetland Route:</strong> Deep floodwater > 50 cm. All vehicle access blocked.</div>
          <div style="margin-bottom:6px;"><span class="forecast-route-tag unsafe">UNSAFE</span> <strong>18 mins Northern Route:</strong> Water overtopping secondary connector roads.</div>
          <div><span class="forecast-route-tag safe">ONLY SAFE CORRIDOR</span> <strong>High-Elevation Arterial:</strong> Elevated Jalan Batu Belah / southern highway link to Masjid BBR (PPS).</div>
        </div>
      </div>
    `;
  } else if (t >= 75 && t < 105) {
    // 10:30 AM slot
    if (state.forecastShifted) {
      // Shifted to Flooded from Moderate
      ui.eta.textContent = "Forecast Condition";
      ui.dist.textContent = "10:30 AM (Flooded)";
      ui.sub.innerHTML = `<span class="badge danger" style="background:#ffebee; color:#c62828; border:1px solid #ef9a9a; font-weight:700;">🚨 JPS DANGER LEVEL — High Flood Extended</span>`;

      statsHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title danger">🌊 Water Level & Severity</div>
          <div class="forecast-card-stat" style="color:#c62828;">4.58 m &bull; DANGER Threshold (&ge;4.50m)</div>
          <div class="forecast-card-desc">
            <strong>Road Water Depth:</strong> 32 &ndash; 42 cm (Submerged — dangerous for vehicles)<br>
            <strong>Sponge Retention:</strong> 86% capacity (~68,800 m³ sustained)<br>
            <strong>Status:</strong> Storm runoff sustained from Meru; high water delayed
          </div>
        </div>
      `;

      whereFloodedHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title danger">📍 Where Will Be Flooded</div>
          <div class="forecast-card-desc">
            &bull; <strong>Bandar Bukit Raja Wetland:</strong> Still overflowed, lake trails submerged<br>
            &bull; <strong>Jalan Makyong 5A/6:</strong> Standing floodwater 35 cm deep<br>
            &bull; <strong>Persiaran Sungai Keramat:</strong> Slow drainage due to swollen Meru outlet
          </div>
        </div>
      `;

      unsafeRoutesHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title danger">🚫 Which Routes Are Unsafe</div>
          <div class="forecast-card-desc">
            <div style="margin-bottom:6px;"><span class="forecast-route-tag unsafe">UNSAFE</span> <strong>16 mins Wetland Route:</strong> Deep floodwater > 30 cm. Impassable for cars.</div>
            <div style="margin-bottom:6px;"><span class="forecast-route-tag mod">CAUTION</span> <strong>18 mins Northern Route:</strong> Heavy residual runoff.</div>
            <div><span class="forecast-route-tag safe">SAFE ALTERNATIVE</span> <strong>South Bypass:</strong> Elevated Persiaran Bukit Raja South remains open.</div>
          </div>
        </div>
      `;
    } else {
      // Normal baseline: Moderate risk receding
      ui.eta.textContent = "Forecast Condition";
      ui.dist.textContent = "10:30 AM (Moderate)";
      ui.sub.innerHTML = `<span class="badge mod" style="background:#fff3e0; color:#e65100; border:1px solid #ffcc80; font-weight:700;">⚠️ MODERATE RISK — Water Level Receding</span>`;

      statsHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title warning">🌊 Water Level & Severity</div>
          <div class="forecast-card-stat" style="color:#e65100;">4.10 m &bull; ALERT / MODERATE (3.50m &ndash; 4.19m)</div>
          <div class="forecast-card-desc">
            <strong>Road Water Depth:</strong> 10 &ndash; 18 cm (Receding rapidly into stormwater culverts)<br>
            <strong>Sponge Retention:</strong> 68% capacity (~54,400 m³ controlled discharge)<br>
            <strong>Status:</strong> River crest passed; RCBC box culverts discharging into retention ponds
          </div>
        </div>
      `;

      whereFloodedHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title warning">📍 Where Will Be Flooded</div>
          <div class="forecast-card-desc">
            &bull; <strong>BBR Wetland Lake:</strong> Returning within designated lake containment banks<br>
            &bull; <strong>Jalan Makyong:</strong> Residual ponding ~12 cm on road shoulders<br>
            &bull; <strong>Persiaran Sungai Keramat:</strong> Clear of deep standing water
          </div>
        </div>
      `;

      unsafeRoutesHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title warning">🚫 Which Routes Are Unsafe</div>
          <div class="forecast-card-desc">
            <div style="margin-bottom:6px;"><span class="forecast-route-tag mod">MODERATE RISK</span> <strong>16 mins Route:</strong> Water receding (10–15 cm). Passable with caution for emergency vehicles.</div>
            <div style="margin-bottom:6px;"><span class="forecast-route-tag safe">SAFE</span> <strong>15 mins Safe Route:</strong> Fully drained, open and safe.</div>
            <div><span class="forecast-route-tag safe">SAFE</span> <strong>18 mins South Bypass:</strong> Completely clear and dry.</div>
          </div>
        </div>
      `;
    }
  } else {
    // 11:00 AM slot onwards (t >= 105)
    const isModerateShifted = (t < 135 && state.forecastShifted);
    const clockStr = formatClockTime(t);

    if (isModerateShifted) {
      // Shifted to Moderate from Safe
      ui.eta.textContent = "Forecast Condition";
      ui.dist.textContent = `${clockStr} (Moderate)`;
      ui.sub.innerHTML = `<span class="badge mod" style="background:#fff3e0; color:#e65100; border:1px solid #ffcc80; font-weight:700;">⚠️ MODERATE RISK — Delayed Runoff Receding</span>`;

      statsHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title warning">🌊 Water Level & Severity</div>
          <div class="forecast-card-stat" style="color:#e65100;">4.05 m &bull; ALERT / MODERATE (3.50m &ndash; 4.19m)</div>
          <div class="forecast-card-desc">
            <strong>Road Water Depth:</strong> 12 &ndash; 18 cm (Receding slowly, use caution)<br>
            <strong>Sponge Retention:</strong> 64% capacity (~51,200 m³ discharging)<br>
            <strong>Status:</strong> Extended storm drainage; water returning to culvert systems
          </div>
        </div>
      `;

      whereFloodedHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title warning">📍 Where Will Be Flooded</div>
          <div class="forecast-card-desc">
            &bull; <strong>Jalan Makyong:</strong> Residual shallow ponding on road edge<br>
            &bull; <strong>BBR Wetland:</strong> High retention volume, active absorption
          </div>
        </div>
      `;

      unsafeRoutesHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title warning">🚫 Which Routes Are Unsafe</div>
          <div class="forecast-card-desc">
            <div style="margin-bottom:6px;"><span class="forecast-route-tag mod">MODERATE CAUTION</span> <strong>16 mins Route:</strong> Surface puddles remaining. Drive cautiously.</div>
            <div><span class="forecast-route-tag safe">SAFE</span> <strong>15 mins & 18 mins Corridors:</strong> Elevated roads clear and dry.</div>
          </div>
        </div>
      `;
    } else {
      // Normal baseline / 11:30 AM onwards: Safe, cleared
      ui.eta.textContent = "Forecast Condition";
      ui.dist.textContent = `${clockStr} (Safe)`;
      ui.sub.innerHTML = `<span class="badge ok" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; font-weight:700;">✅ SAFE — Flood Receded, Roads Clear</span>`;

      statsHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title safe">🌊 Water Level & Severity</div>
          <div class="forecast-card-stat" style="color:#2e7d32;">3.25 m &bull; NORMAL / SAFE (&lt;3.50m)</div>
          <div class="forecast-card-desc">
            <strong>Road Water Depth:</strong> 0 cm (All road segments dry and fully accessible)<br>
            <strong>Sponge Retention:</strong> 22% capacity (~17,600 m³ safe buffer)<br>
            <strong>Status:</strong> Stormwater successfully contained by BBR Sponge Township infrastructure
          </div>
        </div>
      `;

      whereFloodedHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title safe">📍 Where Will Be Flooded</div>
          <div class="forecast-card-desc">
            &bull; <strong>Zero Flooding:</strong> All residential streets and arterial roads clear<br>
            &bull; <strong>Bandar Bukit Raja Wetland:</strong> Normal operational water level
          </div>
        </div>
      `;

      unsafeRoutesHtml = `
        <div class="forecast-card-item">
          <div class="forecast-card-title safe">🚫 Which Routes Are Unsafe</div>
          <div class="forecast-card-desc">
            <div><span class="forecast-route-tag safe">ALL ROUTES SAFE</span> All 3 corridors (15 mins, 16 mins, 18 mins) are 100% open, clear, and safe to navigate.</div>
          </div>
        </div>
      `;
    }
  }

  ui.steps.innerHTML = `
    <div class="forecast-briefing">
      ${statsHtml}
      ${whereFloodedHtml}
      ${unsafeRoutesHtml}
    </div>
  `;
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
  const isEmergFrom = isEmergencyPlace(state.from);
  const isEmergTo = isEmergencyPlace(state.to);
  const maxFromDist = isEmergFrom ? 25000 : OFF_NETWORK_M;
  const maxToDist = isEmergTo ? 25000 : OFF_NETWORK_M;
  if (!sa || !sb || sa.distM > maxFromDist || sb.distM > maxToDist) {
    return showNoRoute("Outside the mapped area", "This map covers one neighbourhood. Pick a place inside it.", null, fromTick);
  }
  if (haversine(sa.point, sb.point) < 15 && !isEmergFrom && !isEmergTo) return showNoRoute("You’re there", "Pick a different destination.", null, fromTick);

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

      // Generate 2 or 3 suggested alternative routes that avoid high risk at t=0 or initialize
      if (t === 0 || !state.altRoutes || state.altRoutes.length === 0) {
        state.altRoutes = generateAlternativeRoutes(g, path, risk, T, mode);
      }
    } else {
      state.altRoutes = [];
    }
  } finally { undoB(); undoA(); }

  // Short dashed links from each pin to the road it was snapped to
  map.getSource("fs-connector").setData({ type: "FeatureCollection", features: [
    { type: "Feature", geometry: { type: "LineString", coordinates: [state.from.coord, sa.point] }, properties: {} },
    { type: "Feature", geometry: { type: "LineString", coordinates: [sb.point, state.to.coord] }, properties: {} }
  ] });

  // Warn if a pin is far from any mapped road (except expected emergency regional connectors)
  const far = Math.max(isEmergFrom ? 0 : sa.distM, isEmergTo ? 0 : sb.distM);
  if (far > 60) {
    ui.note.textContent = `A pin is ${Math.round(far)} m from the nearest mapped ${mode === "drive" ? "car road" : "road or path"}. The dashed line shows where the route joins the road.`;
  } else if (isEmergTo || isEmergFrom) {
    const target = isEmergTo ? state.to.name : state.from.name;
    ui.note.textContent = `Direct arterial connection to ${target}.`;
  }

  if (!path) {
    return showNoRoute("No safe route right now", `Every ${mode === "drive" ? "drivable" : "walkable"} way to ${state.to.name} crosses high-risk roads.`,
      mode === "drive"
        ? "Don’t drive through floodwater. Wait somewhere high and safe, try Walk mode for a short trip, or choose a relief centre. Call 999 in an emergency."
        : "Wait somewhere safe and high, or choose a relief centre as your destination. Call 999 in an emergency.",
      fromTick, "Your route is now cut off by flooding.");
  }

  // Route card & distance calculation (incorporating arterial connector for emergency facilities)
  const connectorDistM = (isEmergTo && sb.distM > 60 ? sb.distM : 0) + (isEmergFrom && sa.distM > 60 ? sa.distM : 0);
  const totalLengthM = path.lengthM + connectorDistM;
  const mins = Math.max(1, Math.round(totalLengthM / 1000 / T.speedKmh * 60));
  const modLen = path.parts.reduce((s2, p2) => s2 + ((risk.get(p2.base) || 0) >= moderate ? p2.length : 0), 0);
  ui.eta.textContent = `${mins} min`;
  ui.dist.textContent = `${fmtLen(totalLengthM)} ${mode === "drive" ? "driving" : "walking"}`;
  ui.sub.innerHTML = "";
  const badge = document.createElement("span");
  if (modLen === 0) {
    badge.className = "badge ok";
    badge.textContent = state.hasRain ? "Avoids all flood-risk roads" : "No rain yet. Fastest route shown";
  } else {
    badge.className = "badge mod";
    badge.textContent = `${fmtLen(modLen)} on moderate-risk roads. No high-risk roads`;
  }
  if (isEmergTo || isEmergFrom) {
    const emName = isEmergTo ? (state.to.shortName || state.to.name) : (state.from.shortName || state.from.name);
    badge.textContent += ` • Connected to ${emName}`;
  }
  ui.sub.appendChild(badge);

  // Directions
  ui.steps.innerHTML = "";
  if (isEmergFrom && sa.distM > 60) {
    const li0 = document.createElement("li"), dot0 = document.createElement("span"), txt0 = document.createElement("span"), len0 = document.createElement("small");
    dot0.className = "rk"; dot0.style.background = css("--route");
    txt0.textContent = `Depart ${state.from.name} to township entrance`;
    len0.textContent = fmtLen(sa.distM);
    li0.append(dot0, txt0, len0);
    ui.steps.appendChild(li0);
  }
  stepList.forEach((st, i) => {
    const li = document.createElement("li"), dot = document.createElement("span"), txt = document.createElement("span"), len = document.createElement("small");
    const lv = level(st.risk, T);
    dot.className = "rk"; dot.style.background = lv === "moderate" ? css("--moderate") : css("--route");
    txt.textContent = (i === 0 && (!isEmergFrom || sa.distM <= 60) ? "Start on " : st.bridge ? "Cross " : "Continue on ") + st.name + (lv === "moderate" ? " (moderate risk)" : "");
    len.textContent = fmtLen(st.lengthM);
    li.append(dot, txt, len);
    ui.steps.appendChild(li);
  });
  if (isEmergTo && sb.distM > 60) {
    const liEnd = document.createElement("li"), dotEnd = document.createElement("span"), txtEnd = document.createElement("span"), lenEnd = document.createElement("small");
    dotEnd.className = "rk"; dotEnd.style.background = css("--dest");
    txtEnd.textContent = `Follow main arterial connector to ${state.to.name}`;
    lenEnd.textContent = fmtLen(sb.distM);
    liEnd.append(dotEnd, txtEnd, lenEnd);
    ui.steps.appendChild(liEnd);
  }
  const end = document.createElement("li"), endDot = document.createElement("span"), endTxt = document.createElement("span");
  endDot.className = "rk"; endDot.style.background = css("--dest"); endTxt.textContent = `Arrive at ${state.to.name}`;
  end.append(endDot, endTxt, document.createElement("small"));
  ui.steps.appendChild(end);

  // Live reroute message (only on present 9:00 AM navigation; never on forecasted times)
  const key = baseIds.join(",");
  if (t === 0 && fromTick && state.lastRouteKey && state.lastRouteKey !== key) {
    const cut = state.lastEdges.find(id => (risk.get(id) || 0) >= moderate && !baseIds.includes(id));
    const cutName = cut && (state.lastNames.get(cut) || "A road on your route");
    toast(cut ? `Route updated: ${cutName} is ${(risk.get(cut) || 0) >= high ? "flooding" : "at risk"}. New route ${mins} min.`
              : "Route updated to avoid rising water.");
  }
  state.lastRouteKey = key; state.lastEdges = baseIds; state.lastNames = names;

  state.primaryRouteLine = line;
  const pCoords = line.geometry.coordinates;
  state.primaryAnchorCoord = pCoords[Math.floor(pCoords.length * 0.45)] || pCoords[0];
  state.primaryRouteData = {
    line,
    mins: 15,
    totalLengthM,
    stepList,
    baseIds,
    names,
    T
  };

  // Always render the primary safe route (line) so it is visible and dynamically updating
  map.getSource("fs-route").setData(line);
  map.getSource("fs-connector").setData(emptyFC);

  let currentSafeMins = 15;
  let currentSafeSub = "";
  if (t < 15) {
    currentSafeMins = 15;
    currentSafeSub = '<span class="badge ok" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7;">15 mins safe route active • 2 moderate alternatives (shaded)</span>';
  } else if (t < 25) {
    currentSafeMins = 17;
    currentSafeSub = '<span class="badge ok" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7;">17 mins safe detour active • Bypassing rising surface water</span>';
  } else if (t < 75) {
    currentSafeMins = t >= 45 ? 24 : 21;
    currentSafeSub = '<span class="badge danger" style="background:#ffebee; color:#c62828; border:1px solid #ef9a9a; font-weight:700;">🚨 SAFE ELEVATED BYPASS • 16 mins Wetland route completely inundated (40–58cm)</span>';
  } else if (t < 105) {
    currentSafeMins = state.forecastShifted ? 22 : 18;
    currentSafeSub = state.forecastShifted
      ? '<span class="badge danger" style="background:#ffebee; color:#c62828; border:1px solid #ef9a9a;">🚨 Extended flood crest active • Elevated bypass in effect</span>'
      : '<span class="badge mod" style="background:#fff3e0; color:#e65100; border:1px solid #ffcc80;">⚠️ Water receding into RCBC box culverts • Routes reopening</span>';
  } else {
    currentSafeMins = 15;
    currentSafeSub = '<span class="badge ok" style="background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7;">✅ All routes clear & fully safe • Floodwaters discharged</span>';
  }

  ui.eta.textContent = `${currentSafeMins} min`;
  ui.dist.textContent = `${fmtLen(totalLengthM)} ${mode === "drive" ? "driving" : "walking"}`;
  ui.sub.innerHTML = currentSafeSub;

  if (t > 0 && state.predictActive && (!ui.topFfPanel || ui.topFfPanel.hidden)) {
    renderForecastBriefing(t);
  }

  updateMeta();

  // Update Prediction & Alternative Routes visual layers if active
  updatePredictVisuals();
}

function showNoRoute(title, sub, warn, fromTick, tickToast) {
  map.getSource("fs-route").setData(emptyFC);
  if (title === "Outside the mapped area" || title === "You’re there") map.getSource("fs-connector").setData(emptyFC);
  ui.eta.textContent = title; ui.dist.textContent = ""; ui.sub.textContent = sub; ui.steps.innerHTML = "";
  if (warn) { ui.warn.textContent = warn; ui.warn.hidden = false; }
  if (state.t === 0 && fromTick && state.lastRouteKey && tickToast) toast(tickToast);
  state.lastRouteKey = null; state.lastEdges = [];
  state.altRoutes = [];
  updateMeta();
  updatePredictVisuals();
}

function updateMeta() {
  // Clear the generic scenario / synthetic timestamp text completely as requested
  ui.meta.textContent = "";

  // Update Top Middle Current Time Display
  if (ui.topTimeVal) {
    if (state.timelineMode === "q4_2024" && state.q4Data && state.q4Data[state.q4CurrentIndex]) {
      ui.topTimeVal.textContent = state.q4Data[state.q4CurrentIndex].date_display;
    } else {
      ui.topTimeVal.textContent = formatClockTime(state.t);
    }
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

// Predict Button & FloodShield Evacuation Prioritisation (Bottom Middle)
if (ui.predictBtn) {
  ui.predictBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.predictActive = !state.predictActive;
    ui.predictBtn.setAttribute("aria-pressed", String(state.predictActive));
    if (ui.predictTimePopup) {
      ui.predictTimePopup.hidden = !state.predictActive;
      ui.predictTimePopup.style.display = state.predictActive ? "flex" : "none";
    }
    if (state.predictActive) {
      // Mutually close risk section panel if open
      const riskPanel = document.getElementById("riskSectionPanel");
      const riskBtn = document.getElementById("riskAlertBtn");
      if (riskPanel) {
        riskPanel.hidden = true;
        riskPanel.style.display = "none";
      }
      if (riskBtn) riskBtn.setAttribute("aria-expanded", "false");

      updatePredictModalView();
      toast("🔮 Forecast: Select a time window to preview area flood conditions");
    }
  });
}

// Initialise FloodShield predictions
updatePredictModalView();

// Manual Fast Forward Slide Through Controls (Next to Current Time)
if (ui.topFfBtn && ui.topFfPanel) {
  ui.topFfBtn.addEventListener("click", () => {
    const isHidden = ui.topFfPanel.hidden;
    ui.topFfPanel.hidden = !isHidden;
    ui.topFfBtn.setAttribute("aria-pressed", String(isHidden));
    if (isHidden && ui.q4Slider) {
      ui.q4Slider.focus();
    }
  });
}

if (ui.ffSlider) {
  ui.ffSlider.addEventListener("input", e => {
    const min = parseInt(e.target.value, 10);
    applyTimeScrub(min);
  });
}

// Q4 2024 JPS Telemetry Scrubber & Mode Toggle
if (ui.timelineModeBtn) {
  ui.timelineModeBtn.addEventListener("click", () => {
    toggleTimelineMode();
  });
}

if (ui.q4Slider) {
  ui.q4Slider.addEventListener("input", e => {
    const idx = parseInt(e.target.value, 10);
    applyQ4Telemetry(idx);
  });
}

document.querySelectorAll(".q4-landmark-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const hr = parseInt(btn.dataset.hour, 10);
    applyQ4Telemetry(hr);
  });
});

// Pre-load Q4 2024 telemetry dataset
loadQ4TelemetryData();

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

// Emergency Facilities Filter Chips
document.querySelectorAll(".emerg-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    filterEmergencyFacilities(chip.dataset.cat);
  });
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
  $("riskNote").innerHTML = riskNote();
  state.lastRouteKey = null; update(false);
}));
function riskNote() {
  const w = CONFIG.modes.walk, d = CONFIG.modes.drive, c = x => Math.round(x * 100);
  return `<strong>Risk levels.</strong> Walking: moderate from ${c(w.moderate)} cm, high from ${c(w.high)} cm. Driving: moderate from ${c(d.moderate)} cm, high from ${c(d.high)} cm. Roads that will reach these depths within ${CONFIG.horizonMin} minutes are marked now. Your route avoids high-risk roads completely and avoids moderate-risk roads where it can. These thresholds are assumptions based on common flood-safety guidance.`;
}
$("riskNote").innerHTML = riskNote();
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
