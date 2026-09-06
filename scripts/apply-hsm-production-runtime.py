from pathlib import Path


def inject_head(path: str, block: str) -> None:
    p = Path(path)
    html = p.read_text()
    if 'data-hsm-production-runtime' in html:
        return
    if '</head>' not in html:
        raise SystemExit(f'Missing </head> in {path}')
    html = html.replace('</head>', block + '\n</head>', 1)
    p.write_text(html)


inject_head('high-style-match/index.html', '''
<!-- High Style Match production runtime -->
<link rel="manifest" href="./manifest.webmanifest" data-hsm-production-runtime>
<script src="./auth-config.js"></script>
<script src="./app-config.js"></script>
<script src="./cloud.js"></script>
<script src="./production.js" defer></script>
''')

inject_head('high-style-match/tether/index.html', '''
<!-- High Style Match production runtime -->
<link rel="manifest" href="../manifest.webmanifest" data-hsm-production-runtime>
<script src="../auth-config.js"></script>
<script src="../app-config.js"></script>
<script src="../cloud.js"></script>
<script src="../production.js" defer></script>
''')

inject_head('high-style-match/sign-in/index.html', '''
<!-- High Style Match production runtime -->
<link rel="manifest" href="../manifest.webmanifest" data-hsm-production-runtime>
<script src="../app-config.js"></script>
<script src="../cloud.js"></script>
<script src="../production.js" defer></script>
''')

inject_head('high-style-match/customer/index.html', '''
<!-- High Style Match production runtime -->
<link rel="manifest" href="../manifest.webmanifest" data-hsm-production-runtime>
<script src="../app-config.js"></script>
<script src="../cloud.js"></script>
<script src="../production.js" defer></script>
''')

# Upgrade the customer portal from an empty shell to a secure project list once cloud is configured.
p = Path('high-style-match/customer/index.html')
html = p.read_text()
if 'HSM_CUSTOMER_PROJECT_LIST_V1' not in html:
    enhancement = r'''
<script id="HSM_CUSTOMER_PROJECT_LIST_V1">
(async()=>{
  if(!window.HSMCloud?.configured?.()) return;
  try{
    const session=await HSMCloud.getSession();
    if(!session){
      location.href='../sign-in/?returnTo='+encodeURIComponent('/high-style-match/customer/');
      return;
    }
    const projects=await HSMCloud.listProjects();
    const projectCount=document.getElementById('projectCount');
    const approvalCount=document.getElementById('approvalCount');
    const deliveredCount=document.getElementById('deliveredCount');
    if(projectCount) projectCount.textContent=String(projects.length);
    if(approvalCount) approvalCount.textContent=String(projects.filter(p=>p.status==='review').length);
    if(deliveredCount) deliveredCount.textContent=String(projects.filter(p=>p.status==='delivered').length);
    const email=document.getElementById('userEmail');
    if(email) email.textContent=session.user.email||'Customer';
    const avatar=document.getElementById('avatar');
    if(avatar) avatar.textContent=(session.user.email||'C').slice(0,1).toUpperCase();
    const section=document.querySelector('.projects');
    if(section){
      const esc=v=>String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
      const rows=projects.map(p=>`<div class="project-row"><div><strong>${esc(p.name)}</strong><span>${esc(p.client_name||'Client')} · ${p.shoot_date?new Date(p.shoot_date+'T12:00:00').toLocaleDateString():''} · ${esc(p.status)}</span></div><a class="open" href="./project/?id=${encodeURIComponent(p.id)}" style="text-decoration:none">Open project</a></div>`).join('');
      const existingEmpty=section.querySelector('.empty');
      if(existingEmpty) existingEmpty.outerHTML=rows||'<div class="empty">No projects have been shared with this account yet.</div>';
      else if(rows) section.insertAdjacentHTML('beforeend',rows);
    }
    const signOut=document.getElementById('signOut');
    if(signOut) signOut.onclick=async()=>{await HSMCloud.signOut();location.href='../sign-in/'};
  }catch(error){
    console.warn('Customer project list unavailable',error);
  }
})();
</script>
'''
    html = html.replace('</body>', enhancement + '\n</body>', 1)
    p.write_text(html)

# Expose launch/legal/diagnostic routes from the main app without changing the existing workflow UI.
p = Path('high-style-match/index.html')
html = p.read_text()
if 'HSM_PRODUCTION_LINKS_V1' not in html:
    helper = r'''
<script id="HSM_PRODUCTION_LINKS_V1">
(()=>{
  window.HSMLinks={
    account:'./account/',onboarding:'./onboarding/',invite:'./invite/',admin:'./admin/',status:'./status/',privacy:'./privacy/',terms:'./terms/'
  };
})();
</script>
'''
    html = html.replace('</body>', helper + '\n</body>', 1)
    p.write_text(html)

print('High Style Match production runtime integrated.')
