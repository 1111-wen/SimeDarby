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
| **Emergency Facilities & Shelters** | JKM InfoBencana, APM, NADMA, KKM, JBPM (Bomba) Selangor | Real-world geocoded locations for Shelters (Dewan MBDK, Grace Community, Masjid BBR), Hospitals (Columbia Asia, HTAR, Klinik Dr Rosli), and Fire & Rescue Stations (Klang Utara, Klang Selatan) | Verified real-world coordinates in `places.json` |

---

## 2. Emergency Facilities Geolocation Directory

All emergency facilities pinpointed on the map use verified real-world geocodes and institutional contacts:

| Category | Facility Name | Coordinates (Lng, Lat) | Address & Details | Contact / Hotline |
| :--- | :--- | :--- | :--- | :--- |
| **🏢 Shelter** | **Dewan Majlis Bandaraya Diraja Klang (MBDK)** *(Dewan Hamzah)* | `[101.443913, 3.044572]` | Lorong Perbandaran, Kawasan 1, 41000 Klang *(Cap: ~1,500 evacuees)* | MBDK Hotline: 03-3371 6044 |
| **🏢 Shelter** | **Grace Community Services** | `[101.465479, 3.054569]` | 7, Jalan Dendang 1, Pusat Bandar Berkeley, 41300 Klang *(Relief & Food Bank)* | Relief Ops |
| **🏢 Shelter** | **Masjid Bandar Bukit Raja (relief centre)** | `[101.429460, 3.089990]` | Jalan Makyong 5E/KU5, Bandar Bukit Raja, 41050 Klang *(Official PPS)* | APM / JKM |
| **🏥 Hospital** | **Columbia Asia Hospital Klang** | `[101.446590, 3.085915]` | 1, Jalan Mahkota 1/KU 2, Bandar Bukit Raja, 41050 Klang *(24/7 Emergency)* | General: 03-3346 7999 |
| **🏥 Hospital** | **Hospital Tengku Ampuan Rahimah (HTAR)** | `[101.442338, 3.026846]` | Jalan Langat, 41200 Klang *(Lead Public General Hospital & Level 1 Trauma)* | Emergency: 03-3375 7000 / 999 |
| **🏥 Clinic** | **Klinik Dr Rosli Bukit Raja** | `[101.431770, 3.090409]` | 19G, Jalan Makyong 5A/KU5, Bandar Bukit Raja, 41050 Klang *(24h Flood Triage)* | Clinic Desk |
| **🚒 Rescue** | **Klang Utara Fire and Rescue Station** | `[101.442800, 3.060100]` | Batu 1 1/2, Jalan Kapar, Kawasan 18, 41400 Klang *(BBP Sungai Pinang, PPDA Water Rescue)* | **+603-3342 4444** / 999 |
| **🚒 Rescue** | **Klang Selatan Fire and Rescue Station** | `[101.447400, 3.042600]` | Jalan Gedung Raja Abdullah, Kawasan 1, 41000 Klang *(BBP Kota Raja, Search & Rescue)* | **+603-3371 4444** / 999 |

---

## 3. Engineering Assumptions & Operational Thresholds

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
