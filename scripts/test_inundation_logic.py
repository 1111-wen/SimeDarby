zones = [
  {'name': 'Pekan Meru Riverbank', 'elev': 3.80, 'thresh': 4.20, 'crestSub': 60},
  {'name': 'Jalan Makyong Dip', 'elev': 4.20, 'thresh': 4.40, 'crestSub': 45},
  {'name': 'Jalan Meru Junction', 'elev': 4.40, 'thresh': 4.50, 'crestSub': 50},
  {'name': 'BBR Wetland Lake', 'elev': 4.10, 'thresh': 4.30, 'crestSub': 35},
  {'name': 'Masjid BBR (Safe High Ground)', 'elev': 5.60, 'thresh': 6.20, 'crestSub': 0}
]

def simulate(curr, pred, time_label):
    rate = (pred - curr) / 3.0
    print(f"\n=== Scenario: Current={curr}m -> Forecast={pred}m (Rise={rate:+.2f}m/h) at {time_label} ===")
    for z in zones:
        if z['crestSub'] == 0:
            print(f"  [SAFE]  {z['name']}: IMMUNE (Always dry high ground)")
            continue
        if curr >= z['thresh']:
            depth = min(z['crestSub'], int((curr - z['elev']) * 100))
            print(f"  [ACTIVE FLOOD] {z['name']}: Submerged {depth} cm")
        elif pred >= z['thresh'] and rate > 0:
            rise_needed = z['thresh'] - curr
            mins = int((rise_needed / rate) * 60)
            depth = min(z['crestSub'], int((pred - z['elev']) * 100))
            print(f"  [PREDICTED FLOOD] {z['name']}: Breaches in {mins} mins (Predicted Depth: {depth} cm)")
        elif pred >= (z['thresh'] - 0.20):
            print(f"  [MODERATE RISK]   {z['name']}: Shallow gutter ponding (~10-15 cm)")
        else:
            print(f"  [CLEAR] {z['name']}: Dry & Safe")

simulate(3.20, 3.25, '25/11 00:00 (Normal Baseline)')
simulate(4.05, 4.65, '28/11 18:00 (Surge Onset)')
simulate(4.76, 4.72, '29/11 04:00 (Peak Flood Crest)')
simulate(4.45, 3.80, '01/12 00:00 (Post-Surge Recession)')
