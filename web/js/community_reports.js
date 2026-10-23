/**
 * community_reports.js
 * Crowd-sourced Citizen Flood Reporting System for FloodShield (Klang, Selangor)
 */

import { VULNERABILITY_ZONES } from "./inundation.js";

// Realistic sample photo base64 SVGs for demonstration & offline fallback
export const SAMPLE_FLOOD_PHOTOS = {
  moderate: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2364748b"/><stop offset="100%" stop-color="%2394a3b8"/></linearGradient><linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.85"/><stop offset="100%" stop-color="%230c4a6e" stop-opacity="0.95"/></linearGradient></defs><rect width="360" height="240" fill="url(%23sky)"/><rect y="130" width="360" height="110" fill="url(%23water)"/><path d="M0,130 Q90,125 180,130 T360,130 L360,240 L0,240 Z" fill="%2338bdf8" opacity="0.3"/><rect x="40" y="70" width="80" height="70" fill="%23334155"/><polygon points="40,70 80,40 120,70" fill="%23dc2626"/><rect x="220" y="80" width="90" height="60" fill="%23475569"/><polygon points="220,80 265,55 310,80" fill="%23ea580c"/><rect x="140" y="145" width="70" height="30" rx="6" fill="%23cbd5e1" opacity="0.85"/><circle cx="155" cy="175" r="9" fill="%230f172a"/><circle cx="195" cy="175" r="9" fill="%230f172a"/><rect x="15" y="195" width="130" height="30" rx="6" fill="%230369a1" opacity="0.9"/><text x="80" y="215" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">🌊 Water: ~35cm</text></svg>`,
  high: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23475569"/><stop offset="100%" stop-color="%2364748b"/></linearGradient><linearGradient id="water2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230369a1"/><stop offset="100%" stop-color="%23075985"/></linearGradient></defs><rect width="360" height="240" fill="url(%23sky2)"/><rect y="105" width="360" height="135" fill="url(%23water2)"/><path d="M0,105 Q90,98 180,105 T360,105 L360,240 L0,240 Z" fill="%230284c7" opacity="0.4"/><rect x="50" y="50" width="100" height="85" fill="%231e293b"/><polygon points="50,50 100,20 150,50" fill="%23b91c1c"/><rect x="190" y="115" width="85" height="35" rx="6" fill="%23e2e8f0"/><circle cx="210" cy="148" r="10" fill="%230f172a"/><circle cx="255" cy="148" r="10" fill="%230f172a"/><rect x="15" y="190" width="150" height="32" rx="6" fill="%23b91c1c" opacity="0.9"/><text x="90" y="211" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">🚨 Submerged ~65cm</text></svg>`,
  ponding: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240"><defs><linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2394a3b8"/><stop offset="100%" stop-color="%23cbd5e1"/></linearGradient><linearGradient id="water3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2338bdf8"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="360" height="240" fill="url(%23sky3)"/><rect y="150" width="360" height="90" fill="url(%23water3)"/><rect x="60" y="80" width="110" height="80" fill="%23475569"/><polygon points="60,80 115,45 170,80" fill="%230284c7"/><rect x="15" y="195" width="130" height="30" rx="6" fill="%230284c7" opacity="0.9"/><text x="80" y="215" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">⚠️ Ponding ~20cm</text></svg>`
};

// Initial verified citizen reports database
export const COMMUNITY_REPORTS = {
  "zone-klang-utama": {
    count: 22,
    lastReportTime: "8 mins ago",
    condition: "Knee Deep (~40 cm)",
    conditionLevel: "moderate",
    notes: "Main road Jalan Sungai Puloh near residential shops is knee-deep. Sedans cannot pass.",
    photo: SAMPLE_FLOOD_PHOTOS.moderate,
    authoritiesNotified: true,
    recentReports: [
      { user: "Ahmad F.", time: "8 mins ago", depth: "40 cm", notes: "Drain overflowing rapidly, water entered porch." },
      { user: "Tan K. W.", time: "22 mins ago", depth: "35 cm", notes: "Cars diverting away from Persiaran Klang Utama." }
    ]
  },
  "zone-batu3-pinang": {
    count: 18,
    lastReportTime: "14 mins ago",
    condition: "Waist Deep (>60 cm, Submerged)",
    conditionLevel: "high",
    notes: "Severe river backflow from Sg. Rasau drain. Lorong Pinang completely submerged.",
    photo: SAMPLE_FLOOD_PHOTOS.high,
    authoritiesNotified: true,
    recentReports: [
      { user: "Siti Nurhaliza", time: "14 mins ago", depth: "65 cm", notes: "APM rescue boat spotted on site. Evacuate now!" },
      { user: "Kavitha R.", time: "35 mins ago", depth: "55 cm", notes: "Ground floor flooded, electricity cut." }
    ]
  },
  "zone-meru-junction": {
    count: 15,
    lastReportTime: "20 mins ago",
    condition: "Knee Deep (~35 cm)",
    conditionLevel: "moderate",
    notes: "Pekan Meru main cross junction water accumulating fast. Traffic backed up 2km.",
    photo: SAMPLE_FLOOD_PHOTOS.moderate,
    authoritiesNotified: true,
    recentReports: [
      { user: "Mohd Hafiz", time: "20 mins ago", depth: "35 cm", notes: "BHP petrol station junction underwater." }
    ]
  },
  "zone-batu-belah": {
    count: 11,
    lastReportTime: "28 mins ago",
    condition: "Ankle to Knee Deep (~30 cm)",
    conditionLevel: "moderate",
    notes: "Jalan Batu Belah road ponding reaching curbs. Low-lying houses placing sandbags.",
    photo: SAMPLE_FLOOD_PHOTOS.ponding,
    authoritiesNotified: true,
    recentReports: [
      { user: "Lee C. H.", time: "28 mins ago", depth: "30 cm", notes: "Water rising near bridge culvert." }
    ]
  },
  "zone-rasau-tugu": {
    count: 9,
    lastReportTime: "36 mins ago",
    condition: "Heavy Road Ponding (~25 cm)",
    conditionLevel: "moderate",
    notes: "Federal Highway exit towards Tugu Keris has 2 lanes blocked by floodwater.",
    photo: SAMPLE_FLOOD_PHOTOS.ponding,
    authoritiesNotified: false,
    recentReports: [
      { user: "Darren S.", time: "36 mins ago", depth: "25 cm", notes: "Motorcycles stalling in middle lane." }
    ]
  },
  "zone-aman-perdana": {
    count: 7,
    lastReportTime: "45 mins ago",
    condition: "Gutter Overflow (~18 cm)",
    conditionLevel: "moderate",
    notes: "Perimeter monsoon drain reached crest. Surface runoff flowing onto sidewalks.",
    photo: SAMPLE_FLOOD_PHOTOS.ponding,
    authoritiesNotified: false,
    recentReports: [
      { user: "Rajesh K.", time: "45 mins ago", depth: "18 cm", notes: "Monsoon drain overflowing onto pavement." }
    ]
  }
};

let mapInstance = null;
let reportMarkers = [];
let onReportTriggerCallback = null;

/**
 * Initialize Crowd-sourced Community Flood Report Markers on MapLibre
 */
export function initCommunityReportMarkers(map, onAddReportClick) {
  mapInstance = map;
  onReportTriggerCallback = onAddReportClick;
  if (!map) return;

  // Clear existing markers if any
  clearCommunityReportMarkers();

  // Create markers for zones with active crowd reports
  VULNERABILITY_ZONES.forEach(zone => {
    const reportData = COMMUNITY_REPORTS[zone.id];
    if (reportData && reportData.count > 0) {
      createCommunityMarker(zone, reportData);
    }
  });
}

function clearCommunityReportMarkers() {
  reportMarkers.forEach(m => {
    if (m.popup) m.popup.remove();
    m.marker.remove();
  });
  reportMarkers = [];
}

function createCommunityMarker(zone, reportData) {
  const el = document.createElement("div");
  el.className = "community-report-marker";
  el.id = `comm-marker-${zone.id}`;
  el.dataset.zoneId = zone.id;

  // Badge layout: [🔴 Pulse Dot] [📢 22 people reported]
  el.innerHTML = `
    <div class="community-report-pill ${reportData.count >= 15 ? 'pill-severe' : 'pill-alert'}">
      <span class="report-pulse-dot"></span>
      <span class="report-icon">📢</span>
      <span class="report-count-text">(${reportData.count} people reported)</span>
    </div>
  `;

  const popupContent = document.createElement("div");
  popupContent.className = "community-report-popup";
  popupContent.innerHTML = buildCommunityPopupHtml(zone, reportData);

  const popup = new maplibregl.Popup({
    offset: [0, -18],
    closeButton: true,
    maxWidth: "340px",
    className: "custom-community-popup"
  }).setDOMContent(popupContent);

  popup.on("open", () => {
    const addBtn = popupContent.querySelector(".comm-add-report-btn");
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        popup.remove();
        if (onReportTriggerCallback) {
          onReportTriggerCallback(zone.id);
        }
      };
    }
  });

  // Position slightly offset from the central zone marker so both are visible
  const markerCoord = [zone.coord[0] + 0.0035, zone.coord[1] + 0.0022];

  const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
    .setLngLat(markerCoord)
    .setPopup(popup)
    .addTo(mapInstance);

  reportMarkers.push({ zoneId: zone.id, zone, marker, popup, el, popupContent, markerCoord });
}

function buildCommunityPopupHtml(zone, reportData) {
  return `
    <div class="comm-popup-wrapper">
      <div class="comm-popup-header">
        <span class="comm-live-badge">🔴 LIVE CITIZEN REPORT</span>
        <span class="comm-timestamp">${reportData.lastReportTime}</span>
      </div>

      <div class="comm-popup-headline">
        <h4 class="comm-zone-title">${zone.icon} ${zone.shortName}</h4>
        <div class="comm-counter-banner">
          <span class="comm-counter-icon">👥</span>
          <strong>${reportData.count} people reported</strong>
          <span class="comm-counter-sub">this area is flooded</span>
        </div>
      </div>

      <div class="comm-info-grid">
        <div class="comm-info-row">
          <span class="comm-info-label">🌊 Condition:</span>
          <span class="comm-info-val text-danger"><strong>${reportData.condition}</strong></span>
        </div>
        <div class="comm-info-row">
          <span class="comm-info-label">📝 Details:</span>
          <span class="comm-info-val">${reportData.notes || 'Water overflowing roadways; low visibility.'}</span>
        </div>
      </div>

      ${reportData.photo ? `
        <div class="comm-photo-preview-wrap">
          <img src="${reportData.photo}" alt="Citizen Report Photo - ${zone.shortName}" class="comm-popup-img" />
          <div class="comm-photo-overlay">📸 Verified Citizen Photo</div>
        </div>
      ` : ''}

      <div class="comm-popup-footer">
        <button type="button" class="comm-add-report-btn" data-zone-id="${zone.id}">
          <span>📸</span>
          <strong>Add My Report (+1)</strong>
        </button>
      </div>
    </div>
  `;
}

/**
 * Add or update a community report for a zone and update the map live
 */
export function recordCommunityReport(zoneId, reportPayload) {
  let existing = COMMUNITY_REPORTS[zoneId];
  if (!existing) {
    existing = {
      count: 0,
      lastReportTime: "Just now",
      condition: reportPayload.condition || "Ponding Observed",
      conditionLevel: "moderate",
      notes: reportPayload.notes || "",
      photo: reportPayload.photo || SAMPLE_FLOOD_PHOTOS.moderate,
      authoritiesNotified: true,
      recentReports: []
    };
    COMMUNITY_REPORTS[zoneId] = existing;
  }

  // Increment report count
  existing.count += 1;
  existing.lastReportTime = "Just now";
  if (reportPayload.condition) existing.condition = reportPayload.condition;
  if (reportPayload.notes) existing.notes = reportPayload.notes;
  if (reportPayload.photo) existing.photo = reportPayload.photo;

  existing.recentReports.unshift({
    user: reportPayload.userName || "Verified Citizen",
    time: "Just now",
    depth: reportPayload.condition || "Active Flood",
    notes: reportPayload.notes || ""
  });

  // Update or create marker on map
  const item = reportMarkers.find(m => m.zoneId === zoneId);
  const zone = VULNERABILITY_ZONES.find(z => z.id === zoneId);

  if (item) {
    // Update marker element badge text
    const textEl = item.el.querySelector(".report-count-text");
    if (textEl) {
      textEl.textContent = `(${existing.count} people reported)`;
    }
    // Update popup HTML
    item.popupContent.innerHTML = buildCommunityPopupHtml(item.zone, existing);
    const addBtn = item.popupContent.querySelector(".comm-add-report-btn");
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.popup.remove();
        if (onReportTriggerCallback) onReportTriggerCallback(zoneId);
      };
    }
  } else if (zone && mapInstance) {
    createCommunityMarker(zone, existing);
  }

  return existing;
}

/**
 * Focus and open the community report popup on the map for a given zone
 */
export function showCommunityReportOnMap(zoneId) {
  const item = reportMarkers.find(m => m.zoneId === zoneId);
  if (item && mapInstance) {
    mapInstance.easeTo({
      center: item.markerCoord,
      zoom: 15.4,
      duration: 800
    });
    setTimeout(() => {
      item.popup.addTo(mapInstance);
    }, 450);
  } else {
    const zone = VULNERABILITY_ZONES.find(z => z.id === zoneId);
    if (zone && mapInstance) {
      mapInstance.easeTo({
        center: zone.coord,
        zoom: 15.4,
        duration: 800
      });
    }
  }
}
