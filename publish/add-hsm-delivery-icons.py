from pathlib import Path

p = Path('high-style-match/index.html')
s = p.read_text()

if 'HSM 0.9.1 — delivery process icons' in s:
    raise SystemExit(0)

s = s.replace("APP_VERSION='0.9.0'", "APP_VERSION='0.9.1'", 1)

old = "const d=deliveryDraft(s),current=deliveryIsCurrent(s),events=s.delivery?.history||[];W.innerHTML=`"
new = "const d=deliveryDraft(s),current=deliveryIsCurrent(s),events=s.delivery?.history||[],detailsReady=!!(d.title&&d.message),opened=!!s.delivery?.openedAt;W.innerHTML=`"
if old not in s:
    raise SystemExit('delivery state marker not found')
s = s.replace(old, new, 1)

hero_end = "`}<div class=\"delivery-grid section\">"
process = "`}<div class=\"delivery-process section\"><div class=\"delivery-process-step done\"><span class=\"delivery-process-icon\">${icon('archive')}</span><div><strong>Package</strong><span>ZIP ready</span></div></div><span class=\"delivery-process-line ${detailsReady?'done':''}\"></span><div class=\"delivery-process-step ${detailsReady?'done':'active'}\"><span class=\"delivery-process-icon\">${icon('mail')}</span><div><strong>Details</strong><span>${detailsReady?'Prepared':'Add message'}</span></div></div><span class=\"delivery-process-line ${opened||current?'done':''}\"></span><div class=\"delivery-process-step ${current?'done':opened?'done':detailsReady?'active':''}\"><span class=\"delivery-process-icon\">${icon('send')}</span><div><strong>WeTransfer</strong><span>${current?'Sent':opened?'Opened':'Send files'}</span></div></div><span class=\"delivery-process-line ${current?'done':''}\"></span><div class=\"delivery-process-step ${current?'done':opened?'active':''}\"><span class=\"delivery-process-icon\">${icon('check')}</span><div><strong>Delivered</strong><span>${current?'Complete':'Confirm'}</span></div></div></div><div class=\"delivery-grid section\">"
if hero_end not in s:
    raise SystemExit('delivery grid marker not found')
s = s.replace(hero_end, process, 1)

old_provider = '<div class="provider-logo">W</div>'
new_provider = '<div class="provider-logo">${icon(\'send\')}</div>'
if old_provider not in s:
    raise SystemExit('provider logo marker not found')
s = s.replace(old_provider, new_provider, 1)

old_steps = '<div class="delivery-steps"><div class="delivery-step"><i>1</i><div><strong>Prepare</strong><span>High Style Match keeps the recipient, title and message with this shoot.</span></div></div><div class="delivery-step"><i>2</i><div><strong>Open WeTransfer</strong><span>Upload the delivery ZIP in WeTransfer. Your API credentials are never exposed in this web page.</span></div></div><div class="delivery-step"><i>3</i><div><strong>Record</strong><span>Paste the transfer link or confirm the email transfer, then mark the shoot Delivered.</span></div></div></div>'
new_steps = '<div class="delivery-steps"><div class="delivery-step"><i>${icon(\'mail\')}</i><div><strong>Prepare details</strong><span>Keep the recipient, transfer title and client message with this shoot.</span></div></div><div class="delivery-step"><i>${icon(\'send\')}</i><div><strong>Send with WeTransfer</strong><span>Open WeTransfer and upload the prepared delivery ZIP.</span></div></div><div class="delivery-step"><i>${icon(\'link\')}</i><div><strong>Save the transfer</strong><span>Paste the finished link or confirm the email transfer.</span></div></div><div class="delivery-step"><i>${icon(\'check\')}</i><div><strong>Confirm delivery</strong><span>Mark the shoot delivered so the date and hand-off stay in project history.</span></div></div></div>'
if old_steps not in s:
    raise SystemExit('delivery steps marker not found')
s = s.replace(old_steps, new_steps, 1)

css = r'''
/* HSM 0.9.1 — delivery process icons */
.delivery-process{display:grid;grid-template-columns:minmax(130px,1fr) 44px minmax(130px,1fr) 44px minmax(130px,1fr) 44px minmax(130px,1fr);align-items:center;gap:8px;padding:14px 16px;background:#0D0F12;border:1px solid #25282E;border-radius:12px}
.delivery-process-step{display:flex;align-items:center;gap:10px;min-width:0;color:#717781}.delivery-process-step strong{display:block;font-size:11px;color:#A2A7B0}.delivery-process-step>div>span{display:block;font-size:8px;color:#626872;margin-top:3px}.delivery-process-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:0 0 auto;background:#171A1F;border:1px solid #282B31;color:#747A84}.delivery-process-icon svg{width:17px;height:17px}.delivery-process-step.done .delivery-process-icon{background:#12311E;border-color:#214B31;color:#6CD891}.delivery-process-step.done strong{color:#DDF7E6}.delivery-process-step.active .delivery-process-icon{background:#F5F7FA;border-color:#F5F7FA;color:#090A0C}.delivery-process-step.active strong{color:#fff}.delivery-process-line{height:1px;background:#26292F;display:block}.delivery-process-line.done{background:#3B8D5B}.provider-logo svg{width:19px;height:19px}.delivery-step{grid-template-columns:36px minmax(0,1fr)!important}.delivery-step i{width:34px!important;height:34px!important;border-radius:10px!important;background:#171A1F!important;border:1px solid #292C33;color:#DDE0E5!important}.delivery-step i svg{width:16px;height:16px}.delivery-summary div{position:relative}.delivery-summary div:before{width:28px;height:28px;border-radius:8px;background:#171A1F;border:1px solid #282B31;color:#A9AEB7;display:grid;place-items:center;margin-bottom:10px;font-size:12px}.delivery-summary div:nth-child(1):before{content:'▣'}.delivery-summary div:nth-child(2):before{content:'↓'}.delivery-summary div:nth-child(3):before{content:'✓'}
@media(max-width:980px){.delivery-process{grid-template-columns:1fr 20px 1fr;row-gap:12px}.delivery-process-line:nth-of-type(2){display:none}.delivery-process-step:nth-of-type(3),.delivery-process-step:nth-of-type(4){margin-top:2px}}
@media(max-width:620px){.delivery-process{display:grid;grid-template-columns:1fr;gap:8px}.delivery-process-line{display:none}.delivery-process-step{padding:6px 0}}
'''

s = s.replace('</style>', css + '\n</style>', 1)
p.write_text(s)
