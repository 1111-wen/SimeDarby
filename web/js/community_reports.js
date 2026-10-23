/**
 * community_reports.js
 * Crowd-sourced Citizen Flood Reporting System for FloodShield (Klang, Selangor)
 */

import { VULNERABILITY_ZONES } from "./inundation.js";

// Realistic sample photo base64 SVGs for demonstration & offline fallback
export const SAMPLE_FLOOD_PHOTOS = {
  moderate: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNjAiIGhlaWdodD0iMjQwIiB2aWV3Qm94PSIwIDAgMzYwIDI0MCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJza3kiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNjQ3NDhiIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjOTRhM2I4Ii8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9IndhdGVyIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAyODRjNyIgc3RvcC1vcGFjaXR5PSIwLjg1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMGM0YTZlIiBzdG9wLW9wYWNpdHk9IjAuOTUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzYwIiBoZWlnaHQ9IjI0MCIgZmlsbD0idXJsKCNza3kpIi8+PHJlY3QgeT0iMTMwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjExMCIgZmlsbD0idXJsKCN3YXRlcikiLz48cGF0aCBkPSJNMCwxMzAgUTkwLDEyNSAxODAsMTMwIFQzNjAsMTMwIEwzNjAsMjQwIEwwLDI0MCBaIiBmaWxsPSIjMzhiZGY4IiBvcGFjaXR5PSIwLjMiLz48cmVjdCB4PSI0MCIgeT0iNzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI3MCIgZmlsbD0iIzMzNDE1NSIvPjxwb2x5Z29uIHBvaW50cz0iNDAsNzAgODAsNDAgMTIwLDcwIiBmaWxsPSIjZGMyNjI2Ii8+PHJlY3QgeD0iMjIwIiB5PSI4MCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNDc1NTY5Ii8+PHBvbHlnb24gcG9pbnRzPSIyMjAsODAgMjY1LDU1IDMxMCw4MCIgZmlsbD0iI2VhNTgwYyIvPjxyZWN0IHg9IjE0MCIgeT0iMTQ1IiB3aWR0aD0iNzAiIGhlaWdodD0iMzAiIHJ4PSI2IiBmaWxsPSIjY2JkNWUxIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMTU1IiBjeT0iMTc1IiByPSI5IiBmaWxsPSIjMGYxNzJhIi8+PGNpcmNsZSBjeD0iMTk1IiBjeT0iMTc1IiByPSI5IiBmaWxsPSIjMGYxNzJhIi8+PHJlY3QgeD0iMTUiIHk9IjE5NSIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIzMCIgcng9IjYiIGZpbGw9IiMwMzY5YTEiIG9wYWNpdHk9IjAuOSIvPjx0ZXh0IHg9IjgwIiB5PSIyMTUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V2F0ZXI6IH4zNWNtPC90ZXh0Pjwvc3ZnPg==",
  high: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNjAiIGhlaWdodD0iMjQwIiB2aWV3Qm94PSIwIDAgMzYwIDI0MCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJza3kyIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzQ3NTU2OSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzY0NzQ4YiIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJ3YXRlcjIiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDM2OWExIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDc1OTg1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjM2MCIgaGVpZ2h0PSIyNDAiIGZpbGw9InVybCgjc2t5MikiLz48cmVjdCB5PSIxMDUiIHdpZHRoPSIzNjAiIGhlaWdodD0iMTM1IiBmaWxsPSJ1cmwoI3dhdGVyMikiLz48cGF0aCBkPSJNMCwxMDUgUTkwLDk4IDE4MCwxMDUgVDM2MCwxMDUgTDM2MCwyNDAgTDAsMjQwIFoiIGZpbGw9IiMwMjg0YzciIG9wYWNpdHk9IjAuNCIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4NSIgZmlsbD0iIzFlMjkzYiIvPjxwb2x5Z29uIHBvaW50cz0iNTAsNTAgMTAwLDIwIDE1MCw1MCIgZmlsbD0iI2I5MWMxYyIvPjxyZWN0IHg9IjE5MCIgeT0iMTE1IiB3aWR0aD0iODUiIGhlaWdodD0iMzUiIHJ4PSI2IiBmaWxsPSIjZTJlOGYwIi8+PGNpcmNsZSBjeD0iMjEwIiBjeT0iMTQ4IiByPSIxMCIgZmlsbD0iIzBmMTcyYSIvPjxjaXJjbGUgY3g9IjI1NSIgY3k9IjE0OCIgcj0iMTAiIGZpbGw9IiMwZjE3MmEiLz48cmVjdCB4PSIxNSIgeT0iMTkwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iI2I5MWMxYyIgb3BhY2l0eT0iMC45Ii8+PHRleHQgeD0iOTAiIHk9IjIxMSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdWJtZXJnZWQgfjY1Y208L3RleHQ+PC9zdmc+",
  ponding: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNjAiIGhlaWdodD0iMjQwIiB2aWV3Qm94PSIwIDAgMzYwIDI0MCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJza3kzIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzk0YTNiOCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2NiZDVlMSIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJ3YXRlcjMiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMzhiZGY4Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDI4NGM3Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjM2MCIgaGVpZ2h0PSIyNDAiIGZpbGw9InVybCgjc2t5MykiLz48cmVjdCB5PSIxNTAiIHdpZHRoPSIzNjAiIGhlaWdodD0iOTAiIGZpbGw9InVybCgjd2F0ZXIzKSIvPjxyZWN0IHg9IjYwIiB5PSI4MCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzQ3NTU2OSIvPjxwb2x5Z29uIHBvaW50cz0iNjAsODAgMTE1LDQ1IDE3MCw4MCIgZmlsbD0iIzAyODRjNyIvPjxyZWN0IHg9IjE1IiB5PSIxOTUiIHdpZHRoPSIxMzAiIGhlaWdodD0iMzAiIHJ4PSI2IiBmaWxsPSIjMDI4NGM3IiBvcGFjaXR5PSIwLjkiLz48dGV4dCB4PSI4MCIgeT0iMjE1IiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBvbmRpbmcgfjIwY208L3RleHQ+PC9zdmc+"
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
