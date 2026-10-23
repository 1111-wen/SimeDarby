/**
 * FloodShield — Hydraulic Inundation & Time-Critical Evacuation Prioritisation Engine
 * 
 * Philosophy:
 * "Our system goes beyond visualising floodwater and identifying routes that are safe at the present moment.
 * It estimates when critical access roads may become unsafe and compares this with the time required for
 * residents to evacuate. By identifying residential blocks with the smallest remaining evacuation windows,
 * FloodShield can prioritise time-critical warnings and recommend alternative routes before neighbourhoods
 * risk becoming isolated."
 */

export const VULNERABILITY_ZONES = [
  {
    id: "zone-makyong-dip",
    code: "Area A",
    name: "Jalan Makyong 5A/5B Residential Dips (BBR North)",
    shortName: "Jalan Makyong (Area A)",
    category: "residential",
    coord: [101.4305, 3.0903],
    groundElevationM: 4.20,
    riverFloodThresholdM: 4.40, // Late Warning
    crestSubmergenceCm: 45,
    evacTimeMin: 20, // Residents need 20 minutes to evacuate to Masjid BBR (PPS)
    icon: "🏠",
    corridor: "Jalan Makyong 5A, 5B, 6 & Sg. Puloh culvert intake",
    safeBypass: "Elevated connector road direct to Masjid BBR (PPS)",
    desc: "Natural topographic bowl. Traps surface runoff when Sg. Puloh culverts are backwater-pressured."
  },
  {
    id: "zone-kyra-casira",
    code: "Area B",
    name: "Taman Kyra & Casira Residential Blocks (BBR West)",
    shortName: "Taman Kyra (Area B)",
    category: "residential",
    coord: [101.4135, 3.1020],
    groundElevationM: 4.60,
    riverFloodThresholdM: 4.75, // Higher ground threshold
    crestSubmergenceCm: 30,
    evacTimeMin: 20, // Residents need 20 minutes to reach elevated bypass
    icon: "🏠",
    corridor: "Persiaran Bukit Raja West & Casira loop",
    safeBypass: "Persiaran Bukit Raja 1 elevated link toward Columbia Asia bypass",
    desc: "Higher elevation residential block (>4.6m). Retains longer escape window before runoff peaks."
  },
  {
    id: "zone-meru-riverbank",
    code: "Pekan Meru",
    name: "Pekan Meru Low-Lying Riverbank & Market Dip",
    shortName: "Pekan Meru Riverbank",
    category: "commercial",
    coord: [101.4415, 3.1382],
    groundElevationM: 3.80,
    riverFloodThresholdM: 4.20, // JPS Warning
    crestSubmergenceCm: 60,
    evacTimeMin: 25,
    icon: "🏛️",
    corridor: "Jalan Meru low market dip & Sg. Binjai riverbank",
    safeBypass: "Persiaran Bukit Raja 1 / Jalan Haji Abdul Manan",
    desc: "Lowest river corridor (3.8m). First to experience storm drain backwater locking and overtopping."
  },
  {
    id: "zone-meru-junction",
    code: "Jalan Meru",
    name: "Jalan Meru Commercial Junction & BBR Gateway",
    shortName: "Jalan Meru Junction",
    category: "arterial",
    coord: [101.4385, 3.0982],
    groundElevationM: 4.40,
    riverFloodThresholdM: 4.50, // JPS Danger
    crestSubmergenceCm: 50,
    evacTimeMin: 15,
    icon: "🏢",
    corridor: "Persiaran Klang / Jalan Meru main gateway junction",
    safeBypass: "NKVE Highway elevated slip road & Persiaran Mokhtar Dahari",
    desc: "Major arterial junction. Severely submerged when Sg. Binjai crosses 4.50m (Danger)."
  },
  {
    id: "zone-wetland-perimeter",
    code: "Wetland Lake",
    name: "Bandar Bukit Raja Wetland Lake Perimeter",
    shortName: "BBR Wetland Park",
    category: "sponge",
    coord: [101.4240, 3.0930],
    groundElevationM: 4.10,
    riverFloodThresholdM: 4.30,
    crestSubmergenceCm: 35,
    evacTimeMin: 15,
    icon: "🏞️",
    corridor: "125-acre wetland retention lake edge & jogging boardwalks",
    safeBypass: "Upper perimeter bund and elevated town park boardwalk",
    desc: "Active blue-green sponge retention lake absorbing up to 100% capacity."
  },
  {
    id: "zone-safe-highground",
    code: "Masjid BBR",
    name: "Persiaran Bukit Raja Spine & Masjid BBR (PPS)",
    shortName: "Masjid BBR (Safe High Ground)",
    category: "safe",
    coord: [101.4295, 3.0899],
    groundElevationM: 5.60,
    riverFloodThresholdM: 6.20, // Extreme 100-year capacity
    crestSubmergenceCm: 0,
    evacTimeMin: 0,
    icon: "🛡️",
    corridor: "High-Elevation Evacuation Spine (>5.5m DEM)",
    safeBypass: "Primary designated relief corridor to official APM / NADMA relief centre",
    desc: "Elevated ridge immune to river overflow. Designated refuge zone."
  }
];

/**
 * Add minutes to time string (either "09:00 AM" or "28/11/2024 20:00")
 */
function addMinutesToTimestamp(baseStr, addMins) {
  if (!baseStr) return "";
  addMins = Math.round(addMins);

  const clockMatch = baseStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (clockMatch) {
    let hours = parseInt(clockMatch[1], 10);
    const mins = parseInt(clockMatch[2], 10);
    const meridiem = clockMatch[3] ? clockMatch[3].toUpperCase() : null;

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const totalMins = (hours * 60 + mins + addMins) % (24 * 60);
    let newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    let newMeridiem = "AM";
    if (newH >= 12) {
      newMeridiem = "PM";
      if (newH > 12) newH -= 12;
    }
    if (newH === 0) newH = 12;
    return `${newH}:${newM < 10 ? '0' : ''}${newM} ${newMeridiem}`;
  }

  const dateMatch = baseStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const year = parseInt(dateMatch[3], 10);
    const hours = parseInt(dateMatch[4], 10);
    const mins = parseInt(dateMatch[5], 10);

    const d = new Date(year, month, day, hours, mins);
    d.setMinutes(d.getMinutes() + addMins);

    const pad = n => (n < 10 ? '0' + n : '' + n);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return `+${addMins}m`;
}

/**
 * Calculate the exact flood schedule and evacuation window for each geographic area
 * based on current river level, XGBoost predicted level (t+3h), and ground elevation.
 */
export function computeAreaFloodSchedule(currentWl, predWl, currentTimestampStr = "Current Time") {
  const current = Number(currentWl) || 2.10;
  const pred = Number(predWl) || current;
  const ratePerHour = (pred - current) / 3.0; // m per hour over 3-hour lead window

  return VULNERABILITY_ZONES.map(zone => {
    const thresh = zone.riverFloodThresholdM;
    const elev = zone.groundElevationM;
    let status = "SAFE"; // SAFE | WARNING | PREDICTED_FLOOD | CURRENT_FLOOD
    let timeText = "Dry & Safe";
    let depthCm = 0;
    let badgeClass = "badge-safe";
    let badgeText = "SAFE";
    let willFlood = false;
    let timeUntilFloodMin = 180;
    let spareTimeMin = 180;
    let urgencyBadge = "Lower urgency — more time to prepare.";
    let urgencyCls = "urgency-low";

    // 1. High ground zone is permanently safe
    if (zone.category === "safe") {
      return {
        ...zone,
        status: "SAFE",
        willFlood: false,
        timeUntilFloodMin: 999,
        spareTimeMin: 999,
        timeText: "Immune to Flood (Always Dry High Ground)",
        depthCm: 0,
        badgeClass: "badge-safe",
        badgeText: "100% SAFE",
        actionText: "Designated Safe Evacuation Destination (Masjid BBR PPS)",
        urgencyBadge: "Safe Refuge Zone",
        urgencyCls: "urgency-safe"
      };
    }

    // 2. Currently flooded
    if (current >= thresh) {
      status = "CURRENT_FLOOD";
      willFlood = true;
      timeUntilFloodMin = 0;
      spareTimeMin = -zone.evacTimeMin;
      depthCm = Math.min(zone.crestSubmergenceCm, Math.max(15, Math.round((current - elev) * 100)));
      timeText = "Currently Flooded (Active Now)";
      badgeClass = "badge-danger";
      badgeText = "FLOODED";
      urgencyBadge = "🚫 CRITICAL: Escape route submerged! Use elevated bypass.";
      urgencyCls = "urgency-danger";

      if (pred < thresh && ratePerHour < -0.01) {
        const fallNeeded = current - thresh;
        const minsToClear = Math.round((fallNeeded / Math.abs(ratePerHour)) * 60);
        const clearTime = addMinutesToTimestamp(currentTimestampStr, minsToClear);
        timeText = `Currently Flooded &bull; Clears ~${clearTime} (in ${minsToClear}m)`;
      }
    }
    // 3. Predicted to flood in the next 3 hours
    else if (pred >= thresh && ratePerHour > 0.005) {
      status = "PREDICTED_FLOOD";
      willFlood = true;
      const riseNeeded = thresh - current;
      const minsToBreach = Math.max(5, Math.min(180, Math.round((riseNeeded / ratePerHour) * 60)));
      timeUntilFloodMin = minsToBreach;
      spareTimeMin = minsToBreach - zone.evacTimeMin;

      const floodTime = addMinutesToTimestamp(currentTimestampStr, minsToBreach);
      depthCm = Math.min(zone.crestSubmergenceCm, Math.max(10, Math.round((pred - elev) * 100)));
      timeText = `Floods at ${floodTime} (in ${minsToBreach} mins)`;
      badgeClass = "badge-danger";
      badgeText = "FLOOD INCOMING";

      if (spareTimeMin <= 15) {
        urgencyBadge = "High urgency — warn residents first.";
        urgencyCls = "urgency-high";
      } else if (spareTimeMin <= 45) {
        urgencyBadge = "Moderate urgency — begin pre-evacuation alert.";
        urgencyCls = "urgency-mod";
      } else {
        urgencyBadge = "Lower urgency — more time to prepare.";
        urgencyCls = "urgency-low";
      }
    }
    // 4. Moderate risk / shallow ponding approaching threshold
    else if (pred >= (thresh - 0.20) || current >= (thresh - 0.20)) {
      status = "WARNING";
      timeUntilFloodMin = 90;
      spareTimeMin = 90 - zone.evacTimeMin;
      depthCm = Math.round(Math.max(5, (Math.max(current, pred) - (thresh - 0.20)) * 50));
      timeText = "Gutter ponding / runoff warning";
      badgeClass = "badge-warning";
      badgeText = "MODERATE RISK";
      urgencyBadge = "Lower urgency — monitor road conditions.";
      urgencyCls = "urgency-low";
    }
    // 5. Completely safe
    else {
      status = "SAFE";
      timeUntilFloodMin = 180;
      spareTimeMin = 180 - zone.evacTimeMin;
      timeText = "Safe throughout 3h window";
      badgeClass = "badge-safe";
      badgeText = "SAFE";
      urgencyBadge = "Safe — no evacuation required.";
      urgencyCls = "urgency-safe";
    }

    const actionText = willFlood
      ? `🚫 Impassable (${depthCm}cm) &bull; Divert to ${zone.safeBypass}`
      : status === "WARNING"
      ? `⚠️ Caution: Surface ponding (${depthCm}cm) &bull; High clearance vehicles only`
      : `✅ Clear & dry &bull; Road passable`;

    return {
      ...zone,
      status,
      willFlood,
      timeUntilFloodMin,
      spareTimeMin,
      timeText,
      depthCm,
      badgeClass,
      badgeText,
      actionText,
      urgencyBadge,
      urgencyCls
    };
  });
}

/**
 * Generate formatted HTML for the full FloodShield Evacuation & Predict Panel
 */
export function renderPredictPanelHtml(scheduleList, currentWl, predWl, currentTimestampStr) {
  // Cards for all areas
  const cardsHtml = scheduleList.map(item => {
    const isDanger = item.status === "CURRENT_FLOOD" || item.status === "PREDICTED_FLOOD";
    const isWarning = item.status === "WARNING";
    const borderCls = isDanger ? "border-danger" : isWarning ? "border-warning" : "border-safe";

    return `
      <div class="area-sched-card ${borderCls}" data-zone-id="${item.id}" data-lat="${item.coord[1]}" data-lng="${item.coord[0]}" title="Click to view ${item.name} on map">
        <div class="area-sched-head">
          <div class="area-sched-title">
            <span class="area-icon">${item.icon}</span>
            <strong>${item.name}</strong>
            <small class="area-elev">Ground: ${item.groundElevationM.toFixed(1)}m | Trigger: ${item.riverFloodThresholdM.toFixed(1)}m</small>
          </div>
          <span class="sponge-badge ${item.badgeClass}">${item.badgeText}</span>
        </div>
        <div class="area-sched-time">
          <span class="time-clock-ico">⏱️</span>
          <strong>${item.timeText}</strong>
          ${item.depthCm > 0 ? `<span class="depth-tag">🌊 ${item.depthCm} cm road depth</span>` : '<span class="depth-tag" style="background:#dcfce7; color:#15803d; border-color:#86efac;">Dry</span>'}
          <span class="evac-spare-tag ${item.spareTimeMin <= 15 ? 'spare-danger' : 'spare-safe'}">
            🏃 Evac Window: ${item.spareTimeMin <= 0 ? '0m' : item.spareTimeMin + 'm spare'}
          </span>
        </div>
        <div class="area-sched-action">
          ${item.actionText}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="floodshield-modal-content">
      <!-- Modal Header -->
      <div class="floodshield-modal-head">
        <div class="modal-head-title">
          <span class="modal-head-icon">🔮</span>
          <div>
            <h2 style="margin:0; font-size:16px; color:var(--ink);">FloodShield: Area Inundation & Evacuation Schedule</h2>
            <p class="modal-head-sub" style="margin:2px 0 0; font-size:11.5px; color:var(--muted);">Sg. Binjai Level: <strong>${Number(currentWl).toFixed(2)}m</strong> &bull; Forecast (t+3h): <strong>${Number(predWl).toFixed(2)}m</strong> &bull; Scrubber Time: <strong>${currentTimestampStr}</strong></p>
          </div>
        </div>
        <button type="button" class="floodshield-close-btn" id="predictCloseBtn" aria-label="Close prediction">&times;</button>
      </div>

      <!-- Detailed All-Area Inundation Schedule List -->
      <div class="area-schedule-cards" style="max-height: 480px; margin-top:8px;">
        ${cardsHtml}
      </div>
    </div>
  `;
}

/**
 * Generate formatted HTML for the "Area Flood Schedule" container (used inside Q4 drawer)
 */
export function renderAreaScheduleHtml(scheduleList) {
  const floodedCount = scheduleList.filter(z => z.willFlood).length;
  
  let headerSummary = "";
  if (floodedCount > 0) {
    headerSummary = `<span class="sched-summary-alert">🚨 ${floodedCount} area(s) affected by predicted floodwater</span>`;
  } else {
    headerSummary = `<span class="sched-summary-safe">✅ All areas safe from river overtopping</span>`;
  }

  const cardsHtml = scheduleList.map(item => {
    const isDanger = item.status === "CURRENT_FLOOD" || item.status === "PREDICTED_FLOOD";
    const isWarning = item.status === "WARNING";
    const borderCls = isDanger ? "border-danger" : isWarning ? "border-warning" : "border-safe";

    return `
      <div class="area-sched-card ${borderCls}" data-zone-id="${item.id}" data-lat="${item.coord[1]}" data-lng="${item.coord[0]}" title="Click to view ${item.name} on map">
        <div class="area-sched-head">
          <div class="area-sched-title">
            <span class="area-icon">${item.icon}</span>
            <strong>${item.shortName}</strong>
            <small class="area-elev">Elev: ${item.groundElevationM.toFixed(1)}m | Trigger: ${item.riverFloodThresholdM.toFixed(1)}m</small>
          </div>
          <span class="sponge-badge ${item.badgeClass}">${item.badgeText}</span>
        </div>
        <div class="area-sched-time">
          <span class="time-clock-ico">⏱️</span>
          <strong>${item.timeText}</strong>
          ${item.depthCm > 0 ? `<span class="depth-tag">🌊 ${item.depthCm} cm depth</span>` : ''}
          <span class="evac-spare-tag ${item.spareTimeMin <= 15 ? 'spare-danger' : 'spare-safe'}">
            🏃 Evac Window: ${item.spareTimeMin <= 0 ? '0m' : item.spareTimeMin + 'm spare'}
          </span>
        </div>
        <div class="area-sched-action">
          ${item.actionText}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="area-schedule-wrap">
      <div class="area-schedule-top">
        <div class="area-schedule-header">
          <span class="sched-title-icon">📍</span>
          <strong>Area & Time Inundation Forecast</strong>
        </div>
        ${headerSummary}
      </div>
      <div class="area-schedule-cards">
        ${cardsHtml}
      </div>
    </div>
  `;
}

// Map markers for vulnerability zones
let zoneMarkers = [];
let mapInstance = null;

export function initInundationMarkers(map, onCardClick) {
  mapInstance = map;
  if (!map) return;

  // Clear existing
  zoneMarkers.forEach(m => m.remove());
  zoneMarkers = [];

  VULNERABILITY_ZONES.forEach(zone => {
    const el = document.createElement("div");
    el.className = "inundation-map-marker marker-safe";
    el.id = `marker-${zone.id}`;
    el.innerHTML = `
      <div class="marker-bubble">
        <span class="m-icon">${zone.icon}</span>
        <span class="m-label">${zone.shortName}</span>
      </div>
      <div class="marker-pulse"></div>
    `;

    el.addEventListener("click", e => {
      e.stopPropagation();
      map.easeTo({ center: zone.coord, zoom: 15.5 });
      if (onCardClick) onCardClick(zone);
    });

    const m = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(zone.coord)
      .addTo(map);

    zoneMarkers.push({ zone, marker: m, el });
  });
}

export function updateInundationMarkers(scheduleList) {
  if (!zoneMarkers || zoneMarkers.length === 0) return;

  const mapByZoneId = new Map(scheduleList.map(s => [s.id, s]));

  zoneMarkers.forEach(({ zone, el }) => {
    const data = mapByZoneId.get(zone.id);
    if (!data) return;

    el.className = "inundation-map-marker";
    const labelSpan = el.querySelector(".m-label");

    if (data.status === "CURRENT_FLOOD") {
      el.classList.add("marker-danger", "marker-flooded");
      if (labelSpan) labelSpan.textContent = `${data.shortName} (Flooded ${data.depthCm}cm)`;
    } else if (data.status === "PREDICTED_FLOOD") {
      el.classList.add("marker-danger", "marker-predicting");
      if (labelSpan) labelSpan.textContent = `${data.shortName} (Floods in ${data.timeUntilFloodMin}m &bull; ${data.spareTimeMin}m spare)`;
    } else if (data.status === "WARNING") {
      el.classList.add("marker-warning");
      if (labelSpan) labelSpan.textContent = `${data.shortName} (Ponding ${data.depthCm}cm)`;
    } else {
      el.classList.add("marker-safe");
      if (labelSpan) labelSpan.textContent = data.category === "safe" ? `${data.shortName} (Safe)` : data.shortName;
    }
  });
}
