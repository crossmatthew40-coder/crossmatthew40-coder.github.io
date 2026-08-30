(() => {
  if (window.__highStyleButtonSettingsNormalizerLoaded || typeof getConfig !== 'function') return;
  window.__highStyleButtonSettingsNormalizerLoaded = true;
  const baseGetConfig = getConfig;
  const TYPES = ['booking','phone','whatsapp','email','website','instagram','linkedin','tiktok'];
  function available(type,c){
    if(type==='booking') return !!c.bookingUrl;
    if(type==='phone') return !!c.phone;
    if(type==='whatsapp') return !!c.whatsapp;
    if(type==='email') return !!c.email;
    if(type==='website') return !!c.website;
    if(type==='instagram') return !!c.instagram;
    if(type==='linkedin') return !!c.linkedin;
    if(type==='tiktok') return !!c.tiktok;
    return false;
  }
  getConfig = function(){
    const c = baseGetConfig();
    const enabled = new Set((Array.isArray(c.actions)?c.actions:[]).map(a=>a.type));
    const effectiveHidden = TYPES.filter(type => available(type,c) && !enabled.has(type));
    c.buttonSettings = {...(c.buttonSettings||{}), managed:true, hidden:effectiveHidden, saveContact:c.saveContactEnabled !== false};
    return c;
  };
})();