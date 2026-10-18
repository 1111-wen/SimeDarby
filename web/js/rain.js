// Rain sources: a demo storm for presentations, and a live-rainfall hook for the real app.
import { CONFIG } from "./config.js";

// Plays a pre-computed scenario forward in time, like a recording of a storm.
export class DemoStorm {
  constructor(durationMin, onTick) {
    this.durationMin = durationMin;
    this.onTick = onTick;
    this.t = 0;
    this.timer = null;
  }
  get running() { return this.timer !== null; }
  start() {
    if (this.t >= this.durationMin) this.t = 0;
    const stepMs = 250, stepMin = CONFIG.demoSpeedMinPerSec * stepMs / 1000;
    this.onTick(this.t);
    this.timer = setInterval(() => {
      this.t = Math.min(this.durationMin, this.t + stepMin);
      this.onTick(this.t);
      if (this.t >= this.durationMin) this.stop();
    }, stepMs);
  }
  stop() { clearInterval(this.timer); this.timer = null; }
  seek(t) { this.t = t; this.onTick(t); }
}

// TODO (roadmap): return the current rainfall in mm/h for the neighbourhood, or null if unknown.
// Candidate public sources: MET Malaysia forecasts and warnings (check the current API in the
// data.gov.my developer documentation) and JPS rainfall stations on Public Infobanjir.
// Record the source and how often it updates in DATA_SOURCES.md.
export async function fetchRainfallMmHr() {
  return null;
}

export function startLiveRain(onRain) {
  if (!CONFIG.liveRain.enabled) return null;
  const poll = async () => {
    try { const mm = await fetchRainfallMmHr(); if (mm != null) onRain(mm); }
    catch (e) { console.warn("Rainfall fetch failed", e); }
  };
  poll();
  return setInterval(poll, CONFIG.liveRain.pollMin * 60 * 1000);
}
