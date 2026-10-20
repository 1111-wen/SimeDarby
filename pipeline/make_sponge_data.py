import json

sponge_features = [
    # ---------------- GREEN INFRASTRUCTURE ----------------
    {
        "type": "Feature",
        "id": "green_bbr_townpark",
        "properties": {
            "id": "green_bbr_townpark",
            "name": "BBR Wetland Townpark Eco-Meadow & Urban Park",
            "category": "green",
            "category_label": "Green Infrastructure",
            "type": "urban_park",
            "type_label": "Urban Park & Eco-Meadow",
            "description": "60-acre urban park featuring deep-root native trees, sunken recreational fields, and sponge turf that traps and absorbs stormwater into the soil.",
            "absorption_capacity_m3": 18000,
            "infiltration_rate_mm_hr": 45,
            "max_pond_depth_m": 0.45,
            "color": "#2e7d32"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4172, 3.0990],
                [101.4215, 3.0995],
                [101.4220, 3.1025],
                [101.4185, 3.1028],
                [101.4170, 3.1005],
                [101.4172, 3.0990]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "green_kyra_park",
        "properties": {
            "id": "green_kyra_park",
            "name": "Taman Kyra Community Park & Rain Garden",
            "category": "green",
            "category_label": "Green Infrastructure",
            "type": "rain_garden",
            "type_label": "Rain Garden & Bio-Retention Cell",
            "description": "Engineered bio-retention rain garden with engineered sandy-loam soil and wetland sedges, capturing residential roof and driveway runoff.",
            "absorption_capacity_m3": 4500,
            "infiltration_rate_mm_hr": 55,
            "max_pond_depth_m": 0.35,
            "color": "#388e3c"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4118, 3.1052],
                [101.4140, 3.1054],
                [101.4142, 3.1070],
                [101.4122, 3.1068],
                [101.4118, 3.1052]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "green_casira_swale",
        "properties": {
            "id": "green_casira_swale",
            "name": "Taman Casira Vegetated Swale & Linear Buffer",
            "category": "green",
            "category_label": "Green Infrastructure",
            "type": "bioswale",
            "type_label": "Vegetated Swale & Linear Park",
            "description": "Gentle sloping linear green corridor planted with native vetiver and reeds to slow runoff velocity, trap silt, and promote natural ground infiltration.",
            "absorption_capacity_m3": 3800,
            "infiltration_rate_mm_hr": 40,
            "max_pond_depth_m": 0.30,
            "color": "#43a047"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4132, 3.0975],
                [101.4158, 3.0978],
                [101.4162, 3.0992],
                [101.4138, 3.0988],
                [101.4132, 3.0975]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "green_makyong_gardens",
        "properties": {
            "id": "green_makyong_gardens",
            "name": "Jalan Makyong Pocket Rain Gardens",
            "category": "green",
            "category_label": "Green Infrastructure",
            "type": "rain_garden",
            "type_label": "Pocket Rain Garden",
            "description": "Series of sunken botanical micro-catchments dispersed across residential crescents in Jalan Makyong to intercept street runoff before it pools.",
            "absorption_capacity_m3": 2800,
            "infiltration_rate_mm_hr": 50,
            "max_pond_depth_m": 0.25,
            "color": "#4caf50"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4272, 3.0895],
                [101.4288, 3.0896],
                [101.4286, 3.0912],
                [101.4270, 3.0910],
                [101.4272, 3.0895]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "green_roof_makyong",
        "properties": {
            "id": "green_roof_makyong",
            "name": "Makyong Commercial Hub Eco-Green Roofs",
            "category": "green",
            "category_label": "Green Infrastructure",
            "type": "green_roof",
            "type_label": "Extensive Green Roofs",
            "description": "Vegetated rooftop systems on commercial shophouses (Krista, Q-dees vicinity) absorbing direct rainfall, mitigating heat-island effect, and buffering stormwater peak.",
            "absorption_capacity_m3": 1600,
            "infiltration_rate_mm_hr": 60,
            "max_pond_depth_m": 0.15,
            "color": "#66bb6a"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4258, 3.0886],
                [101.4268, 3.0887],
                [101.4267, 3.0896],
                [101.4257, 3.0895],
                [101.4258, 3.0886]
            ]]
        }
    },

    # ---------------- BLUE INFRASTRUCTURE ----------------
    {
        "type": "Feature",
        "id": "blue_bbr_wetland",
        "properties": {
            "id": "blue_bbr_wetland",
            "name": "Bandar Bukit Raja Wetland Lake (Main Retention Basin)",
            "category": "blue",
            "category_label": "Blue Infrastructure",
            "type": "retention_basin",
            "type_label": "Restored Wetland & Primary Retention Lake",
            "description": "Sime Darby Property flagship 50,000 m³ retention lake. Operates on 4R principles (Reroute, Retain, Restore, Release) with macrophyte marsh zones buffering regional stormwater.",
            "capacity_m3": 52000,
            "normal_pool_depth_m": 1.2,
            "max_water_depth_m": 3.2,
            "alert_depth_m": 2.2,     # MSMA Alert (Waspada, ~65%)
            "warning_depth_m": 2.6,   # MSMA Warning (Amar, ~80%)
            "danger_depth_m": 2.9,    # MSMA Danger (Bahaya / Overflow, >90%)
            "color": "#0288d1"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4178, 3.0962],
                [101.4222, 3.0968],
                [101.4218, 3.0995],
                [101.4175, 3.0988],
                [101.4178, 3.0962]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "blue_casira_pond",
        "properties": {
            "id": "blue_casira_pond",
            "name": "Taman Casira Stormwater Retention Basin",
            "category": "blue",
            "category_label": "Blue Infrastructure",
            "type": "detention_pond",
            "type_label": "Community Retention Basin",
            "description": "Deep stormwater retention pond regulating discharge from Casira into Sungai Puloh, fitted with concrete weir overflow and sediment trap.",
            "capacity_m3": 12500,
            "normal_pool_depth_m": 0.8,
            "max_water_depth_m": 2.6,
            "alert_depth_m": 1.8,
            "warning_depth_m": 2.1,
            "danger_depth_m": 2.4,
            "color": "#039be5"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4148, 3.0958],
                [101.4170, 3.0960],
                [101.4168, 3.0975],
                [101.4146, 3.0972],
                [101.4148, 3.0958]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "blue_kyra_pond",
        "properties": {
            "id": "blue_kyra_pond",
            "name": "Taman Kyra North Retention Pond",
            "category": "blue",
            "category_label": "Blue Infrastructure",
            "type": "retention_basin",
            "type_label": "North Detention Pond",
            "description": "Retention pond serving Taman Kyra northern quadrant, equipped with multistage outlet riser to restrict post-development discharge to pre-development levels.",
            "capacity_m3": 10500,
            "normal_pool_depth_m": 0.7,
            "max_water_depth_m": 2.4,
            "alert_depth_m": 1.6,
            "warning_depth_m": 1.9,
            "danger_depth_m": 2.2,
            "color": "#00acc1"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4102, 3.1058],
                [101.4124, 3.1060],
                [101.4122, 3.1076],
                [101.4100, 3.1074],
                [101.4102, 3.1058]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "blue_makyong_pond",
        "properties": {
            "id": "blue_makyong_pond",
            "name": "Jalan Makyong South Flood Detention Basin",
            "category": "blue",
            "category_label": "Blue Infrastructure",
            "type": "detention_pond",
            "type_label": "South Flood Detention Basin",
            "description": "Lowland stormwater detention basin attenuating sudden flood surges from Jalan Makyong 1 to 6, protecting downstream neighborhoods.",
            "capacity_m3": 14000,
            "normal_pool_depth_m": 0.9,
            "max_water_depth_m": 2.8,
            "alert_depth_m": 1.9,
            "warning_depth_m": 2.2,
            "danger_depth_m": 2.5,
            "color": "#0097a7"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4308, 3.0872],
                [101.4332, 3.0874],
                [101.4328, 3.0892],
                [101.4305, 3.0890],
                [101.4308, 3.0872]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "blue_sungai_puloh",
        "properties": {
            "id": "blue_sungai_puloh",
            "name": "Sungai Puloh Widened River & Conveyance Corridor",
            "category": "blue",
            "category_label": "Blue Infrastructure",
            "type": "widened_river",
            "type_label": "Widened Naturalized River & Canal",
            "description": "30m widened river channel designed for 100-year ARI events, featuring stabilized vegetated riparian margins, bioswale feeders, and gentle terraced flood benches.",
            "capacity_m3": 45000,
            "normal_depth_m": 1.0,
            "max_depth_m": 3.5,
            "alert_depth_m": 2.4,
            "warning_depth_m": 2.8,
            "danger_depth_m": 3.1,
            "color": "#0277bd"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.3995, 3.0927],
                [101.4065, 3.0928],
                [101.4135, 3.0928],
                [101.4195, 3.0928],
                [101.4270, 3.0928],
                [101.4338, 3.0928]
            ]
        }
    },

    # ---------------- GRAY INFRASTRUCTURE ----------------
    {
        "type": "Feature",
        "id": "gray_persiaran_bbr_culvert",
        "properties": {
            "id": "gray_persiaran_bbr_culvert",
            "name": "Persiaran BBR Primary Reinforced Concrete Box Culvert (RCBC)",
            "category": "gray",
            "category_label": "Gray Infrastructure",
            "type": "drainage_culvert",
            "type_label": "Primary Drainage Culvert Trunk (2.4m x 2.4m RCBC)",
            "description": "High-capacity subsurface twin box culvert running along Persiaran Bandar Bukit Raja, rapidly conveying stormwater away from residential road surfaces to the retention lakes.",
            "design_discharge_m3_s": 18.5,
            "diameter_m": 2.4,
            "surcharge_threshold_pct": 85,
            "color": "#607d8b"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4135, 3.0982],
                [101.4165, 3.0970],
                [101.4195, 3.0965],
                [101.4230, 3.0955],
                [101.4275, 3.0945],
                [101.4332, 3.0928]
            ]
        }
    },
    {
        "type": "Feature",
        "id": "gray_makyong_culvert",
        "properties": {
            "id": "gray_makyong_culvert",
            "name": "Jalan Makyong Interconnected Concrete Drainage Trunk",
            "category": "gray",
            "category_label": "Gray Infrastructure",
            "type": "drainage_culvert",
            "type_label": "Concrete Storm Trunk Drain (1.8m U-Drain)",
            "description": "Engineered U-drain and pipe network linking residential streets of Jalan Makyong directly into the south detention basin.",
            "design_discharge_m3_s": 12.0,
            "diameter_m": 1.8,
            "surcharge_threshold_pct": 80,
            "color": "#78909c"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [101.4255, 3.0882],
                [101.4275, 3.0888],
                [101.4295, 3.0898],
                [101.4315, 3.0905],
                [101.4330, 3.0880]
            ]
        }
    },
    {
        "type": "Feature",
        "id": "gray_masjid_porous_parking",
        "properties": {
            "id": "gray_masjid_porous_parking",
            "name": "Masjid Bandar Bukit Raja Permeable Pavement & Porous Parking",
            "category": "gray",
            "category_label": "Gray Infrastructure",
            "type": "porous_parking",
            "type_label": "Permeable Pavement & Porous Parking Lot",
            "description": "Permeable interlocking concrete pavers (PICP) laid over an open-graded crushed stone reservoir, allowing rainwater to filter immediately into the subgrade without ponding.",
            "storage_capacity_m3": 1850,
            "filtration_rate_mm_hr": 120,
            "reservoir_depth_m": 0.45,
            "color": "#546e7a"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4290, 3.0894],
                [101.4302, 3.0895],
                [101.4300, 3.0904],
                [101.4288, 3.0903],
                [101.4290, 3.0894]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "gray_krista_permeable",
        "properties": {
            "id": "gray_krista_permeable",
            "name": "Makyong Commercial Plaza Porous Pavement",
            "category": "gray",
            "category_label": "Gray Infrastructure",
            "type": "permeable_pavement",
            "type_label": "Porous Asphalt & Interlocking Pavers",
            "description": "Porous asphalt bay allowing high-rate infiltration, preventing vehicle hydroplaning and relieving roadside drain pressure.",
            "storage_capacity_m3": 1200,
            "filtration_rate_mm_hr": 100,
            "reservoir_depth_m": 0.35,
            "color": "#455a64"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4260, 3.0887],
                [101.4272, 3.0888],
                [101.4271, 3.0895],
                [101.4259, 3.0894],
                [101.4260, 3.0887]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "gray_masjid_cistern",
        "properties": {
            "id": "gray_masjid_cistern",
            "name": "Masjid BBR Subsurface Stormwater Storage Cistern",
            "category": "gray",
            "category_label": "Gray Infrastructure",
            "type": "underground_cistern",
            "type_label": "Underground Stormwater Detention Cistern",
            "description": "Buried modular geocellular stormwater attenuation tank holding 3,200 m³ of runoff beneath the mosque compound. Trapped water is reused for ablution filtration and landscape maintenance.",
            "storage_capacity_m3": 3200,
            "depth_m": 2.8,
            "surcharge_threshold_pct": 85,
            "color": "#37474f"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4292, 3.0898],
                [101.4298, 3.0898],
                [101.4298, 3.0903],
                [101.4292, 3.0903],
                [101.4292, 3.0898]
            ]]
        }
    },
    {
        "type": "Feature",
        "id": "gray_bbr_civic_cistern",
        "properties": {
            "id": "gray_bbr_civic_cistern",
            "name": "Bandar Bukit Raja Subterranean Detention Vault",
            "category": "gray",
            "category_label": "Gray Infrastructure",
            "type": "underground_cistern",
            "type_label": "Subterranean Detention Vault",
            "description": "Reinforced underground retention vault located below the civic junction, providing surge attenuation when downstream river levels peak.",
            "storage_capacity_m3": 4800,
            "depth_m": 3.0,
            "surcharge_threshold_pct": 85,
            "color": "#263238"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [101.4172, 3.0984],
                [101.4180, 3.0985],
                [101.4179, 3.0991],
                [101.4171, 3.0990],
                [101.4172, 3.0984]
            ]]
        }
    }
]

sponge_fc = {
    "type": "FeatureCollection",
    "features": sponge_features
}

with open("web/data/bbr/sponge.geojson", "w", encoding="utf-8") as f:
    json.dump(sponge_fc, f, indent=2)

print(f"Saved {len(sponge_features)} sponge infrastructure features to web/data/bbr/sponge.geojson")
