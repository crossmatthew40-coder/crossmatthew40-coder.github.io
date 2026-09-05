from pathlib import Path
import re

p = Path('high-style-match/index.html')
s = p.read_text()

s = s.replace("APP_VERSION='0.9.1'", "APP_VERSION='0.9.2'", 1)

# Make the left navigation use one delegated click handler so icon/SVG clicks
# and re-renders cannot leave stale handlers behind.
nav_pattern = re.compile(r"function navTo\(id\)\{.*?\}\nfunction setNav\(\)\{.*?\}\nfunction renderClients", re.S)
nav_replacement = r'''function navTo(id){
  if(!id)return;
  if(id==='home'||id==='shoots'||id==='settings'||id==='clients'||id==='globalhistory'){navigate(id);return}
  if(['live','photos','cull','review','deliver'].includes(id)){
    let s=getShoot();
    if(!s){
      s=[...D.shoots].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
      if(!s){navigate('shoots');toast('Create or open a project first.');return}
      shootId=String(s.id);
    }
    screen='workspace';tab=id;renameDraft=[];render();return;
  }
}
function setNav(){
  const items=[['home','home','Dashboard'],['shoots','folder','Projects'],['live','spark','Tether Mode'],['photos','photo','Photos'],['cull','star','Cull'],['review','eye','Review'],['deliver','send','Deliver'],['clients','template','Clients'],['globalhistory','archive','History'],['settings','settings','Settings']];
  NAV.innerHTML=items.map(([id,ic,label])=>{const active=screen===id||(screen==='workspace'&&tab===id)||(id==='shoots'&&['shotlist','new'].includes(screen));return `<button type="button" data-nav="${id}" class="${active?'on':''}">${icon(ic)}<span>${label}</span></button>`}).join('');
  NAV.onclick=e=>{const b=e.target.closest('[data-nav]');if(!b||!NAV.contains(b))return;e.preventDefault();navTo(b.dataset.nav)};
}
function renderClients'''
if not nav_pattern.search(s):
    raise SystemExit('navigation block not found')
s = nav_pattern.sub(nav_replacement, s, count=1)

# Restore Tether Mode as a normal project tab and give tabs button semantics.
old_tabs = "${[['overview','Overview'],['shotlist','Shot List'],['photos','Photos'],['cull','Cull'],['review','Review'],['rename','Rename'],['deliver','Deliver'],['history','History']].map(([id,l])=>`<button data-tab=\"${id}\" class=\"${tab===id?'on':''}\">${l}</button>`).join('')}"
new_tabs = "${[['overview','Overview'],['shotlist','Shot List'],['live','Tether'],['photos','Photos'],['cull','Cull'],['review','Review'],['rename','Rename'],['deliver','Deliver'],['history','History']].map(([id,l])=>`<button type=\"button\" data-tab=\"${id}\" class=\"${tab===id?'on':''}\">${l}</button>`).join('')}"
if old_tabs not in s:
    raise SystemExit('workspace tabs marker not found')
s = s.replace(old_tabs, new_tabs, 1)

# Use a delegated workspace tab handler. This survives each full workspace re-render.
old_wire = "document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renameDraft=[];renderWorkspace()});renderTab(s,c)"
new_wire = "wireWorkspaceTabs();renderTab(s,c)"
if old_wire not in s:
    raise SystemExit('workspace tab wiring marker not found')
s = s.replace(old_wire, new_wire, 1)

insert_before = "function renderWorkspace(){"
wire_fn = '''function wireWorkspaceTabs(){
  const bar=document.getElementById('tabs');
  if(!bar)return;
  bar.onclick=e=>{
    const b=e.target.closest('[data-tab]');
    if(!b||!bar.contains(b))return;
    e.preventDefault();
    const next=b.dataset.tab;
    if(!next)return;
    tab=next;
    renameDraft=[];
    renderWorkspace();
  };
}
'''
if 'function wireWorkspaceTabs()' not in s:
    if insert_before not in s:
        raise SystemExit('renderWorkspace marker not found')
    s = s.replace(insert_before, wire_fn + insert_before, 1)

# Make tab rendering explicit and resilient. A broken panel should no longer make
# the whole navigation feel dead; the user gets a visible recovery action.
render_tab_pattern = re.compile(r"function renderTab\(s,c\)\{.*?\}\nfunction dashboardCovered", re.S)
render_tab_replacement = r'''function renderTab(s,c){
  const W=document.getElementById('workspaceBody');
  if(!W)return;
  try{
    switch(tab){
      case 'overview': return renderOverview(W,s,c);
      case 'shotlist': return renderShotListTab(W,s,c);
      case 'live': return renderLiveShootTab(W,s,c);
      case 'photos': return renderPhotosTab(W,s,c);
      case 'cull': return renderCullTab(W,s,c);
      case 'review': return renderReviewTab(W,s,c);
      case 'rename': return renderRenameTab(W,s,c);
      case 'deliver': return renderDeliverTab(W,s,c);
      case 'history': return renderHistoryTab(W,s);
      default: tab='overview'; return renderOverview(W,s,c);
    }
  }catch(err){
    console.error('High Style Match tab error',tab,err);
    W.innerHTML=`<div class="panel panel-pad"><div class="panel-head"><div><h2>Could not open ${esc(tab)}</h2><p>This view hit a browser error, but the rest of the project is still available.</p></div></div><div class="notice warn">${icon('info')}Try the view again or return to Overview. Your project data has not been removed.</div><div class="actions section"><button class="btn secondary" id="retryTab">Try Again</button><button class="btn primary" id="returnOverview">Overview</button></div></div>`;
    const retry=document.getElementById('retryTab');if(retry)retry.onclick=()=>renderWorkspace();
    const home=document.getElementById('returnOverview');if(home)home.onclick=()=>{tab='overview';renderWorkspace()};
  }
}
function dashboardCovered'''
if not render_tab_pattern.search(s):
    raise SystemExit('renderTab block not found')
s = render_tab_pattern.sub(render_tab_replacement, s, count=1)

# Tether is standard, so remove the old paid-add-on copy that could still appear.
s = s.replace('Tether Mode is a paid add-on for photographers who want to track the brief while they are on location.','Tether Mode is included with High Style Match and is available from every project.',1)
s = s.replace('Customer billing and account entitlements will activate this feature. The public web build does not store payment credentials or a secret unlock key.','Capture One remains in control of the camera while High Style Match tracks the live shot list and capture folder.',1)

css = '''
/* HSM 0.9.2 — navigation reliability */
.nav,.nav button,.tabs,.tabs button{pointer-events:auto!important}
.nav button,.tabs button{position:relative;z-index:2}
.tabs{isolation:isolate}
.tabs button:focus-visible,.nav button:focus-visible{outline:2px solid #fff;outline-offset:2px}
'''
if 'HSM 0.9.2 — navigation reliability' not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

p.write_text(s)
