with open("web/index.html", "r", encoding="utf-8") as f:
    content = f.read()

hud_html = """    <div class="camtoggle">
      <button type="button" id="cam3d" aria-pressed="true">3D</button>
      <button type="button" id="camTop" aria-pressed="false">Top</button>
    </div>

    <!-- Sponge Township & Drainage System HUD (MSMA / JPS Guidelines) -->
    <div class="sponge-hud" id="spongeHud" aria-label="Sponge Township Status">
      <div class="sponge-hud-head">
        <span class="sponge-hud-title">Sponge Township</span>
        <span class="sponge-badge badge-safe" id="spongeStatusBadge">Normal (Safe)</span>
      </div>
      <div class="sponge-hud-meter">
        <div class="sponge-hud-bar" id="spongeHudBar" style="width: 18%;"></div>
      </div>
      <div class="sponge-hud-stats">
        <span>Retention: <strong id="spongeStorageText">18% (14,200 m³)</strong></span>
        <span id="spongeRainText" style="color:var(--water); font-weight:600;">Dry</span>
      </div>
      <div class="sponge-hud-tags">
        <span class="tag green" title="Urban parks, gardens, green roofs, rain gardens">🌿 Green</span>
        <span class="tag blue" title="Restored wetlands, retention basins, widened rivers">💧 Blue</span>
        <span class="tag gray" title="Permeable pavements, porous parking, cisterns, culverts">⚙️ Gray</span>
      </div>
    </div>"""

# Replace camtoggle
old_camtoggle = """    <div class="camtoggle">
      <button type="button" id="cam3d" aria-pressed="true">3D</button>
      <button type="button" id="camTop" aria-pressed="false">Top</button>
    </div>"""

if old_camtoggle in content:
    content = content.replace(old_camtoggle, hud_html)
elif old_camtoggle.replace("\r\n", "\n") in content:
    content = content.replace(old_camtoggle.replace("\r\n", "\n"), hud_html.replace("\r\n", "\n"))

# Add sponge legend below main legend
old_legend = """        <div class="legend">
          <span><span class="sw" style="background:var(--route)"></span>Your route</span>
          <span><span class="sw" style="background:var(--moderate)"></span>Moderate risk</span>
          <span><span class="sw" style="background:var(--high)"></span>High risk</span>
          <span><span class="sw" style="background:var(--water)"></span>Floodwater</span>
        </div>"""

new_legend = """        <div class="legend">
          <span><span class="sw" style="background:var(--route)"></span>Your route</span>
          <span><span class="sw" style="background:var(--moderate)"></span>Moderate risk</span>
          <span><span class="sw" style="background:var(--high)"></span>High risk</span>
          <span><span class="sw" style="background:var(--water)"></span>Floodwater</span>
        </div>
        <div class="legend sponge-legend">
          <span><span class="sw" style="background:#2e7d32"></span>🌿 Green (Parks & Infiltration)</span>
          <span><span class="sw" style="background:#0288d1"></span>💧 Blue (Wetlands & Basins)</span>
          <span><span class="sw" style="background:#607d8b"></span>⚙️ Gray (Culverts & Cisterns)</span>
        </div>"""

if old_legend in content:
    content = content.replace(old_legend, new_legend)
elif old_legend.replace("\r\n", "\n") in content:
    content = content.replace(old_legend.replace("\r\n", "\n"), new_legend.replace("\r\n", "\n"))

# Add MSMA sponge explanation in <details>
old_details_tail = "<p>This app supports official warnings. Always follow instructions from Bomba and the authorities, and call 999 in an emergency.</p>"
new_details_tail = """<p><strong>Sponge City Framework (MSMA / JPS):</strong> Models Green (urban parks, green roofs, rain gardens), Blue (wetlands, retention basins, widened rivers), and Gray (permeable pavements, cisterns, culverts) infrastructure. As water rises to Warning (&ge;75%) and Danger (&ge;85%), overtopping triggers dynamic evacuation rerouting away from flooded roads toward safety / relief centres (Masjid Bandar Bukit Raja).</p>
          <p>This app supports official warnings. Always follow instructions from Bomba and the authorities, and call 999 in an emergency.</p>"""

if old_details_tail in content:
    content = content.replace(old_details_tail, new_details_tail)
elif old_details_tail.replace("\r\n", "\n") in content:
    content = content.replace(old_details_tail.replace("\r\n", "\n"), new_details_tail.replace("\r\n", "\n"))

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated web/index.html successfully.")
