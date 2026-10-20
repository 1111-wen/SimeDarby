with open("web/js/app.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add import
old_import = 'import { DemoStorm, startLiveRain } from "./rain.js";'
new_import = """import { DemoStorm, startLiveRain } from "./rain.js";
import { initSponge, updateSponge, setSpongeVisible, getTownshipSpongeSummary } from "./sponge.js";"""
code = code.replace(old_import, new_import)

# 2. Add sponge ui elements
old_ui = """  fromIn: $("fromIn"), toIn: $("toIn"), note: $("note"), dataNote: $("dataNote")
};"""
new_ui = """  fromIn: $("fromIn"), toIn: $("toIn"), note: $("note"), dataNote: $("dataNote"),
  spongeHud: $("spongeHud"), spongeStatusBadge: $("spongeStatusBadge"),
  spongeHudBar: $("spongeHudBar"), spongeStorageText: $("spongeStorageText"), spongeRainText: $("spongeRainText")
};"""
code = code.replace(old_ui, new_ui)

# 3. Enhance 3D buildings and add initSponge in addLayers()
old_add_layers = """function addLayers() {
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
  }"""

new_add_layers = """async function addLayers() {
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
  await initSponge(map, CONFIG.dataBase);"""

code = code.replace(old_add_layers, new_add_layers)

# 4. Add set3DMode function and update cam3d / camTop event listeners
old_cam = """const cam3d = $("cam3d"), camTop = $("camTop");
cam3d.addEventListener("click", () => { cam3d.setAttribute("aria-pressed", "true"); camTop.setAttribute("aria-pressed", "false"); map.easeTo({ pitch: CONFIG.pitch, bearing: CONFIG.bearing }); });
camTop.addEventListener("click", () => { camTop.setAttribute("aria-pressed", "true"); cam3d.setAttribute("aria-pressed", "false"); map.easeTo({ pitch: 0, bearing: 0 }); });"""

new_cam = """function set3DMode(enabled) {
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
  setSpongeVisible(enabled);
  if (ui.spongeHud) ui.spongeHud.style.opacity = enabled ? "1" : "0.7";
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
});"""

code = code.replace(old_cam, new_cam)

# 5. In update(fromTick): update live sponge metrics and HUD
old_update_head = """function update(fromTick) {
  if (!state.graph || !state.from || !state.to) return;
  const sc = state.scenario, t = state.t, mode = state.mode, T = th(), { moderate, high } = T;
  const modeOk = e => mode === "walk" ? e.walk : e.drive;"""

new_update_head = """function update(fromTick) {
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
  }"""

code = code.replace(old_update_head, new_update_head)

with open("web/js/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated web/js/app.js successfully.")
