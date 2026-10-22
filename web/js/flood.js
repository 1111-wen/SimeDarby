// Flood scenarios: load pre-computed results and answer "how deep, and how risky, at minute t?"
import { CONFIG } from "./config.js";

// th = { moderate, high } for the current travel mode (see CONFIG.modes)
export function level(depthM, th) {
  if (depthM >= th.high) return "high";
  if (depthM >= th.moderate) return "moderate";
  return "none";
}

export class Scenario {
  constructor(json) {
    this.id = json.scenario;
    this.name = json.name || json.scenario;
    this.rainMmHr = json.rain_mm_hr ?? null;
    this.generated = json.generated;
    this.stepMin = json.step_min;
    this.depths = json.depths;        // { edgeId: [depth at step 0, 1, 2, ...] } in metres
    this.extent = json.extent || [];  // optional: one GeoJSON FeatureCollection of flooded area per step
    this.synthetic = !!json.synthetic;
    const any = Object.values(this.depths)[0] || [];
    this.durationMin = Math.max(0, (any.length - 1) * this.stepMin);
  }

  // Water depth on a road at minute t (linear interpolation between steps).
  depth(edgeId, t) {
    const s = this.depths[edgeId];
    if (!s || !s.length) return 0;
    const x = Math.max(0, Math.min(t / this.stepMin, s.length - 1));
    const i = Math.floor(x), f = x - i;
    return i + 1 < s.length ? s[i] * (1 - f) + s[i + 1] * f : s[i];
  }

  // Highest depth expected between now and now + horizon. Routes use this, not just "now".
  risk(edgeId, t, horizon = CONFIG.horizonMin) {
    let m = 0;
    for (let k = 0; k <= horizon; k += this.stepMin) {
      m = Math.max(m, this.depth(edgeId, Math.min(t + k, this.durationMin)));
    }
    return m;
  }

  extentAt(t) {
    if (!this.extent.length) return { type: "FeatureCollection", features: [] };
    const i = Math.max(0, Math.min(Math.round(t / this.stepMin), this.extent.length - 1));
    return this.extent[i];
  }
}

export async function loadScenarios(base = CONFIG.dataBase) {
  const index = await (await fetch(`${base}/scenarios/index.json`)).json();
  const list = [];
  for (const s of index.scenarios) {
    const json = await (await fetch(`${base}/scenarios/${s.file}`)).json();
    list.push(new Scenario(json));
  }
  return list;
}

// Pick the scenario that best matches the rain being observed:
// the lightest scenario at least as heavy as the observed rain, else the heaviest available.
export function pickScenario(scenarios, rainMmHr) {
  const ranked = scenarios.filter(s => s.rainMmHr != null).sort((a, b) => a.rainMmHr - b.rainMmHr);
  if (!ranked.length) return scenarios[0];
  return ranked.find(s => s.rainMmHr >= rainMmHr) || ranked[ranked.length - 1];
}

// Query live 3-hour flood level forecast from the Python AI backend (FastAPI / Flask)
export async function fetchLiveFloodPrediction(telemetry = {}) {
  const base = CONFIG.apiUrl || "http://localhost:5000";
  try {
    const params = new URLSearchParams();
    if (telemetry.binjai_level != null) params.set("binjai_level", telemetry.binjai_level);
    if (telemetry.binjai_rain != null) params.set("binjai_rain", telemetry.binjai_rain);
    if (telemetry.rasau_level != null) params.set("rasau_level", telemetry.rasau_level);
    if (telemetry.klang_level != null) params.set("klang_level", telemetry.klang_level);
    if (telemetry.cum_rain_3h != null) params.set("cum_rain_3h", telemetry.cum_rain_3h);

    const res = await fetch(`${base}/predict?${params.toString()}`, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    // Graceful fallback to offline/pre-computed scenarios
    return null;
  }
}
