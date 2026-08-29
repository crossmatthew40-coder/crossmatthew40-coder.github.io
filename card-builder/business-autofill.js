(() => {
  const scanResults = document.getElementById('scanResults');
  const scanButton = document.getElementById('scanWebsite');
  const scanUrl = document.getElementById('scanUrl');
  if (!scanResults || !scanButton || !scanUrl) return;

  let runId = 0;
  let lastAppliedSignature = '';
  let lastColourSignature = '';

  function rowValue(pattern){
    const rows = [...scanResults.querySelectorAll('.scan-item')];
    for (const row of rows) {
      const title = row.querySelector('.scan-item-title')?.textContent?.trim() || '';
      if (!pattern.test(title)) continue;
      return (row.querySelector('.scan-item-value')?.textContent || '').replace(/\s+/g,' ').trim();
    }
    return '';
  }

  function cleanInstagram(raw){
    if (!raw) return {url:'',label:''};
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase().replace(/^www\./,'');
      if (host !== 'instagram.com' && host !== 'm.instagram.com') return {url:'',label:''};
      const parts = u.pathname.split('/').filter(Boolean);
      if (!parts.length) return {url:'',label:''};
      const blocked = /^(p|reel|reels|stories|explore|accounts|about)$/i;
      if (blocked.test(parts[0])) return {url:'',label:''};
      const handle = parts[0].replace(/^@/,'');
      return {url:`https://www.instagram.com/${handle}/`,label:'@'+handle};
    } catch(e) {
      return {url:'',label:''};
    }
  }

  function suitableTagline(raw,businessName){
    let value = String(raw || '').replace(/\s+/g,' ').trim();
    if (!value) return '';

    const forbidden = /(cookie|privacy policy|terms and conditions|all rights reserved|copyright|accept cookies|skip to content|navigation|sign up|subscribe|newsletter)/i;
    if (forbidden.test(value)) return '';
    if (/^welcome(?:\s+to)?\b/i.test(value) && value.split(/\s+/).length < 7) return '';

    const name = String(businessName || '').trim().toLowerCase();
    if (name && value.toLowerCase() === name) return '';

    // Prefer a short first sentence if the website description is longer.
    if (value.length > 145) {
      const first = value.match(/^(.{20,140}?[.!?])(?:\s|$)/);
      value = first ? first[1].trim() : '';
    }

    const words = value.split(/\s+/).filter(Boolean);
    if (value.length < 20 || value.length > 145 || words.length < 4) return '';
    if ((value.match(/https?:\/\//gi) || []).length) return '';
    return value;
  }

  function signature(){
    return `${scanUrl.value.trim()}|${rowValue(/^business name$/i)}|${scanResults.textContent.length}`;
  }

  function applyBusinessDetails(finalNotice=false){
    if (!scanResults.classList.contains('show')) return;
    const sig = signature();
    if (!sig || (!finalNotice && sig === lastAppliedSignature)) return;

    const businessName = rowValue(/^business name$/i) || document.getElementById('businessName')?.value.trim() || '';
    const tag = suitableTagline(rowValue(/^short description\s*\/\s*tagline$/i), businessName);
    const insta = cleanInstagram(rowValue(/^instagram$/i));

    let changed = false;
    const taglineInput = document.getElementById('tagline');
    const instagramInput = document.getElementById('instagram');
    const instagramLabelInput = document.getElementById('instagramLabel');

    if (taglineInput && taglineInput.value.trim() !== tag) {
      setValue('tagline', tag);
      changed = true;
    }
    if (instagramInput && instagramInput.value.trim() !== insta.url) {
      setValue('instagram', insta.url);
      changed = true;
    }
    if (instagramLabelInput && instagramLabelInput.value.trim() !== insta.label) {
      setValue('instagramLabel', insta.label);
      changed = true;
    }

    if (changed) update();
    lastAppliedSignature = sig;

    if (finalNotice) {
      const bits = [];
      if (insta.url) bits.push('Instagram');
      if (tag) bits.push('tagline');
      const message = bits.length
        ? `${bits.join(' and ')} added from the website.`
        : 'Website details checked — no suitable Instagram or tagline was found.';
      showStatus(message);
    }
  }

  function enforceBrandColours(){
    const palette = document.getElementById('designPalette');
    const colourButton = document.getElementById('applyWebsiteColours');
    if (!palette || !colourButton || !palette.querySelector('.swatch')) return;
    const sig = `${scanUrl.value.trim()}|${palette.textContent.trim()}`;
    if (!sig || sig === lastColourSignature) return;
    lastColourSignature = sig;
    colourButton.click();
  }

  const resultsObserver = new MutationObserver(() => applyBusinessDetails(false));
  resultsObserver.observe(scanResults,{attributes:true,childList:true,subtree:true,attributeFilter:['class']});

  const palette = document.getElementById('designPalette');
  if (palette) {
    new MutationObserver(() => setTimeout(enforceBrandColours,30)).observe(palette,{childList:true,subtree:true,characterData:true});
  }

  function startRun(){
    runId += 1;
    const id = runId;
    lastAppliedSignature = '';
    lastColourSignature = '';
    [350,900,1800,3200,5600].forEach((delay,index) => {
      setTimeout(() => {
        if (id !== runId) return;
        applyBusinessDetails(index === 4);
        enforceBrandColours();
      },delay);
    });
  }

  scanButton.addEventListener('click',startRun);
  scanUrl.addEventListener('keydown',e=>{ if(e.key==='Enter') startRun(); });
})();