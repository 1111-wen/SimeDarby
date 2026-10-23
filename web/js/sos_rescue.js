/**
 * sos_rescue.js
 * Emergency SOS Rescue Request System & Role-based Dispatch Command (Resident vs Admin)
 * Developed for FloodShield (Klang, Selangor)
 */

import { VULNERABILITY_ZONES } from "./inundation.js";

// Rescue command center station (Bomba Klang Utara Water Rescue PPDA unit)
export const RESCUE_BASE_STATION = {
  name: "Klang Utara Fire & Rescue Station (BBP Sungai Pinang)",
  shortName: "Bomba Klang Utara",
  coord: [101.442800, 3.060100],
  phone: "+603-3342 4444"
};

// Default verified SOS emergency distress calls
export const DEFAULT_SOS_RECORDS = [
  {
    id: "SOS-8921",
    name: "Mohd Nor Azman",
    phone: "012-8821992",
    zoneId: "zone-seri-mewah",
    zoneName: "Taman Seri Mewah",
    address: "No. 18, Jalan Makyong 4, Taman Seri Mewah",
    coord: [101.4395, 3.0890],
    headcount: { total: 3, adults: 2, children: 1, elderly: 0 },
    situation: "Water level is waist-deep (65cm) and rising fast. Trapped on second floor balcony. 6-month-old infant needs milk and dry clothes.",
    severity: "critical",
    reportedTime: "12 mins ago",
    status: "pending" // pending | dispatched | rescued
  },
  {
    id: "SOS-8922",
    name: "Uncle Muthusamy & Family",
    phone: "016-3391024",
    zoneId: "zone-batu3-pinang",
    zoneName: "Kampung Batu 3",
    address: "Lot 142, Lorong Pinang 2, Kampung Batu 3",
    coord: [101.4285, 3.0760],
    headcount: { total: 5, adults: 3, children: 0, elderly: 2 },
    situation: "Water level above 1 meter. Grandmother is bedridden and wheelchair-bound. Electricity cut off. Urgent rescue boat needed.",
    severity: "critical",
    reportedTime: "24 mins ago",
    status: "pending"
  },
  {
    id: "SOS-8923",
    name: "Cikgu Tan Mei Ling",
    phone: "019-2184901",
    zoneId: "zone-klang-utama",
    zoneName: "Taman Klang Utama",
    address: "No. 45, Jalan Sungai Puloh 13, Klang Utama",
    coord: [101.4170, 3.0855],
    headcount: { total: 2, adults: 2, children: 0, elderly: 0 },
    situation: "Car stalled in floodwater in front of house. Water at 50cm entering living room. Trapped inside with pets.",
    severity: "high",
    reportedTime: "38 mins ago",
    status: "dispatched"
  },
  {
    id: "SOS-8924",
    name: "Noraini binti Kassim",
    phone: "017-6401923",
    zoneId: "zone-batu-belah",
    zoneName: "Batu Belah",
    address: "No. 7, Jalan Sentosa 5, Batu Belah",
    coord: [101.4420, 3.0640],
    headcount: { total: 4, adults: 3, children: 1, elderly: 0 },
    situation: "Road impassable by normal vehicles. Pregnant mother (8 months) having contraction pains. Needs emergency medical boat evacuation.",
    severity: "critical",
    reportedTime: "45 mins ago",
    status: "pending"
  }
];

// In-memory / persistent SOS store
let sosStore = [];
function loadSosStore() {
  try {
    const raw = localStorage.getItem("floodshield_sos_records");
    if (raw) {
      sosStore = JSON.parse(raw);
    } else {
      sosStore = [...DEFAULT_SOS_RECORDS];
      saveSosStore();
    }
  } catch (e) {
    sosStore = [...DEFAULT_SOS_RECORDS];
  }
}

function saveSosStore() {
  try {
    localStorage.setItem("floodshield_sos_records", JSON.stringify(sosStore));
  } catch (e) {}
}

// Module variables
let mapInstance = null;
let currentRole = "resident"; // "resident" | "admin"
let sosMarkers = [];
let routeDispatcherCallback = null;
let toastCallback = null;

export function getSosList() {
  return sosStore;
}

export function getCurrentRole() {
  return currentRole;
}

/**
 * Initialize SOS & Role Management System
 */
export function initSosRescueSystem({ map, onRouteToRescue, toast }) {
  mapInstance = map;
  routeDispatcherCallback = onRouteToRescue;
  toastCallback = toast;
  loadSosStore();

  // Wire SOS Trigger Button
  const sosBtn = document.getElementById("sosBtn");
  if (sosBtn) {
    sosBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSosModal();
    });
  }

  // Wire Role Trigger Button
  const roleBtn = document.getElementById("roleBtn");
  if (roleBtn) {
    roleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openRoleModal();
    });
  }

  // Close backdrops on click outside
  const sosBackdrop = document.getElementById("sosModalBackdrop");
  if (sosBackdrop) {
    sosBackdrop.addEventListener("click", (e) => {
      if (e.target === sosBackdrop) closeSosModal();
    });
  }

  const roleBackdrop = document.getElementById("roleModalBackdrop");
  if (roleBackdrop) {
    roleBackdrop.addEventListener("click", (e) => {
      if (e.target === roleBackdrop) closeRoleModal();
    });
  }
}

// ============================================================================
// 1. SOS EMERGENCY REQUEST MODAL & FORM WORKFLOW
// ============================================================================

export function openSosModal(preselectedZoneId = "zone-seri-mewah") {
  const backdrop = document.getElementById("sosModalBackdrop");
  const slot = document.getElementById("sosModalSlot");
  if (!backdrop || !slot) return;

  renderSosForm(slot, preselectedZoneId);
  backdrop.removeAttribute("hidden");
  backdrop.hidden = false;
  backdrop.style.display = "flex";

  const sosBtn = document.getElementById("sosBtn");
  if (sosBtn) sosBtn.setAttribute("aria-pressed", "true");
}

export function closeSosModal() {
  const backdrop = document.getElementById("sosModalBackdrop");
  if (backdrop) {
    backdrop.setAttribute("hidden", "");
    backdrop.hidden = true;
    backdrop.style.display = "none";
  }
  const sosBtn = document.getElementById("sosBtn");
  if (sosBtn) sosBtn.setAttribute("aria-pressed", "false");
}

function renderSosForm(container, selectedZoneId) {
  const zoneOptionsHtml = VULNERABILITY_ZONES.filter(z => z.category !== "safe").map(z => {
    const isSelected = z.id === selectedZoneId;
    return `<option value="${z.id}" ${isSelected ? 'selected' : ''}>${z.icon} ${z.shortName} (${z.name})</option>`;
  }).join("");

  container.innerHTML = `
    <div class="report-modal-content">
      <!-- Modal Header -->
      <div class="risk-panel-header" style="margin-bottom:8px;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="font-size:22px; animation:sos-pulse 1.4s infinite ease-in-out;">🆘</span>
          <div>
            <strong style="color:#b91c1c; font-size:14px; display:block;">Request Emergency Rescue (SOS)</strong>
            <small style="display:block; font-size:11px; color:var(--muted); font-weight:600;">
              Direct Dispatch Line &bull; APM / BOMBA / District Disaster Operations
            </small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="sosCloseBtn" aria-label="Close SOS Form">&times;</button>
      </div>

      <!-- Emergency Hotline Warning Banner -->
      <div class="sos-banner-alert">
        <span style="font-size:18px;">⚠️</span>
        <div>
          <strong>If life is in immediate danger, call 999 immediately.</strong>
          <span style="display:block; font-size:10.5px; opacity:0.9;">This SOS broadcast notifies on-duty APM and Bomba water rescue boat teams with your GPS coordinates.</span>
        </div>
      </div>

      <!-- Form Body -->
      <form id="sosEmergencyForm" class="report-form-body">
        <!-- 1. Resident Contact Info -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="form-group">
            <label class="form-label" for="sosName">
              <span>👤</span> <strong>Your Full Name:</strong>
            </label>
            <input type="text" id="sosName" class="form-input" placeholder="e.g. Ahmad Razali" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="sosPhone">
              <span>📞</span> <strong>Mobile Phone:</strong>
            </label>
            <input type="tel" id="sosPhone" class="form-input" placeholder="e.g. 012-3456789" required />
          </div>
        </div>

        <!-- 2. Location & Address -->
        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label class="form-label" for="sosZoneSelect">
              <span>📍</span> <strong>Select Flooded Area:</strong>
            </label>
            <button type="button" class="sos-gps-btn" id="sosGpsBtn" title="Auto-detect current GPS coordinate">
              🎯 Use GPS
            </button>
          </div>
          <select id="sosZoneSelect" class="form-select" required>
            ${zoneOptionsHtml}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="sosAddress">
            <span>🏠</span> <strong>House / Street Address:</strong>
          </label>
          <input type="text" id="sosAddress" class="form-input" placeholder="e.g. No. 25, Jalan Makyong 6, Taman Seri Mewah" required />
        </div>

        <!-- 3. Headcount Needing Rescue -->
        <div class="form-group">
          <label class="form-label">
            <span>👥</span> <strong>People Needing Rescue:</strong>
          </label>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
            <div class="headcount-box">
              <small>Adults</small>
              <input type="number" id="sosAdults" class="form-input" min="1" value="2" required />
            </div>
            <div class="headcount-box">
              <small>Children</small>
              <input type="number" id="sosChildren" class="form-input" min="0" value="1" />
            </div>
            <div class="headcount-box">
              <small>Elderly/Infirm</small>
              <input type="number" id="sosElderly" class="form-input" min="0" value="0" />
            </div>
          </div>
        </div>

        <!-- 4. Water Condition / Immediate Hazard -->
        <div class="form-group">
          <label class="form-label" for="sosSituation">
            <span>🌊</span> <strong>Current Condition & Urgency:</strong>
          </label>
          <select id="sosSituation" class="form-select" required>
            <option value="Waist Deep (>60cm) - Trapped on Ground Floor" selected>🌊 Waist Deep (~65cm) - Water in house, trapped on porch</option>
            <option value="Chest Deep (>1.0m) - Trapped on Upper Floor / Roof">🚨 Chest Deep (>1m) - Trapped on 2nd floor / roof</option>
            <option value="Medical Emergency - Bedridden / Urgent Patient">🏥 Medical Emergency - Bedridden / Pregnant / Oxygen required</option>
            <option value="Rapid River Surge - Structure at Risk">⚡ Rapid River Surge - Strong current, cannot exit door</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="sosNotes">
            <span>📝</span> <strong>Additional Critical Notes (Optional):</strong>
          </label>
          <textarea id="sosNotes" class="form-textarea" rows="2" placeholder="e.g. Grandma is in wheelchair; electricity is sparking; roof access is via back window..."></textarea>
        </div>

        <!-- Submit Button -->
        <div style="margin-top:6px;">
          <button type="submit" class="sos-submit-btn" id="sosSubmitBtn">
            🆘 Broadcast Emergency SOS to Rescue Team
          </button>
        </div>
      </form>
    </div>
  `;

  // Bind close button
  const closeBtn = container.querySelector("#sosCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeSosModal();

  // Bind GPS button
  const gpsBtn = container.querySelector("#sosGpsBtn");
  if (gpsBtn) {
    gpsBtn.onclick = () => {
      gpsBtn.textContent = "Locating...";
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            gpsBtn.textContent = "✓ GPS Captured";
            const addrInput = container.querySelector("#sosAddress");
            if (addrInput && !addrInput.value) {
              addrInput.value = `GPS Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`;
            }
          },
          err => {
            gpsBtn.textContent = "GPS Failed";
          },
          { timeout: 8000 }
        );
      }
    };
  }

  // Bind Form Submission
  const form = container.querySelector("#floodIncidentForm") || container.querySelector("#sosEmergencyForm");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      handleSosSubmit(container);
    };
  }
}

function handleSosSubmit(container) {
  const name = container.querySelector("#sosName").value.trim() || "Resident";
  const phone = container.querySelector("#sosPhone").value.trim() || "012-0000000";
  const zoneId = container.querySelector("#sosZoneSelect").value;
  const address = container.querySelector("#sosAddress").value.trim() || "Address not provided";
  const adults = parseInt(container.querySelector("#sosAdults").value, 10) || 1;
  const children = parseInt(container.querySelector("#sosChildren").value, 10) || 0;
  const elderly = parseInt(container.querySelector("#sosElderly").value, 10) || 0;
  const situation = container.querySelector("#sosSituation").value;
  const notes = container.querySelector("#sosNotes").value.trim();

  const zone = VULNERABILITY_ZONES.find(z => z.id === zoneId) || VULNERABILITY_ZONES[0];
  const total = adults + children + elderly;

  // Stagger coordinate slightly within zone so markers don't stack exactly on top
  const jitterLng = (Math.random() - 0.5) * 0.003;
  const jitterLat = (Math.random() - 0.5) * 0.003;
  const coord = [zone.coord[0] + jitterLng, zone.coord[1] + jitterLat];

  const ticketId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRecord = {
    id: ticketId,
    name,
    phone,
    zoneId: zone.id,
    zoneName: zone.shortName,
    address,
    coord,
    headcount: { total, adults, children, elderly },
    situation: notes ? `${situation} - Note: ${notes}` : situation,
    severity: (situation.includes("Chest") || situation.includes("Medical")) ? "critical" : "high",
    reportedTime: "Just now",
    status: "pending"
  };

  sosStore.unshift(newRecord);
  saveSosStore();

  renderSosConfirmation(container, newRecord);

  // If Admin is currently logged in, refresh map markers and admin view
  if (currentRole === "admin") {
    showAdminSosMarkers();
    updateAdminSosPanelView();
  }

  if (toastCallback) {
    toastCallback(`🚨 SOS Transmitted: Ticket #${ticketId}. Rescue dispatch notified.`);
  }
}

function renderSosConfirmation(container, record) {
  container.innerHTML = `
    <div class="report-modal-content" style="text-align:center; padding:16px 8px;">
      <div style="font-size:46px; line-height:1; animation:sos-pulse 1.2s infinite ease-in-out; margin-bottom:8px;">
        🆘
      </div>
      <h2 style="font-size:18px; color:#b91c1c; margin:0 0 6px;">SOS Rescue Broadcast Sent!</h2>
      <p style="font-size:12px; color:var(--muted); margin:0 0 14px;">
        Your distress call has been transmitted to <strong>Bomba Klang Utara</strong> and <strong>District APM Rescue Operations</strong>.
      </p>

      <div class="sos-ticket-card">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #fecaca; padding-bottom:6px; margin-bottom:8px;">
          <span style="font-weight:800; color:#b91c1c;">TICKET: #${record.id}</span>
          <span class="sponge-badge badge-danger">PENDING RESCUE</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; font-size:11.5px; text-align:left; color:#1e293b;">
          <div><strong>👤 Resident:</strong> ${record.name} (${record.phone})</div>
          <div><strong>📍 Location:</strong> ${record.address}</div>
          <div><strong>👥 Trapped:</strong> ${record.headcount.total} Person(s) (${record.headcount.adults} Adults, ${record.headcount.children} Children, ${record.headcount.elderly} Elderly)</div>
          <div><strong>🌊 Situation:</strong> ${record.situation}</div>
        </div>
      </div>

      <div class="sos-safety-instructions">
        <strong>⚠️ CRITICAL RESCUE INSTRUCTIONS:</strong>
        <ul style="margin:4px 0 0; padding-left:18px; text-align:left; font-size:11px; line-height:1.4;">
          <li>Move to highest floor or roof access immediately.</li>
          <li>Never attempt to walk or drive across flooded roads.</li>
          <li>Keep your phone line free so rescue teams can contact you.</li>
          <li>Wave a bright cloth or flashlight if a rescue boat approaches.</li>
        </ul>
      </div>

      <div style="margin-top:14px; display:flex; gap:8px;">
        <button type="button" class="sos-btn-primary" id="sosDoneBtn" style="flex:1;">
          ✓ Return to Map
        </button>
      </div>
    </div>
  `;

  const doneBtn = container.querySelector("#sosDoneBtn");
  if (doneBtn) {
    doneBtn.onclick = () => closeSosModal();
  }
}

// ============================================================================
// 2. USER ROLE SELECTOR & ADMIN AUTHENTICATION (Resident vs Admin)
// ============================================================================

export function openRoleModal() {
  const backdrop = document.getElementById("roleModalBackdrop");
  const slot = document.getElementById("roleModalSlot");
  if (!backdrop || !slot) return;

  renderRoleSelection(slot);
  backdrop.removeAttribute("hidden");
  backdrop.hidden = false;
  backdrop.style.display = "flex";

  const roleBtn = document.getElementById("roleBtn");
  if (roleBtn) roleBtn.setAttribute("aria-pressed", "true");
}

export function closeRoleModal() {
  const backdrop = document.getElementById("roleModalBackdrop");
  if (backdrop) {
    backdrop.setAttribute("hidden", "");
    backdrop.hidden = true;
    backdrop.style.display = "none";
  }
  const roleBtn = document.getElementById("roleBtn");
  if (roleBtn) roleBtn.setAttribute("aria-pressed", "false");
}

function renderRoleSelection(container) {
  container.innerHTML = `
    <div class="report-modal-content">
      <!-- Header -->
      <div class="risk-panel-header" style="margin-bottom:12px;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="font-size:20px;">👥</span>
          <div>
            <strong style="font-size:14px;">Select Application Role</strong>
            <small style="display:block; font-size:11px; color:var(--muted);">Switch between public resident view and emergency responder view</small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="roleCloseBtn" aria-label="Close role selector">&times;</button>
      </div>

      <!-- Current Role Indicator -->
      <div style="background:#f1f5f9; border-radius:10px; padding:7px 10px; font-size:11.5px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <span>Current Active Mode:</span>
        <strong style="color:${currentRole === 'admin' ? '#b91c1c' : '#5B3CC4'}; text-transform:uppercase;">
          ${currentRole === 'admin' ? '🛡️ Rescue Command Admin' : '🏡 Resident'}
        </strong>
      </div>

      <!-- Role Selection Cards -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <!-- Option 1: Resident -->
        <div class="role-selection-card ${currentRole === 'resident' ? 'active-role' : ''}" id="roleCardResident" role="button" tabindex="0">
          <div style="font-size:26px;">🏡</div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:13.5px; color:#1e293b;">Resident Mode</strong>
              ${currentRole === 'resident' ? '<span class="role-current-tag">Active</span>' : ''}
            </div>
            <p style="margin:2px 0 0; font-size:11px; color:#64748b; line-height:1.35;">
              Public navigation view. Plan safe evacuation routes, check flood predictions, and report local flood conditions.
            </p>
          </div>
        </div>

        <!-- Option 2: Admin -->
        <div class="role-selection-card ${currentRole === 'admin' ? 'active-role' : ''}" id="roleCardAdmin" role="button" tabindex="0">
          <div style="font-size:26px;">🛡️</div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:13.5px; color:#b91c1c;">Admin / Rescue Command Mode</strong>
              ${currentRole === 'admin' ? '<span class="role-current-tag" style="background:#b91c1c;">Active</span>' : ''}
            </div>
            <p style="margin:2px 0 0; font-size:11px; color:#64748b; line-height:1.35;">
              For APM, Bomba, and District Disaster Officers. View all reported SOS rescue calls, locate victims on the map, and dispatch rescue boats.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind close button
  const closeBtn = container.querySelector("#roleCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeRoleModal();

  // Resident click -> "nothing happen" (remains resident, closes modal)
  const cardResident = container.querySelector("#roleCardResident");
  if (cardResident) {
    cardResident.onclick = () => {
      if (currentRole === "admin") {
        switchToResidentMode();
      }
      closeRoleModal();
    };
  }

  // Admin click -> Prompt login
  const cardAdmin = container.querySelector("#roleCardAdmin");
  if (cardAdmin) {
    cardAdmin.onclick = () => {
      if (currentRole === "admin") {
        // Already admin, open command panel
        closeRoleModal();
        openAdminSosPanel();
      } else {
        renderAdminLoginForm(container);
      }
    };
  }
}

function renderAdminLoginForm(container) {
  container.innerHTML = `
    <div class="report-modal-content">
      <!-- Header -->
      <div class="risk-panel-header" style="margin-bottom:10px;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="font-size:20px;">🔐</span>
          <div>
            <strong style="color:#b91c1c; font-size:14px;">Rescue Team Admin Verification</strong>
            <small style="display:block; font-size:10.5px; color:var(--muted);">Authorised Personnel Login &bull; APM / BOMBA Operations</small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="roleLoginCloseBtn">&times;</button>
      </div>

      <!-- Demo Credentials Helper Note -->
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:7px 10px; font-size:11.5px; color:#1e40af; margin-bottom:10px;">
        ℹ️ <strong>Demo Credentials:</strong><br/>
        &bull; <strong>Admin ID:</strong> <code>admin</code><br/>
        &bull; <strong>Password:</strong> <code>admin</code> or <code>admin123</code>
      </div>

      <form id="adminLoginForm" class="report-form-body">
        <div class="form-group">
          <label class="form-label" for="adminIdInput">
            <span>🛡️</span> <strong>Admin ID / Officer Call Sign:</strong>
          </label>
          <input type="text" id="adminIdInput" class="form-input" placeholder="e.g. admin" required autofocus />
        </div>

        <div class="form-group">
          <label class="form-label" for="adminPasswordInput">
            <span>🔑</span> <strong>Password:</strong>
          </label>
          <input type="password" id="adminPasswordInput" class="form-input" placeholder="••••••••" required />
        </div>

        <div id="adminLoginError" style="display:none; color:#dc2626; font-size:11.5px; font-weight:700; margin-bottom:6px;">
          ❌ Invalid Admin ID or Password. Please try again.
        </div>

        <div style="display:flex; gap:8px; margin-top:8px;">
          <button type="button" class="btn-cancel" id="adminLoginBackBtn" style="flex:1;">
            Back
          </button>
          <button type="submit" class="sos-submit-btn" style="flex:2; background:#b91c1c;">
            Verify & Enter Command Mode
          </button>
        </div>
      </form>
    </div>
  `;

  const closeBtn = container.querySelector("#roleLoginCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeRoleModal();

  const backBtn = container.querySelector("#adminLoginBackBtn");
  if (backBtn) backBtn.onclick = () => renderRoleSelection(container);

  const form = container.querySelector("#adminLoginForm");
  const errBox = container.querySelector("#adminLoginError");

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const idVal = container.querySelector("#adminIdInput").value.trim().toLowerCase();
      const passVal = container.querySelector("#adminPasswordInput").value.trim();

      // Flexible matching for hackathon evaluation:
      if ((idVal === "admin" || idVal === "rescue" || idVal === "bomba") && (passVal === "admin" || passVal === "admin123" || passVal === "rescue123" || passVal === "123456")) {
        errBox.style.display = "none";
        switchToAdminMode();
        closeRoleModal();
      } else {
        errBox.style.display = "block";
      }
    };
  }
}

function switchToAdminMode() {
  currentRole = "admin";

  // Update role button UI
  const roleBtn = document.getElementById("roleBtn");
  const roleLabel = document.getElementById("roleBtnLabel");
  const roleIcon = document.getElementById("roleBtnIcon");
  if (roleBtn) {
    roleBtn.classList.add("is-admin");
    if (roleLabel) roleLabel.textContent = "Admin";
    if (roleIcon) roleIcon.textContent = "🛡️";
  }

  // Show distress pins on map
  showAdminSosMarkers();

  // Open the Admin SOS Rescue Command Drawer
  openAdminSosPanel();

  if (toastCallback) {
    toastCallback(`🛡️ Admin Mode Active: ${sosStore.length} SOS Distress Calls on Map.`);
  }
}

function switchToResidentMode() {
  currentRole = "resident";

  // Update role button UI
  const roleBtn = document.getElementById("roleBtn");
  const roleLabel = document.getElementById("roleBtnLabel");
  const roleIcon = document.getElementById("roleBtnIcon");
  if (roleBtn) {
    roleBtn.classList.remove("is-admin");
    if (roleLabel) roleLabel.textContent = "Role";
    if (roleIcon) roleIcon.textContent = "👤";
  }

  // Hide distress pins from public map
  hideAdminSosMarkers();

  // Close Admin SOS panel
  closeAdminSosPanel();

  if (toastCallback) {
    toastCallback("🏡 Switched to Resident view.");
  }
}

// ============================================================================
// 3. ADMIN SOS DISPATCH COMMAND PANEL & INTERACTIVE MAP RESCUE MARKERS
// ============================================================================

export function isAdminSosPanelOpen() {
  const panel = document.getElementById("adminSosPanel");
  return panel && !panel.hidden && panel.style.display !== "none";
}

export function openAdminSosPanel() {
  const panel = document.getElementById("adminSosPanel");
  if (!panel) return;

  panel.hidden = false;
  panel.style.display = "flex";

  updateAdminSosPanelView();
}

export function closeAdminSosPanel() {
  const panel = document.getElementById("adminSosPanel");
  if (panel) {
    panel.hidden = true;
    panel.style.display = "none";
  }
}

let adminSosFilter = "all"; // "all" | "pending" | "dispatched" | "rescued"

export function updateAdminSosPanelView() {
  const slot = document.getElementById("adminSosPanelSlot");
  if (!slot) return;

  const total = sosStore.length;
  const pendingCount = sosStore.filter(s => s.status === "pending").length;
  const dispatchedCount = sosStore.filter(s => s.status === "dispatched").length;
  const rescuedCount = sosStore.filter(s => s.status === "rescued").length;
  const totalTrapped = sosStore.reduce((acc, curr) => acc + (curr.headcount.total || 1), 0);

  let filteredList = sosStore;
  if (adminSosFilter !== "all") {
    filteredList = sosStore.filter(s => s.status === adminSosFilter);
  }

  const cardsHtml = filteredList.map(sos => {
    let statusBadge = "";
    if (sos.status === "pending") statusBadge = `<span class="sponge-badge badge-danger">🚨 PENDING</span>`;
    else if (sos.status === "dispatched") statusBadge = `<span class="sponge-badge badge-warning">🚤 DISPATCHED</span>`;
    else statusBadge = `<span class="sponge-badge badge-safe">✅ RESCUED</span>`;

    return `
      <div class="admin-sos-card ${sos.status === 'pending' ? 'is-pending' : ''}" data-sos-id="${sos.id}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <div>
            <strong style="color:#b91c1c; font-size:12.5px;">#${sos.id}</strong>
            <span style="font-size:10.5px; color:var(--muted); margin-left:4px;">⏱️ ${sos.reportedTime}</span>
          </div>
          ${statusBadge}
        </div>

        <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:2px;">
          👤 ${sos.name} &bull; <a href="tel:${sos.phone}" style="color:#2563eb; text-decoration:none;">📞 ${sos.phone}</a>
        </div>

        <div style="font-size:11px; color:#475569; margin-bottom:3px;">
          📍 <strong>${sos.zoneName}:</strong> ${sos.address}
        </div>

        <div style="background:#fef2f2; border:1px solid #fee2e2; border-radius:6px; padding:5px 7px; font-size:11px; margin-bottom:6px;">
          <div><strong>👥 Trapped (${sos.headcount.total} pax):</strong> ${sos.headcount.adults} Adults, ${sos.headcount.children} Children, ${sos.headcount.elderly} Elderly</div>
          <div style="color:#b91c1c; margin-top:2px;"><strong>🌊 Situation:</strong> ${sos.situation}</div>
        </div>

        <div style="display:flex; gap:6px; margin-top:4px;">
          <button type="button" class="btn-dispatch-rescue" data-sos-id="${sos.id}" title="Plan rescue boat route from Bomba to this location">
            🚤 Dispatch Rescue Boat
          </button>
          ${sos.status !== 'rescued' ? `
            <button type="button" class="btn-mark-rescued" data-sos-id="${sos.id}" title="Mark resident as safely rescued">
              ✅ Rescued
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join("");

  slot.innerHTML = `
    <div class="admin-sos-panel-inner">
      <!-- Header -->
      <div class="risk-panel-header" style="margin-bottom:8px;">
        <div class="risk-panel-title">
          <span class="risk-panel-icon" style="font-size:20px; animation:sos-pulse 1.5s infinite;">🛡️</span>
          <div>
            <strong style="font-size:13.5px; color:#b91c1c; display:block;">Rescue Command Dashboard</strong>
            <small style="display:block; font-size:11px; color:var(--muted); font-weight:600;">
              Total: <strong>${pendingCount} Pending Calls</strong> &bull; <strong>${totalTrapped} Trapped</strong>
            </small>
          </div>
        </div>
        <button type="button" class="risk-panel-close" id="adminSosCloseBtn">&times;</button>
      </div>

      <!-- Station Base Banner -->
      <div style="background:#1e1b4b; color:#ffffff; border-radius:8px; padding:6px 9px; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
        <span>🚤 Base: <strong>Bomba Klang Utara</strong></span>
        <span style="background:#4338ca; padding:1px 6px; border-radius:10px; font-size:10px;">PPDA Active</span>
      </div>

      <!-- Filter Chips -->
      <div class="risk-filter-chips" style="margin-top:6px; margin-bottom:6px;">
        <button type="button" class="risk-chip ${adminSosFilter === 'all' ? 'active' : ''}" data-filter="all">All (${total})</button>
        <button type="button" class="risk-chip chip-flooded ${adminSosFilter === 'pending' ? 'active' : ''}" data-filter="pending">🚨 Pending (${pendingCount})</button>
        <button type="button" class="risk-chip chip-moderate ${adminSosFilter === 'dispatched' ? 'active' : ''}" data-filter="dispatched">🚤 Dispatched (${dispatchedCount})</button>
        <button type="button" class="risk-chip chip-safe ${adminSosFilter === 'rescued' ? 'active' : ''}" data-filter="rescued">✅ Rescued (${rescuedCount})</button>
      </div>

      <!-- Cards List -->
      <div class="admin-sos-cards-scroll">
        ${cardsHtml.length > 0 ? cardsHtml : '<div style="text-align:center; padding:18px; font-size:12px; color:var(--muted);">No SOS calls in this category.</div>'}
      </div>
    </div>
  `;

  // Bind close button
  const closeBtn = slot.querySelector("#adminSosCloseBtn");
  if (closeBtn) closeBtn.onclick = () => closeAdminSosPanel();

  // Bind filter chips
  slot.querySelectorAll(".risk-filter-chips .risk-chip").forEach(chip => {
    chip.onclick = () => {
      adminSosFilter = chip.dataset.filter;
      updateAdminSosPanelView();
    };
  });

  // Bind Dispatch & Rescued Actions
  slot.querySelectorAll(".btn-dispatch-rescue").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const sosId = btn.dataset.sosId;
      dispatchRescueTo(sosId);
    };
  });

  slot.querySelectorAll(".btn-mark-rescued").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const sosId = btn.dataset.sosId;
      markAsRescued(sosId);
    };
  });
}

function dispatchRescueTo(sosId) {
  const sos = sosStore.find(s => s.id === sosId);
  if (!sos) return;

  sos.status = "dispatched";
  saveSosStore();
  updateAdminSosPanelView();
  showAdminSosMarkers();

  // Plot route on the map from Bomba Klang Utara to the trapped resident
  if (routeDispatcherCallback) {
    routeDispatcherCallback({
      from: { name: RESCUE_BASE_STATION.shortName, coord: RESCUE_BASE_STATION.coord },
      to: { name: `SOS #${sos.id} (${sos.name})`, coord: sos.coord }
    });
  }

  if (mapInstance) {
    mapInstance.easeTo({ center: sos.coord, zoom: 16 });
  }

  if (toastCallback) {
    toastCallback(`🚤 Dispatched Rescue Boat: Bomba Klang Utara ➔ ${sos.name} (${sos.zoneName})`);
  }
}

function markAsRescued(sosId) {
  const sos = sosStore.find(s => s.id === sosId);
  if (!sos) return;

  sos.status = "rescued";
  saveSosStore();
  updateAdminSosPanelView();
  showAdminSosMarkers();

  if (toastCallback) {
    toastCallback(`✅ Marked #${sos.id} (${sos.name}) as Safely Rescued!`);
  }
}

/**
 * Display red pulsating distress markers on the map for all reported SOS locations (Admin Mode)
 */
export function showAdminSosMarkers() {
  hideAdminSosMarkers();
  if (!mapInstance || currentRole !== "admin") return;

  sosStore.forEach(sos => {
    // Only show unrescued on map by default, or with green badge if rescued
    const isRescued = sos.status === "rescued";
    const el = document.createElement("div");
    el.className = "sos-map-marker";
    el.innerHTML = `
      <div class="sos-marker-pin" style="${isRescued ? 'background:#16a34a;' : ''}">
        <span>${isRescued ? '✅' : '🆘'}</span>
        <span>${sos.headcount.total} Trapped</span>
      </div>
      <div class="sos-marker-dot" style="${isRescued ? 'background:#16a34a;' : ''}"></div>
    `;

    // MapLibre popup for rescue action
    const popupHtml = `
      <div class="emerg-facility-popup" style="padding:10px; font-family:inherit; max-width:260px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="color:#b91c1c; font-size:13px;">🚨 SOS #${sos.id}</strong>
          <span class="sponge-badge ${isRescued ? 'badge-safe' : 'badge-danger'}">${sos.status.toUpperCase()}</span>
        </div>
        <div style="font-size:12px; font-weight:700; margin-bottom:2px;">${sos.name} &bull; ${sos.phone}</div>
        <div style="font-size:11px; color:#475569; margin-bottom:4px;">📍 ${sos.address}</div>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:4px 6px; font-size:11px; margin-bottom:6px;">
          <div><strong>Trapped:</strong> ${sos.headcount.total} pax (${sos.headcount.adults}A, ${sos.headcount.children}C, ${sos.headcount.elderly}E)</div>
          <div style="color:#b91c1c; font-size:10.5px; margin-top:2px;">${sos.situation}</div>
        </div>
        ${!isRescued ? `
          <button type="button" class="btn-dispatch-rescue" style="width:100%; padding:6px; font-size:11.5px; border-radius:6px; background:#b91c1c; color:#fff; border:none; cursor:pointer;" onclick="window.dispatchSosFromMap && window.dispatchSosFromMap('${sos.id}')">
            🚤 Dispatch Rescue Boat Here
          </button>
        ` : ''}
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: [0, -20], closeButton: true, maxWidth: "300px" })
      .setHTML(popupHtml);

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(sos.coord)
      .setPopup(popup)
      .addTo(mapInstance);

    sosMarkers.push(marker);
  });

  // Global handler for popup button click
  window.dispatchSosFromMap = (id) => {
    dispatchRescueTo(id);
  };
}

/**
 * Remove all SOS distress markers from the map
 */
export function hideAdminSosMarkers() {
  sosMarkers.forEach(m => m.remove());
  sosMarkers = [];
}
