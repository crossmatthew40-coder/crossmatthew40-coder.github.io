(() => {
  if (window.__highStyleSavedDesignsLoaded) return;
  window.__highStyleSavedDesignsLoaded = true;

  const editor = document.querySelector('.editor-panel');
  if (!editor || typeof getPackage !== 'function' || typeof loadConfig !== 'function') return;

  const STORAGE_KEY = 'highStyleSavedBusinessDesignsV1';
  const q = id => document.getElementById(id);

  const style = document.createElement('style');
  style.textContent = `
    .saved-designs-card{margin:0 0 26px;border:1px solid #262626;border-radius:22px;background:linear-gradient(145deg,#111,#0b0b0b);padding:20px}
    .saved-designs-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.saved-designs-head h2{margin:3px 0 5px;font-size:22px}.saved-designs-head p{margin:0;color:#858585;font-size:12px;line-height:1.5;max-width:590px}
    .saved-designs-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:15px}.saved-designs-tools input{flex:1;min-width:190px}.saved-designs-tools button{border:1px solid #333;border-radius:12px;background:#171717;color:#fff;padding:10px 13px;font-weight:750;cursor:pointer}.saved-designs-tools button.primary{background:#fff;color:#050505;border-color:#fff}
    .saved-designs-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.saved-design{min-width:0;border:1px solid #272727;border-radius:16px;background:#090909;padding:13px}.saved-design-top{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center}.saved-design-logo{width:48px;height:48px;border-radius:12px;border:1px solid #2c2c2c;background:#151515;display:grid;place-items:center;overflow:hidden;font-weight:900;font-size:12px}.saved-design-logo img{width:100%;height:100%;object-fit:contain;background:#fff}.saved-design-name{font-size:13px;font-weight:850;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.saved-design-slug{font-size:10px;color:#6f6f6f;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.saved-design-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px}.saved-design-date{font-size:9px;color:#666}.saved-swatches{display:flex;gap:4px}.saved-swatch{width:15px;height:15px;border-radius:50%;border:1px solid rgba(255,255,255,.18)}.saved-design-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}.saved-design-actions button{flex:1;min-width:62px;border:1px solid #303030;border-radius:9px;background:#141414;color:#ddd;padding:8px 7px;font-size:9px;font-weight:800;cursor:pointer}.saved-design-actions button.load{background:#fff;color:#050505;border-color:#fff}.saved-design-actions button.delete{color:#d98d8d}.saved-design-empty{grid-column:1/-1;border:1px dashed #2a2a2a;border-radius:15px;padding:18px;color:#666;font-size:11px;line-height:1.5;text-align:center}
    .saved-count{border:1px solid #333;border-radius:999px;padding:6px 9px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#aaa;white-space:nowrap}
    @media(max-width:720px){.saved-designs-head{display:block}.saved-count{display:inline-block;margin-top:10px}.saved-designs-list{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.className = 'saved-designs-card';
  section.id = 'savedBusinessDesigns';
  section.innerHTML = `
    <div class="saved-designs-head">
      <div>
        <p class="kicker">Customer library</p>
        <h2>Past Designs</h2>
        <p>Keep previous business cards here so you can reopen, update or duplicate a customer design later.</p>
      </div>
      <span class="saved-count" id="savedDesignCount">0 saved</span>
    </div>
    <div class="saved-designs-tools">
      <input id="savedDesignSearch" type="search" placeholder="Search saved businesses…" aria-label="Search saved business designs">
      <button class="primary" id="saveCurrentDesign">Save current design</button>
    </div>
    <div class="saved-designs-list" id="savedDesignList"></div>
  `;

  const scanner = document.getElementById('websiteScanner');
  if (scanner && scanner.parentNode === editor) editor.insertBefore(section, scanner.nextSibling);
  else editor.insertBefore(section, editor.firstElementChild);

  function readLibrary(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(e) { return []; }
  }

  function writeLibrary(items){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0,100)));
      return true;
    } catch(e) {
      if (typeof showStatus === 'function') showStatus('Could not save this design in the browser.', true);
      return false;
    }
  }

  function safePackage(){
    try { return JSON.parse(JSON.stringify(getPackage())); }
    catch(e) { return null; }
  }

  function initials(name){
    return String(name || 'Business').split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase();
  }

  function formatDate(ts){
    if (!ts) return 'Saved previously';
    try {
      return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ts));
    } catch(e) { return 'Saved'; }
  }

  function liveUrl(slug){
    return `${location.origin}/cards/?brand=${encodeURIComponent(slug || 'new-brand')}`;
  }

  function upsertCurrent(silent=false){
    const pkg = safePackage();
    if (!pkg || !pkg.config) return false;
    const slug = (pkg.slug || '').trim();
    const name = (pkg.config.businessName || '').trim();
    if (!slug || !name) {
      if (!silent && typeof showStatus === 'function') showStatus('Add a business name before saving this design.', true);
      return false;
    }

    const items = readLibrary();
    const existing = items.findIndex(item => item.slug === slug);
    const record = {slug, name, savedAt:Date.now(), package:pkg};
    if (existing >= 0) items.splice(existing,1);
    items.unshift(record);
    if (!writeLibrary(items)) return false;
    render();
    if (!silent && typeof showStatus === 'function') showStatus(`${name} saved to Past Designs.`);
    return true;
  }

  function duplicateRecord(record){
    const copy = JSON.parse(JSON.stringify(record.package));
    const originalName = copy.config.businessName || record.name || 'Business';
    copy.config.businessName = originalName + ' Copy';
    copy.config.displayName = copy.config.businessName;
    copy.slug = typeof cleanSlug === 'function' ? cleanSlug(copy.config.businessName) : (record.slug + '-copy');
    loadConfig(copy);
    const slugInput=q('slug'); if(slugInput) slugInput.dataset.manual='';
    if (typeof showStatus === 'function') showStatus('Design duplicated — rename it for the new customer, then save.');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function deleteRecord(slug){
    const items = readLibrary().filter(item => item.slug !== slug);
    writeLibrary(items);
    render();
    if (typeof showStatus === 'function') showStatus('Saved design removed.');
  }

  function render(){
    const query = (q('savedDesignSearch')?.value || '').trim().toLowerCase();
    const all = readLibrary();
    const items = all.filter(item => !query || `${item.name} ${item.slug}`.toLowerCase().includes(query));
    q('savedDesignCount').textContent = `${all.length} saved`;
    const list = q('savedDesignList');
    list.innerHTML = '';

    if (!items.length) {
      const empty=document.createElement('div'); empty.className='saved-design-empty';
      empty.textContent = all.length ? 'No saved businesses match that search.' : 'No past designs yet. Scan or build a customer card, then choose “Save current design”.';
      list.appendChild(empty); return;
    }

    items.forEach(record => {
      const pkg=record.package || {};
      const c=pkg.config || {};
      const t=c.theme || {};
      const el=document.createElement('article'); el.className='saved-design';
      const logo=c.logo || '';
      const logoHtml=logo ? `<img src="${String(logo).replace(/"/g,'&quot;')}" alt="">` : initials(record.name);
      const palette=[t.background,t.surface,t.accent,t.text].filter(Boolean).slice(0,4);
      el.innerHTML=`
        <div class="saved-design-top">
          <div class="saved-design-logo">${logoHtml}</div>
          <div style="min-width:0"><div class="saved-design-name"></div><div class="saved-design-slug"></div></div>
        </div>
        <div class="saved-design-meta"><div class="saved-design-date">${formatDate(record.savedAt)}</div><div class="saved-swatches"></div></div>
        <div class="saved-design-actions">
          <button class="load" type="button">Load</button>
          <button class="open" type="button">Open card</button>
          <button class="duplicate" type="button">Duplicate</button>
          <button class="delete" type="button">Delete</button>
        </div>`;
      el.querySelector('.saved-design-name').textContent=record.name || c.businessName || 'Saved business';
      el.querySelector('.saved-design-slug').textContent=liveUrl(record.slug);
      const swatches=el.querySelector('.saved-swatches');
      palette.forEach(colour=>{const s=document.createElement('span');s.className='saved-swatch';s.style.background=colour;swatches.appendChild(s)});
      el.querySelector('.load').addEventListener('click',()=>{
        loadConfig(JSON.parse(JSON.stringify(record.package)));
        const slugInput=q('slug'); if(slugInput) slugInput.dataset.manual='1';
        if(typeof showStatus==='function') showStatus(`${record.name} loaded.`);
        window.scrollTo({top:0,behavior:'smooth'});
      });
      el.querySelector('.open').addEventListener('click',()=>window.open(liveUrl(record.slug),'_blank','noopener'));
      el.querySelector('.duplicate').addEventListener('click',()=>duplicateRecord(record));
      el.querySelector('.delete').addEventListener('click',()=>deleteRecord(record.slug));
      list.appendChild(el);
    });
  }

  q('saveCurrentDesign').addEventListener('click',()=>upsertCurrent(false));
  q('savedDesignSearch').addEventListener('input',render);

  // Existing Save Draft also records/updates that customer in Past Designs.
  const saveDraft=q('saveDraft');
  if(saveDraft) saveDraft.addEventListener('click',()=>setTimeout(()=>upsertCurrent(true),0));

  // Export a tiny API for future publish/dashboard features.
  window.highStyleSavedDesigns = {
    save: () => upsertCurrent(false),
    list: () => readLibrary(),
    refresh: render
  };

  render();
})();