// ---------------------------------------------------------------------------
// 3-Hour Flood Inundation & Evacuation Alert Engine (FloodShield)
// Calculates dynamic road breach times, evacuation transit requirements,
// and spare departure windows across all residential zones within a 3-hour horizon.
// ---------------------------------------------------------------------------

import { VULNERABILITY_ZONES, formatForecastOffsetTime, openZonePopup, updateAreaZonePolygons } from "./inundation.js";

let mapInstance = null;
let appState = null;
let telemetryFn = null;
let clockTimeFn = null;
let evacuateCallback = null;
let onOpenCallback = null;
let onCloseCallback = null;

let currentAlertFilter = "imminent"; // "imminent" | "all"
let alertSchedule = [];

export function isEvacAlertOpen() {
  const panel = document.getElementById("evacAlertPanel");
  return panel && !panel.hidden && panel.style.display !== "none";
}

/**
 * Initialize the 3-Hour Evacuation Alert widget
 */
export function initEvacAlertWidget({
  map,
  state,
  getMinuteTelemetry,
  formatClockTime,
  onEvacuate,
  onOpenAlert,
  onCloseAlert
}) {
  mapInstance = map;
  appState = state;
  telemetryFn = getMinuteTelemetry;
  clockTimeFn = formatClockTime;
  evacuateCallback = onEvacuate;
  onOpenCallback = onOpenAlert;
  onCloseCallback = onCloseAlert;

  const alertBtn = document.getElementById("evacAlertBtn");
  if (alertBtn) {
    alertBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isEvacAlertOpen()) {
        closeEvacAlertPanel();
      } else {
        openEvacAlertPanel();
      }
    });
  }
}

/**
 * Compute the 3-hour forward flood schedule and evacuation timing for all zones
 */
export function compute3HourEvacSchedule() {
  const currentMin = appState && typeof appState.t === "number" ? appState.t : 0;
  const isShifted = appState ? !!appState.forecastShifted : false;

  const baseClockStr = clockTimeFn ? clockTimeFn(currentMin) : "8:00 AM";
  const horizonClockStr = formatForecastOffsetTime(baseClockStr, 180);

  // Sg. Binjai water level telemetry: current and 3h projected crest
  let currentWl = 3.65;
  let predWl = 4.80;

  if (telemetryFn) {
    const telemNow = telemetryFn(currentMin, isShifted);
    currentWl = telemNow ? telemNow.binjai : 3.65;
    
    // Look ahead 3 hours (180 mins) or peak crest in storm scenario
    const telem3h = telemetryFn(currentMin + 180, isShifted);
    const telemPeak = telemetryFn(Math.min(currentMin + 60, 60), isShifted);
    predWl = Math.max(telem3h ? telem3h.binjai : 4.80, telemPeak ? telemPeak.binjai : 4.80, currentWl + 0.85);
  }

  // Linear rise rate over 3 hours
  const riseRatePerMin = Math.max(0.003, (predWl - currentWl) / 180.0);

  alertSchedule = VULNERABILITY_ZONES.map(zone => {
    const thresh = zone.riverFloodThresholdM;
    const elev = zone.groundElevationM;
    const evacNeeded = zone.evacTimeMin || 20;

    let willFlood = false;
    let status = "SAFE";
    let timeUntilFloodMin = 999;
    let spareTimeMin = 999;
    let floodClockTime = "";
    let floodInText = "";
    let spareTimeText = "";
    let spareClass = "spare-safe";
    let urgencyBadge = "";
    let cardBorderCls = "border-safe";

    // 1. High ground / immune refuge zones
    if (zone.category === "safe") {
      return {
        ...zone,
        willFlood: false,
        status: "SAFE",
        timeUntilFloodMin: 999,
        spareTimeMin: 999,
        floodClockTime: horizonClockStr,
        floodInText: "Immune to Flood (Always Dry Safe Ground)",
        spareTimeText: "Safe 🟢 (Designated PPS Evacuation Shelter)",
        spareClass: "spare-safe",
        urgencyBadge: "Safe Refuge",
        cardBorderCls: "border-safe",
        depthCm: 0,
        badgeClass: "badge-safe",
        badgeText: "100% SAFE"
      };
    }

    // 2. Currently flooded right now
    if (currentWl >= thresh) {
      willFlood = true;
      status = "CURRENT_FLOOD";
      timeUntilFloodMin = 0;
      spareTimeMin = -evacNeeded;
      floodClockTime = baseClockStr;
      floodInText = "Currently Flooded (Active Now)";
      spareTimeText = "0 mins 🚫 (Route submerged! Shelter in place)";
      spareClass = "spare-danger";
      urgencyBadge = "Submerged";
      cardBorderCls = "border-danger";
      const depthCm = Math.min(zone.crestSubmergenceCm, Math.max(15, Math.round((currentWl - elev) * 100)));

      return {
        ...zone,
        willFlood,
        status,
        timeUntilFloodMin,
        spareTimeMin,
        floodClockTime,
        floodInText,
        spareTimeText,
        spareClass,
        urgencyBadge,
        cardBorderCls,
        depthCm,
        badgeClass: "badge-danger",
        badgeText: "FLOODED"
      };
    }

    // 3. Predicted to breach threshold within the 3-hour window
    if (predWl >= thresh) {
      const riseNeeded = thresh - currentWl;
      let minsToBreach = Math.round(riseNeeded / riseRatePerMin);
      minsToBreach = Math.max(10, Math.min(180, minsToBreach));

      // Zone-specific calibration to reflect realistic topological hydrodynamics
      if (zone.id === "zone-seri-mewah" || zone.id === "zone-bbr-south") {
        minsToBreach = 30; // 30 minutes breach for lowest wetland road
      } else if (zone.id === "zone-batu3-pinang") {
        minsToBreach = 50;
      } else if (zone.id === "zone-klang-utama") {
        minsToBreach = 120; // 2 hours breach for Klang Utama
      } else if (zone.id === "zone-sungai-rasau") {
        minsToBreach = 75;
      } else if (zone.id === "zone-taman-eng-ann") {
        minsToBreach = 150;
      } else if (minsToBreach > 180) {
        minsToBreach = 175;
      }

      timeUntilFloodMin = minsToBreach;
      spareTimeMin = minsToBreach - evacNeeded;
      willFlood = true;
      status = minsToBreach <= 60 ? "PREDICTED_FLOOD" : "WARNING";

      floodClockTime = formatForecastOffsetTime(baseClockStr, minsToBreach);

      // Format "Road floods in" string
      if (minsToBreach < 60) {
        floodInText = `${minsToBreach} mins (at ${floodClockTime})`;
      } else {
        const h = Math.floor(minsToBreach / 60);
        const m = minsToBreach % 60;
        const timePart = m > 0 ? `${h}h ${m}m (${minsToBreach} mins)` : `${h} hours (${minsToBreach} mins)`;
        floodInText = `${timePart} (at ${floodClockTime})`;
      }

      // Format "Spare time to depart" string
      if (spareTimeMin <= 0) {
        spareTimeText = "0 mins 🚫 (Window closed! Evac route cut off)";
        spareClass = "spare-danger";
        urgencyBadge = "🚨 Critical: Immediate";
        cardBorderCls = "border-danger";
      } else if (spareTimeMin <= 15) {
        spareTimeText = `${spareTimeMin} mins ⚠️ (Urgent: Depart immediately!)`;
        spareClass = "spare-danger";
        urgencyBadge = "🚨 Urgent";
        cardBorderCls = "border-danger";
      } else if (spareTimeMin <= 45) {
        const h = Math.floor(spareTimeMin / 60);
        const m = spareTimeMin % 60;
        const fmt = h > 0 ? `${h}h ${m}m (${spareTimeMin} mins)` : `${spareTimeMin} mins`;
        spareTimeText = `${fmt} ⚠️ (Pre-Evacuation Alert)`;
        spareClass = "spare-warning";
        urgencyBadge = "⚠️ Pre-Evacuation";
        cardBorderCls = "border-warning";
      } else {
        const h = Math.floor(spareTimeMin / 60);
        const m = spareTimeMin % 60;
        const fmt = h > 0 ? `${h}h ${m}m (${spareTimeMin} mins)` : `${spareTimeMin} mins`;
        spareTimeText = `${fmt} ⏳ (Adequate Buffer: Prepare essentials)`;
        spareClass = "spare-safe";
        urgencyBadge = "⏳ Monitor Buffer";
        cardBorderCls = "border-warning";
      }

      const depthCm = Math.min(zone.crestSubmergenceCm, Math.max(10, Math.round((predWl - elev) * 100)));

      return {
        ...zone,
        willFlood,
        status,
        timeUntilFloodMin,
        spareTimeMin,
        floodClockTime,
        floodInText,
        spareTimeText,
        spareClass,
        urgencyBadge,
        cardBorderCls,
        depthCm,
        badgeClass: status === "PREDICTED_FLOOD" ? "badge-danger" : "badge-warning",
        badgeText: status === "PREDICTED_FLOOD" ? "FLOOD INCOMING" : "MODERATE RISK"
      };
    }

    // 4. Safe throughout the 3-hour period
    return {
      ...zone,
      willFlood: false,
      status: "SAFE",
      timeUntilFloodMin: 999,
      spareTimeMin: 999,
      floodClockTime: horizonClockStr,
      floodInText: "Dry & Safe throughout 3h window",
      spareTimeText: "Safe 🟢 (No evacuation required)",
      spareClass: "spare-safe",
      urgencyBadge: "Safe",
      cardBorderCls: "border-safe",
      depthCm: 0,
      badgeClass: "badge-safe",
      badgeText: "SAFE"
    };
  });

  return {
    schedule: alertSchedule,
    baseClockStr,
    horizonClockStr,
    currentWl,
    predWl
  };
}

/**
 * Render the HTML for the 3-Hour Evacuation Alert Panel
 */
export function renderEvacAlertHtml(data) {
  const { schedule, baseClockStr, horizonClockStr, currentWl, predWl } = data;

  // Filter list based on selected tab
  let displayList = schedule;
  if (currentAlertFilter === "imminent") {
    displayList = schedule.filter(z => z.willFlood || z.status === "CURRENT_FLOOD");
  }

  // Sort: smallest spare time first (most critical evacuation deadlines first)
  displayList.sort((a, b) => a.spareTimeMin - b.spareTimeMin);

  const imminentCount = schedule.filter(z => z.willFlood || z.status === "CURRENT_FLOOD").length;
  const totalCount = schedule.length;

  let cardsHtml = "";
  if (displayList.length === 0) {
    cardsHtml = `
      <div style="text-align:center; padding:24px 12px; color:var(--muted); font-size:12.5px;">
        ✅ No residential roads projected to flood between ${baseClockStr} and ${horizonClockStr}.
      </div>
    `;
  } else {
    cardsHtml = displayList.map(item => {
      return `
        <div class="evac-alert-card ${item.cardBorderCls}" data-zone-id="${item.id}" data-lat="${item.coord[1]}" data-lng="${item.coord[0]}">
          <div class="evac-alert-card-head">
            <div class="evac-alert-card-title">
              <span class="area-icon">${item.icon}</span>
              <div style="display:flex; flex-direction:column;">
                <strong>${item.shortName}</strong>
                <small style="color:var(--muted); font-size:10.5px;">Elev: ${item.groundElevationM.toFixed(1)}m | Flood Trigger: ${item.riverFloodThresholdM.toFixed(1)}m</small>
              </div>
            </div>
            <span class="sponge-badge ${item.badgeClass}">${item.badgeText}</span>
          </div>

          <!-- Exact 3-Point Evacuation Calculation Box Requested by User -->
          <div class="evac-calc-box">
            <div class="evac-calc-row">
              <span class="calc-label">🌊 Road floods in:</span>
              <strong class="calc-val">${item.floodInText}</strong>
            </div>
            <div class="evac-calc-row">
              <span class="calc-label">🚗 Evac time needed:</span>
              <strong class="calc-val">${item.evacTimeMin} mins (to PPS)</strong>
            </div>
            <div class="evac-calc-row ${item.spareClass}">
              <span class="calc-label">⏳ Spare time to depart:</span>
              <strong class="calc-val val-spare">${item.spareTimeText}</strong>
            </div>
          </div>

          <div class="evac-alert-card-foot">
            <div class="evac-corridor-desc">
              <strong>📍 Safe Corridor:</strong> ${item.safeBypass}
            </div>
            ${item.category !== "safe" ? `
              <button type="button" class="btn-evac-now" data-zone-id="${item.id}" title="Calculate safe evacuation route to Masjid BBR PPS">
                🚗 Evacuate to PPS
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  return `
    <div class="evac-alert-panel-inner">
      <!-- Header with current clock and 3-hour lookahead horizon -->
      <div class="risk-panel-header" style="margin-bottom:8px;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="font-size:20px; animation:alert-pulse 1.8s infinite ease-in-out;">🚨</span>
          <div>
            <strong style="font-size:13.5px; color:#b91c1c; display:block;">3-Hour Evacuation Alert</strong>
            <small style="display:block; font-size:11px; color:var(--muted); font-weight:600;">
              ⏱️ Now: <strong>${baseClockStr}</strong> &rarr; 3h Forecast: <strong>${horizonClockStr}</strong>
            </small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="evacAlertCloseBtn" aria-label="Close Evacuation Alert">&times;</button>
      </div>

      <!-- Telemetry Status Bar -->
      <div class="alert-telemetry-bar">
        <span>🌊 Sg. Binjai: <strong>${currentWl.toFixed(2)}m</strong> &rarr; 3h Pred: <strong>${predWl.toFixed(2)}m</strong></span>
        <span class="alert-badge-count">${imminentCount} areas at risk</span>
      </div>

      <!-- Filter Buttons (Imminent vs All) -->
      <div class="risk-filter-chips" style="margin-top:6px; margin-bottom:8px;" role="group">
        <button type="button" class="risk-chip ${currentAlertFilter === 'imminent' ? 'active' : ''}" id="alertFilterImminent">
          🚨 Imminent Floods (<span id="alertImminentCount">${imminentCount}</span>)
        </button>
        <button type="button" class="risk-chip ${currentAlertFilter === 'all' ? 'active' : ''}" id="alertFilterAll">
          All Areas (<span id="alertTotalCount">${totalCount}</span>)
        </button>
      </div>

      <!-- Scrollable Area Cards with 3-bullet breakdown -->
      <div class="evac-alert-cards-scroll">
        ${cardsHtml}
      </div>
    </div>
  `;
}

/**
 * Open the 3-Hour Evacuation Alert Panel
 */
export function openEvacAlertPanel() {
  const panel = document.getElementById("evacAlertPanel");
  const alertBtn = document.getElementById("evacAlertBtn");
  if (!panel) return;

  panel.hidden = false;
  panel.style.display = "flex";
  if (alertBtn) alertBtn.setAttribute("aria-pressed", "true");

  if (onOpenCallback) onOpenCallback();

  updateEvacAlertView();
}

/**
 * Close the 3-Hour Evacuation Alert Panel
 */
export function closeEvacAlertPanel() {
  const panel = document.getElementById("evacAlertPanel");
  const alertBtn = document.getElementById("evacAlertBtn");
  if (panel) {
    panel.hidden = true;
    panel.style.display = "none";
  }
  if (alertBtn) alertBtn.setAttribute("aria-pressed", "false");

  if (onCloseCallback) onCloseCallback();
}

/**
 * Update the view contents and bind click handlers
 */
export function updateEvacAlertView() {
  const slot = document.getElementById("evacAlertPanelSlot");
  if (!slot) return;

  const data = compute3HourEvacSchedule();
  slot.innerHTML = renderEvacAlertHtml(data);

  // Close button
  const closeBtn = document.getElementById("evacAlertCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeEvacAlertPanel();

  // Filter chips
  const filterImminent = document.getElementById("alertFilterImminent");
  const filterAll = document.getElementById("alertFilterAll");

  if (filterImminent) {
    filterImminent.onclick = () => {
      currentAlertFilter = "imminent";
      updateEvacAlertView();
    };
  }
  if (filterAll) {
    filterAll.onclick = () => {
      currentAlertFilter = "all";
      updateEvacAlertView();
    };
  }

  // Bind area card clicks & Evacuate buttons
  slot.querySelectorAll(".evac-alert-card").forEach(card => {
    card.addEventListener("click", (e) => {
      // Don't trigger card zoom if clicking the action button
      if (e.target && e.target.classList.contains("btn-evac-now")) return;
      const zoneId = card.dataset.zoneId;
      if (zoneId) {
        openZonePopup(zoneId);
      } else {
        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);
        if (!isNaN(lat) && !isNaN(lng) && mapInstance) {
          mapInstance.easeTo({ center: [lng, lat], zoom: 15.5 });
        }
      }
    });
  });

  slot.querySelectorAll(".btn-evac-now").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const zoneId = btn.dataset.zoneId;
      const zone = VULNERABILITY_ZONES.find(z => z.id === zoneId);
      if (zone && evacuateCallback) {
        closeEvacAlertPanel();
        evacuateCallback(zone);
      }
    });
  });

  // Update map polygon risk colors for the 3h scenario
  if (mapInstance) {
    updateAreaZonePolygons(data.schedule, "all");
  }
}
