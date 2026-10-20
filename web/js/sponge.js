// Sponge Infrastructure & Drainage System (MSMA / JPS Hydrologic Simulation)
// Features: Real lakes, real organic gardens, real 3D trees, and high-visibility drainage culverts & sumps.

let spongeData = null;
let mapInstance = null;
let currentPopup = null;
let spongeVisible = true;

// MSMA Hydrologic Thresholds:
export const MSMA_THRESHOLDS = {
  alert: 65,
  warning: 75,
  danger: 85
};

export function getMsmaStatus(pct) {
  if (pct >= MSMA_THRESHOLDS.danger) return { key: "danger", label: "Danger / Bahaya (Overflowing)", color: "#ff1744", badge: "badge-danger" };
  if (pct >= MSMA_THRESHOLDS.warning) return { key: "warning", label: "Warning / Amar (Near Capacity)", color: "#ff9100", badge: "badge-warning" };
  if (pct >= MSMA_THRESHOLDS.alert) return { key: "alert", label: "Alert / Waspada (Storage Active)", color: "#76ff03", badge: "badge-alert" };
  return { key: "normal", label: "Normal / Safe (Absorbing)", color: "#00e5ff", badge: "badge-safe" };
}

// Compute live water metrics for any sponge feature at minute t during storm
export function computeFeatureMetrics(f, t, rainMmHr = 60) {
  const p = f.properties;
  const rainFactor = Math.max(0.2, rainMmHr / 60.0);
  
  let curve = 0;
  if (t <= 5) curve = 0.05;
  else if (t <= 80) curve = 0.05 + 0.85 * Math.sin((t - 5) / 75.0 * (Math.PI / 2.0));
  else if (t <= 110) curve = 0.90 + 0.10 * Math.sin((t - 80) / 30.0 * (Math.PI / 2.0));
  else curve = Math.max(0.15, 1.0 - 0.80 * ((t - 110) / 70.0));

  curve = Math.min(1.05, curve * rainFactor);

  if (p.type === "real_tree") {
    // Trees intercept rainfall on canopy & transpire
    const interceptPct = Math.round(Math.min(100, curve * 85));
    return {
      fillPct: interceptPct,
      depthM: 0,
      storedM3: Math.round((p.height_m * p.canopy_radius_m * 0.15) * (interceptPct / 100)),
      maxM3: Math.round(p.height_m * p.canopy_radius_m * 0.15),
      status: getMsmaStatus(interceptPct),
      extrusionHeight: p.height_m,
      baseHeight: p.trunk_height_m || 3.0
    };
  } else if (p.category === "green") {
    // Gardens & parks: soil saturation
    const satPct = Math.round(Math.min(100, curve * 92));
    const waterDepth = (satPct > 70 ? (satPct - 70) * 0.008 : 0).toFixed(2);
    const absorbedM3 = Math.round((p.absorption_capacity_m3 || 4000) * (satPct / 100));
    return {
      fillPct: satPct,
      depthM: parseFloat(waterDepth),
      storedM3: absorbedM3,
      maxM3: p.absorption_capacity_m3 || 4000,
      status: getMsmaStatus(satPct),
      extrusionHeight: 0.6 + parseFloat(waterDepth) * 2.0,
      baseHeight: 0
    };
  } else if (p.category === "blue") {
    // Real lakes, retention basins & rivers
    const basePct = 18;
    const activePct = Math.round(basePct + (100 - basePct) * curve);
    const cappedPct = Math.min(100, activePct);
    const maxDepth = p.max_depth_m || 3.0;
    const liveDepth = (0.6 + (maxDepth - 0.6) * (cappedPct / 100)).toFixed(2);
    const storedM3 = Math.round((p.capacity_m3 || 40000) * (cappedPct / 100));
    return {
      fillPct: cappedPct,
      depthM: parseFloat(liveDepth),
      storedM3: storedM3,
      maxM3: p.capacity_m3 || 40000,
      status: getMsmaStatus(cappedPct),
      extrusionHeight: Math.max(1.0, parseFloat(liveDepth) * 1.8),
      baseHeight: 0
    };
  } else {
    // Gray infrastructure: culverts, permeable pavements, cisterns, sumps
    const isMakyong6Drain = p.id === "drain_makyong6_udrain" || p.id === "node_makyong6_west_sump" || p.id === "node_makyong6_east_sump" || p.is_overflow_prone;
    const isMakyong4Relief = p.id === "drain_makyong4_relief" || p.id === "node_makyong4_west_sump" || p.id === "node_makyong4_east_sump";
    
    let fillPct = 15;
    if (isMakyong6Drain) {
      // Local residential subcatchment concentrates runoff rapidly on Makyong 6
      if (t <= 5) fillPct = 15;
      else if (t <= 15) fillPct = Math.round(15 + 25 * ((t - 5) / 10.0));
      else if (t <= 25) fillPct = Math.round(40 + 28 * ((t - 15) / 10.0)); // 68% Alert
      else if (t <= 35) fillPct = Math.round(68 + 14 * ((t - 25) / 10.0)); // 82% Warning
      else if (t <= 55) fillPct = Math.min(98, Math.round(82 + 14 * ((t - 35) / 20.0))); // 96% Overflowing!
      else if (t <= 95) fillPct = Math.round(96 - 15 * ((t - 55) / 40.0));
      else fillPct = Math.max(20, Math.round(81 - 55 * ((t - 95) / 85.0)));
      fillPct = Math.min(100, Math.round(fillPct * rainFactor));
    } else if (isMakyong4Relief) {
      // High-capacity relief bypass drain has abundant hydraulic capacity; remains safe
      fillPct = Math.min(65, Math.round((12 + 48 * curve) * rainFactor));
    } else {
      // Standard RCBC trunk culverts & cisterns
      fillPct = Math.min(78, Math.round((15 + 58 * curve) * rainFactor));
    }

    const maxVol = p.storage_capacity_m3 || 3500;
    const storedM3 = Math.round(maxVol * (fillPct / 100));
    const depthM = ((p.depth_m || 2.0) * (fillPct / 100)).toFixed(2);
    const designQ = p.design_capacity_m3s || 12.0;
    const liveQ = (designQ * (fillPct / 100)).toFixed(1);

    return {
      fillPct: fillPct,
      depthM: parseFloat(depthM),
      storedM3: storedM3,
      maxM3: maxVol,
      flowM3s: parseFloat(liveQ),
      designQ: designQ,
      status: getMsmaStatus(fillPct),
      extrusionHeight: 1.2 + parseFloat(depthM),
      baseHeight: 0
    };
  }
}

// Overall township sponge summary
export function getTownshipSpongeSummary(t, rainMmHr = 60) {
  if (!spongeData) return null;
  let totalStored = 0;
  let totalCapacity = 0;

  for (const f of spongeData.features) {
    if (f.properties.type === "real_tree") continue;
    const m = computeFeatureMetrics(f, t, rainMmHr);
    totalStored += m.storedM3;
    totalCapacity += m.maxM3;
  }

  const overallPct = Math.round((totalStored / Math.max(1, totalCapacity)) * 100);
  return {
    overallPct,
    totalStoredM3: totalStored,
    totalCapacityM3: totalCapacity,
    status: getMsmaStatus(overallPct)
  };
}

export async function initSponge(map, base = "./data/bbr") {
  mapInstance = map;
  try {
    const res = await fetch(`${base}/sponge.geojson`);
    spongeData = await res.json();
  } catch (err) {
    console.error("Failed to load sponge.geojson:", err);
    return;
  }

  // Filter features into specific categories
  const lakeFeatures = spongeData.features.filter(f => f.properties.type === "real_lake");
  const gardenFeatures = spongeData.features.filter(f => f.properties.type === "real_garden");
  const treeFeatures = spongeData.features.filter(f => f.properties.type === "real_tree");
  const grayPolyFeatures = spongeData.features.filter(f => f.properties.category === "gray" && f.geometry.type.includes("Polygon"));
  const riverFeatures = spongeData.features.filter(f => f.properties.type === "widened_river");
  const drainLineFeatures = spongeData.features.filter(f => f.properties.type === "drainage_culvert");
  const drainNodeFeatures = spongeData.features.filter(f => f.properties.type === "drain_inlet" || f.properties.type === "drain_outfall");

  // Representative point markers for key landmarks (lakes and gardens)
  const landmarkPoints = spongeData.features
    .filter(f => f.properties.type === "real_lake" || f.properties.type === "real_garden")
    .map(f => {
      const ring = f.geometry.coordinates[0];
      let sx = 0, sy = 0;
      for (const p of ring) { sx += p[0]; sy += p[1]; }
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [sx / ring.length, sy / ring.length] },
        properties: { ...f.properties }
      };
    });

  // Add GeoJSON sources
  map.addSource("fs-sponge-lakes", { type: "geojson", data: { type: "FeatureCollection", features: lakeFeatures } });
  map.addSource("fs-sponge-gardens", { type: "geojson", data: { type: "FeatureCollection", features: gardenFeatures } });
  map.addSource("fs-sponge-trees", { type: "geojson", data: { type: "FeatureCollection", features: treeFeatures } });
  map.addSource("fs-sponge-gray", { type: "geojson", data: { type: "FeatureCollection", features: grayPolyFeatures } });
  map.addSource("fs-sponge-river", { type: "geojson", data: { type: "FeatureCollection", features: riverFeatures } });
  map.addSource("fs-sponge-drain-lines", { type: "geojson", data: { type: "FeatureCollection", features: drainLineFeatures } });
  map.addSource("fs-sponge-drain-nodes", { type: "geojson", data: { type: "FeatureCollection", features: drainNodeFeatures } });
  map.addSource("fs-sponge-landmarks", { type: "geojson", data: { type: "FeatureCollection", features: landmarkPoints } });

  // 1. REAL GARDENS: Organic landscaped garden beds with botanical edging
  map.addLayer({
    id: "fs-sponge-gardens-bed",
    type: "fill-extrusion",
    source: "fs-sponge-gardens",
    paint: {
      "fill-extrusion-color": "#2e7d32",
      "fill-extrusion-height": 0.6,
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.88
    }
  });

  // 2. REAL LAKES: Organic water bodies with 3D water surface that rises dynamically
  map.addLayer({
    id: "fs-sponge-lakes-water",
    type: "fill-extrusion",
    source: "fs-sponge-lakes",
    paint: {
      "fill-extrusion-color": [
        "interpolate", ["linear"], ["coalesce", ["get", "live_fill_pct"], 20],
        20, "#0288d1",
        70, "#0097a7",
        85, "#f57c00",
        95, "#c62828"
      ],
      "fill-extrusion-height": ["coalesce", ["get", "live_extrusion_height"], 1.5],
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.85
    }
  });

  // 3. REAL 3D TREES:
  map.addLayer({
    id: "fs-sponge-trees-canopy",
    type: "fill-extrusion",
    source: "fs-sponge-trees",
    minzoom: 13,
    paint: {
      "fill-extrusion-color": ["coalesce", ["get", "canopy_color"], "#2d6a4f"],
      "fill-extrusion-height": ["coalesce", ["get", "height_m"], 11],
      "fill-extrusion-base": ["coalesce", ["get", "trunk_height_m"], 3.5],
      "fill-extrusion-opacity": 0.94
    }
  });

  map.addLayer({
    id: "fs-sponge-trees-trunk",
    type: "fill-extrusion",
    source: "fs-sponge-trees",
    minzoom: 14.5,
    paint: {
      "fill-extrusion-color": ["coalesce", ["get", "trunk_color"], "#4a3525"],
      "fill-extrusion-height": ["coalesce", ["get", "trunk_height_m"], 3.5],
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.95
    }
  });

  // 4. GRAY INFRASTRUCTURE: Porous parking & underground cisterns
  map.addLayer({
    id: "fs-sponge-gray-poly",
    type: "fill-extrusion",
    source: "fs-sponge-gray",
    paint: {
      "fill-extrusion-color": ["coalesce", ["get", "color"], "#546e7a"],
      "fill-extrusion-height": 1.2,
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.85
    }
  });
}

// Add Drainage Layers ABOVE roads and risk fills so they are crystal clear
export function addDrainageLayers(map) {
  // 1. Natural River Corridor (Sungai Puloh)
  map.addLayer({
    id: "fs-sponge-river-case",
    type: "line",
    source: "fs-sponge-river",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#01579b", "line-width": 11, "line-opacity": 0.8 }
  });
  map.addLayer({
    id: "fs-sponge-river-water",
    type: "line",
    source: "fs-sponge-river",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#29b6f6", "line-width": 6.5, "line-opacity": 0.95 }
  });

  // 2. Primary Drainage Culverts & U-Drains (Casing & Inner Water Flow)
  map.addLayer({
    id: "fs-sponge-drain-case",
    type: "line",
    source: "fs-sponge-drain-lines",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#001a33",
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 7.5, 16, 11],
      "line-opacity": 0.95
    }
  });

  map.addLayer({
    id: "fs-sponge-drain-water",
    type: "line",
    source: "fs-sponge-drain-lines",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "live_status_color"], "#00e5ff"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 4.5, 16, 7.5],
      "line-opacity": 1.0
    }
  });

  map.addLayer({
    id: "fs-sponge-drain-flow",
    type: "line",
    source: "fs-sponge-drain-lines",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#ffffff",
      "line-width": 2.2,
      "line-dasharray": [2, 3],
      "line-opacity": 0.85
    }
  });

  // 3. Drainage Nodes: Sumps, Inlets & Outfalls
  map.addLayer({
    id: "fs-sponge-drain-nodes",
    type: "circle",
    source: "fs-sponge-drain-nodes",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 5.5, 16, 8.5],
      "circle-color": ["coalesce", ["get", "live_status_color"], "#00e5ff"],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#001a33",
      "circle-opacity": 1.0
    }
  });

  // 4. Drainage System Labels
  map.addLayer({
    id: "fs-sponge-drain-labels",
    type: "symbol",
    source: "fs-sponge-drain-nodes",
    minzoom: 14,
    layout: {
      "text-field": [
        "concat",
        ["match", ["get", "type"], "drain_outfall", "🌊 ", "🚰 "],
        ["get", "name"]
      ],
      "text-size": 11,
      "text-offset": [0, 1.4],
      "text-anchor": "top",
      "text-font": ["Noto Sans Bold"],
      "text-max-width": 14
    },
    paint: {
      "text-color": "#002b49",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2.5
    }
  });

  // 5. Landmark Labels for Lakes and Gardens
  map.addLayer({
    id: "fs-sponge-landmark-labels",
    type: "symbol",
    source: "fs-sponge-landmarks",
    minzoom: 13.5,
    layout: {
      "text-field": [
        "concat",
        ["match", ["get", "type"], "real_lake", "🏞️ ", "real_garden", "🌸 ", "⚙️ "],
        ["get", "name"]
      ],
      "text-size": 12,
      "text-offset": [0, -1.2],
      "text-anchor": "bottom",
      "text-font": ["Noto Sans Bold"],
      "text-max-width": 14
    },
    paint: {
      "text-color": [
        "match", ["get", "category"],
        "green", "#1b5e20",
        "blue", "#01579b",
        "#002b49"
      ],
      "text-halo-color": "#ffffff",
      "text-halo-width": 2.5
    }
  });

  // Interactive Click Handlers
  const interactiveLayers = [
    "fs-sponge-drain-water", "fs-sponge-drain-case", "fs-sponge-drain-nodes",
    "fs-sponge-river-water", "fs-sponge-lakes-water", "fs-sponge-gardens-bed",
    "fs-sponge-trees-canopy", "fs-sponge-gray-poly"
  ];
  interactiveLayers.forEach(lyr => {
    map.on("mouseenter", lyr, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", lyr, () => { map.getCanvas().style.cursor = ""; });
    map.on("click", lyr, e => {
      if (e.features && e.features.length) {
        showSpongePopup(e.features[0], e.lngLat);
      }
    });
  });
}

// Update live water heights, colors, and hydraulic status at minute t
export function updateSponge(t, rainMmHr = 60) {
  if (!mapInstance || !spongeData || !mapInstance.getSource("fs-sponge-lakes")) return;

  const lakeFeatures = [];
  const gardenFeatures = [];
  const treeFeatures = [];
  const grayPolyFeatures = [];
  const riverFeatures = [];
  const drainLineFeatures = [];
  const drainNodeFeatures = [];

  for (const f of spongeData.features) {
    const m = computeFeatureMetrics(f, t, rainMmHr);
    const updatedProps = {
      ...f.properties,
      live_fill_pct: m.fillPct,
      live_depth_m: m.depthM,
      live_stored_m3: m.storedM3,
      live_flow_m3s: m.flowM3s,
      live_status_label: m.status.label,
      live_status_color: m.status.color,
      live_extrusion_height: m.extrusionHeight,
      live_base_height: m.baseHeight
    };

    const copy = { ...f, properties: updatedProps };
    if (f.properties.type === "real_lake") {
      lakeFeatures.push(copy);
    } else if (f.properties.type === "real_garden") {
      gardenFeatures.push(copy);
    } else if (f.properties.type === "real_tree") {
      treeFeatures.push(copy);
    } else if (f.properties.type === "widened_river") {
      riverFeatures.push(copy);
    } else if (f.properties.type === "drainage_culvert") {
      drainLineFeatures.push(copy);
    } else if (f.properties.type === "drain_inlet" || f.properties.type === "drain_outfall") {
      drainNodeFeatures.push(copy);
    } else {
      grayPolyFeatures.push(copy);
    }
  }

  mapInstance.getSource("fs-sponge-lakes").setData({ type: "FeatureCollection", features: lakeFeatures });
  mapInstance.getSource("fs-sponge-gardens").setData({ type: "FeatureCollection", features: gardenFeatures });
  mapInstance.getSource("fs-sponge-trees").setData({ type: "FeatureCollection", features: treeFeatures });
  mapInstance.getSource("fs-sponge-gray").setData({ type: "FeatureCollection", features: grayPolyFeatures });
  if (mapInstance.getSource("fs-sponge-river")) {
    mapInstance.getSource("fs-sponge-river").setData({ type: "FeatureCollection", features: riverFeatures });
  }
  if (mapInstance.getSource("fs-sponge-drain-lines")) {
    mapInstance.getSource("fs-sponge-drain-lines").setData({ type: "FeatureCollection", features: drainLineFeatures });
  }
  if (mapInstance.getSource("fs-sponge-drain-nodes")) {
    mapInstance.getSource("fs-sponge-drain-nodes").setData({ type: "FeatureCollection", features: drainNodeFeatures });
  }

  // Update dynamic lake water level extrusion
  if (mapInstance.getLayer("fs-sponge-lakes-water")) {
    mapInstance.setPaintProperty("fs-sponge-lakes-water", "fill-extrusion-height", ["coalesce", ["get", "live_extrusion_height"], 1.5]);
  }
}

export function showSpongePopup(feature, lngLat) {
  if (!mapInstance) return;
  if (currentPopup) currentPopup.remove();

  const p = feature.properties;
  const isTree = p.type === "real_tree";
  const isLake = p.type === "real_lake";
  const isGarden = p.type === "real_garden";
  const isCulvert = p.type === "drainage_culvert";
  const isDrainNode = p.type === "drain_inlet" || p.type === "drain_outfall";

  let icon = "💧";
  let title = "Sponge Infrastructure";
  if (isTree) { icon = "🌳"; title = "Matured Canopy Tree"; }
  else if (isLake) { icon = "🏞️"; title = "Restored Wetland Lake"; }
  else if (isGarden) { icon = "🌸"; title = "Botanical Rain Garden"; }
  else if (isCulvert) { icon = "🚰"; title = "Primary Storm Drainage Culvert"; }
  else if (isDrainNode) { icon = "⚙️"; title = "Drainage Inflow & Control Sump"; }
  else if (p.category === "gray") { icon = "🏗️"; title = "Hydraulic Infiltration Infrastructure"; }

  const fillPct = p.live_fill_pct ?? 20;
  const status = getMsmaStatus(fillPct);

  let detailsHtml = "";
  if (isTree) {
    detailsHtml = `
      <div class="sponge-status-box" style="border-left: 4px solid #2e7d32;">
        <div class="sponge-status-header">
          <strong>Species:</strong> <span style="color:#2e7d32; font-weight:700;">${p.species || p.name}</span>
        </div>
        <div class="sponge-stats" style="margin-top:6px;">
          <div class="stat-item"><small>Canopy Height</small><strong>${p.height_m} m</strong></div>
          <div class="stat-item"><small>Canopy Width</small><strong>${((p.canopy_radius_m || 5)*2).toFixed(1)} m</strong></div>
          <div class="stat-item"><small>Rain Intercept</small><strong>${fillPct}% active</strong></div>
        </div>
      </div>
    `;
  } else if (isCulvert || isDrainNode) {
    const depthM = p.live_depth_m ?? 0.4;
    const flowQ = p.live_flow_m3s ?? 3.5;
    const designQ = p.design_capacity_m3s || 12.0;
    const dims = p.dimensions || "2.4m x 2.4m RCBC";
    detailsHtml = `
      <div class="sponge-status-box" style="border-left: 4px solid ${status.color};">
        <div class="sponge-status-header">
          <strong>Hydraulic Status:</strong> <span style="color:${status.color}; font-weight:700;">${status.label}</span>
        </div>
        <div class="sponge-meter">
          <div class="sponge-meter-bar" style="width:${fillPct}%; background:${status.color};"></div>
        </div>
        <div class="sponge-meter-labels">
          <span>Capacity: <strong>${fillPct}%</strong></span>
          <span>Water Depth: <strong>${depthM} m</strong></span>
        </div>
      </div>
      <div class="sponge-stats">
        <div class="stat-item"><small>Design Section</small><strong>${dims}</strong></div>
        <div class="stat-item"><small>Flow Discharge</small><strong>${flowQ} / ${designQ} m³/s</strong></div>
        <div class="stat-item"><small>MSMA Class</small><strong>${p.type_label || "Storm Drain"}</strong></div>
      </div>
    `;
  } else {
    const depthM = p.live_depth_m ?? 0.6;
    const storedM3 = p.live_stored_m3 ? Number(p.live_stored_m3).toLocaleString() : "14,000";
    const maxM3 = p.capacity_m3 || p.absorption_capacity_m3 || 45000;
    detailsHtml = `
      <div class="sponge-status-box" style="border-left: 4px solid ${status.color};">
        <div class="sponge-status-header">
          <strong>MSMA Status:</strong> <span style="color:${status.color}; font-weight:700;">${status.label}</span>
        </div>
        <div class="sponge-meter">
          <div class="sponge-meter-bar" style="width:${fillPct}%; background:${status.color};"></div>
        </div>
        <div class="sponge-meter-labels">
          <span>Capacity: <strong>${fillPct}%</strong></span>
          <span>Water Depth: <strong>${depthM} m</strong></span>
        </div>
      </div>
      <div class="sponge-stats">
        <div class="stat-item"><small>Water Stored</small><strong>${storedM3} m³</strong></div>
        <div class="stat-item"><small>Design Capacity</small><strong>${Number(maxM3).toLocaleString()} m³</strong></div>
        <div class="stat-item"><small>Infrastructure Class</small><strong>${p.type_label || p.type}</strong></div>
      </div>
    `;
  }

  const html = `
    <div class="sponge-pop">
      <div class="sponge-pop-head">
        <span class="sponge-cat-tag ${p.category}">${icon} ${title}</span>
        <h4>${p.name}</h4>
      </div>
      <p class="sponge-desc">${p.description || ""}</p>
      ${detailsHtml}
    </div>
  `;

  currentPopup = new maplibregl.Popup({ offset: 15, maxWidth: "340px", closeButton: true })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(mapInstance);
}

export function setSpongeVisible(visible) {
  spongeVisible = visible;
  if (!mapInstance) return;
  const opacity = visible ? 0.9 : 0;
  const lineOpacity = visible ? 1.0 : 0.4;
  const textOpacity = visible ? 1 : 0;

  const extrusions = ["fs-sponge-lakes-water", "fs-sponge-gardens-bed", "fs-sponge-trees-canopy", "fs-sponge-trees-trunk", "fs-sponge-gray-poly"];
  extrusions.forEach(id => {
    if (mapInstance.getLayer(id)) mapInstance.setPaintProperty(id, "fill-extrusion-opacity", opacity);
  });
  if (mapInstance.getLayer("fs-sponge-river-case")) mapInstance.setPaintProperty("fs-sponge-river-case", "line-opacity", lineOpacity * 0.8);
  if (mapInstance.getLayer("fs-sponge-river-water")) mapInstance.setPaintProperty("fs-sponge-river-water", "line-opacity", lineOpacity);
  if (mapInstance.getLayer("fs-sponge-drain-case")) mapInstance.setPaintProperty("fs-sponge-drain-case", "line-opacity", lineOpacity * 0.95);
  if (mapInstance.getLayer("fs-sponge-drain-water")) mapInstance.setPaintProperty("fs-sponge-drain-water", "line-opacity", lineOpacity);
  if (mapInstance.getLayer("fs-sponge-drain-flow")) mapInstance.setPaintProperty("fs-sponge-drain-flow", "line-opacity", visible ? 0.85 : 0);
  if (mapInstance.getLayer("fs-sponge-drain-nodes")) mapInstance.setPaintProperty("fs-sponge-drain-nodes", "circle-opacity", visible ? 1.0 : 0.5);
  if (mapInstance.getLayer("fs-sponge-drain-labels")) mapInstance.setPaintProperty("fs-sponge-drain-labels", "text-opacity", textOpacity);
  if (mapInstance.getLayer("fs-sponge-landmark-labels")) mapInstance.setPaintProperty("fs-sponge-landmark-labels", "text-opacity", textOpacity);
}
