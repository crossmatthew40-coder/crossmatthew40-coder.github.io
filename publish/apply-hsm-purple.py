from pathlib import Path
import re

BUILD = '20260907-4'
THEME_HREF = f'./high-style-purple-theme.css?v={BUILD}'
MARKER_START = '<!-- HSM_PURPLE_THEME_START -->'
MARKER_END = '<!-- HSM_PURPLE_THEME_END -->'

files = [
    Path('high-style-match/index.html'),
    Path('high-style-match/tether/index.html'),
    Path('high-style-match/sign-in/index.html'),
    Path('high-style-match/customer/index.html'),
]

block = f'''{MARKER_START}\n<meta name="hsm-theme-build" content="{BUILD}">\n<link rel="stylesheet" href="{THEME_HREF}">\n<style>\n:root{{--accent:#6D4EEE!important;--accent-2:#8D6CFF!important;--ink:#F7F7FB!important;--bg:#06070A!important;--surface:#111319!important;--surface-2:#171A22!important;--line:#2A2E39!important}}\nhtml,body,.app{{background:#06070A!important;color:#F7F7FB!important}}\n.sidebar{{background:linear-gradient(180deg,#08090D 0%,#0D0F15 58%,#151020 100%)!important;border-color:#242837!important}}\n.topbar{{background:rgba(11,13,18,.94)!important;border-color:#242837!important;color:#F7F7FB!important}}\n.nav button.on{{background:linear-gradient(90deg,#17132A,#1C1735)!important;color:#fff!important;box-shadow:inset 2px 0 0 #8D6CFF!important}}\n.nav button.on svg,.eyebrow{{color:#A992FF!important}}\n.btn.primary,.hsm-byl-btn,.live-touch.primary,.hsm-stage.on{{background:linear-gradient(135deg,#6D4EEE,#8D6CFF)!important;color:#fff!important;border-color:#8D6CFF!important}}\n.progress i,.confidence i,.storage-meter i,.cull-progress i,.live-meter i{{background:linear-gradient(90deg,#6D4EEE,#8D6CFF)!important}}\n</style>\n{MARKER_END}'''

for path in files:
    if not path.exists():
        continue
    html = path.read_text()
    html = re.sub(re.escape(MARKER_START) + r'.*?' + re.escape(MARKER_END), '', html, flags=re.S)
    if '</head>' not in html:
        raise RuntimeError(f'No </head> in {path}')
    html = html.replace('</head>', block + '\n</head>', 1)
    path.write_text(html)
    print(f'updated {path}')
