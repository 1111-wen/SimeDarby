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
    "id": "zone-klang-utama",
    "code": "Klang Utama",
    "name": "Taman Klang Utama Lowland Residential Suburb",
    "shortName": "Taman Klang Utama",
    "category": "residential",
    "coord": [
      101.4155,
      3.0845
    ],
    "polygon": [
      [
        101.408,
        3.091
      ],
      [
        101.423,
        3.091
      ],
      [
        101.423,
        3.078
      ],
      [
        101.408,
        3.078
      ],
      [
        101.408,
        3.091
      ]
    ],
    "groundElevationM": 3.9,
    "riverFloodThresholdM": 4.25,
    "crestSubmergenceCm": 55,
    "evacTimeMin": 20,
    "icon": "\ud83c\udfe1",
    "corridor": "Persiaran Sungai Keramat & Sg. Puloh catchment",
    "safeBypass": "Elevated Persiaran Bukit Raja connector direct to Masjid BBR (PPS)",
    "desc": "Major residential suburb west of BBR. Backwater locks when Sg. Puloh / Sg. Binjai water levels rise."
  },
  {
    "id": "zone-batu3-pinang",
    "code": "Batu 3",
    "name": "Kampung Batu 3 & Sg. Pinang Coastal Plain",
    "shortName": "Kampung Batu 3",
    "category": "residential",
    "coord": [
      101.428,
      3.075
    ],
    "polygon": [
      [
        101.422,
        3.082
      ],
      [
        101.436,
        3.082
      ],
      [
        101.436,
        3.069
      ],
      [
        101.422,
        3.069
      ],
      [
        101.422,
        3.082
      ]
    ],
    "groundElevationM": 3.6,
    "riverFloodThresholdM": 4.2,
    "crestSubmergenceCm": 65,
    "evacTimeMin": 22,
    "icon": "\ud83c\udfd8\ufe0f",
    "corridor": "Jalan Batu 3 & Sg. Pinang tributary corridor",
    "safeBypass": "Elevated Shapadu Flyover Link toward BBR safe spine",
    "desc": "Low coastal village zone south of BBR. Prone to compound tidal and tributary surge."
  },
  {
    "id": "zone-batu-belah",
    "code": "Batu Belah",
    "name": "Batu Belah Residential & Commercial Pocket",
    "shortName": "Batu Belah",
    "category": "residential",
    "coord": [
      101.439,
      3.071
    ],
    "polygon": [
      [
        101.434,
        3.0775
      ],
      [
        101.4465,
        3.0775
      ],
      [
        101.4465,
        3.064
      ],
      [
        101.434,
        3.064
      ],
      [
        101.434,
        3.0775
      ]
    ],
    "groundElevationM": 4.1,
    "riverFloodThresholdM": 4.45,
    "crestSubmergenceCm": 40,
    "evacTimeMin": 18,
    "icon": "\ud83c\udfe0",
    "corridor": "Jalan Batu Belah & E30 Shapadu Highway underpass",
    "safeBypass": "Federal Highway elevated bypass toward Shah Alam / Klang High Ground",
    "desc": "Dense neighbourhood adjacent to Shapadu Highway. Storm drains bottleneck during high river discharge."
  },
  {
    "id": "zone-bbk-columbia",
    "code": "BBK",
    "name": "Bandar Baru Klang & Columbia Asia Medical Corridor",
    "shortName": "Bandar Baru Klang",
    "category": "arterial",
    "coord": [
      101.455,
      3.069
    ],
    "polygon": [
      [
        101.4465,
        3.076
      ],
      [
        101.464,
        3.076
      ],
      [
        101.464,
        3.062
      ],
      [
        101.4465,
        3.062
      ],
      [
        101.4465,
        3.076
      ]
    ],
    "groundElevationM": 4.8,
    "riverFloodThresholdM": 4.85,
    "crestSubmergenceCm": 30,
    "evacTimeMin": 15,
    "icon": "\ud83c\udfe5",
    "corridor": "Persiaran Bukit Raja 1 & Columbia Asia access artery",
    "safeBypass": "Federal Highway elevated interchange & KPJ / Columbia medical corridor",
    "desc": "Commercial & medical district. Critical ambulance and evacuation arterial route."
  },
  {
    "id": "zone-makyong-dip",
    "code": "Area A",
    "name": "Jalan Makyong 5A/5B Residential Dips (BBR North)",
    "shortName": "Jalan Makyong (Area A)",
    "category": "residential",
    "coord": [
      101.4285,
      3.0888
    ],
    "polygon": [
      [
        101.4235,
        3.092
      ],
      [
        101.434,
        3.092
      ],
      [
        101.434,
        3.0855
      ],
      [
        101.4235,
        3.0855
      ],
      [
        101.4235,
        3.092
      ]
    ],
    "groundElevationM": 4.2,
    "riverFloodThresholdM": 4.4,
    "crestSubmergenceCm": 45,
    "evacTimeMin": 20,
    "icon": "\ud83c\udfe0",
    "corridor": "Jalan Makyong 5A, 5B, 6 & Sg. Puloh culvert intake",
    "safeBypass": "Elevated connector road direct to Masjid BBR (PPS)",
    "desc": "Natural topographic bowl. Traps surface runoff when Sg. Puloh culverts are backwater-pressured."
  },
  {
    "id": "zone-bbr-industrial",
    "code": "BBR Industrial",
    "name": "Bandar Bukit Raja Gateway Industrial Hub",
    "shortName": "BBR Industrial Hub",
    "category": "commercial",
    "coord": [
      101.427,
      3.104
    ],
    "polygon": [
      [
        101.418,
        3.111
      ],
      [
        101.433,
        3.111
      ],
      [
        101.433,
        3.099
      ],
      [
        101.418,
        3.099
      ],
      [
        101.418,
        3.111
      ]
    ],
    "groundElevationM": 4.5,
    "riverFloodThresholdM": 4.7,
    "crestSubmergenceCm": 35,
    "evacTimeMin": 16,
    "icon": "\ud83c\udfed",
    "corridor": "Jalan BBR Industrial 1 & Sime Darby Logistics Park",
    "safeBypass": "Persiaran Bukit Raja northbound bypass to WCE Highway",
    "desc": "High-value logistics and industrial zone engineered with SUDS retention basins."
  },
  {
    "id": "zone-kyra-casira",
    "code": "Area B",
    "name": "Taman Kyra & Casira Residential Blocks (BBR West)",
    "shortName": "Taman Kyra (Area B)",
    "category": "residential",
    "coord": [
      101.41287,
      3.10591
    ],
    "polygon": [
      [
        101.4075,
        3.112
      ],
      [
        101.418,
        3.112
      ],
      [
        101.418,
        3.099
      ],
      [
        101.4075,
        3.099
      ],
      [
        101.4075,
        3.112
      ]
    ],
    "groundElevationM": 4.6,
    "riverFloodThresholdM": 4.75,
    "crestSubmergenceCm": 30,
    "evacTimeMin": 20,
    "icon": "\ud83c\udfe0",
    "corridor": "Persiaran Bukit Raja West & Casira loop",
    "safeBypass": "Persiaran Bukit Raja 1 elevated link toward Columbia Asia bypass",
    "desc": "Higher elevation residential block (>4.6m). Retains longer escape window before runoff peaks."
  },
  {
    "id": "zone-wetland-perimeter",
    "code": "Wetland Lake",
    "name": "Bandar Bukit Raja Wetland Lake & Central Park",
    "shortName": "BBR Wetland Park",
    "category": "sponge",
    "coord": [
      101.41954,
      3.0979
    ],
    "polygon": [
      [
        101.415,
        3.099
      ],
      [
        101.424,
        3.099
      ],
      [
        101.424,
        3.091
      ],
      [
        101.415,
        3.091
      ],
      [
        101.415,
        3.099
      ]
    ],
    "groundElevationM": 4.1,
    "riverFloodThresholdM": 4.3,
    "crestSubmergenceCm": 35,
    "evacTimeMin": 15,
    "icon": "\ud83c\udfde\ufe0f",
    "corridor": "125-acre wetland retention lake edge & jogging boardwalks",
    "safeBypass": "Upper perimeter bund and elevated town park boardwalk",
    "desc": "Active blue-green sponge retention lake absorbing up to 100% capacity."
  },
  {
    "id": "zone-meru-junction",
    "code": "Jalan Meru",
    "name": "Jalan Meru Commercial Junction & BBR Gateway",
    "shortName": "Jalan Meru Junction",
    "category": "arterial",
    "coord": [
      101.4395,
      3.097
    ],
    "polygon": [
      [
        101.433,
        3.1025
      ],
      [
        101.446,
        3.1025
      ],
      [
        101.446,
        3.0915
      ],
      [
        101.433,
        3.0915
      ],
      [
        101.433,
        3.1025
      ]
    ],
    "groundElevationM": 4.4,
    "riverFloodThresholdM": 4.5,
    "crestSubmergenceCm": 50,
    "evacTimeMin": 15,
    "icon": "\ud83c\udfe2",
    "corridor": "Persiaran Klang / Jalan Meru main gateway junction",
    "safeBypass": "NKVE Highway elevated slip road & Persiaran Mokhtar Dahari",
    "desc": "Major arterial junction. Severely submerged when Sg. Binjai crosses 4.50m (Danger)."
  },
  {
    "id": "zone-aman-perdana",
    "code": "Aman Perdana",
    "name": "Taman Aman Perdana Gated Township",
    "shortName": "Taman Aman Perdana",
    "category": "residential",
    "coord": [
      101.405,
      3.118
    ],
    "polygon": [
      [
        101.396,
        3.126
      ],
      [
        101.412,
        3.126
      ],
      [
        101.412,
        3.11
      ],
      [
        101.396,
        3.11
      ],
      [
        101.396,
        3.126
      ]
    ],
    "groundElevationM": 4.3,
    "riverFloodThresholdM": 4.55,
    "crestSubmergenceCm": 35,
    "evacTimeMin": 22,
    "icon": "\ud83c\udfe1",
    "corridor": "Jalan Aman Perdana & West Coast Expressway corridor",
    "safeBypass": "Jalan Kapar elevated link toward Meru West high bypass",
    "desc": "Established residential neighbourhood northwest of BBR. Controlled internal retention lakes buffer minor events."
  },
  {
    "id": "zone-meru-south",
    "code": "Meru South",
    "name": "Meru South & Bukit Kapar Agricultural Fringe",
    "shortName": "Meru South / Bukit Kapar",
    "category": "residential",
    "coord": [
      101.428,
      3.125
    ],
    "polygon": [
      [
        101.418,
        3.131
      ],
      [
        101.435,
        3.131
      ],
      [
        101.435,
        3.118
      ],
      [
        101.418,
        3.118
      ],
      [
        101.418,
        3.131
      ]
    ],
    "groundElevationM": 4.7,
    "riverFloodThresholdM": 4.8,
    "crestSubmergenceCm": 25,
    "evacTimeMin": 18,
    "icon": "\ud83c\udf3e",
    "corridor": "Jalan Teratai / Jalan Paip rural-suburban collector",
    "safeBypass": "Persiaran Hamzah Alang toward Setia Alam elevated spur",
    "desc": "Transition zone between BBR and Meru. Moderate slope prevents stagnant standing water."
  },
  {
    "id": "zone-meru-riverbank",
    "code": "Pekan Meru",
    "name": "Pekan Meru Low-Lying Riverbank & Market Dip",
    "shortName": "Pekan Meru Riverbank",
    "category": "commercial",
    "coord": [
      101.4385,
      3.1365
    ],
    "polygon": [
      [
        101.432,
        3.144
      ],
      [
        101.446,
        3.144
      ],
      [
        101.446,
        3.129
      ],
      [
        101.432,
        3.129
      ],
      [
        101.432,
        3.144
      ]
    ],
    "groundElevationM": 3.8,
    "riverFloodThresholdM": 4.2,
    "crestSubmergenceCm": 60,
    "evacTimeMin": 25,
    "icon": "\ud83c\udfdb\ufe0f",
    "corridor": "Jalan Meru low market dip & Sg. Binjai riverbank",
    "safeBypass": "Persiaran Bukit Raja 1 / Jalan Haji Abdul Manan",
    "desc": "Lowest river corridor (3.8m). First to experience storm drain backwater locking and overtopping."
  },
  {
    "id": "zone-berkeley-engann",
    "code": "Berkeley",
    "name": "Taman Berkeley & Kawasan Perniagaan Eng Ann",
    "shortName": "Taman Berkeley / Eng Ann",
    "category": "residential",
    "coord": [
      101.458,
      3.058
    ],
    "polygon": [
      [
        101.45,
        3.064
      ],
      [
        101.467,
        3.064
      ],
      [
        101.467,
        3.052
      ],
      [
        101.45,
        3.052
      ],
      [
        101.45,
        3.064
      ]
    ],
    "groundElevationM": 4.5,
    "riverFloodThresholdM": 4.7,
    "crestSubmergenceCm": 35,
    "evacTimeMin": 16,
    "icon": "\ud83c\udfe1",
    "corridor": "Lebuh Rajawali & Jalan Kasawari commercial spine",
    "safeBypass": "Federal Highway elevated viaduct toward I-City / Shah Alam",
    "desc": "Mature residential and commercial hub. Flash ponding at underpasses during torrential downpours."
  },
  {
    "id": "zone-bandar-klang",
    "code": "Bandar Klang",
    "name": "Bandar Klang Town Centre & Sg. Klang Waterfront",
    "shortName": "Bandar Klang (Heritage)",
    "category": "commercial",
    "coord": [
      101.448,
      3.045
    ],
    "polygon": [
      [
        101.44,
        3.054
      ],
      [
        101.457,
        3.054
      ],
      [
        101.457,
        3.036
      ],
      [
        101.44,
        3.036
      ],
      [
        101.44,
        3.054
      ]
    ],
    "groundElevationM": 3.4,
    "riverFloodThresholdM": 4.15,
    "crestSubmergenceCm": 70,
    "evacTimeMin": 25,
    "icon": "\ud83c\udfdb\ufe0f",
    "corridor": "Jalan Tengku Kelana & Jambatan Kota / Sg. Klang waterfront",
    "safeBypass": "Jalan Meru / Bukit Kuda elevated high ground",
    "desc": "Historic lowland commercial waterfront at confluence of Sg. Klang. Highly vulnerable to king tides."
  },
  {
    "id": "zone-rasau-tugu",
    "code": "Sg. Rasau",
    "name": "Sg. Rasau & Tugu Keris Industrial Corridor",
    "shortName": "Sg. Rasau / Tugu Keris",
    "category": "commercial",
    "coord": [
      101.472,
      3.056
    ],
    "polygon": [
      [
        101.464,
        3.063
      ],
      [
        101.482,
        3.063
      ],
      [
        101.482,
        3.049
      ],
      [
        101.464,
        3.049
      ],
      [
        101.464,
        3.063
      ]
    ],
    "groundElevationM": 4.0,
    "riverFloodThresholdM": 4.35,
    "crestSubmergenceCm": 45,
    "evacTimeMin": 18,
    "icon": "\ud83c\udfed",
    "corridor": "Federal Highway KM 16 & Sg. Rasau barrage gates",
    "safeBypass": "NKVE / Shah Alam elevated highway links",
    "desc": "Major gateway corridor monitored by Sg. Rasau JPS station. Subject to backflow during Sg. Klang peak."
  },
  {
    "id": "zone-rantau-panjang",
    "code": "Rantau Panjang",
    "name": "Kampung Rantau Panjang & Sg. Puloh Estuary",
    "shortName": "Rantau Panjang Estuary",
    "category": "residential",
    "coord": [
      101.398,
      3.072
    ],
    "polygon": [
      [
        101.385,
        3.082
      ],
      [
        101.408,
        3.082
      ],
      [
        101.408,
        3.062
      ],
      [
        101.385,
        3.062
      ],
      [
        101.385,
        3.082
      ]
    ],
    "groundElevationM": 3.2,
    "riverFloodThresholdM": 4.1,
    "crestSubmergenceCm": 75,
    "evacTimeMin": 28,
    "icon": "\ud83c\udf0a",
    "corridor": "Jalan Rantau Panjang & Selat Klang river mouth",
    "safeBypass": "Jalan Kapar elevated bridge direct to Klang Town",
    "desc": "Extremely low coastal floodplain (3.2m). Highest risk of combined river overtopping and coastal tidal surge."
  },
  {
    "id": "zone-kapar-belt",
    "code": "Kapar",
    "name": "Kapar Coastal Belt (Batu 4 - Batu 6)",
    "shortName": "Kapar Coastal Belt",
    "category": "residential",
    "coord": [
      101.382,
      3.105
    ],
    "polygon": [
      [
        101.372,
        3.118
      ],
      [
        101.395,
        3.118
      ],
      [
        101.395,
        3.092
      ],
      [
        101.372,
        3.092
      ],
      [
        101.372,
        3.118
      ]
    ],
    "groundElevationM": 3.7,
    "riverFloodThresholdM": 4.25,
    "crestSubmergenceCm": 50,
    "evacTimeMin": 24,
    "icon": "\ud83c\udfe1",
    "corridor": "Federal Route 5 (Jalan Kapar) coastal corridor",
    "safeBypass": "West Coast Expressway (WCE) elevated ramp interchange",
    "desc": "Coastal ribbon community. Vulnerable to tidal gate backwater when high tide coincides with rainstorm."
  },
  {
    "id": "zone-safe-highground",
    "code": "Masjid BBR",
    "name": "Persiaran Bukit Raja Spine & Masjid BBR (PPS)",
    "shortName": "Masjid BBR (Safe High Ground)",
    "category": "safe",
    "coord": [
      101.42946,
      3.08999
    ],
    "polygon": [
      [
        101.426,
        3.0925
      ],
      [
        101.433,
        3.0925
      ],
      [
        101.433,
        3.0875
      ],
      [
        101.426,
        3.0875
      ],
      [
        101.426,
        3.0925
      ]
    ],
    "groundElevationM": 5.6,
    "riverFloodThresholdM": 6.2,
    "crestSubmergenceCm": 0,
    "evacTimeMin": 0,
    "icon": "\ud83d\udee1\ufe0f",
    "corridor": "High-Elevation Evacuation Spine (>5.5m DEM)",
    "safeBypass": "Primary designated relief corridor to official APM / NADMA relief centre",
    "desc": "Elevated ridge immune to river overflow. Designated refuge zone."
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

// Map markers for vulnerability zones (Teardrop Pin & Map-Locked Popup like Shelter/Bomba/Hospital)
let zoneMarkers = [];
let mapInstance = null;
let currentSchedule = [];
let actionCallbacks = {};

function buildPopupHtml(zone, data) {
  const status = data ? data.status : (zone.category === "safe" ? "SAFE" : "SAFE");
  const isDanger = status === "CURRENT_FLOOD" || status === "PREDICTED_FLOOD";
  const isWarning = status === "WARNING";
  
  const badgeTitle = status === "CURRENT_FLOOD" 
    ? `🌊 Submerged (${data.depthCm}cm) • Flooded`
    : status === "PREDICTED_FLOOD"
    ? `🔮 Flood Inbound (${data.timeText})`
    : status === "WARNING"
    ? `⚠️ Surface Ponding (${data.depthCm}cm)`
    : `✅ Safe & Dry`;

  const timeText = data ? data.timeText : "Dry & Safe";
  const depthText = data && data.depthCm > 0 ? `${data.depthCm} cm road inundation` : "Dry road surface";
  const spareText = data ? (data.spareTimeMin <= 0 ? "0 mins (Route Submerged!)" : `${data.spareTimeMin} mins spare window`) : "Normal escape window";
  const actionText = data ? data.actionText : (zone.category === "safe" ? "Designated Official PPS Evacuation Centre" : "Road fully passable");

  return `
    <div class="emerg-popup-head" style="background:${isDanger ? '#fee2e2' : isWarning ? '#fef3c7' : '#dcfce7'}; border-bottom:1.5px solid ${isDanger ? '#fca5a5' : isWarning ? '#fcd34d' : '#86efac'}; padding:8px 10px; border-radius:8px 8px 0 0;">
      <span class="emerg-popup-cat-badge" style="font-weight:800; font-size:11px; color:${isDanger ? '#991b1b' : isWarning ? '#92400e' : '#166534'};">${zone.icon} ${badgeTitle}</span>
      <h4 class="emerg-popup-title" style="margin:4px 0 0; font-size:13.5px; color:#0f172a; font-weight:800;">${zone.name}</h4>
    </div>
    <div class="emerg-popup-body" style="padding:10px 12px; font-size:12px; line-height:1.45;">
      <div style="margin-bottom:4px;"><strong>📍 Corridor:</strong> ${zone.corridor}</div>
      <div style="margin-bottom:4px;"><strong>⏱️ Timing:</strong> ${timeText}</div>
      <div style="margin-bottom:4px;"><strong>🌊 Depth:</strong> ${depthText}</div>
      <div style="margin-bottom:4px;"><strong>📐 Elevation:</strong> Ground: ${zone.groundElevationM.toFixed(1)}m | Trigger: ${zone.riverFloodThresholdM.toFixed(1)}m</div>
      <div style="margin-bottom:4px;"><strong>🏃 Evacuation:</strong> ${spareText} (Needs ${zone.evacTimeMin}m to PPS)</div>
      <div style="margin-bottom:8px; font-size:11px; color:#475569;"><strong>🛡️ Safe Bypass:</strong> ${zone.safeBypass}</div>
      <div class="emerg-popup-actions" style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
        ${zone.category !== "safe" ? `<button type="button" class="emerg-action-btn btn-evac" style="background:#5B3CC4; color:#ffffff; font-weight:700; padding:6px 10px; border-radius:8px; border:none; cursor:pointer;">🚗 Evacuate to Masjid BBR (PPS)</button>` : ''}
        <div style="display:flex; gap:6px;">
          <button type="button" class="emerg-action-btn btn-to" style="flex:1;">📍 Route Here</button>
          <button type="button" class="emerg-action-btn btn-from" style="flex:1;">🚩 Start Here</button>
        </div>
      </div>
    </div>
  `;
}

function bindPopupActions(container, zone, popup) {
  const btnEvac = container.querySelector(".btn-evac");
  const btnTo = container.querySelector(".btn-to");
  const btnFrom = container.querySelector(".btn-from");

  if (btnEvac) {
    btnEvac.onclick = (e) => {
      e.stopPropagation();
      if (actionCallbacks.evacuateFrom) {
        actionCallbacks.evacuateFrom(zone);
      }
      popup.remove();
    };
  }
  if (btnTo) {
    btnTo.onclick = (e) => {
      e.stopPropagation();
      if (actionCallbacks.setTo) {
        actionCallbacks.setTo({ name: zone.shortName, coord: zone.coord });
      }
      popup.remove();
    };
  }
  if (btnFrom) {
    btnFrom.onclick = (e) => {
      e.stopPropagation();
      if (actionCallbacks.setFrom) {
        actionCallbacks.setFrom({ name: zone.shortName, coord: zone.coord });
      }
      popup.remove();
    };
  }
}

export function initInundationMarkers(map, onCardClick, actions = {}) {
  mapInstance = map;
  actionCallbacks = actions;
  if (!map) return;

  initAreaZoneLayers(map);

  // Clear existing
  zoneMarkers.forEach(m => {
    if (m.popup) m.popup.remove();
    m.marker.remove();
  });
  zoneMarkers = [];

  VULNERABILITY_ZONES.forEach(zone => {
    const el = document.createElement("div");
    el.className = "inundation-zone-marker status-safe";
    el.id = `marker-${zone.id}`;
    el.dataset.zoneId = zone.id;

    const container = document.createElement("div");
    container.className = "inundation-marker-container";

    const pin = document.createElement("div");
    pin.className = "inundation-pin";
    const icon = document.createElement("span");
    icon.className = "inundation-icon";
    icon.textContent = zone.icon;
    pin.appendChild(icon);

    const badge = document.createElement("div");
    badge.className = "inundation-badge";
    const dot = document.createElement("span");
    dot.className = "inundation-status-dot";
    const badgeText = document.createElement("span");
    badgeText.className = "inundation-badge-text";
    badgeText.textContent = zone.shortName;
    badge.appendChild(dot);
    badge.appendChild(badgeText);

    container.appendChild(pin);
    container.appendChild(badge);
    el.appendChild(container);

    const popupContent = document.createElement("div");
    popupContent.className = "emerg-popup inundation-popup";
    popupContent.id = `popup-content-${zone.id}`;
    popupContent.innerHTML = buildPopupHtml(zone, null);

    const popup = new maplibregl.Popup({ offset: [0, -36], closeButton: true, maxWidth: "330px" })
      .setDOMContent(popupContent);

    popup.on("open", () => {
      bindPopupActions(popupContent, zone, popup);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(zone.coord)
      .setPopup(popup)
      .addTo(map);

    el.addEventListener("click", () => {
      if (onCardClick) onCardClick(zone);
    });

    zoneMarkers.push({ zone, marker, popup, el, popupContent });
  });
}

export function openZonePopup(zoneId) {
  const item = zoneMarkers.find(m => m.zone.id === zoneId);
  if (item && mapInstance) {
    zoneMarkers.forEach(m => {
      if (m.popup && m.popup.isOpen && m.popup.isOpen() && m.zone.id !== zoneId) {
        m.popup.remove();
      }
    });
    mapInstance.easeTo({ center: item.zone.coord, zoom: 15.2, duration: 600 });
    if (item.popup) {
      item.popup.addTo(mapInstance);
    }
  }
}

export function updateInundationMarkers(scheduleList) {
  if (!zoneMarkers || zoneMarkers.length === 0) return;
  currentSchedule = scheduleList;

  const mapByZoneId = new Map(scheduleList.map(s => [s.id, s]));

  zoneMarkers.forEach(({ zone, el, popupContent, popup }) => {
    const data = mapByZoneId.get(zone.id);
    if (!data) return;

    // 1. Update pin status class
    el.classList.remove("status-danger", "status-warning", "status-safe");
    if (data.status === "CURRENT_FLOOD" || data.status === "PREDICTED_FLOOD") {
      el.classList.add("status-danger");
    } else if (data.status === "WARNING") {
      el.classList.add("status-warning");
    } else {
      el.classList.add("status-safe");
    }

    // 2. Update badge text
    const badgeText = el.querySelector(".inundation-badge-text");
    if (badgeText) {
      if (data.status === "CURRENT_FLOOD") {
        badgeText.textContent = `${zone.shortName} (${data.depthCm}cm)`;
      } else if (data.status === "PREDICTED_FLOOD") {
        badgeText.textContent = `${zone.shortName} (${data.timeUntilFloodMin}m)`;
      } else {
        badgeText.textContent = zone.shortName;
      }
    }

    // 3. Update popup DOM content
    if (popupContent) {
      popupContent.innerHTML = buildPopupHtml(zone, data);
      bindPopupActions(popupContent, zone, popup);
    }
  });

  // Automatically update the Risk Section Widget counts and areas
  updateAreaZonePolygons(scheduleList, currentSectionFilter);
  renderRiskSectionWidget(scheduleList, currentSectionFilter);
}


let currentSectionFilter = "all";

export function renderRiskSectionWidget(scheduleList, activeSection = currentSectionFilter) {
  currentSectionFilter = activeSection;

  const countAll = document.getElementById("countAll");
  const countFlooded = document.getElementById("countFlooded");
  const countHigh = document.getElementById("countHigh");
  const countModerate = document.getElementById("countModerate");
  const countSafe = document.getElementById("countSafe");
  const areasList = document.getElementById("riskSectionAreasList");

  if (!areasList || !scheduleList || scheduleList.length === 0) return;

  // Classify areas into sections
  const floodedList = scheduleList.filter(z => z.status === "CURRENT_FLOOD");
  const highRiskList = scheduleList.filter(z => z.status === "PREDICTED_FLOOD");
  const moderateList = scheduleList.filter(z => z.status === "WARNING");
  const safeList = scheduleList.filter(z => z.status === "SAFE");

  // Update badge counts on buttons
  if (countAll) countAll.textContent = scheduleList.length;
  if (countFlooded) countFlooded.textContent = floodedList.length;
  if (countHigh) countHigh.textContent = highRiskList.length;
  if (countModerate) countModerate.textContent = moderateList.length;
  if (countSafe) countSafe.textContent = safeList.length;

  // Filter items for active section
  let filtered = scheduleList;
  if (activeSection === "flooded") filtered = floodedList;
  else if (activeSection === "high") filtered = highRiskList;
  else if (activeSection === "moderate") filtered = moderateList;
  else if (activeSection === "safe") filtered = safeList;

  // Update area polygon highlights according to section
  updateAreaZonePolygons(scheduleList, activeSection);

  // Filter/highlight map pins according to section
  zoneMarkers.forEach(({ zone, el }) => {
    if (activeSection === "all") {
      el.style.opacity = "1";
    } else {
      const isIncluded = filtered.some(f => f.id === zone.id);
      el.style.opacity = isIncluded ? "1" : "0.22";
    }
  });

  if (filtered.length === 0) {
    const sectionNames = {
      flooded: "currently flooded",
      high: "at high risk",
      moderate: "with moderate ponding",
      safe: "safe"
    };
    areasList.innerHTML = `
      <div style="text-align:center; padding:16px 8px; color:var(--muted); font-size:12px;">
        ✅ No areas ${sectionNames[activeSection] || "found"}.
      </div>
    `;
    return;
  }

  areasList.innerHTML = filtered.map(item => {
    let cardCls = "card-safe";
    let badgeCls = "badge-safe";
    let depthCls = "safe-tag";
    let depthLabel = "Dry & Passable";

    if (item.status === "CURRENT_FLOOD") {
      cardCls = "card-flooded";
      badgeCls = "badge-danger";
      depthCls = "";
      depthLabel = `🌊 ${item.depthCm}cm submerged`;
    } else if (item.status === "PREDICTED_FLOOD") {
      cardCls = "card-high";
      badgeCls = "badge-danger";
      depthCls = "";
      depthLabel = `🌊 ${item.depthCm}cm inbound`;
    } else if (item.status === "WARNING") {
      cardCls = "card-moderate";
      badgeCls = "badge-warning";
      depthCls = "warn-tag";
      depthLabel = `⚠️ ${item.depthCm}cm ponding`;
    }

    return `
      <div class="risk-area-card ${cardCls}" data-zone-id="${item.id}" title="Click to view ${item.name} on map">
        <div class="risk-area-head">
          <div class="risk-area-name">
            <span>${item.icon}</span>
            <span>${item.shortName}</span>
          </div>
          <span class="sponge-badge ${badgeCls}">${item.badgeText}</span>
        </div>
        <div class="risk-area-timing">
          <span>⏱️ ${item.timeText}</span>
          <span class="risk-area-depth-tag ${depthCls}">${depthLabel}</span>
        </div>
        <div class="risk-area-bypass">
          🛡️ ${item.safeBypass}
        </div>
      </div>
    `;
  }).join("");

  // Bind clicks on cards to open map popup
  areasList.querySelectorAll(".risk-area-card").forEach(card => {
    card.addEventListener("click", () => {
      const zoneId = card.dataset.zoneId;
      if (zoneId) {
        openZonePopup(zoneId);
      }
    });
  });
}

export function initRiskSectionControls() {
  const btnTrigger = document.getElementById("riskAlertBtn");
  const panel = document.getElementById("riskSectionPanel");
  const btnClose = document.getElementById("riskPanelClose");
  const chips = document.querySelectorAll(".risk-chip");

  if (btnTrigger && panel) {
    btnTrigger.onclick = () => {
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      btnTrigger.setAttribute("aria-expanded", String(isHidden));
      if (isHidden) {
        renderRiskSectionWidget(currentSchedule, currentSectionFilter);
      }
    };
  }

  if (btnClose && panel) {
    btnClose.onclick = () => {
      panel.hidden = true;
      if (btnTrigger) btnTrigger.setAttribute("aria-expanded", "false");
      // Reset pin opacities
      zoneMarkers.forEach(({ el }) => { el.style.opacity = "1"; });
    };
  }

  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const section = chip.dataset.section;
      renderRiskSectionWidget(currentSchedule, section);
    };
  });
}


export function initAreaZoneLayers(map) {
  if (!map) return;

  if (!map.getSource("fs-area-zones")) {
    map.addSource("fs-area-zones", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });
  }

  // 1. Polygon Fill Layer with dynamic risk color and opacity
  if (!map.getLayer("fs-area-zones-fill")) {
    const beforeLayer = map.getLayer("fs-roads-risk") ? "fs-roads-risk" : undefined;
    map.addLayer({
      id: "fs-area-zones-fill",
      type: "fill",
      source: "fs-area-zones",
      paint: {
        "fill-color": ["coalesce", ["get", "fillColor"], "#22c55e"],
        "fill-opacity": ["coalesce", ["get", "fillOpacity"], 0.20]
      }
    }, beforeLayer);
  }

  // 2. Polygon Outline Line Layer
  if (!map.getLayer("fs-area-zones-line")) {
    const beforeLayer = map.getLayer("fs-roads-risk") ? "fs-roads-risk" : undefined;
    map.addLayer({
      id: "fs-area-zones-line",
      type: "line",
      source: "fs-area-zones",
      paint: {
        "line-color": ["coalesce", ["get", "lineColor"], "#15803d"],
        "line-width": 2.5,
        "line-dasharray": [2.5, 1.5],
        "line-opacity": 0.85
      }
    }, beforeLayer);
  }

  // 3. Centered Area Name Label Layer
  if (!map.getLayer("fs-area-zones-label")) {
    map.addLayer({
      id: "fs-area-zones-label",
      type: "symbol",
      source: "fs-area-zones",
      layout: {
        "text-field": ["get", "shortName"],
        "text-size": 11.5,
        "text-font": ["Noto Sans Bold"],
        "text-anchor": "center",
        "text-allow-overlap": false
      },
      paint: {
        "text-color": ["coalesce", ["get", "textColor"], "#1e293b"],
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    });
  }

  // Click on area polygon to open popup & zoom
  map.on("click", "fs-area-zones-fill", e => {
    if (e.features && e.features[0]) {
      const zoneId = e.features[0].properties.id;
      if (zoneId) openZonePopup(zoneId);
    }
  });

  map.on("mouseenter", "fs-area-zones-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "fs-area-zones-fill", () => {
    map.getCanvas().style.cursor = "";
  });
}

export function updateAreaZonePolygons(scheduleList, activeSection = "all") {
  if (!mapInstance || !mapInstance.getSource("fs-area-zones")) return;

  const mapByZoneId = new Map((scheduleList || []).map(s => [s.id, s]));

  const features = VULNERABILITY_ZONES.filter(z => z.polygon).map(zone => {
    const data = mapByZoneId.get(zone.id) || { status: "SAFE", depthCm: 0, timeText: "Safe" };

    let fillColor = "#22c55e"; // Safe emerald green
    let fillOpacity = 0.18;
    let lineColor = "#16a34a";
    let textColor = "#15803d";
    let statusLabel = "Safe";

    if (data.status === "CURRENT_FLOOD") {
      fillColor = "#ef4444"; // Red
      fillOpacity = 0.46; // Strong opacity for active flood
      lineColor = "#b91c1c";
      textColor = "#991b1b";
      statusLabel = `Flooded (${data.depthCm}cm)`;
    } else if (data.status === "PREDICTED_FLOOD" || (data.willFlood && data.spareTimeMin <= 15)) {
      fillColor = "#ea580c"; // High risk orange-red
      fillOpacity = 0.38;
      lineColor = "#c2410c";
      textColor = "#c2410c";
      statusLabel = `High Risk (${data.timeText})`;
    } else if (data.status === "WARNING") {
      fillColor = "#f59e0b"; // Moderate risk amber
      fillOpacity = 0.28;
      lineColor = "#d97706";
      textColor = "#b45309";
      statusLabel = `Moderate (${data.depthCm}cm)`;
    }

    // If a specific section is active in the filter, dim non-matching polygons
    if (activeSection !== "all") {
      const matchesSection = 
        (activeSection === "flooded" && data.status === "CURRENT_FLOOD") ||
        (activeSection === "high" && data.status === "PREDICTED_FLOOD") ||
        (activeSection === "moderate" && data.status === "WARNING") ||
        (activeSection === "safe" && data.status === "SAFE");

      if (matchesSection) {
        fillOpacity = Math.min(0.60, fillOpacity + 0.12);
      } else {
        fillOpacity = 0.06;
      }
    }

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [zone.polygon]
      },
      properties: {
        id: zone.id,
        name: zone.name,
        shortName: zone.shortName,
        status: data.status,
        statusLabel,
        depthCm: data.depthCm || 0,
        fillColor,
        fillOpacity,
        lineColor,
        textColor
      }
    };
  });

  mapInstance.getSource("fs-area-zones").setData({
    type: "FeatureCollection",
    features
  });
}
