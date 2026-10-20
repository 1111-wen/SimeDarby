import json

with open("web/data/bbr/sponge.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)

# Keep lakes, gardens, trees, porous parking, cisterns
preserved_features = [f for f in data["features"] if not f["id"].startswith("culvert_") and not f["id"].startswith("drain_")]

drainage_features = [
    # 1. Primary Trunk Culvert (Persiaran BBR)
    {
        "type": "Feature",
        "id": "drain_trunk_bbr_main",
        "properties": {
            "id": "drain_trunk_bbr_main",
            "name": "Persiaran BBR Main Storm Box Culvert (2.4m x 2.4m RCBC)",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Primary Reinforced Concrete Box Culvert (RCBC)",
            "description": "Twin 2.4m x 2.4m box culvert running along Persiaran Bandar Bukit Raja carrying high-velocity runoff to the BBR Wetland Lake.",
            "design_discharge_m3_s": 22.0,
            "diameter_m": 2.4,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4130, 3.1060],
                [101.4138, 3.1025],
                [101.4143, 3.0982],
                [101.4165, 3.0970],
                [101.4195, 3.0965],
                [101.4230, 3.0955],
                [101.4275, 3.0945],
                [101.4332, 3.0928]
            ]
        }
    },
    # 2. Makyong North Drainage Trunk
    {
        "type": "Feature",
        "id": "drain_trunk_makyong_north",
        "properties": {
            "id": "drain_trunk_makyong_north",
            "name": "Jalan Makyong North Storm Drain Trunk (1.8m U-Drain)",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Concrete Storm Trunk Drain",
            "description": "Reinforced concrete storm drain conveying runoff from Jalan Makyong 2 & 4 into the south detention basin.",
            "design_discharge_m3_s": 14.5,
            "diameter_m": 1.8,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4255, 3.0910],
                [101.4275, 3.0912],
                [101.4295, 3.0915],
                [101.4315, 3.0912],
                [101.4325, 3.0885]
            ]
        }
    },
    # 3. Makyong Central Drainage Trunk (Along Makyong 6 & 5)
    {
        "type": "Feature",
        "id": "drain_trunk_makyong_central",
        "properties": {
            "id": "drain_trunk_makyong_central",
            "name": "Jalan Makyong Central Collector Culvert (1.5m Pipe)",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Subsurface Concrete Pipe Culvert",
            "description": "Underground storm pipe draining Jalan Makyong 6A/B/C and the mosque plaza.",
            "design_discharge_m3_s": 10.0,
            "diameter_m": 1.5,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4260, 3.0888],
                [101.4278, 3.0887],
                [101.4295, 3.0899],
                [101.4310, 3.0903],
                [101.4325, 3.0885]
            ]
        }
    },
    # 4. Makyong Lateral Feeder Drains
    {
        "type": "Feature",
        "id": "drain_feeder_makyong_4",
        "properties": {
            "id": "drain_feeder_makyong_4",
            "name": "Jalan Makyong 4 Lateral Drain",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Residential Roadside U-Drain",
            "description": "Covered roadside concrete drain connecting housing streets into the north trunk line.",
            "design_discharge_m3_s": 6.5,
            "diameter_m": 1.2,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4270, 3.0925],
                [101.4272, 3.0912]
            ]
        }
    },
    {
        "type": "Feature",
        "id": "drain_feeder_makyong_2",
        "properties": {
            "id": "drain_feeder_makyong_2",
            "name": "Jalan Makyong 2 Lateral Drain",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Residential Roadside U-Drain",
            "description": "Covered roadside concrete drain serving Jalan Makyong 2 housing parcels.",
            "design_discharge_m3_s": 6.5,
            "diameter_m": 1.2,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4292, 3.0925],
                [101.4295, 3.0915]
            ]
        }
    },
    # 5. Casira Storm Drainage Collector
    {
        "type": "Feature",
        "id": "drain_trunk_casira",
        "properties": {
            "id": "drain_trunk_casira",
            "name": "Taman Casira Primary Storm Culvert",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Interconnected Storm Drainage Line",
            "description": "Concrete stormwater pipe discharging neighborhood runoff directly into the Casira retention lake.",
            "design_discharge_m3_s": 8.5,
            "diameter_m": 1.5,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4135, 3.0990],
                [101.4145, 3.0980],
                [101.4155, 3.0970],
                [101.4158, 3.0968]
            ]
        }
    },
    # 6. Kyra Storm Drainage Collector
    {
        "type": "Feature",
        "id": "drain_trunk_kyra",
        "properties": {
            "id": "drain_trunk_kyra",
            "name": "Taman Kyra Storm Drain Collector",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drainage_culvert",
            "type_label": "Northern Drainage Collector Line",
            "description": "Concrete culvert directing storm runoff from Jalan Ulek Mayang into the Kyra North retention pond.",
            "design_discharge_m3_s": 7.8,
            "diameter_m": 1.35,
            "color": "#00e5ff"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4140, 3.1070],
                [101.4125, 3.1065],
                [101.4112, 3.1065]
            ]
        }
    },
    # 7. Drainage Inlet Grates & Outfalls (Inspection Nodes)
    {
        "type": "Feature",
        "id": "node_inlet_persiaran_bbr",
        "properties": {
            "id": "node_inlet_persiaran_bbr",
            "name": "Persiaran BBR Culvert Intake Sump & Trash Screen",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drain_inlet",
            "type_label": "Heavy-Duty Storm Inlet Sump",
            "description": "Deep drop sump with cast iron grated inlet and hydraulic debris rack.",
            "color": "#00e5ff"
        },
        "geometry": { "type": "Point", "coordinates": [101.4143, 3.0982] }
    },
    {
        "type": "Feature",
        "id": "node_outfall_wetland_lake",
        "properties": {
            "id": "node_outfall_wetland_lake",
            "name": "BBR Wetland Lake Main Discharge Outfall",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drain_outfall",
            "type_label": "Engineered Riprap Outfall Structure",
            "description": "Energy-dissipating concrete headwall discharging culvert flow into the wetland lake settling pool.",
            "color": "#00e5ff"
        },
        "geometry": { "type": "Point", "coordinates": [101.4178, 3.0968] }
    },
    {
        "type": "Feature",
        "id": "node_inlet_masjid_bbr",
        "properties": {
            "id": "node_inlet_masjid_bbr",
            "name": "Masjid BBR Storm Sump & Cistern Interceptor",
            "category": "gray",
            "category_label": "Drainage System",
            "type": "drain_inlet",
            "type_label": "Stormwater Interceptor Sump",
            "description": "Diverts initial 25mm of rain into the underground cistern; bypasses surplus flow into the municipal trunk.",
            "color": "#00e5ff"
        },
        "geometry": { "type": "Point", "coordinates": [101.4295, 3.0899] }
    }
]

all_features = preserved_features + drainage_features
with open("web/data/bbr/sponge.geojson", "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": all_features}, f, indent=2)

print(f"Updated sponge.geojson: total features = {len(all_features)} (including {len(drainage_features)} drainage system features)")
