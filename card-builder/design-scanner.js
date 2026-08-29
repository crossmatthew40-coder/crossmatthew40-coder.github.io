(() => {
  const scanCard = document.getElementById('websiteScanner');
  const scanButton = document.getElementById('scanWebsite');
  const scanUrl = document.getElementById('scanUrl');
  if (!scanCard || !scanButton || !scanUrl || document.getElementById('designScanResults')) return;

  const style = document.createElement('style');
  style.textContent = `
    .design-scan{display:none;margin-top:18px;padding-top:18px;border-top:1px solid #242424}.design-scan.show{display:block}
    .design-scan-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}.design-scan-head h3{font-size:16px;margin:2px 0 4px}.design-scan-head p{margin:0;color:#777;font-size:11px;line-height:1.45}
    .design-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:10px}.design-box{border:1px solid #252525;background:#0a0a0a;border-radius:15px;padding:12px}
    .design-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#6f6f6f;margin-bottom:8px}.palette{display:flex;gap:7px;flex-wrap:wrap}.swatch{width:52px}.swatch-colour{height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.15);box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}.swatch code{display:block;margin-top:5px;color:#aaa;font-size:9px;text-align:center}
    .design-preview{display:grid;grid-template-columns:78px 1fr;gap:10px;align-items:center}.design-logo{width:78px;height:78px;border-radius:14px;background:#161616;border:1px solid #292929;display:grid;place-items:center;overflow:hidden}.design-logo img{width:100%;height:100%;object-fit:contain;padding:7px;background:#fff}.design-logo span{font-size:10px;color:#666;text-align:center;padding:5px}.design-summary{display:grid;gap:7px}.design-summary div{font-size:11px;color:#bbb}.design-summary strong{display:block;color:#fff;font-size:12px;margin-bottom:1px}
    .website-shot{margin-top:10px;border-radius:13px;overflow:hidden;border:1px solid #252525;max-height:180px;background:#111}.website-shot img{display:block;width:100%;height:180px;object-fit:cover;object-position:top}.website-shot.empty{display:none}
    .button-style-preview{margin-top:10px;padding:11px;border:1px solid #252525;border-radius:13px;background:#070707}.button-style-row{display:grid;gap:7px}.button-demo{display:flex;justify-content:space-between;align-items:center;padding:10px 11px;border-radius:11px;font-size:10px;font-weight:850;border:1px solid transparent}.button-demo small{font-size:9px;opacity:.68;font-weight:700}.button-key{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.button-key span{font-size:9px;color:#777}.button-key b{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:0}
    .design-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.design-actions button{border:1px solid #333;border-radius:12px;padding:10px 13px;background:#171717;color:#fff;font-weight:700;cursor:pointer}.design-actions button.primary{background:#fff;color:#050505;border-color:#fff}
    .design-note{font-size:10px;color:#646464;line-height:1.45;margin:9px 0 0}.auto-applied{color:#8fce96;font-weight:800}
    @media(max-width:620px){.design-grid{grid-template-columns:1fr}.design-scan-head{display:block}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('div');
  section.id = 'designScanResults';
  section.className = 'design-scan';
  section.innerHTML = `
    <div class="design-scan-head">
      <div>
        <div class="scan-rec-title" style="margin:0 0 4px">Website design scan</div>
        <h3>Brand colours + button styling</h3>
        <p>The scan picks a usable brand palette from the website, then turns it into a card background, main action button and softer secondary buttons with readable contrast.</p>
      </div>
      <span class="scan-badge" id="designConfidence">Visual scan</span>
    </div>
    <div class="design-grid">
      <div class="design-box">
        <div class="design-label">Colours detected from website</div>
        <div class="palette" id="designPalette"></div>
        <div class="button-style-preview">
          <div class="design-label">Button treatment</div>
          <div class="button-style-row">
            <div class="button-demo" id="primaryButtonDemo"><span>Book / Enquire</span><small>PRIMARY →</small></div>
            <div class="button-demo" id="secondaryButtonDemo"><span>Call / Email / Social</span><small>SECONDARY →</small></div>
          </div>
          <div class="button-key" id="buttonKey"></div>
        </div>
        <div class="website-shot empty" id="websiteShot"><img id="websiteShotImg" alt="Website preview"></div>
      </div>
      <div class="design-box">
        <div class="design-label">Brand direction</div>
        <div class="design-preview">
          <div class="design-logo" id="designLogo"><span>No logo found</span></div>
          <div class="design-summary">
            <div><strong id="designMode">—</strong>Colour mode</div>
            <div><strong id="designMood">—</strong>Design direction</div>
            <div><strong id="designType">—</strong>Suggested type direction</div>
          </div>
        </div>
      </div>
    </div>
    <div class="design-actions">
      <button class="primary" id="applyWebsiteDesign">Apply full website design</button>
      <button id="applyWebsiteColours">Re-apply colours + buttons</button>
      <button id="applyWebsiteLogo">Apply logo only</button>
    </div>
    <p class="design-note"><span class="auto-applied">Colours and button styling are applied automatically after a successful scan.</span> You can still fine-tune every colour in the builder before publishing.</p>
  `;
  const results = document.getElementById('scanResults');
  scanCard.insertBefore(section, results ? results.nextSibling : null);

  let designData = null;

  function normalise(raw){
    let v = String(raw || '').trim();
    if (!v) throw new Error('Enter a website address first.');
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return new URL(v).href;
  }

  function hex(value){
    if (!value) return '';
    let v = String(value).trim();
    if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + [...v.slice(1)].map(x=>x+x).join('');
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : '';
  }

  function paletteFromNode(node){
    if (!node) return [];
    const p = node.palette;
    if (!Array.isArray(p)) return [];
    return p.map(item => {
      if (typeof item === 'string') return hex(item);
      if (item && typeof item === 'object') return hex(item.hex || item.color || item.value || item.background);
      return '';
    }).filter(Boolean);
  }

  function rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
  function lum(h){
    const vals=rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
    return .2126*vals[0]+.7152*vals[1]+.0722*vals[2];
  }
  function sat(h){
    const [r,g,b]=rgb(h).map(v=>v/255), max=Math.max(r,g,b), min=Math.min(r,g,b);
    return max===0 ? 0 : (max-min)/max;
  }
  function mix(a,b,t){
    const A=rgb(a),B=rgb(b); const c=A.map((v,i)=>Math.round(v+(B[i]-v)*t));
    return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function contrast(a,b){
    const A=lum(a),B=lum(b); return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);
  }
  function unique(list){ return list.filter((v,i,a)=>v && a.indexOf(v)===i); }
  function isNeutral(c){ return sat(c)<.20; }
  function readableText(bg){ return lum(bg)>.43?'#111111':'#FFFFFF'; }

  async function coloursFromImage(url){
    if (!url) return [];
    return new Promise(resolve=>{
      const img=new Image(); img.crossOrigin='anonymous';
      img.onload=()=>{
        try{
          const canvas=document.createElement('canvas'); canvas.width=72; canvas.height=72;
          const ctx=canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0,72,72);
          const data=ctx.getImageData(0,0,72,72).data; const bins=new Map();
          for(let i=0;i<data.length;i+=16){
            if(data[i+3]<180) continue;
            const r=Math.round(data[i]/24)*24, g=Math.round(data[i+1]/24)*24, b=Math.round(data[i+2]/24)*24;
            const key=[Math.min(r,255),Math.min(g,255),Math.min(b,255)].join(','); bins.set(key,(bins.get(key)||0)+1);
          }
          const out=[...bins.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k])=>'#'+k.split(',').map(v=>(+v).toString(16).padStart(2,'0')).join('').toUpperCase());
          resolve(out);
        }catch(e){resolve([])}
      };
      img.onerror=()=>resolve([]); img.src=url;
    });
  }

  function pickTheme(palette){
    let p=unique(palette.map(hex).filter(Boolean));
    if(!p.length) p=['#F3EFE7','#181818'];

    // Prefer a neutral dominant website colour as the card base so branded buttons remain clear.
    const neutralCandidates=p.filter(isNeutral);
    let background=neutralCandidates[0] || p[0];
    if(sat(background)>.38){
      background=lum(background)<.45?'#101010':'#F7F7F4';
    }
    const dark=lum(background)<.42;
    const text=dark?'#FFFFFF':'#151515';

    // Pick the strongest genuine brand colour for the primary CTA, avoiding near-white/near-black where possible.
    let accentCandidates=p.filter(c=>c!==background && sat(c)>.20 && lum(c)>.035 && lum(c)<.94);
    accentCandidates=accentCandidates.sort((a,b)=>{
      const score=c=>sat(c)*1.6 + Math.min(contrast(c,background),5)*.20 + (lum(c)>.08&&lum(c)<.82?.2:0);
      return score(b)-score(a);
    });
    let accent=accentCandidates[0];

    // Monochrome brands intentionally get a high-contrast black/white CTA.
    if(!accent){
      const contrasting=p.filter(c=>c!==background).sort((a,b)=>contrast(b,background)-contrast(a,background))[0];
      accent=contrasting && contrast(contrasting,background)>2 ? contrasting : (dark?'#FFFFFF':'#181818');
    }

    const accentText=readableText(accent);

    // Secondary buttons receive a restrained tint of the brand accent rather than generic grey.
    const surface=mix(background,accent,dark?.16:.10);
    const muted=mix(text,background,.54);
    const secondaryText=readableText(surface);
    const avgSat=p.reduce((n,c)=>n+sat(c),0)/p.length;
    let mood='Clean / minimal';
    if(dark && avgSat<.28) mood='Premium / understated';
    else if(!dark && avgSat<.23) mood='Editorial / refined';
    else if(avgSat>.48) mood='Bold / modern';
    else if(p.some(c=>{const [r,g,b]=rgb(c);return r>g && g>b && r-b>45;})) mood='Warm / welcoming';
    const type = /Premium|Editorial|refined/.test(mood) ? 'Elegant serif + clean sans' : 'Clean modern sans-serif';
    return {background,surface,text,muted,accent,accentText,secondaryText,mode:dark?'Dark':'Light',mood,type,palette:p.slice(0,6)};
  }

  function render(data){
    const p=document.getElementById('designPalette'); p.innerHTML='';
    data.theme.palette.forEach(c=>{
      const s=document.createElement('div'); s.className='swatch';
      s.innerHTML=`<div class="swatch-colour" style="background:${c}"></div><code>${c}</code>`; p.appendChild(s);
    });
    document.getElementById('designMode').textContent=data.theme.mode;
    document.getElementById('designMood').textContent=data.theme.mood;
    document.getElementById('designType').textContent=data.theme.type;
    const logo=document.getElementById('designLogo');
    logo.innerHTML=data.logo?`<img src="${data.logo}" alt="Detected logo">`:'<span>No logo found</span>';
    const shot=document.getElementById('websiteShot');
    if(data.screenshot){document.getElementById('websiteShotImg').src=data.screenshot;shot.classList.remove('empty')}else shot.classList.add('empty');
    document.getElementById('designConfidence').textContent=data.paletteSource;

    const primary=document.getElementById('primaryButtonDemo');
    primary.style.background=data.theme.accent;
    primary.style.color=data.theme.accentText;
    primary.style.borderColor=data.theme.accent;
    const secondary=document.getElementById('secondaryButtonDemo');
    secondary.style.background=data.theme.surface;
    secondary.style.color=data.theme.text;
    secondary.style.borderColor=mix(data.theme.surface,data.theme.accent,.34);
    document.getElementById('buttonKey').innerHTML=`
      <span><b style="background:${data.theme.accent}"></b>Main action ${data.theme.accent}</span>
      <span><b style="background:${data.theme.surface}"></b>Other buttons ${data.theme.surface}</span>`;
    section.classList.add('show');
  }

  function applyColours(silent=false){
    if(!designData) return;
    const t=designData.theme;
    setColour('background',t.background);
    setColour('surface',t.surface);
    setColour('text',t.text);
    setColour('muted',t.muted);
    setColour('accent',t.accent);
    setColour('accentTextColour',t.accentText);
    update();
    if(!silent) showStatus('Website colours and button styling applied.');
  }
  function applyLogo(){ if(designData&&designData.logo){ setValue('logo',designData.logo); update(); } }
  function applyAll(){
    if(!designData) return;
    applyColours(true);
    applyLogo();
    if(designData.hero && document.getElementById('gallery') && !document.getElementById('gallery').value.trim()) setValue('gallery',designData.hero);
    update(); showStatus('Website brand design and button styling applied.');
  }

  async function scanDesign(){
    let url; try{url=normalise(scanUrl.value)}catch(e){return}
    document.getElementById('designConfidence').textContent='Scanning design…';
    section.classList.add('show');
    try{
      const endpoint='https://api.microlink.io/?url='+encodeURIComponent(url)+'&screenshot=true&palette=true';
      const res=await fetch(endpoint,{headers:{'Accept':'application/json'}});
      if(!res.ok) throw new Error('Visual scan unavailable');
      const json=await res.json(); const d=json.data||{};
      const logo=d.logo&&d.logo.url?d.logo.url:'';
      const screenshot=d.screenshot&&d.screenshot.url?d.screenshot.url:'';
      const hero=d.image&&d.image.url?d.image.url:'';
      let palette=unique([
        ...paletteFromNode(d.screenshot),
        ...paletteFromNode(d.logo),
        ...paletteFromNode(d.image)
      ]);
      let source='Website palette';
      if(!palette.length){
        palette=await coloursFromImage(screenshot||hero||logo);
        source=palette.length?'Screenshot colours':'Suggested palette';
      }
      const theme=pickTheme(palette);
      designData={url,logo,screenshot,hero,theme,paletteSource:source};
      render(designData);

      // The user's intended workflow is website -> scan -> automatically branded card.
      // Apply the visual palette immediately, while leaving all controls editable.
      applyColours(true);
      showStatus('Website colours found — card and buttons styled automatically.');
    }catch(e){
      designData=null;
      document.getElementById('designConfidence').textContent='Design scan unavailable';
      document.getElementById('designPalette').innerHTML='<span style="font-size:11px;color:#777">The content scan can still be used. This website did not return visual brand data.</span>';
      document.getElementById('designMode').textContent='—'; document.getElementById('designMood').textContent='—'; document.getElementById('designType').textContent='—';
    }
  }

  scanButton.addEventListener('click',()=>{setTimeout(scanDesign,0)});
  scanUrl.addEventListener('keydown',e=>{if(e.key==='Enter') setTimeout(scanDesign,0)});
  document.getElementById('applyWebsiteDesign').addEventListener('click',applyAll);
  document.getElementById('applyWebsiteColours').addEventListener('click',()=>applyColours(false));
  document.getElementById('applyWebsiteLogo').addEventListener('click',()=>{applyLogo();showStatus('Website logo applied.')});
})();