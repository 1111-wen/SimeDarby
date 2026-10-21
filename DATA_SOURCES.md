# Data Sources and Technical Assumptions

This document records the geospatial datasets, hydrologic and hydrodynamic modeling parameters, engineering assumptions, and validation sources for the **FloodSafe Route — Bandar Bukit Raja Sponge Township** system.

---

## 1. Data Sources

| Data Category | Primary Source | Usage in FloodSafe Route | Validation / Status |
| :--- | :--- | :--- | :--- |
| **Road & Footpath Network** | OpenStreetMap contributors (ODbL) via OSMnx | Base graph network; attributes for pedestrian paths, multi-lane roads, one-way constraints, bridges | Publicly verified for Bandar Bukit Raja, Klang |
| **3D Buildings & Urban Fabric** | OpenStreetMap / OpenMapTiles | 3D building height extrusion, footprint geometries, and built density | Rendered in MapLibre GL fill-extrusion |
| **Ground Elevation & DEM** | FABDEM (30 m bare-earth with canopy/buildings removed) / Copernicus GLO-30 | Overland flow modeling, basin boundary delineation, depression analysis | Public satellite radar elevation |
| **Hydrologic Guidelines** | Urban Stormwater Management Manual for Malaysia (*MSMA 2nd Edition*, JPS) | Design storm hyetographs, runoff coefficients, detention basin volume requirements | Official JPS standard |
| **Rainfall Telemetry Calibration** | JPS Public Infobanjir / JPS Selangor Station #3014002 (*Batu Belah, Klang*) | Calibration of simulated storm depths against recorded Klang catchment rainfall | Official telemetry records |
| **Hydrodynamic Simulation (2D)** | HEC-RAS 2D (US Army Corps of Engineers) | Depth raster series per timestep ($t = 0 \dots 180\text{ min}$), surface velocities, inundation boundaries | Team simulation calibrated for BBR catchment |
| **Sponge Infrastructure Inventory** | Sime Darby Property BBR master plans & field verification | 125-acre wetland retention basins, linear lakes, RCBC storm culverts, intake sumps, urban rain gardens | Modeled in `web/js/sponge.js` |
| **Evacuation Centres (PPS)** | Jabatan Kebajikan Masyarakat (JKM) InfoBencana / APM / NADMA | Destination relief centre: **Masjid Bandar Bukit Raja** | Verified relief shelter with high-ground access |

---

## 2. Engineering Assumptions & Operational Thresholds

| Parameter | Value | Technical Justification |
| :--- | :--- | :--- |
| **Walking — Moderate Risk** | $5\text{ cm} \le \text{Depth} < 15\text{ cm}$ | Obscures road defects, submerged curbs, and drain inlets; mobility reduced. |
| **Walking — High Risk** | $\ge 15\text{ cm}$ | Sufficient dynamic pressure from flowing stormwater to destabilize an adult pedestrian (US National Weather Service / UK DEFRA Flood Hazards). |
| **Driving — Moderate Risk** | $10\text{ cm} \le \text{Depth} < 30\text{ cm}$ | Risk of water ingestion into low vehicle intakes, brake fade, loss of traction. |
| **Driving — High Risk** | $\ge 30\text{ cm}$ | Buoyancy threshold for standard passenger vehicles; risk of vehicle floating or engine stall. |
| **Evacuation Look-Ahead Window** | $30\text{ minutes}$ | Roads modeled to reach hazardous inundation depths within 30 minutes are marked and proactively avoided. |
| **Evacuation Route Weighting** | High risk: $\infty$ (Blocked)<br>Moderate risk: $4\times$ penalty | High-risk segments are strictly impassable. Moderate-risk roads are traversed only when no clear alternative exists. |
| **BBR Retention Lake Capacity** | $\approx 80,000\text{ m}^3$ active retention | Based on Bandar Bukit Raja's 125-acre integrated stormwater wetland and retention lake system. |
| **Bridges & Overpasses** | Risk inherited from approach segments | Bridge decks sit above high-water elevation, but accessibility depends on approaches remaining unflooded. |
| **Culvert & Sump Flow** | Orifice / weir equation approximation | Gray infrastructure maintains design conveyance until tailwater exceeds culvert obvert. |

---

## 3. Known Limitations & Prototype Scope

1. **Elevation Granularity:** Satellite-derived 30 m DEMs provide macro-topography. Localized micro-topography (such as 15 cm road curbs and roadside swale details) benefits from high-density LiDAR or drone photogrammetry.
2. **Subsurface Drainage Interconnection:** While RCBC culverts and major trunk drains are mapped, secondary underground pipe networks are represented through lumped catchment conveyance rather than full 1D pipe network models (e.g. SWMM).
3. **Emergency Priority:** The system is an auxiliary decision-support tool designed for residents. It does not supersede live emergency operational commands issued by official emergency response agencies (PDRM, Bomba, APM, NADMA).
