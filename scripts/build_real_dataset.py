import os
import sys
import json
import re
from datetime import datetime

# Parse CSV directly with standard python library without needing pandas immediately
def parse_station_csv(filepath, col_prefix):
    records = {}
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    header_idx = -1
    for i, line in enumerate(lines[:10]):
        if 'Date/Time' in line or 'Time' in line or 'No.' in line:
            header_idx = i
            break

    if header_idx == -1:
        header_idx = 1

    header_line = lines[header_idx]
    
    # We know from inspecting lines that format is:
    # No., Date/Time, Raw Rain, ECM Rain, Rainfall, Raw WL, ECM WL, Water Level
    for line in lines[header_idx + 2:]:
        line = line.strip()
        if not line:
            continue
        parts = [p.strip().replace('"', '').replace("'", "") for p in line.split(',')]
        if len(parts) < 8:
            continue
        dt_str = parts[1] # e.g. "01/10/2024 00:00"
        try:
            # Parse DD/MM/YYYY HH:MM
            dt = datetime.strptime(dt_str, "%d/%m/%Y %H:%M")
        except Exception:
            continue
        
        # Rainfall in column 4, Water Level in column 7
        try:
            rf = float(parts[4])
        except Exception:
            rf = 0.0
            
        try:
            wl = float(parts[7])
        except Exception:
            wl = None
            
        records[dt] = {
            f"{col_prefix}_level": wl,
            f"{col_prefix}_rain": rf
        }
    return records

print("Parsing CSV files from sime/...")
binjai_data = parse_station_csv("sime/Sg.BinjaidiPekanMeru.csv", "binjai")
rasau_data = parse_station_csv("sime/Sg.RasaudiTuguKeris.csv", "rasau")
klang_data = parse_station_csv("sime/Sg.KlangdiBandarKlang.csv", "klang")

print(f"Loaded {len(binjai_data)} Binjai records, {len(rasau_data)} Rasau records, {len(klang_data)} Klang records.")

# Target date range: 25/11/2024 00:00 to 05/12/2024 00:00 (hourly)
start_dt = datetime(2024, 11, 25, 0, 0)
end_dt = datetime(2024, 12, 5, 0, 0)

# Filter Binjai records within range
in_range_dts = sorted([dt for dt in binjai_data.keys() if start_dt <= dt <= end_dt])
print(f"Found {len(in_range_dts)} 15-minute timestamps between {start_dt} and {end_dt}.")

# Find max WL
max_entry = max([(dt, binjai_data[dt]['binjai_level']) for dt in in_range_dts if binjai_data[dt]['binjai_level'] is not None], key=lambda x: x[1])
print(f"Historical Maximum Water Level at Sg. Binjai: {max_entry[1]} m at {max_entry[0]}")
