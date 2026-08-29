(() => {
  if (window.__highStyleFontThemeLoaded) return;
  window.__highStyleFontThemeLoaded = true;

  const SYSTEM_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  let headingFont = SYSTEM_SANS;
  let bodyFont = SYSTEM_SANS;
  let fontLabel = 'Clean modern sans-serif';

  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;
  const baseUpdatePreview = updatePreview;

  function fontPlanFromDesign(){
    const mood = (document.getElementById('designMood')?.textContent || '').toLowerCase();
    const type = (document.getElementById('designType')?.textContent || '').toLowerCase();
    const smart = (document.getElementById('smartDesignStyle')?.textContent || '').toLowerCase();
    const hay = `${mood} ${type} ${smart}`;

    if (/premium|editorial|refined|understated|luxury|serif/.test(hay)) {
      return {
        heading: 'Georgia, "Times New Roman", serif',
        body: SYSTEM_SANS,
        label: 'Elegant serif + clean sans'
      };
    }
    if (/bold|modern/.test(hay)) {
      return {
        heading: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
        body: '"Helvetica Neue", Arial, sans-serif',
        label: 'Bold modern sans-serif'
      };
    }
    if (/warm|welcoming|soft/.test(hay)) {
      return {
        heading: '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
        body: '"Segoe UI", Arial, sans-serif',
        label: 'Warm rounded sans-serif'
      };
    }
    return {
      heading: SYSTEM_SANS,
      body: SYSTEM_SANS,
      label: 'Clean modern sans-serif'
    };
  }

  function applyPlan(plan, silent=false){
    headingFont = plan.heading;
    bodyFont = plan.body;
    fontLabel = plan.label;
    update();
    const type = document.getElementById('designType');
    if (type) type.textContent = fontLabel;
    if (!silent) showStatus('Website colours, buttons and font style copied to the card.');
  }

  getConfig = function(){
    const c = baseGetConfig();
    c.theme = c.theme || {};
    c.theme.headingFont = headingFont;
    c.theme.bodyFont = bodyFont;
    c.theme.fontLabel = fontLabel;
    return c;
  };

  loadConfig = function(data){
    const d = data?.config || data || {};
    const t = d.theme || {};
    headingFont = t.headingFont || SYSTEM_SANS;
    bodyFont = t.bodyFont || SYSTEM_SANS;
    fontLabel = t.fontLabel || 'Clean modern sans-serif';
    baseLoadConfig(data);
  };

  updatePreview = function(c){
    baseUpdatePreview(c);
    const card = document.getElementById('cardPreview');
    const title = document.getElementById('previewBusiness');
    if (card) card.style.fontFamily = c?.theme?.bodyFont || bodyFont;
    if (title) title.style.fontFamily = c?.theme?.headingFont || headingFont;
    document.querySelectorAll('.preview-btn,.chip,.preview-role,.preview-tagline,.preview-location,.preview-person,.preview-footer').forEach(el => {
      el.style.fontFamily = c?.theme?.bodyFont || bodyFont;
    });
  };

  const copyDesign = document.getElementById('applyWebsiteDesign');
  const coloursButton = document.getElementById('applyWebsiteColours');
  if (copyDesign) {
    copyDesign.textContent = 'Copy Website Design';
    copyDesign.addEventListener('click', () => applyPlan(fontPlanFromDesign(), false));
  }
  if (coloursButton) coloursButton.textContent = 'Copy Brand Colours + Buttons';

  const mood = document.getElementById('designMood');
  if (mood) {
    new MutationObserver(() => {
      const plan = fontPlanFromDesign();
      const type = document.getElementById('designType');
      if (type) type.textContent = plan.label;
    }).observe(mood, {childList:true, characterData:true, subtree:true});
  }

  // Recover font settings from an existing local draft when the builder booted before this extension loaded.
  try {
    let saved = null;
    if (location.hash.startsWith('#draft=')) {
      const raw = decodeURIComponent(escape(atob(location.hash.slice(7))));
      saved = JSON.parse(raw);
    } else {
      const local = localStorage.getItem('highStyleCardBuilderDraft');
      if (local) saved = JSON.parse(local);
    }
    const t = saved?.config?.theme || saved?.theme;
    if (t?.headingFont || t?.bodyFont) {
      headingFont = t.headingFont || SYSTEM_SANS;
      bodyFont = t.bodyFont || SYSTEM_SANS;
      fontLabel = t.fontLabel || 'Brand typography';
    }
  } catch(e) {}

  update();
})();