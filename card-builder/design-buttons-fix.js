(() => {
  const colourButton = document.getElementById('applyWebsiteColours');
  const brandButton = document.getElementById('applyWebsiteDesign');
  if (!colourButton || !brandButton || window.__highStyleDesignButtonsFixed) return;
  window.__highStyleDesignButtonsFixed = true;

  function hex(value){
    let v = String(value || '').trim();
    if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + [...v.slice(1)].map(x => x + x).join('');
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : '';
  }
  function rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
  function lum(h){
    const vals = rgb(h).map(v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); });
    return .2126*vals[0] + .7152*vals[1] + .0722*vals[2];
  }
  function sat(h){
    const [r,g,b] = rgb(h).map(v=>v/255), max=Math.max(r,g,b), min=Math.min(r,g,b);
    return max===0 ? 0 : (max-min)/max;
  }
  function mix(a,b,t){
    const A=rgb(a), B=rgb(b), c=A.map((v,i)=>Math.round(v+(B[i]-v)*t));
    return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function contrast(a,b){
    const A=lum(a), B=lum(b);
    return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);
  }
  function readableText(bg){ return lum(bg)>.43 ? '#111111' : '#FFFFFF'; }
  function unique(list){ return list.filter((v,i,a)=>v && a.indexOf(v)===i); }

  function detectedPalette(){
    const codes = [...document.querySelectorAll('#designPalette code')]
      .map(el => hex(el.textContent))
      .filter(Boolean);
    if (codes.length) return unique(codes);

    const swatches = [...document.querySelectorAll('#designPalette .swatch-colour')]
      .map(el => {
        const c = getComputedStyle(el).backgroundColor.match(/\d+/g);
        if (!c || c.length < 3) return '';
        return '#'+c.slice(0,3).map(v=>Number(v).toString(16).padStart(2,'0')).join('').toUpperCase();
      })
      .filter(Boolean);
    return unique(swatches);
  }

  function makeTheme(palette){
    const p = unique(palette.map(hex).filter(Boolean));
    if (!p.length) return null;

    const neutrals = p.filter(c => sat(c) < .20);
    let background = neutrals[0] || p[0];
    if (sat(background) > .38) background = lum(background) < .45 ? '#101010' : '#F7F7F4';
    const dark = lum(background) < .42;
    const text = dark ? '#FFFFFF' : '#151515';

    let candidates = p.filter(c => c!==background && sat(c)>.20 && lum(c)>.035 && lum(c)<.94);
    candidates.sort((a,b) => {
      const score = c => sat(c)*1.6 + Math.min(contrast(c,background),5)*.20 + (lum(c)>.08 && lum(c)<.82 ? .2 : 0);
      return score(b)-score(a);
    });
    let accent = candidates[0];
    if (!accent) {
      const contrasting = p.filter(c=>c!==background).sort((a,b)=>contrast(b,background)-contrast(a,background))[0];
      accent = contrasting && contrast(contrasting,background)>2 ? contrasting : (dark ? '#FFFFFF' : '#181818');
    }

    return {
      background,
      surface: mix(background,accent,dark ? .16 : .10),
      text,
      muted: mix(text,background,.54),
      accent,
      accentText: readableText(accent)
    };
  }

  function applyColours(showMessage=true){
    const palette = detectedPalette();
    const theme = makeTheme(palette);
    if (!theme) {
      if (showMessage) showStatus('Scan a website first so I can detect its brand colours.', true);
      return false;
    }

    setColour('background', theme.background);
    setColour('surface', theme.surface);
    setColour('text', theme.text);
    setColour('muted', theme.muted);
    setColour('accent', theme.accent);
    setColour('accentTextColour', theme.accentText);
    update();

    if (showMessage) showStatus('Brand colours and button colours applied to the card.');
    return true;
  }

  function applyLogo(){
    const logo = document.querySelector('#designLogo img');
    const src = logo ? (logo.currentSrc || logo.src || '') : '';
    if (!src) return false;
    try { uploadedLogo = ''; } catch(e) {}
    setValue('logo', src);
    update();
    return true;
  }

  async function applyBrand(){
    const coloursApplied = applyColours(false);
    const logoApplied = applyLogo();
    const styleApplied = typeof window.applyHighStyleBrandTreatment === 'function'
      ? window.applyHighStyleBrandTreatment(true)
      : false;

    let reviewsAdded = false;
    if (typeof window.applyHighStyleTripadvisorReviews === 'function') {
      try { reviewsAdded = await window.applyHighStyleTripadvisorReviews(true); } catch(e) {}
    }

    if (!coloursApplied && !logoApplied && !styleApplied && !reviewsAdded) {
      showStatus('Scan a website first so I can copy its branding.', true);
      return;
    }

    update();
    showStatus(reviewsAdded
      ? 'Website branding applied — style, colours, logo and Tripadvisor Reviews added.'
      : 'Website branding applied — style, colours, buttons, logo and typography updated.');
  }

  colourButton.textContent = 'Copy Brand Colours + Buttons';
  brandButton.textContent = 'Copy Website Branding';

  colourButton.addEventListener('click', () => applyColours(true));
  brandButton.addEventListener('click', () => applyBrand());

  const palette = document.getElementById('designPalette');
  if (palette) {
    const refresh = () => {
      const ready = detectedPalette().length > 0;
      colourButton.dataset.ready = ready ? '1' : '0';
      brandButton.dataset.ready = ready ? '1' : '0';
      colourButton.title = ready ? 'Apply the detected website palette to the card' : 'Scan a website first';
      brandButton.title = ready ? 'Apply the detected website style, branding and reviews to the card' : 'Scan a website first';
    };
    new MutationObserver(refresh).observe(palette,{childList:true,subtree:true,characterData:true});
    refresh();
  }
})();