(() => {
  if (window.__highStylePremiumMotionV8) return;
  window.__highStylePremiumMotionV8 = true;

  const brands = window.HIGH_STYLE_BRANDS || {};
  const slug = (new URLSearchParams(location.search).get('brand') || 'high-style').toLowerCase();
  const brand = brands[slug];
  if (!brand) return;

  const motion = brand.animations || {};
  const enabled = motion.entrance !== 'none' || motion.buttons !== 'none' || motion.accent !== 'none';
  if (!enabled) return;

  const style = document.createElement('style');
  style.textContent = `
    body.hs-premium-motion .brand-mark{animation:hsV8Logo .72s .12s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion .hero h1{animation:hsV8Copy .62s .20s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion .hero .role,body.hs-premium-motion .hero .tagline,body.hs-premium-motion .hero .location{animation:hsV8Copy .58s .28s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion #actions .action .action-icon-wrap,body.hs-premium-motion #saveContact .action-icon-wrap{animation:hsV8Icon .48s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion #actions .action .action-copy,body.hs-premium-motion #saveContact .action-copy{animation:hsV8Copy .48s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion #actions .action .arrow,body.hs-premium-motion #saveContact .arrow{animation:hsV8Arrow .46s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion #actions .action:nth-child(1) .action-icon-wrap,body.hs-premium-motion #actions .action:nth-child(1) .action-copy,body.hs-premium-motion #actions .action:nth-child(1) .arrow{animation-delay:.28s}
    body.hs-premium-motion #actions .action:nth-child(2) .action-icon-wrap,body.hs-premium-motion #actions .action:nth-child(2) .action-copy,body.hs-premium-motion #actions .action:nth-child(2) .arrow{animation-delay:.36s}
    body.hs-premium-motion #actions .action:nth-child(3) .action-icon-wrap,body.hs-premium-motion #actions .action:nth-child(3) .action-copy,body.hs-premium-motion #actions .action:nth-child(3) .arrow{animation-delay:.44s}
    body.hs-premium-motion #actions .action:nth-child(4) .action-icon-wrap,body.hs-premium-motion #actions .action:nth-child(4) .action-copy,body.hs-premium-motion #actions .action:nth-child(4) .arrow{animation-delay:.52s}
    body.hs-premium-motion #actions .action:nth-child(5) .action-icon-wrap,body.hs-premium-motion #actions .action:nth-child(5) .action-copy,body.hs-premium-motion #actions .action:nth-child(5) .arrow{animation-delay:.60s}
    body.hs-premium-motion #actions .action:nth-child(6) .action-icon-wrap,body.hs-premium-motion #actions .action:nth-child(6) .action-copy,body.hs-premium-motion #actions .action:nth-child(6) .arrow{animation-delay:.68s}
    body.hs-premium-motion .section,body.hs-premium-motion #saveContact,body.hs-premium-motion .footer{animation:hsV8Section .58s .68s cubic-bezier(.16,.8,.24,1) both}
    body.hs-premium-motion .section:nth-of-type(2){animation-delay:.74s}body.hs-premium-motion .section:nth-of-type(3){animation-delay:.80s}body.hs-premium-motion .section:nth-of-type(4){animation-delay:.86s}body.hs-premium-motion .section:nth-of-type(5){animation-delay:.92s}
    body.hs-premium-motion .action:hover .action-icon-wrap{transform:translateY(-1px) scale(1.035);transition:transform .22s cubic-bezier(.2,.75,.25,1)}
    body.hs-premium-motion .action:hover .arrow{transform:translateX(2px);transition:transform .22s cubic-bezier(.2,.75,.25,1)}
    @keyframes hsV8Logo{from{opacity:0;transform:translateY(10px) scale(.91);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
    @keyframes hsV8Copy{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes hsV8Icon{from{opacity:0;transform:translateX(-8px) scale(.9)}to{opacity:1;transform:none}}
    @keyframes hsV8Arrow{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:none}}
    @keyframes hsV8Section{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){body.hs-premium-motion *,body.hs-premium-motion *:before,body.hs-premium-motion *:after{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  function run(){
    document.body.classList.remove('hs-premium-motion');
    void document.body.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('hs-premium-motion')));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(run, 90), {once:true});
  else setTimeout(run, 90);
  window.addEventListener('pageshow', e => { if (e.persisted) setTimeout(run, 60); });
})();
