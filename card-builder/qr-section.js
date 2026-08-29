(() => {
  const editor = document.querySelector('.editor-panel');
  if (!editor || document.getElementById('qrBuilderSection')) return;

  const style = document.createElement('style');
  style.textContent = `
    .qr-builder-card{margin-top:30px;border:1px solid #272727;border-radius:24px;background:linear-gradient(145deg,#111,#090909);padding:22px;box-shadow:0 18px 55px rgba(0,0,0,.2)}
    .qr-builder-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:16px}.qr-builder-head h2{font-size:22px;margin:3px 0 6px}.qr-builder-head p{margin:0;color:#888;line-height:1.5;font-size:13px;max-width:600px}.qr-ready-badge{border:1px solid #343434;border-radius:999px;padding:7px 10px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#bbb;white-space:nowrap}
    .qr-url-box{display:grid;grid-template-columns:1fr auto;gap:9px;margin-top:15px}.qr-url-box input{min-width:0}.qr-url-box button{border:1px solid #333;border-radius:12px;background:#171717;color:#fff;padding:0 14px;font-weight:750;cursor:pointer}
    .qr-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.qr-options label{margin:0}.qr-options select,.qr-options input{width:100%}
    .qr-output{display:none;grid-template-columns:230px 1fr;gap:20px;align-items:center;margin-top:18px;padding:18px;border:1px solid #272727;border-radius:18px;background:#070707}.qr-output.show{display:grid}.qr-image-wrap{background:#fff;border-radius:16px;padding:14px;display:grid;place-items:center;aspect-ratio:1}.qr-image-wrap svg{width:100%;height:100%;display:block}.qr-details h3{margin:0 0 6px;font-size:19px}.qr-details p{margin:0 0 12px;color:#888;font-size:12px;line-height:1.5}.qr-destination{font-size:11px;line-height:1.45;color:#bbb;background:#101010;border:1px solid #252525;border-radius:10px;padding:10px;overflow-wrap:anywhere;margin-bottom:12px}.qr-actions{display:flex;gap:8px;flex-wrap:wrap}.qr-actions button{border:1px solid #333;border-radius:11px;background:#171717;color:#fff;padding:10px 12px;font-weight:750;cursor:pointer}.qr-actions button.primary{background:#fff;color:#050505;border-color:#fff}.qr-note{font-size:11px;color:#666;margin:13px 0 0;line-height:1.5}.qr-warning{color:#d3aa68}
    @media(max-width:720px){.qr-builder-head{display:block}.qr-ready-badge{display:inline-block;margin-top:10px}.qr-output.show{grid-template-columns:1fr}.qr-image-wrap{max-width:260px;width:100%;margin:auto}.qr-options{grid-template-columns:1fr}.qr-url-box{grid-template-columns:1fr}.qr-url-box button{min-height:44px}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.className = 'qr-builder-card';
  section.id = 'qrBuilderSection';
  section.innerHTML = `
    <div class="qr-builder-head">
      <div>
        <p class="kicker">Final step</p>
        <h2>Create the card QR code</h2>
        <p>Generate a permanent QR code for this customer's digital card. The QR points to the brand's card URL, so the card content can be updated later without reprinting the QR.</p>
      </div>
      <span class="qr-ready-badge">Print ready</span>
    </div>

    <label>QR destination</label>
    <div class="qr-url-box">
      <input id="qrDestination" inputmode="url" aria-label="QR code destination URL">
      <button id="refreshQrUrl">Use card URL</button>
    </div>

    <div class="qr-options">
      <label>Export size
        <select id="qrSize">
          <option value="600">600 × 600 px · digital</option>
          <option value="1200" selected>1200 × 1200 px · print</option>
          <option value="2000">2000 × 2000 px · large print</option>
        </select>
      </label>
      <label>QR foreground
        <input id="qrColour" type="color" value="#000000">
      </label>
    </div>

    <div class="finish-actions" style="margin-top:14px">
      <button class="btn" id="generateQr">Generate QR Code</button>
    </div>

    <div class="qr-output" id="qrOutput">
      <div class="qr-image-wrap" id="qrImage"></div>
      <div class="qr-details">
        <h3 id="qrTitle">Customer QR Code</h3>
        <p>Scan this code to open the customer's digital business card.</p>
        <div class="qr-destination" id="qrDestinationText"></div>
        <div class="qr-actions">
          <button class="primary" id="downloadQr">Download PNG</button>
          <button id="downloadQrSvg">Download SVG</button>
          <button id="copyQrLink">Copy card link</button>
        </div>
      </div>
    </div>
    <p class="qr-note"><span class="qr-warning">Important:</span> publish the customer's brand config to the live cards system before printing the QR. Once published, this permanent URL can stay the same while you update the card behind it.</p>
  `;

  const finishHead = [...editor.querySelectorAll('.section-head')].find(el => /finish/i.test(el.textContent));
  const configBox = editor.querySelector('.config-box');
  if (configBox && configBox.parentNode === editor) editor.insertBefore(section, configBox.nextSibling);
  else if (finishHead) editor.appendChild(section);
  else editor.appendChild(section);

  const q = id => document.getElementById(id);
  let currentSvg = '';
  let currentUrl = '';

  function brandSlug(){
    const raw = q('slug') ? q('slug').value : 'new-brand';
    if (typeof cleanSlug === 'function') return cleanSlug(raw);
    return (raw || 'new-brand').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'new-brand';
  }

  function permanentCardUrl(){
    return `${location.origin}/cards/?brand=${encodeURIComponent(brandSlug())}`;
  }

  function syncUrl(force=false){
    const input=q('qrDestination');
    if(force || !input.dataset.manual) input.value=permanentCardUrl();
  }

  async function ensureQrLibrary(){
    if(window.qrcode) return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
      s.onload=resolve;
      s.onerror=()=>reject(new Error('QR library could not load.'));
      document.head.appendChild(s);
    });
  }

  function makeSvg(url, colour){
    const qr = window.qrcode(0,'H');
    qr.addData(url);
    qr.make();
    const count=qr.getModuleCount();
    const margin=4;
    const total=count+margin*2;
    let paths='';
    for(let r=0;r<count;r++){
      for(let c=0;c<count;c++){
        if(qr.isDark(r,c)) paths += `M${c+margin},${r+margin}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${paths}" fill="${colour}"/></svg>`;
  }

  async function generate(){
    let url=q('qrDestination').value.trim();
    try{
      if(!/^https?:\/\//i.test(url)) url='https://'+url;
      url=new URL(url).href;
    }catch(e){ if(typeof showStatus==='function') showStatus('Enter a valid QR destination.',true); return; }

    const btn=q('generateQr');
    btn.disabled=true; btn.textContent='Generating…';
    try{
      await ensureQrLibrary();
      currentUrl=url;
      currentSvg=makeSvg(url,q('qrColour').value || '#000000');
      q('qrImage').innerHTML=currentSvg;
      q('qrDestinationText').textContent=url;
      const business=q('businessName')?.value?.trim() || 'Customer';
      q('qrTitle').textContent=business+' QR Code';
      q('qrOutput').classList.add('show');
      if(typeof showStatus==='function') showStatus('QR code created.');
    }catch(e){
      console.error(e);
      if(typeof showStatus==='function') showStatus('Could not create the QR code.',true);
    }finally{btn.disabled=false;btn.textContent='Generate QR Code';}
  }

  function svgBlob(){ return new Blob([currentSvg],{type:'image/svg+xml;charset=utf-8'}); }

  function downloadSvg(){
    if(!currentSvg) return;
    const url=URL.createObjectURL(svgBlob());
    const a=document.createElement('a');a.href=url;a.download=brandSlug()+'-qr.svg';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function downloadPng(){
    if(!currentSvg) return;
    const size=parseInt(q('qrSize').value,10)||1200;
    const blob=svgBlob();
    const svgUrl=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);ctx.drawImage(img,0,0,size,size);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob(png=>{
        if(!png)return;
        const url=URL.createObjectURL(png);const a=document.createElement('a');a.href=url;a.download=brandSlug()+'-qr-'+size+'px.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      },'image/png');
    };
    img.onerror=()=>{URL.revokeObjectURL(svgUrl); if(typeof showStatus==='function') showStatus('Could not export the PNG.',true);};
    img.src=svgUrl;
  }

  async function copyLink(){
    if(!currentUrl) return;
    try{await navigator.clipboard.writeText(currentUrl); if(typeof showStatus==='function') showStatus('Card link copied.');}
    catch(e){if(typeof copyText==='function'){const ok=await copyText(currentUrl); if(typeof showStatus==='function') showStatus(ok?'Card link copied.':'Could not copy link.',!ok);}}
  }

  q('refreshQrUrl').addEventListener('click',()=>{q('qrDestination').dataset.manual='';syncUrl(true);if(typeof showStatus==='function')showStatus('Permanent card URL loaded.');});
  q('qrDestination').addEventListener('input',()=>{q('qrDestination').dataset.manual='1';});
  q('generateQr').addEventListener('click',generate);
  q('downloadQr').addEventListener('click',downloadPng);
  q('downloadQrSvg').addEventListener('click',downloadSvg);
  q('copyQrLink').addEventListener('click',copyLink);
  q('qrColour').addEventListener('input',()=>{if(currentUrl) generate();});
  q('slug')?.addEventListener('input',()=>syncUrl(false));

  syncUrl(true);
})();
