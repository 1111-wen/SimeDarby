/**
 * report_modal.js
 * Citizen Flood Incident Reporting Modal and Form Workflow
 */

import { VULNERABILITY_ZONES } from "./inundation.js";
import { SAMPLE_FLOOD_PHOTOS, recordCommunityReport, showCommunityReportOnMap } from "./community_reports.js";

let modalContainer = null;
let currentUploadedPhotoData = SAMPLE_FLOOD_PHOTOS.moderate; // default sample photo
let currentSelectedZoneId = "zone-klang-utama";
let onReportSubmittedCallback = null;

function getContainer() {
  return modalContainer || document.getElementById("reportModalSlot") || document.getElementById("reportFloodModal");
}

export function initReportModal(containerEl, onReportSuccess) {
  modalContainer = containerEl || document.getElementById("reportModalSlot");
  onReportSubmittedCallback = onReportSuccess;
  renderReportForm("zone-klang-utama");
}

export function openReportModal(preselectedZoneId = "zone-klang-utama") {
  const backdrop = document.getElementById("reportModalBackdrop");
  const slot = document.getElementById("reportModalSlot");
  modalContainer = slot || backdrop;
  currentSelectedZoneId = preselectedZoneId;
  currentUploadedPhotoData = SAMPLE_FLOOD_PHOTOS.moderate;
  renderReportForm(preselectedZoneId);

  if (backdrop) {
    backdrop.removeAttribute("hidden");
    backdrop.hidden = false;
    backdrop.style.display = "flex";
  }

  const reportBtn = document.getElementById("reportBtn");
  if (reportBtn) reportBtn.setAttribute("aria-pressed", "true");
}

export function closeReportModal() {
  const backdrop = document.getElementById("reportModalBackdrop");
  if (backdrop) {
    backdrop.setAttribute("hidden", "");
    backdrop.hidden = true;
    backdrop.style.display = "none";
  }
  const reportBtn = document.getElementById("reportBtn");
  if (reportBtn) reportBtn.setAttribute("aria-pressed", "false");
}

/**
 * Step 1: Render Report Submission Form
 */
function renderReportForm(selectedZoneId) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${hours}:${mins}`;

  const zoneOptionsHtml = VULNERABILITY_ZONES.map(z => {
    const isSelected = z.id === selectedZoneId;
    return `<option value="${z.id}" ${isSelected ? 'selected' : ''}>${z.icon} ${z.shortName}</option>`;
  }).join("");

  const container = getContainer();
  if (!container) return;
  container.innerHTML = `
    <div class="report-modal-content">
      <!-- Header -->
      <div class="risk-panel-header" style="margin-bottom:10px;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="color:#e11d48;">📢</span>
          <div>
            <strong style="color:#be123c; font-size:13px;">Report Flood Incident</strong>
            <small style="display:block; font-size:10.5px; color:var(--muted); font-weight:normal;">Live Citizen Crowd-Alert Network &bull; Klang</small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="reportCloseBtn" aria-label="Close report">&times;</button>
      </div>

      <!-- Scrollable Form Container -->
      <form id="floodIncidentForm" class="report-form-body">
        <!-- 1. Location Selection -->
        <div class="form-group">
          <label class="form-label" for="reportZoneSelect">
            <span>📍</span> <strong>Select Flooded Area in Klang:</strong>
          </label>
          <div class="select-with-btn">
            <select id="reportZoneSelect" class="form-select" required>
              ${zoneOptionsHtml}
            </select>
          </div>
        </div>

        <!-- 2. Flood Condition / Severity -->
        <div class="form-group">
          <label class="form-label">
            <span>🌊</span> <strong>Condition & Water Depth:</strong>
          </label>
          <div class="condition-chips-grid" id="conditionChipsGroup">
            <button type="button" class="condition-chip" data-val="Ankle Deep (~10-20 cm)" data-photo="ponding">
              <span>🌊</span> Ankle Deep (10-20cm)
            </button>
            <button type="button" class="condition-chip active" data-val="Knee Deep (~30-50 cm)" data-photo="moderate">
              <span>🌊</span> Knee Deep (30-50cm)
            </button>
            <button type="button" class="condition-chip" data-val="Waist Deep (>60 cm, Submerged)" data-photo="high">
              <span>🚨</span> Waist Deep (>60cm)
            </button>
            <button type="button" class="condition-chip" data-val="Road Submerged / Impassable" data-photo="high">
              <span>⚠️</span> Road Submerged
            </button>
          </div>
          <input type="hidden" id="reportConditionInput" value="Knee Deep (~30-50 cm)" />
        </div>

        <!-- 3. Time of Observation -->
        <div class="form-group">
          <label class="form-label" for="reportTimeInput">
            <span>⏱️</span> <strong>Incident Time:</strong>
          </label>
          <input type="time" id="reportTimeInput" class="form-input" value="${currentTimeStr}" required />
        </div>

        <!-- 4. Photo Evidence Upload -->
        <div class="form-group">
          <label class="form-label">
            <span>📸</span> <strong>Upload / Take Flood Photo:</strong>
          </label>

          <div class="photo-upload-zone" id="photoDropZone">
            <input type="file" id="reportPhotoFile" accept="image/*" capture="environment" style="display:none;" />
            <div class="upload-prompt" id="uploadPrompt" style="display:none;">
              <span class="upload-icon">📷</span>
              <strong>Click to Take Photo or Browse</strong>
              <small>Supports camera capture or gallery image</small>
            </div>
            <div class="photo-preview-wrap" id="photoPreviewWrap">
              <img id="photoPreviewImg" src="${currentUploadedPhotoData}" alt="Uploaded Flood Evidence" class="photo-preview-thumb" />
              <button type="button" class="photo-change-btn" id="photoChangeBtn">🔄 Choose Photo / Retake</button>
            </div>
          </div>

          <!-- Quick Sample Photo Selectors -->
          <div class="sample-photos-row">
            <span style="font-size:10.5px; color:var(--muted); font-weight:600;">Presets:</span>
            <button type="button" class="sample-preset-btn active" data-type="moderate">🌊 35cm Road</button>
            <button type="button" class="sample-preset-btn" data-type="high">🚨 65cm Submerged</button>
            <button type="button" class="sample-preset-btn" data-type="ponding">⚠️ 20cm Ponding</button>
          </div>
        </div>

        <!-- 5. Additional Description -->
        <div class="form-group">
          <label class="form-label" for="reportNotes">
            <span>📝</span> <strong>Situation Details (Road, landmarks, trapped cars):</strong>
          </label>
          <textarea id="reportNotes" class="form-textarea" rows="2" placeholder="e.g. Jalan Meru near residential junction submerged, drain overflowing, sedans cannot pass."></textarea>
        </div>

        <!-- 6. Reporter Name / Contact -->
        <div class="form-group">
          <label class="form-label" for="reporterName">
            <span>👤</span> <strong>Reporter Name (Optional):</strong>
          </label>
          <input type="text" id="reporterName" class="form-input" placeholder="e.g. Local Resident / Driver (or Anonymous)" />
        </div>

        <!-- Submit Button -->
        <div class="form-submit-row">
          <button type="submit" class="submit-report-btn" id="submitReportBtn">
            <span>🚀</span>
            <strong>Submit Flood Report</strong>
          </button>
        </div>
      </form>
    </div>
  `;

  bindFormEvents();
}

function bindFormEvents() {
  const closeBtn = document.getElementById("reportCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeReportModal();

  const fileInput = document.getElementById("reportPhotoFile");
  const changeBtn = document.getElementById("photoChangeBtn");
  const uploadPrompt = document.getElementById("uploadPrompt");
  const previewImg = document.getElementById("photoPreviewImg");

  if (changeBtn && fileInput) {
    changeBtn.onclick = () => fileInput.click();
  }
  if (uploadPrompt && fileInput) {
    uploadPrompt.onclick = () => fileInput.click();
  }

  // Handle actual file upload or camera photo
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          currentUploadedPhotoData = loadEvt.target.result;
          if (previewImg) previewImg.src = currentUploadedPhotoData;
          document.querySelectorAll(".sample-preset-btn").forEach(b => b.classList.remove("active"));
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Condition chip selectors
  const conditionInput = document.getElementById("reportConditionInput");
  document.querySelectorAll(".condition-chip").forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll(".condition-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      if (conditionInput) conditionInput.value = chip.dataset.val;

      // Auto update sample photo matching condition if user hasn't uploaded custom photo
      const photoKey = chip.dataset.photo;
      if (photoKey && SAMPLE_FLOOD_PHOTOS[photoKey]) {
        currentUploadedPhotoData = SAMPLE_FLOOD_PHOTOS[photoKey];
        if (previewImg) previewImg.src = currentUploadedPhotoData;
        document.querySelectorAll(".sample-preset-btn").forEach(b => {
          if (b.dataset.type === photoKey) b.classList.add("active");
          else b.classList.remove("active");
        });
      }
    };
  });

  // Preset sample photo buttons
  document.querySelectorAll(".sample-preset-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".sample-preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.dataset.type;
      if (key && SAMPLE_FLOOD_PHOTOS[key]) {
        currentUploadedPhotoData = SAMPLE_FLOOD_PHOTOS[key];
        if (previewImg) previewImg.src = currentUploadedPhotoData;
      }
    };
  });

  // Form submit handler
  const form = document.getElementById("floodIncidentForm");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const zoneSelect = document.getElementById("reportZoneSelect");
      const zoneId = zoneSelect ? zoneSelect.value : "zone-klang-utama";
      const condition = conditionInput ? conditionInput.value : "Knee Deep (~30-50 cm)";
      const timeVal = document.getElementById("reportTimeInput") ? document.getElementById("reportTimeInput").value : "Just now";
      const notes = document.getElementById("reportNotes") ? document.getElementById("reportNotes").value.trim() : "";
      const reporter = document.getElementById("reporterName") ? document.getElementById("reporterName").value.trim() : "Citizen Reporter";

      const zone = VULNERABILITY_ZONES.find(z => z.id === zoneId) || VULNERABILITY_ZONES[0];

      // Save to community reports database & update map
      const updatedRecord = recordCommunityReport(zoneId, {
        userName: reporter,
        condition: condition,
        notes: notes || "Water level overflowing onto roads and walkways.",
        photo: currentUploadedPhotoData
      });

      // Switch to Step 2: Confirmation / Success screen
      renderReportSuccessView({
        zone: zone,
        zoneId: zoneId,
        condition: condition,
        time: timeVal,
        notes: notes || "Active flood water observed along main roadways.",
        photo: currentUploadedPhotoData,
        totalReports: updatedRecord.count
      });

      if (onReportSubmittedCallback) {
        onReportSubmittedCallback(zoneId, updatedRecord);
      }
    };
  }
}

/**
 * Step 2: Render Submitted Confirmation Page with Details & Thank You
 */
function renderReportSuccessView(data) {
  const container = getContainer();
  if (!container) return;
  container.innerHTML = `
    <div class="report-modal-content report-success-content">
      <!-- Success Header -->
      <div class="risk-panel-header" style="margin-bottom:12px; border-bottom:1px solid #86efac;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="color:#16a34a; font-size:18px;">✅</span>
          <div>
            <strong style="color:#15803d; font-size:13.5px;">Report Submitted Successfully!</strong>
            <small style="display:block; font-size:10.5px; color:#166534; font-weight:normal;">Live Community Broadcast Active</small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="reportCloseBtn" aria-label="Close confirmation">&times;</button>
      </div>

      <!-- Thank You Message -->
      <div class="thank-you-banner">
        <div class="thank-you-badge">🎉 Thank You for Your Report!</div>
        <p class="thank-you-desc">
          Your flood report has been logged and shared with local authorities (MBDK & APM Emergency Command) and fellow road users.
        </p>
      </div>

      <!-- Report Details Card filled by user -->
      <div class="submitted-details-card">
        <div class="submitted-detail-row">
          <span class="sub-label">📍 Location:</span>
          <span class="sub-value"><strong>${data.zone.icon} ${data.zone.shortName}</strong></span>
        </div>

        <div class="submitted-detail-row">
          <span class="sub-label">⏱️ Time Reported:</span>
          <span class="sub-value"><strong>${data.time}</strong></span>
        </div>

        <div class="submitted-detail-row">
          <span class="sub-label">🌊 Flood Condition:</span>
          <span class="sub-value text-danger"><strong>${data.condition}</strong></span>
        </div>

        ${data.notes ? `
          <div class="submitted-detail-row">
            <span class="sub-label">📝 Details:</span>
            <span class="sub-value">${data.notes}</span>
          </div>
        ` : ''}

        <!-- Photo Evidence -->
        <div class="submitted-photo-wrap">
          <div style="font-size:11px; font-weight:700; color:var(--muted); margin-bottom:4px;">📷 Photo Evidence Uploaded:</div>
          <img src="${data.photo}" alt="Submitted Evidence" class="submitted-photo-img" />
        </div>

        <!-- Live Impact Banner -->
        <div class="community-impact-banner">
          <span class="impact-icon">📢</span>
          <div>
            <strong>(${data.totalReports} people reported)</strong>
            <span style="display:block; font-size:10.5px; color:#475569;">Live map marker has been updated for ${data.zone.shortName}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="success-actions-row">
        <button type="button" class="view-map-btn" id="viewOnMapBtn">
          <span>🗺️</span>
          <strong>View Alert on Map</strong>
        </button>
        <button type="button" class="submit-another-btn" id="submitAnotherBtn">
          <span>➕</span>
          <span>Submit Another</span>
        </button>
      </div>
    </div>
  `;

  // Bind confirmation actions
  const closeBtn = document.getElementById("reportCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeReportModal();

  const viewMapBtn = document.getElementById("viewOnMapBtn");
  if (viewMapBtn) {
    viewMapBtn.onclick = () => {
      closeReportModal();
      showCommunityReportOnMap(data.zoneId);
    };
  }

  const anotherBtn = document.getElementById("submitAnotherBtn");
  if (anotherBtn) {
    anotherBtn.onclick = () => {
      renderReportForm(data.zoneId);
    };
  }
}
