(() => {
  const brands = window.HIGH_STYLE_BRANDS = window.HIGH_STYLE_BRANDS || {};
  const params = new URLSearchParams(location.search);
  const slug = (params.get('brand') || 'high-style').toLowerCase();

  // Published cards always win. The QR snapshot is only the immediate fallback.
  if (brands[slug]) return;
  const match = location.hash.match(/(?:^#|&)c=([^&]+)/);
  if (!match) return;

  const SYSTEM = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const fonts = {
    modern:['"Helvetica Neue", Arial, sans-serif','"Helvetica Neue", Arial, sans-serif','Modern'],
    luxury:['Didot, "Bodoni 72", Georgia, "Times New Roman", serif',SYSTEM,'Luxury'],
    editorial:['Baskerville, Georgia, "Times New Roman", serif','"Helvetica Neue", Arial, sans-serif','Editorial'],
    bold:['"Arial Black", "Helvetica Neue", Arial, sans-serif','"Helvetica Neue", Arial, sans-serif','Bold'],
    rounded:['"Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Arial, sans-serif','"Avenir Next", "Segoe UI", Arial, sans-serif','Rounded'],
    classic:['Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif','Georgia, "Times New Roman", serif','Classic']
  };

  function decodeBase64Url(value){
    let b64 = String(value || '').replace(/-/g,'+').replace(/_/g,'/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function clean(obj){
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) delete obj[k];
    });
    return obj;
  }

  function expandTokens(v){
    if (!Array.isArray(v)) return undefined;
    return clean({
      buttonRadius:v[0], cardRadius:v[1], logoRadius:v[2], borderWidth:v[3],
      headingWeight:v[4], headingTransform:v[5], letterSpacing:v[6],
      sectionGap:v[7], density:v[8]
    });
  }

  function expandTheme(h){
    h = h || {};
    const font = fonts[h.q] || null;
    return clean({
      background:h.b, surface:h.s, text:h.x, muted:h.m, accent:h.a,
      accentText:h.c, border:h.o,
      headingFont:font ? font[0] : h.h,
      bodyFont:font ? font[1] : h.f,
      fontLabel:font ? font[2] : h.l,
      fontChoice:h.q,
      brandTokens:expandTokens(h.k)
    });
  }

  try {
    const p = JSON.parse(decodeBase64Url(match[1]));
    const card = clean({
      businessName:p.n || 'Digital Card',
      displayName:p.d || p.n || 'Digital Card',
      eyebrow:p.e || 'Digital business card',
      personName:p.p,
      role:p.r,
      tagline:p.t,
      logo:p.g,
      initials:p.i,
      theme:expandTheme(p.h),
      phone:p.ph,
      phoneDisplay:p.pd,
      whatsapp:p.wa,
      email:p.em,
      website:p.wb,
      instagram:p.ig,
      instagramLabel:p.il,
      linkedin:p.li,
      tiktok:p.tk,
      bookingUrl:p.bu,
      bookingLabel:p.bl,
      services:p.sv || [],
      review:p.rv,
      location:p.lo,
      gallery:p.ga || [],
      footer:p.ft || 'Powered by High Style Cards',
      actions:Array.isArray(p.ac) ? p.ac.map(a => clean({type:a.t,label:a.l,primary:!!a.p})) : [],
      designStyle:p.ds,
      tripadvisorUrl:p.ta
    });
    brands[slug] = card;
    window.HIGH_STYLE_SNAPSHOT_ACTIVE = true;
  } catch(e) {
    console.warn('Could not load card snapshot', e);
  }
})();
