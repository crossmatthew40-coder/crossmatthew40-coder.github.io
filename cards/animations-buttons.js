(() => {
  const brands=window.HIGH_STYLE_BRANDS||{};
  const params=new URLSearchParams(location.search);
  const slug=(params.get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];
  if(!brand) return;

  const settings=brand.buttonSettings||{};
  const hidden=new Set(Array.isArray(settings.hidden)?settings.hidden:[]);
  const animations=brand.animations||{};

  function isMatch(a,type){
    const href=String(a.getAttribute('href')||'');
    if(type==='booking') return !!brand.bookingUrl && href===brand.bookingUrl;
    if(type==='phone') return href.startsWith('tel:');
    if(type==='whatsapp') return /wa\.me\//i.test(href);
    if(type==='email') return href.startsWith('mailto:');
    if(type==='website') return !!brand.website && href===brand.website;
    if(type==='instagram') return !!brand.instagram && href===brand.instagram;
    if(type==='linkedin') return !!brand.linkedin && href===brand.linkedin;
    if(type==='tiktok') return !!brand.tiktok && href===brand.tiktok;
    return false;
  }

  hidden.forEach(type=>{
    document.querySelectorAll('#actions .action,#socials .social').forEach(a=>{if(isMatch(a,type))a.remove()});
  });

  const socialSection=document.getElementById('socialSection');
  const socials=document.getElementById('socials');
  if(socialSection&&socials&&!socials.children.length) socialSection.classList.add('hidden');

  const save=document.getElementById('saveContact');
  if(save&&(brand.saveContactEnabled===false||settings.saveContact===false)) save.classList.add('hidden');

  const style=document.createElement('style');
  style.textContent=`
    body.anim-entrance-fade-up .hero{animation:hsLiveFadeUp .58s cubic-bezier(.2,.7,.2,1) both}
    body.anim-entrance-slide-up .hero{animation:hsLiveSlideUp .62s cubic-bezier(.2,.7,.2,1) both}
    body.anim-entrance-scale-in .hero{animation:hsLiveScaleIn .52s cubic-bezier(.2,.7,.2,1) both}
    body.anim-buttons-stagger .action{animation:hsLiveFadeUp .44s ease both}
    body.anim-buttons-stagger .action:nth-child(2){animation-delay:.06s}body.anim-buttons-stagger .action:nth-child(3){animation-delay:.12s}body.anim-buttons-stagger .action:nth-child(4){animation-delay:.18s}body.anim-buttons-stagger .action:nth-child(5){animation-delay:.24s}body.anim-buttons-stagger .action:nth-child(6){animation-delay:.30s}
    body.anim-buttons-float .action{animation:hsLiveFloat 4.5s ease-in-out infinite}body.anim-buttons-float .action:nth-child(even){animation-delay:-2.2s}
    body.anim-buttons-glow .action.primary{animation:hsLiveButtonGlow 2.8s ease-in-out infinite}
    body.anim-accent-soft-pulse .hero:before{animation:hsLiveAccentPulse 4s ease-in-out infinite}
    body.anim-accent-drift .hero:before{animation:hsLiveAccentDrift 6s ease-in-out infinite alternate}
    @keyframes hsLiveFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes hsLiveSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
    @keyframes hsLiveScaleIn{from{opacity:0;transform:scale(.965)}to{opacity:1;transform:scale(1)}}
    @keyframes hsLiveFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes hsLiveButtonGlow{0%,100%{filter:none}50%{filter:brightness(1.08);box-shadow:0 18px 42px color-mix(in srgb,var(--accent) 30%,transparent)}}
    @keyframes hsLiveAccentPulse{0%,100%{opacity:.62;transform:scale(.94)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes hsLiveAccentDrift{from{transform:translate(-12px,6px) scale(.95)}to{transform:translate(15px,-9px) scale(1.08)}}
    @media(prefers-reduced-motion:reduce){body .hero,body .action,body .hero:before{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const e=animations.entrance||'fade-up';
  const b=animations.buttons||'stagger';
  const a=animations.accent||'soft-pulse';
  if(e!=='none')document.body.classList.add('anim-entrance-'+e);
  if(b!=='none')document.body.classList.add('anim-buttons-'+b);
  if(a!=='none')document.body.classList.add('anim-accent-'+a);
})();