// FloodSafe Route: app settings. Change these for your neighbourhood and data.
export const CONFIG = {
  appName: "FloodSafe Route",

  // Map start view: set to the centre of your chosen neighbourhood (lng, lat).
  // Placeholder: around Bandar Bukit Raja, Klang. Check and adjust.
  center: [101.4162, 3.0985],
  zoom: 15.6,
  pitch: 55,
  bearing: -20,

  // Free vector basemap with OpenStreetMap buildings, water and bridges (no API key).
  // The map shows the required attribution automatically.
  styleUrl: "https://tiles.openfreemap.org/styles/liberty",

  // Where the app loads roads, places and flood scenarios from.
  // "./data/sample" is SYNTHETIC test data. Point this at the folder your pipeline produces.
  dataBase: "./data/bbr",

  // Travel modes. Risk levels are metres of water on the road. ASSUMPTIONS based on commonly cited
  // flood-safety guidance (about 15 cm of moving water can knock a person over; about 30 cm can float
  // many cars). Agree final values with authorities before real use, and list them in DATA_SOURCES.md.
  modes: {
    walk:  { label: "Walk",  speedKmh: 4.5, moderate: 0.05, high: 0.15 },
    drive: { label: "Drive", speedKmh: 20,  moderate: 0.10, high: 0.30 }
  },
  defaultMode: "drive",

  // How far ahead the app looks when marking roads as risky (minutes).
  horizonMin: 30,

  // Demo storm speed: simulated minutes per real second.
  demoSpeedMinPerSec: 6,

  // Live rainfall (roadmap). When enabled, rain.js polls fetchRainfallMmHr().
  liveRain: { enabled: false, pollMin: 10 },

  // Optional place search through OpenStreetMap Nominatim (low volume only; follow its usage policy).
  geocoder: { nominatim: false, countryCodes: "my" }
};
