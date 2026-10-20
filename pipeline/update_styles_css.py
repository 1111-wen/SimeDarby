sponge_css = """
/* Sponge Township & Drainage System HUD (MSMA / JPS Guidelines) */
.sponge-hud {
  position: absolute; right: 12px; top: 62px; z-index: 2; width: 260px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
  box-shadow: var(--shadow); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;
  transition: all .25s ease;
}
@media (max-width: 899px) { .sponge-hud { top: 290px; width: 240px; padding: 10px 12px; } }

.sponge-hud-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.sponge-hud-title { font-size: 13px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }

.sponge-badge {
  font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: 0.02em;
}
.badge-safe { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
.badge-alert { background: #fffde7; color: #f57f17; border: 1px solid #fff59d; }
.badge-warning { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
.badge-danger { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; animation: pulse-danger 1.5s infinite; }

@keyframes pulse-danger {
  0% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(198, 40, 40, 0); }
  100% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0); }
}

.sponge-hud-meter {
  width: 100%; height: 7px; border-radius: 4px; background: var(--line); overflow: hidden;
}
.sponge-hud-bar {
  height: 100%; border-radius: 4px; background: #2e7d32; transition: width .3s ease, background-color .3s ease;
}
.sponge-hud-stats {
  display: flex; justify-content: space-between; font-size: 11.5px; color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.sponge-hud-tags {
  display: flex; gap: 5px; flex-wrap: wrap; margin-top: 2px;
}
.sponge-hud-tags .tag {
  font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 5px; background: var(--surface);
  border: 1px solid var(--line); color: var(--ink);
}
.sponge-hud-tags .tag.green { border-color: #a5d6a7; color: #2e7d32; }
.sponge-hud-tags .tag.blue { border-color: #81d4fa; color: #0277bd; }
.sponge-hud-tags .tag.gray { border-color: #b0bec5; color: #455a64; }

/* Sponge Feature Popups */
.sponge-pop { min-width: 250px; font-family: inherit; font-size: 13px; line-height: 1.4; color: var(--ink); }
.sponge-pop-head { margin-bottom: 6px; }
.sponge-pop-head h4 { margin: 4px 0 2px; font-size: 15px; font-weight: 700; }
.sponge-cat-tag {
  font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 5px; display: inline-block;
}
.sponge-cat-tag.green { background: #e8f5e9; color: #2e7d32; }
.sponge-cat-tag.blue { background: #e1f5fe; color: #0288d1; }
.sponge-cat-tag.gray { background: #eceff1; color: #455a64; }

.sponge-desc { font-size: 12px; color: var(--muted); margin: 0 0 8px; }
.sponge-status-box {
  background: var(--surface); padding: 8px 10px; border-radius: 8px; margin-bottom: 8px;
}
.sponge-status-header { font-size: 12px; margin-bottom: 5px; display: flex; justify-content: space-between; }
.sponge-meter { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; margin-bottom: 5px; }
.sponge-meter-bar { height: 100%; border-radius: 3px; transition: width .3s ease; }
.sponge-meter-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }

.sponge-stats {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11.5px;
}
.sponge-stats .stat-item {
  background: var(--surface); padding: 5px 8px; border-radius: 6px; display: flex; flex-direction: column;
}
.sponge-stats .stat-item small { color: var(--muted); font-size: 10.5px; }
.sponge-stats .stat-item:last-child { grid-column: span 2; }
"""

with open("web/css/styles.css", "a", encoding="utf-8") as f:
    f.write(sponge_css)

print("Appended Sponge CSS styles successfully.")
