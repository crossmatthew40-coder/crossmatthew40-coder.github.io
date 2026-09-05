from pathlib import Path
import re

FILES = [
    Path('high-style-match/index.html'),
    Path('high-style-match/tether/index.html'),
    Path('high-style-match/sign-in/index.html'),
    Path('high-style-match/customer/index.html'),
]

CSS = r'''
/* HSM MONOCHROME 1.0 */
:root{
  --accent:#fff!important;--accent-2:#fff!important;--accent2:#fff!important;
  --p:#fff!important;--p2:#fff!important;
  --ink:#fff!important;--muted:#a3a3a3!important;--muted-2:#737373!important;
  --bg:#000!important;--surface:#0b0b0b!important;--surface-2:#111!important;--card:#0b0b0b!important;
  --line:#292929!important;--dark:#000!important;--dark-2:#050505!important;
  --good:#fff!important;--success:#fff!important;--success-bg:#111!important;
  --warn:#fff!important;--warn-bg:#111!important;--bad:#fff!important;--danger:#fff!important;--danger-bg:#111!important;
  --shadow:none!important;
}
html,body{background:#000!important;color:#fff!important;color-scheme:dark}
body{background-image:none!important}
.top,.topbar,.sidebar,.brand-panel{background:#000!important;background-image:none!important;border-color:#242424!important;box-shadow:none!important}
.brand-panel:before,.brand-panel:after,.delivery-hero:after,.smart-cull-hero:after,.callout:after{display:none!important}
.mark,.brandmark{background:#000!important;background-image:none!important;border:1px solid #fff!important;box-shadow:none!important}
.mark i,.brandmark i{background:#fff!important;box-shadow:0 -7px #fff,0 7px #fff!important}
.panel,.card,.stat,.mini-stat,.setting-card,.workflow-step,.shoot-row,.review-block,.workspace-head,.provider-card,.delivery-summary div,.delivery-step,.activity-item,.delivery-event,.q,.thumb,.vstat,.modal,.empty,.setup,.login-panel,.login-wrap,.project-row,.side-card,.shot-progress-card,.recent-card,.dash-stat,.shot-create-card,.shot-hub-hero,.current,.board,.mini{background:#0b0b0b!important;background-image:none!important;color:#fff!important;border-color:#292929!important;box-shadow:none!important}
.workspace-head,.delivery-hero,.smart-cull-hero,.review-hero,.callout,.statusbar,.desktop-cap{background:#080808!important;background-image:none!important;color:#fff!important;border-color:#292929!important;box-shadow:none!important}
.btn.primary,.primary{background:#fff!important;background-image:none!important;color:#000!important;border:1px solid #fff!important;box-shadow:none!important}
.btn.primary:hover,.primary:hover{background:#e8e8e8!important;color:#000!important;box-shadow:none!important;transform:none!important}
.btn.secondary,.btn.light,.btn.soft,.btn.dark,.secondary,.open,.signout,.icon-btn,.qmeta button{background:#111!important;color:#fff!important;border-color:#333!important;box-shadow:none!important}
.btn.secondary:hover,.btn.light:hover,.btn.soft:hover,.btn.dark:hover,.secondary:hover,.open:hover,.signout:hover{background:#1a1a1a!important;color:#fff!important}
input,textarea,select,.select,.project-select,.field input,.field textarea,.field select,.mini select,.review-select,.delivery-link input{background:#050505!important;color:#fff!important;border-color:#333!important;box-shadow:none!important}
input:focus,textarea:focus,select:focus,.field input:focus,.field textarea:focus,.field select:focus{border-color:#fff!important;box-shadow:0 0 0 2px rgba(255,255,255,.16)!important;outline:none!important}
.nav button,.tabs button,.text-link,.back,.dash-link{color:#aaa!important}
.nav button:hover,.tabs button:hover,.text-link:hover,.back:hover,.dash-link:hover{color:#fff!important}
.nav button.on{background:#171717!important;background-image:none!important;color:#fff!important;box-shadow:inset 0 0 0 1px #333!important}
.nav button.on svg,.tabs button.on,.eyebrow,.portal-label,.delivery-event a{color:#fff!important}
.tabs{border-color:#292929!important}.tabs button.on{border-bottom-color:#fff!important}
.pill,.badge,.state,.review-status,.cull-badge,.cull-mini span,.format-badges span,.desktop-only-badge,.portal-label,.check,.lock{background:#151515!important;color:#fff!important;border-color:#3a3a3a!important}
.pill.success,.pill.warn,.pill.purple,.badge.good,.badge.warn,.badge.public,.state.good,.state.warn,.state.bad,.review-status.good,.review-status.check,.review-status.missing,.cull-badge.pick,.cull-badge.duplicate,.cull-badge.review,.cull-badge.purple,.cull-mini span.pick,.cull-mini span.duplicate,.cull-mini span.excluded{background:#151515!important;color:#fff!important;border:1px solid #444!important}
.notice,.notice.info,.notice.success,.notice.warn,.status,.status.info,.status.success,.status.error,.alertbar,.brief,.big-shoot-note,.delivered-banner{background:#101010!important;background-image:none!important;color:#e5e5e5!important;border-color:#383838!important}
.progress,.dash-meter,.cull-progress,.storage-meter,.confidence{background:#222!important}
.progress i,.dash-meter i,.cull-progress i,.storage-meter i,.confidence i,.delivery-process-line.done{background:#fff!important;background-image:none!important}
.delivery-process,.delivery-process-step,.delivery-process-icon{background:#0b0b0b!important;color:#fff!important;border-color:#292929!important}
.delivery-process-step.active .delivery-process-icon,.delivery-process-step.done .delivery-process-icon{background:#fff!important;color:#000!important;border-color:#fff!important}
.delivery-process-step.active strong,.delivery-process-step.done strong{color:#fff!important}
.provider-logo{background:#fff!important;color:#000!important;border:1px solid #fff!important}
.viewer-stage,.rawtile,.rawmini,.thumb img,.recent-thumb,.review-thumb,.next-shot-thumb{background:#090909!important;background-image:none!important}
.q.on,.thumb.on{background:#141414!important;border-color:#fff!important;box-shadow:none!important}
.dot,.dot.on{background:#fff!important;box-shadow:0 0 0 4px rgba(255,255,255,.12)!important}
.stat-icon,.empty-icon,.upload-icon{background:#151515!important;color:#fff!important;border:1px solid #333!important}
.field label,.remember,.intro,.brand-copy p,.benefit,.secure-note,.brand span,.brand-foot,.hero-copy,.shot-note,.meta,.muted{color:#a3a3a3!important}
a{color:#fff}
::selection{background:#fff;color:#000}
/* END HSM MONOCHROME 1.0 */
'''

for p in FILES:
    if not p.exists():
        print('skip missing', p)
        continue
    s = p.read_text()
    s = re.sub(r'/\* HSM MONOCHROME 1\.0 \*/[\s\S]*?/\* END HSM MONOCHROME 1\.0 \*/\s*', '', s)
    s = re.sub(r'<meta name="theme-color" content="#[0-9a-fA-F]{6}">', '<meta name="theme-color" content="#000000">', s, count=1)
    if p.as_posix() == 'high-style-match/index.html':
        s = re.sub(r"const APP_VERSION='0\.9\.[0-9]+'", "const APP_VERSION='0.9.3'", s, count=1)
    if '</style>' not in s:
        raise SystemExit(f'No style tag in {p}')
    s = s.replace('</style>', CSS + '\n</style>', 1)
    p.write_text(s)
    print('updated', p)
