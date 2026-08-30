(() => {
  const brands = window.HIGH_STYLE_BRANDS = window.HIGH_STYLE_BRANDS || {};
  const params = new URLSearchParams(location.search);
  const slug = (params.get('brand') || 'high-style').toLowerCase();
  const match = location.hash.match(/(?:^#|&)c=([^&]+)/);

  // A QR/customer-view snapshot is the exact finished design from the builder.
  // When present it intentionally overrides an older published card with the same slug.
  if (!match) return;

  function decodeBase64Url(value){
    let b64 = String(value || '').replace(/-/g,'+').replace(/_/g,'/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function fontPlan(choice){
    const SYSTEM = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    const map = {
      modern:{heading:'"Helvetica Neue", Arial, sans-serif',body:'"Helvetica Neue", Arial, sans-serif',label:'Modern'},
      luxury:{heading:'Didot, "Bodoni 72", Georgia, "Times New Roman", serif',body:SYSTEM,label:'Luxury'},
      editorial:{heading:'Baskerville, Georgia, "Times New Roman", serif',body:'"Helvetica Neue", Arial, sans-serif',label:'Editorial'},
      bold:{heading:'"Arial Black", "Helvetica Neue", Arial, sans-serif',body:'"Helvetica Neue", Arial, sans-serif',label:'Bold'},
      rounded:{heading:'"Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Arial, sans-serif',body:'"Avenir Next", "Segoe UI", Arial, sans-serif',label:'Rounded'},
      classic:{heading:'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',body:'Georgia, "Times New Roman", serif',label:'Classic'}
    };
    return map[choice] || null;
  }

  function expandTokens(value){
    if (!Array.isArray(value)) return value || undefined;
    const [buttonRadius,cardRadius,logoRadius,borderWidth,headingWeight,headingTransform,letterSpacing,sectionGap,density] = value;
    return clean({buttonRadius,cardRadius,logoRadius,borderWidth,headingWeight,headingTransform,letterSpacing,sectionGap,density});
  }

  function expandTheme(h){
    h = h || {};
    const fp = fontPlan(h.q);
    return clean({
      background:h.b,
      surface:h.s,
      text:h.x,
      muted:h.m,
      accent:h.a,
      accentText:h.c,
      border:h.o,
      headingFont:fp?.heading || h.h,
      bodyFont:fp?.body || h.f,
      fontLabel:fp?.label || h.l,
      fontChoice:h.q,
      brandTokens:expandTokens(h.k)
    });
  }

  function clean(obj){
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) delete obj[k];
    });
    return obj;
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