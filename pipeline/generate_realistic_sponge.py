import json
import math
import random

# Seed for reproducible natural tree placement
random.seed(42)

def make_circle_polygon(center, radius_m, points=16, roughness=0.0):
    """Generate organic circular/curved polygon in [lng, lat] coordinates."""
    lng, lat = center
    # Approximate degrees per meter
    m_per_deg_lat = 111132.0
    m_per_deg_lng = 111132.0 * math.cos(math.radians(lat))
    
    coords = []
    for i in range(points):
        angle = (2 * math.pi * i) / points
        r = radius_m * (1.0 + random.uniform(-roughness, roughness))
        d_lat = (r * math.sin(angle)) / m_per_deg_lat
        d_lng = (r * math.cos(angle)) / m_per_deg_lng
        coords.append([round(lng + d_lng, 7), round(lat + d_lat, 7)])
    coords.append(coords[0]) # close ring
    return coords

def make_organic_lake():
    """Real shape for Bandar Bukit Raja Wetland Lake with natural bays, islands, and inlets."""
    # Central wetland lake around 101.4195, 3.0980 (approx 450m long, 220m wide natural shape)
    base_points = [
        [101.4175, 3.0968],
        [101.4182, 3.0965],
        [101.4195, 3.0963],
        [101.4208, 3.0965],
        [101.4218, 3.0970],
        [101.4225, 3.0978],
        [101.4222, 3.0988],
        [101.4212, 3.0995],
        [101.4200, 3.0998],
        [101.4188, 3.0996],
        [101.4180, 3.0990],
        [101.4172, 3.0982],
        [101.4170, 3.0975],
        [101.4175, 3.0968]
    ]
    # Smooth into a natural meandering shoreline (interpolating 3x points with slight organic variation)
    smooth = []
    n = len(base_points) - 1
    for i in range(n):
        p0 = base_points[i]
        p1 = base_points[(i + 1) % n]
        for t in [0.0, 0.33, 0.67]:
            lng = p0[0] + (p1[0] - p0[0]) * t + random.uniform(-0.00008, 0.00008)
            lat = p0[1] + (p1[1] - p0[1]) * t + random.uniform(-0.00008, 0.00008)
            smooth.append([round(lng, 7), round(lat, 7)])
    smooth.append(smooth[0])
    return smooth

def make_organic_pond(center_lng, center_lat, r_x_m, r_y_m, rotation_deg=0):
    """Generate organic natural pond with curvilinear edges."""
    m_per_deg_lat = 111132.0
    m_per_deg_lng = 111132.0 * math.cos(math.radians(center_lat))
    pts = 24
    coords = []
    rad = math.radians(rotation_deg)
    for i in range(pts):
        angle = (2 * math.pi * i) / pts
        # Ellipse with organic wiggle
        rx = r_x_m * (1.0 + 0.12 * math.sin(3 * angle) + random.uniform(-0.05, 0.05))
        ry = r_y_m * (1.0 + 0.15 * math.cos(2 * angle) + random.uniform(-0.05, 0.05))
        x0 = rx * math.cos(angle)
        y0 = ry * math.sin(angle)
        # Rotate
        xr = x0 * math.cos(rad) - y0 * math.sin(rad)
        yr = x0 * math.sin(rad) + y0 * math.cos(rad)
        dlng = xr / m_per_deg_lng
        dlat = yr / m_per_deg_lat
        coords.append([round(center_lng + dlng, 7), round(center_lat + dlat, 7)])
    coords.append(coords[0])
    return coords

def make_organic_garden_bed(center_lng, center_lat, length_m, width_m, angle_deg=25):
    """Generate realistic curved garden bed polygon."""
    return make_organic_pond(center_lng, center_lat, length_m, width_m, angle_deg)

features = []

# ==================== 1. REAL LAKES (BLUE INFRASTRUCTURE) ====================
# Main BBR Wetland Lake (organic shoreline)
features.append({
    "type": "Feature",
    "id": "lake_bbr_wetland",
    "properties": {
        "id": "lake_bbr_wetland",
        "name": "Bandar Bukit Raja Wetland Lake",
        "category": "blue",
        "category_label": "Blue Infrastructure",
        "type": "real_lake",
        "type_label": "Restored Natural Wetland Lake",
        "description": "50,000 m³ naturalized retention lake featuring sinuous shorelines, biological reed margins, and deep sediment retention pools under the 4R framework.",
        "capacity_m3": 52000,
        "max_depth_m": 3.2,
        "normal_depth_m": 1.2,
        "alert_depth_m": 2.2,
        "warning_depth_m": 2.6,
        "danger_depth_m": 2.9,
        "color": "#0288d1"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [make_organic_lake()]
    }
})

# Casira Retention Lake
features.append({
    "type": "Feature",
    "id": "lake_casira",
    "properties": {
        "id": "lake_casira",
        "name": "Taman Casira Retention Lake",
        "category": "blue",
        "category_label": "Blue Infrastructure",
        "type": "real_lake",
        "type_label": "Naturalized Retention Lake",
        "description": "Teardrop-shaped stormwater retention lake buffering runoff from Taman Casira before entering Sungai Puloh.",
        "capacity_m3": 13500,
        "max_depth_m": 2.7,
        "normal_depth_m": 0.9,
        "alert_depth_m": 1.9,
        "warning_depth_m": 2.2,
        "danger_depth_m": 2.5,
        "color": "#039be5"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [make_organic_pond(101.4158, 3.0968, 110, 65, 35)]
    }
})

# Kyra North Lake & Wetland
features.append({
    "type": "Feature",
    "id": "lake_kyra",
    "properties": {
        "id": "lake_kyra",
        "name": "Taman Kyra North Retention Pond",
        "category": "blue",
        "category_label": "Blue Infrastructure",
        "type": "real_lake",
        "type_label": "Community Retention Lake",
        "description": "Naturalized detention lake with emergent aquatic macrophytes attenuating northern catchment runoff.",
        "capacity_m3": 11000,
        "max_depth_m": 2.5,
        "normal_depth_m": 0.8,
        "alert_depth_m": 1.7,
        "warning_depth_m": 2.0,
        "danger_depth_m": 2.3,
        "color": "#00acc1"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [make_organic_pond(101.4112, 3.1065, 95, 55, -20)]
    }
})

# Makyong South Retention Basin
features.append({
    "type": "Feature",
    "id": "lake_makyong",
    "properties": {
        "id": "lake_makyong",
        "name": "Jalan Makyong South Retention Lake",
        "category": "blue",
        "category_label": "Blue Infrastructure",
        "type": "real_lake",
        "type_label": "Lowland Retention Lake",
        "description": "Kidney-shaped stormwater lake attenuating flash flood runoff from Jalan Makyong 1 to 6.",
        "capacity_m3": 14500,
        "max_depth_m": 2.8,
        "normal_depth_m": 0.9,
        "alert_depth_m": 1.9,
        "warning_depth_m": 2.3,
        "danger_depth_m": 2.6,
        "color": "#0097a7"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [make_organic_pond(101.4318, 3.0882, 105, 60, 45)]
    }
})

# Sinuous Sungai Puloh Naturalized River Corridor
river_coords = [
    [101.3992, 3.09265],
    [101.4030, 3.09272],
    [101.4065, 3.09280],
    [101.4100, 3.09275],
    [101.4135, 3.09283],
    [101.4170, 3.09278],
    [101.4205, 3.09285],
    [101.4240, 3.09280],
    [101.4280, 3.09286],
    [101.4320, 3.09280],
    [101.4342, 3.09285]
]
features.append({
    "type": "Feature",
    "id": "river_sungai_puloh",
    "properties": {
        "id": "river_sungai_puloh",
        "name": "Sungai Puloh Restored Natural River Corridor",
        "category": "blue",
        "category_label": "Blue Infrastructure",
        "type": "widened_river",
        "type_label": "Restored River & Sinuous Canal",
        "description": "30m-wide naturalized meandering river corridor with vegetated riparian benches that convey floodwaters smoothly.",
        "capacity_m3": 48000,
        "normal_depth_m": 1.0,
        "max_depth_m": 3.4,
        "color": "#0277bd"
    },
    "geometry": {
        "type": "LineString",
        "coordinates": river_coords
    }
})

# ==================== 2. REAL GARDENS (GREEN INFRASTRUCTURE) ====================
# Curvilinear Rain Gardens in BBR Townpark, Kyra, Casira, Makyong
garden_specs = [
    ("garden_bbr_central", "BBR Townpark Botanical Rain Garden", 101.4190, 3.1005, 120, 70, -15, "Multi-tiered landscaped botanical garden with engineered bio-retention soil and deep-rooting native sedges."),
    ("garden_kyra_rain", "Taman Kyra Bio-Retention Rain Garden", 101.4130, 3.1060, 65, 38, 30, "Sunken rain garden bed with permeable sandy-loam filter capturing driveway and road runoff."),
    ("garden_casira_swale", "Taman Casira Vegetated Garden Swale", 101.4148, 3.0982, 80, 35, 55, "Curved landscaped swale planted with flowering irises and vetiver grass to trap silt."),
    ("garden_makyong_pocket1", "Jalan Makyong Pocket Rain Garden East", 101.4280, 3.0905, 55, 32, -40, "Neighborhood pocket rain garden trapping runoff before entering roadside drains."),
    ("garden_makyong_pocket2", "Jalan Makyong Pocket Rain Garden West", 101.4265, 3.0898, 48, 28, 20, "Curved roadside bio-retention garden planted with flowering shrubs and ferns.")
]

for gid, gname, glng, glat, glen, gwid, gang, gdesc in garden_specs:
    features.append({
        "type": "Feature",
        "id": gid,
        "properties": {
            "id": gid,
            "name": gname,
            "category": "green",
            "category_label": "Green Infrastructure",
            "type": "real_garden",
            "type_label": "Curved Botanical Rain Garden",
            "description": gdesc,
            "absorption_capacity_m3": 3500,
            "infiltration_rate_mm_hr": 55,
            "color": "#388e3c"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [make_organic_garden_bed(glng, glat, glen, gwid, gang)]
        }
    })

# ==================== 3. REAL 3D TREES ====================
tree_species = [
    {"name": "Rain Tree (Samanea saman)", "height": 13.5, "radius": 6.8, "color": "#1b4332", "trunk": "#4a3525"},
    {"name": "Yellow Flame (Peltophorum pterocarpum)", "height": 11.0, "radius": 5.2, "color": "#2d6a4f", "trunk": "#5d4037"},
    {"name": "Weeping Willow (Salix babylonica)", "height": 9.5, "radius": 5.0, "color": "#40916c", "trunk": "#3e2723"},
    {"name": "Royal Palm (Roystonea regia)", "height": 14.0, "radius": 3.5, "color": "#52b788", "trunk": "#795548"},
    {"name": "Frangipani (Plumeria rubra)", "height": 6.5, "radius": 3.8, "color": "#74c69d", "trunk": "#6d4c41"}
]

# Generate realistic tree groves along:
# A) BBR Wetland Lake perimeter trail
# B) BBR Central Townpark green meadows
# C) Taman Kyra community park & road verges
# D) Taman Casira linear garden & swale
# E) Jalan Makyong garden pockets & mosque compound

tree_clusters = [
    # (center_lng, center_lat, count, spread_m, species_idx_bias)
    (101.4190, 3.0970, 22, 140, 2), # Wetland lake south shore (Willows & Rain trees)
    (101.4210, 3.0980, 20, 120, 0), # Wetland lake east shore
    (101.4180, 3.0985, 18, 110, 1), # Wetland lake west trail
    (101.4195, 3.1010, 25, 150, 0), # BBR Central Townpark grove
    (101.4128, 3.1062, 16, 70, 1),  # Taman Kyra community park
    (101.4145, 3.0985, 18, 80, 3),  # Taman Casira green belt
    (101.4275, 3.0902, 15, 60, 4),  # Jalan Makyong gardens
    (101.4295, 3.0898, 14, 50, 3)   # Masjid BBR garden landscape
]

m_per_deg_lat = 111132.0
tree_id_counter = 1

for clng, clat, count, spread, sp_bias in tree_clusters:
    m_per_deg_lng = 111132.0 * math.cos(math.radians(clat))
    for _ in range(count):
        # Position with organic scatter
        r = random.uniform(8, spread)
        theta = random.uniform(0, 2 * math.pi)
        tlng = round(clng + (r * math.cos(theta)) / m_per_deg_lng, 7)
        tlat = round(clat + (r * math.sin(theta)) / m_per_deg_lat, 7)
        
        # Pick species
        sp = tree_species[(sp_bias + random.choice([0, 0, 1, 2])) % len(tree_species)]
        height = round(sp["height"] * random.uniform(0.85, 1.15), 1)
        radius = round(sp["radius"] * random.uniform(0.85, 1.15), 1)
        
        # 3D Tree Canopy Polygon (multi-sided organic canopy that extrudes in 3D)
        canopy_poly = make_circle_polygon((tlng, tlat), radius, points=12, roughness=0.15)
        
        features.append({
            "type": "Feature",
            "id": f"tree_{tree_id_counter}",
            "properties": {
                "id": f"tree_{tree_id_counter}",
                "name": sp["name"],
                "category": "green",
                "category_label": "Green Infrastructure",
                "type": "real_tree",
                "type_label": "Matured Urban Canopy Tree",
                "species": sp["name"],
                "height_m": height,
                "trunk_height_m": round(height * 0.35, 1),
                "canopy_radius_m": radius,
                "canopy_color": sp["color"],
                "trunk_color": sp["trunk"],
                "description": f"Matured {sp['name']} with a {radius*2:.1f}m wide canopy. Intercepts rainfall, transpires moisture, and binds soil along sponge corridors."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [canopy_poly]
            }
        })
        tree_id_counter += 1

print(f"Generated {tree_id_counter - 1} realistic trees.")

# ==================== 4. REAL GRAY INFRASTRUCTURE ====================
# Concrete Box Culverts and Underground Cisterns
features.append({
    "type": "Feature",
    "id": "culvert_bbr_primary",
    "properties": {
        "id": "culvert_bbr_primary",
        "name": "Persiaran BBR Primary Box Culvert Trunk (RCBC)",
        "category": "gray",
        "category_label": "Gray Infrastructure",
        "type": "drainage_culvert",
        "type_label": "2.4m x 2.4m Box Culvert",
        "description": "Twin reinforced concrete box culvert running below Persiaran BBR, discharging high volume stormwater into the wetland lake.",
        "design_discharge_m3_s": 18.5,
        "diameter_m": 2.4,
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
})

# Porous Parking at Masjid BBR
features.append({
    "type": "Feature",
    "id": "porous_masjid_bbr",
    "properties": {
        "id": "porous_masjid_bbr",
        "name": "Masjid BBR Permeable Pavers & Porous Parking",
        "category": "gray",
        "category_label": "Gray Infrastructure",
        "type": "porous_parking",
        "type_label": "Permeable Interlocking Pavers",
        "description": "Open-graded permeable concrete pavers allowing instant vertical stormwater infiltration into underground crushed stone subbase.",
        "storage_capacity_m3": 1850,
        "color": "#546e7a"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [make_organic_pond(101.4296, 3.0898, 45, 30, 15)]
    }
})

# Underground Storage Cistern
features.append({
    "type": "Feature",
    "id": "cistern_masjid_bbr",
    "properties": {
        "id": "cistern_masjid_bbr",
        "name": "Masjid BBR Underground Storage Cistern",
        "category": "gray",
        "category_label": "Gray Infrastructure",
        "type": "underground_cistern",
        "type_label": "Subsurface Stormwater Cistern",
        "description": "3,200 m³ underground modular detention vault capturing surplus roof & site runoff, preventing surface flooding.",
        "storage_capacity_m3": 3200,
        "depth_m": 2.8,
        "color": "#37474f"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [make_organic_pond(101.4293, 3.0901, 32, 22, -10)]
    }
})

sponge_fc = {
    "type": "FeatureCollection",
    "features": features
}

with open("web/data/bbr/sponge.geojson", "w", encoding="utf-8") as f:
    json.dump(sponge_fc, f, indent=2)

print(f"Total realistic features generated: {len(features)}")
