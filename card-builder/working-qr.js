(() => {
  if (window.__highStyleWorkingQrLoaded) return;
  window.__highStyleWorkingQrLoaded = true;
  const editor = document.querySelector('.editor-panel');
  if (!editor || typeof getPackage !== 'function') return;

  const old = document.getElementById('qrBuilderSection');
  const insertBefore = old ? old.nextSibling : null;
  if (old) old.remove();

  const style = document.createElement('style');
  style.textContent = `
    .working-qr{margin-top:30px;border:1px solid #303030;border-radius:24px;background:linear-gradient(145deg,#121212,#080808);padding:22px;box-shadow:0 20px 55px rgba(0,0,0,.23)}
    .working-qr-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.working-qr h2{margin:3px 0 6px;font-size:22px}.working-qr-head p{margin:0;color:#858585;font-size:12px;line-height:1.5;max-width:610px}.working-qr-badge{white-space:nowrap;border:1px solid #285035;background:#0e1912;color:#94d4a0;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
    .working-qr-url{margin-top:16px;display:grid;grid-template-columns:1fr auto;gap:9px}.working-qr-url input{min-width:0;opacity:.84}.working-qr-url button{border:1px solid #333;border-radius:12px;background:#171717;color:#fff;padding:0 14px;font-weight:800;cursor:pointer}.working-qr-state{margin-top:8px;color:#8fcf9a;font-size:10px;font-weight:800}.working-qr-state.warn{color:#d7b678}
    .working-qr-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.working-qr-options label{margin:0}.working-qr-options select,.working-qr-options input{width:100%}
    .working-qr-output{display:none;grid-template-columns:230px 1fr;gap:20px;align-items:center;margin-top:18px;padding:18px;border:1px solid #272727;border-radius:18px;background:#070707}.working-qr-output.show{display:grid}.working-qr-image{background:#fff;border-radius:16px;padding:14px;display:grid;place-items:center;aspect-ratio:1}.working-qr-image svg{width:100%;height:100%;display:block}.working-qr-info h3{margin:0 0 6px;font-size:19px}.working-qr-info p{margin:0 0 12px;color:#858585;font-size:11px;line-height:1.5}.working-qr-destination{max-height:76px;overflow:auto;font-size:9px;line-height:1.4;color:#aaa;background:#101010;border:1px solid #252525;border-radius:10px;padding:9px;overflow-wrap:anywhere;margin-bottom:11px}.working-qr-actions{display:flex;gap:8px;flex-wrap:wrap}.working-qr-actions button{border:1px solid #333;border-radius:11px;background:#171717;color:#fff;padding:10px 12px;font-weight:800;cursor:pointer}.working-qr-actions button.primary{background:#fff;color:#050505;border-color:#fff}.working-qr-note{margin:13px 0 0;color:#666;font-size:10px;line-height:1.5}
    @media(max-width:720px){.working-qr-head{display:block}.working-qr-badge{display:inline-block;margin-top:10px}.working-qr-url,.working-qr-output.show,.working-qr-options{grid-template-columns:1fr}.working-qr-image{max-width:260px;width:100%;margin:auto}.working-qr-url button{min-height:44px}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.id = 'qrBuilderSection';
  section.className = 'working-qr';
  section.innerHTML = `
    <div class="working-qr-head">
      <div>
        <p class="kicker">Final step</p>
        <h2>Working QR for this finished card</h2>
        <p>This QR contains a compact fallback of the card you have designed, so a new customer card can open immediately on another phone. It includes fonts, animations, button choices, icon styling, menu and premium styling.</p>
      </div>
      <span class="working-qr-badge">Works immediately</span>
    </div>
    <label style="margin-top:16px">Working card link</label>
    <div class="working-qr-url"><input id="workingQrUrl" readonly><button id="workingQrOpen" type="button">Open card</button></div>
    <div class="working-qr-state" id="workingQrState">Building QR from the current design…</div>
    <div class="working-qr-options">
      <label>Export size<select id="workingQrSize"><option value="600">600 × 600 px · digital</option><option value="1200" selected>1200 × 1200 px · print</option><option value="2000">2000 × 2000 px · large print</option></select></label>
      <label>QR foreground<input id="workingQrColour" type="color" value="#000000"></label>
    </div>
    <div class="finish-actions" style="margin-top:14px"><button class="btn" id="workingQrRefresh" type="button">Refresh QR Code</button></div>
    <div class="working-qr-output" id="workingQrOutput">
      <div class="working-qr-image" id="workingQrImage"></div>
      <div class="working-qr-info"><h3 id="workingQrTitle">Customer QR Code</h3><p>Scan this code to open the finished digital business card.</p><div class="working-qr-destination" id="workingQrDestination"></div><div class="working-qr-actions"><button class="primary" id="workingQrPng" type="button">Download PNG</button><button id="workingQrSvg" type="button">Download SVG</button><button id="workingQrCopy" type="button">Copy card link</button></div></div>
    </div>
    <p class="working-qr-note">If you change a font, animation, icon, menu or card button, this QR automatically refreshes from the latest design.</p>`;

  if (insertBefore) editor.insertBefore(section, insertBefore); else editor.appendChild(section);
  const q = id => document.getElementById(id);
  let currentSvg = '', currentUrl = '', timer = null;

  function clean(obj){Object.keys(obj).forEach(k=>{const v=obj[k];if(v===''||v===null||v===undefined||(Array.isArray(v)&&!v.length))delete obj[k]});return obj}
  function compactTokens(t){if(!t)return undefined;return[t.buttonRadius,t.cardRadius,t.logoRadius,t.borderWidth,t.headingWeight,t.headingTransform,t.letterSpacing,t.sectionGap,t.density]}
  function hosted(value){return /^https?:\/\//i.test(String(value||''))?String(value):''}
  function compactIcons(s){
    if(!s)return undefined;
    const icons=s.icons&&Object.keys(s.icons).length?s.icons:undefined;
    return clean({e:s.enabled===false?0:undefined,s:s.shape,z:s.size,w:s.stroke,b:s.background,r:s.border===false?0:undefined,c:s.color,m:icons});
  }
  function compact(c,reduced=false){
    const t=c.theme||{};const fontChoice=t.fontChoice&&t.fontChoice!=='auto'?t.fontChoice:'';
    const h=clean({b:t.background,s:t.surface,x:t.text,m:t.muted,a:t.accent,c:t.accentText,o:t.border,q:fontChoice,k:compactTokens(t.brandTokens)});if(!fontChoice){h.h=t.headingFont;h.f=t.bodyFont;h.l=t.fontLabel;}
    const actions=Array.isArray(c.actions)?c.actions.map(a=>clean({t:a.type,l:a.label})):[];
    const animation=c.animations?clean({e:c.animations.entrance,b:c.animations.buttons,a:c.animations.accent}):undefined;
    return clean({
      n:c.businessName,d:c.displayName!==c.businessName?c.displayName:undefined,e:c.eyebrow!=='Digital business card'?c.eyebrow:undefined,p:c.personName,r:c.role,t:c.tagline,
      g:hosted(c.logo),i:c.initials,h,ph:c.phone,pd:c.phoneDisplay,wa:c.whatsapp,em:c.email,wb:c.website,ig:c.instagram,il:c.instagramLabel,li:c.linkedin,tk:c.tiktok,
      bu:c.bookingUrl,bl:c.bookingLabel,mu:hosted(c.menuUrl),ml:c.menuLabel,sv:c.services||[],rv:c.review,lo:c.location,ga:reduced?[]:(c.gallery||[]).filter(hosted).slice(0,2),ft:c.footer!=='Powered by High Style Cards'?c.footer:undefined,
      ac:actions,ds:c.designStyle,ta:c.tripadvisorUrl,bm:c.buttonSettings?.managed?1:undefined,sc:c.saveContactEnabled===false?0:undefined,an:animation,ic:compactIcons(c.iconSettings)
    });
  }
  function base64Url(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function slug(){const raw=q('slug')?.value||'new-brand';return typeof cleanSlug==='function'?cleanSlug(raw):raw.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function snapshotUrl(reduced=false){const pkg=getPackage();const payload=base64Url(JSON.stringify(compact(pkg.config,reduced)));return `${location.origin}/cards/?brand=${encodeURIComponent(pkg.slug||slug())}#c=${payload}`}
  async function ensureQr(){if(window.qrcode)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('QR library unavailable'));document.head.appendChild(s)})}
  function svgFor(url,colour){let qr=null,last=null;for(const level of ['H','Q','M','L']){try{const candidate=window.qrcode(0,level);candidate.addData(url);candidate.make();qr=candidate;break}catch(e){last=e}}if(!qr)throw last||new Error('Card link is too large for a QR code');const count=qr.getModuleCount(),margin=4,total=count+margin*2;let paths='';for(let r=0;r<count;r++)for(let c=0;c<count;c++)if(qr.isDark(r,c))paths+=`M${c+margin},${r+margin}h1v1h-1z`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${paths}" fill="${colour}"/></svg>`}
  async function generate(silent=false){
    if(!silent){q('workingQrRefresh').disabled=true;q('workingQrRefresh').textContent='Generating…'}
    try{await ensureQr();let url=snapshotUrl(false),svg='';try{svg=svgFor(url,q('workingQrColour').value||'#000')}catch(e){url=snapshotUrl(true);svg=svgFor(url,q('workingQrColour').value||'#000');q('workingQrState').textContent='QR created from the core card details; gallery links were omitted to keep the QR reliable.';q('workingQrState').classList.add('warn')}currentUrl=url;currentSvg=svg;q('workingQrUrl').value=url;q('workingQrDestination').textContent=url;q('workingQrImage').innerHTML=svg;q('workingQrTitle').textContent=(q('businessName')?.value?.trim()||'Customer')+' QR Code';q('workingQrOutput').classList.add('show');if(!q('workingQrState').classList.contains('warn'))q('workingQrState').textContent='QR is linked to the current finished design and ready to test.';if(!silent&&typeof showStatus==='function')showStatus('Working QR created for this finished card.')}
    catch(e){console.error(e);q('workingQrState').textContent='This card contains too much embedded data for a reliable QR. Use hosted logo/gallery URLs or remove some gallery images.';q('workingQrState').classList.add('warn');if(typeof showStatus==='function')showStatus('Could not create a reliable QR for this card.',true)}
    finally{if(!silent){q('workingQrRefresh').disabled=false;q('workingQrRefresh').textContent='Refresh QR Code'}}
  }
  function schedule(){clearTimeout(timer);q('workingQrState').classList.remove('warn');q('workingQrState').textContent='Updating QR from the latest design…';timer=setTimeout(()=>generate(true),260)}
  function blob(){return new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'})}
  function downloadSvg(){if(!currentSvg)return;const u=URL.createObjectURL(blob()),a=document.createElement('a');a.href=u;a.download=slug()+'-qr.svg';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
  function downloadPng(){if(!currentSvg)return;const size=parseInt(q('workingQrSize').value,10)||1200,u=URL.createObjectURL(blob()),img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);ctx.drawImage(img,0,0,size,size);URL.revokeObjectURL(u);canvas.toBlob(png=>{if(!png)return;const p=URL.createObjectURL(png),a=document.createElement('a');a.href=p;a.download=slug()+'-qr-'+size+'px.png';a.click();setTimeout(()=>URL.revokeObjectURL(p),1000)},'image/png')};img.src=u}
  async function copy(){if(!currentUrl)await generate(true);const ok=typeof copyText==='function'?await copyText(currentUrl):false;if(typeof showStatus==='function')showStatus(ok?'Working card link copied.':'Could not copy link.',!ok)}
  q('workingQrOpen').addEventListener('click',()=>{if(currentUrl)window.open(currentUrl,'_blank','noopener');else generate(true).then(()=>window.open(currentUrl,'_blank','noopener'))});q('workingQrRefresh').addEventListener('click',()=>generate(false));q('workingQrColour').addEventListener('input',schedule);q('workingQrPng').addEventListener('click',downloadPng);q('workingQrSvg').addEventListener('click',downloadSvg);q('workingQrCopy').addEventListener('click',copy);
  editor.addEventListener('input',e=>{if(!section.contains(e.target))schedule()});editor.addEventListener('change',e=>{if(!section.contains(e.target))schedule()});editor.addEventListener('click',e=>{if(section.contains(e.target))return;if(e.target.closest('button'))setTimeout(schedule,90)});
  window.highStyleWorkingCardUrl=()=>currentUrl||snapshotUrl(false);setTimeout(()=>generate(true),420);
})();