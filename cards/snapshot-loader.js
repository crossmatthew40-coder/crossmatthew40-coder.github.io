(() => {
  const brands = window.HIGH_STYLE_BRANDS = window.HIGH_STYLE_BRANDS || {};
  const params = new URLSearchParams(location.search);
  const slug = (params.get('brand') || 'high-style').toLowerCase();
  const match = location.hash.match(/(?:^#|&)c=([^&]+)/);
  if (!match) return;

  function decodeBase64Url(value){
    let b64 = String(value || '').replace(/-/g,'+').replace(/_/g,'/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function fontPlan(choice){
    const SYSTEM='-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    const map={
      modern:{heading:'"Helvetica Neue", Arial, sans-serif',body:'"Helvetica Neue", Arial, sans-serif',label:'Modern'},
      inter:{heading:'Inter, Arial, sans-serif',body:'Inter, Arial, sans-serif',label:'Inter'},
      manrope:{heading:'Manrope, Arial, sans-serif',body:'Manrope, Arial, sans-serif',label:'Manrope'},
      montserrat:{heading:'Montserrat, Arial, sans-serif',body:'Montserrat, Arial, sans-serif',label:'Montserrat'},
      poppins:{heading:'Poppins, Arial, sans-serif',body:'Poppins, Arial, sans-serif',label:'Poppins'},
      space:{heading:'"Space Grotesk", Arial, sans-serif',body:'"Space Grotesk", Arial, sans-serif',label:'Space Grotesk'},
      luxury:{heading:'Didot, "Bodoni 72", Georgia, "Times New Roman", serif',body:SYSTEM,label:'Luxury'},
      playfair:{heading:'"Playfair Display", Georgia, serif',body:'Manrope, Arial, sans-serif',label:'Playfair Display'},
      cormorant:{heading:'"Cormorant Garamond", Georgia, serif',body:'Manrope, Arial, sans-serif',label:'Cormorant'},
      dmserif:{heading:'"DM Serif Display", Georgia, serif',body:'Inter, Arial, sans-serif',label:'DM Serif'},
      editorial:{heading:'Baskerville, Georgia, "Times New Roman", serif',body:'"Helvetica Neue", Arial, sans-serif',label:'Editorial'},
      lora:{heading:'Lora, Georgia, serif',body:'Lora, Georgia, serif',label:'Lora'},
      bold:{heading:'"Arial Black", "Helvetica Neue", Arial, sans-serif',body:'"Helvetica Neue", Arial, sans-serif',label:'Bold'},
      oswald:{heading:'Oswald, Arial, sans-serif',body:'Inter, Arial, sans-serif',label:'Oswald'},
      rounded:{heading:'"Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Arial, sans-serif',body:'"Avenir Next", "Segoe UI", Arial, sans-serif',label:'Rounded'},
      classic:{heading:'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',body:'Georgia, "Times New Roman", serif',label:'Classic'}
    };
    return map[choice]||null;
  }

  function expandTokens(value){
    if (!Array.isArray(value)) return value || undefined;
    const [buttonRadius,cardRadius,logoRadius,borderWidth,headingWeight,headingTransform,letterSpacing,sectionGap,density] = value;
    return clean({buttonRadius,cardRadius,logoRadius,borderWidth,headingWeight,headingTransform,letterSpacing,sectionGap,density});
  }
  function expandTheme(h){
    h=h||{};const fp=fontPlan(h.q);
    return clean({background:h.b,surface:h.s,text:h.x,muted:h.m,accent:h.a,accentText:h.c,border:h.o,headingFont:fp?.heading||h.h,bodyFont:fp?.body||h.f,fontLabel:fp?.label||h.l,fontChoice:h.q,brandTokens:expandTokens(h.k)});
  }
  function expandIcons(ic){
    if(!ic)return undefined;
    return {
      enabled:ic.e===0?false:true,
      shape:ic.s||'rounded',
      size:ic.z||'medium',
      stroke:ic.w||'regular',
      background:ic.b||'panel',
      border:ic.r===0?false:true,
      color:ic.c||'text',
      icons:ic.m||{}
    };
  }
  function clean(obj){Object.keys(obj).forEach(k=>{const v=obj[k];if(v===''||v===null||v===undefined||(Array.isArray(v)&&!v.length))delete obj[k]});return obj}
  function availableTypes(card){const list=[];if(card.bookingUrl)list.push('booking');if(card.phone)list.push('phone');if(card.whatsapp)list.push('whatsapp');if(card.email)list.push('email');if(card.website)list.push('website');if(card.instagram)list.push('instagram');if(card.linkedin)list.push('linkedin');if(card.tiktok)list.push('tiktok');return list}

  try{
    const p=JSON.parse(decodeBase64Url(match[1]));
    const card=clean({
      businessName:p.n||'Digital Card',displayName:p.d||p.n||'Digital Card',eyebrow:p.e||'Digital business card',personName:p.p,role:p.r,tagline:p.t,logo:p.g,initials:p.i,theme:expandTheme(p.h),
      phone:p.ph,phoneDisplay:p.pd,whatsapp:p.wa,email:p.em,website:p.wb,instagram:p.ig,instagramLabel:p.il,linkedin:p.li,tiktok:p.tk,bookingUrl:p.bu,bookingLabel:p.bl,
      menuUrl:p.mu,menuLabel:p.ml||'View Menu',services:p.sv||[],review:p.rv,location:p.lo,gallery:p.ga||[],footer:p.ft||'Powered by High Style Cards',
      actions:Array.isArray(p.ac)?p.ac.map(a=>clean({type:a.t,label:a.l,primary:false})):[],designStyle:p.ds,tripadvisorUrl:p.ta,
      animations:p.an?{entrance:p.an.e||'fade-up',buttons:p.an.b||'stagger',accent:p.an.a||'soft-pulse'}:undefined,
      iconSettings:expandIcons(p.ic),saveContactEnabled:p.sc===0?false:undefined
    });
    if(p.bm){const enabled=new Set((card.actions||[]).map(a=>a.type));const hidden=availableTypes(card).filter(type=>!enabled.has(type));card.buttonSettings={managed:true,hidden,saveContact:p.sc!==0};if(p.sc!==0)card.saveContactEnabled=true;}
    brands[slug]=card;window.HIGH_STYLE_SNAPSHOT_ACTIVE=true;
  }catch(e){console.warn('Could not load card snapshot',e)}
})();