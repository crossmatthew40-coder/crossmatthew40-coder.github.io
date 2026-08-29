(() => {
  if (window.__highStyleBrandMirrorLoaded) return;
  window.__highStyleBrandMirrorLoaded = true;

  const card = document.getElementById('cardPreview');
  const scanButton = document.getElementById('scanWebsite');
  const copyDesignButton = document.getElementById('applyWebsiteDesign');
  const moodEl = document.getElementById('designMood');
  const typeEl = document.getElementById('designType');
  if (!card || !scanButton) return;

  let brandTokens = {
    buttonRadius: 15,
    cardRadius: 32,
    logoRadius: 22,
    borderWidth: 1,
    headingWeight: 800,
    headingTransform: 'none',
    letterSpacing: '-0.045em',
    sectionGap: 20,
    density: 'balanced'
  };

  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;
  const baseUpdatePreview = updatePreview;

  function inferTokens(){
    const mood = (moodEl?.textContent || '').toLowerCase();
    const type = (typeEl?.textContent || '').toLowerCase();
    const combined = `${mood} ${type}`;

    if (/premium|luxury|editorial|refined|understated|serif/.test(combined)) {
      return {
        buttonRadius: 10,
        cardRadius: 28,
        logoRadius: 999,
        borderWidth: 1,
        headingWeight: 600,
        headingTransform: 'none',
        letterSpacing: '-0.03em',
        sectionGap: 24,
        density: 'airy'
      };
    }
    if (/bold|modern/.test(combined)) {
      return {
        buttonRadius: 9,
        cardRadius: 22,
        logoRadius: 12,
        borderWidth: 2,
        headingWeight: 950,
        headingTransform: 'uppercase',
        letterSpacing: '-0.06em',
        sectionGap: 17,
        density: 'compact'
      };
    }
    if (/warm|welcoming|soft|rounded/.test(combined)) {
      return {
        buttonRadius: 26,
        cardRadius: 36,
        logoRadius: 999,
        borderWidth: 1,
        headingWeight: 750,
        headingTransform: 'none',
        letterSpacing: '-0.035em',
        sectionGap: 22,
        density: 'soft'
      };
    }
    return {
      buttonRadius: 15,
      cardRadius: 32,
      logoRadius: 22,
      borderWidth: 1,
      headingWeight: 800,
      headingTransform: 'none',
      letterSpacing: '-0.045em',
      sectionGap: 20,
      density: 'balanced'
    };
  }

  function applyTokensToPreview(tokens){
    card.style.borderRadius = `${tokens.cardRadius}px`;
    document.querySelectorAll('.preview-btn').forEach(el => {
      el.style.borderRadius = `${tokens.buttonRadius}px`;
      el.style.borderWidth = `${tokens.borderWidth}px`;
    });
    const logo = document.getElementById('previewLogo');
    if (logo) logo.style.borderRadius = tokens.logoRadius >= 999 ? '50%' : `${tokens.logoRadius}px`;
    const title = document.getElementById('previewBusiness');
    if (title) {
      title.style.fontWeight = String(tokens.headingWeight);
      title.style.textTransform = tokens.headingTransform;
      title.style.letterSpacing = tokens.letterSpacing;
    }
    document.querySelectorAll('.preview-section').forEach(el => el.style.marginTop = `${tokens.sectionGap}px`);
  }

  getConfig = function(){
    const c = baseGetConfig();
    c.theme = c.theme || {};
    c.theme.brandTokens = {...brandTokens};
    return c;
  };

  loadConfig = function(data){
    const d = data?.config || data || {};
    const t = d.theme || {};
    brandTokens = t.brandTokens ? {...brandTokens, ...t.brandTokens} : inferTokens();
    baseLoadConfig(data);
  };

  updatePreview = function(c){
    baseUpdatePreview(c);
    const tokens = c?.theme?.brandTokens || brandTokens;
    applyTokensToPreview(tokens);
  };

  function copyBrandDesign(silent=false){
    brandTokens = inferTokens();
    applyTokensToPreview(brandTokens);
    update();
    if (!silent) showStatus('Website branding copied — colours, buttons, font style and layout treatment applied.');
  }

  if (copyDesignButton) {
    copyDesignButton.textContent = 'Copy Website Branding';
    copyDesignButton.addEventListener('click', () => copyBrandDesign(false));
  }

  if (moodEl) {
    new MutationObserver(() => {
      brandTokens = inferTokens();
      applyTokensToPreview(brandTokens);
    }).observe(moodEl, {childList:true, characterData:true, subtree:true});
  }

  // Once a visual scan finishes successfully, mirror the detected brand treatment automatically.
  const confidence = document.getElementById('designConfidence');
  if (confidence) {
    new MutationObserver(() => {
      const text = confidence.textContent.toLowerCase();
      if (!text || /scanning|unavailable/.test(text)) return;
      setTimeout(() => copyBrandDesign(true), 80);
    }).observe(confidence, {childList:true, characterData:true, subtree:true});
  }

  scanButton.addEventListener('click', () => {
    // Keep previous settings until the new scan completes to avoid a visual flash.
  });

  try {
    const saved = localStorage.getItem('highStyleCardBuilderDraft');
    if (saved) {
      const parsed = JSON.parse(saved);
      const tokens = parsed?.config?.theme?.brandTokens || parsed?.theme?.brandTokens;
      if (tokens) brandTokens = {...brandTokens, ...tokens};
    }
  } catch(e) {}

  update();
})();