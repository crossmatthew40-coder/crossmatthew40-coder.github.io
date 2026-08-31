(() => {
  const slug=(new URLSearchParams(location.search).get('brand')||'').toLowerCase();
  if(slug!=='cancello'||window.__cancelloThemeLoaded)return;
  window.__cancelloThemeLoaded=true;
  document.body.classList.add('cancello-card');

  const style=document.createElement('style');
  style.textContent=`
    body.cancello-card{
      --c-ivory:#eee8dc;--c-cream:#f7f1e5;--c-ink:#11100e;--c-gold:#c6a56a;
      background:
        radial-gradient(circle at 12% 12%,rgba(255,255,255,.62),transparent 25%),
        radial-gradient(circle at 82% 18%,rgba(198,165,106,.16),transparent 28%),
        linear-gradient(118deg,transparent 0 24%,rgba(95,86,72,.07) 25%,transparent 27% 58%,rgba(95,86,72,.06) 59%,transparent 62%),
        linear-gradient(152deg,#f4efe5 0%,#e5ded2 38%,#f8f3e9 64%,#ddd5c7 100%)!important;
      background-attachment:fixed!important;
    }
    body.cancello-card .shell{width:min(100%,520px)}
    body.cancello-card .hero{
      background:linear-gradient(155deg,#171512,#0d0c0a)!important;
      border:1px solid #39342b!important;
      box-shadow:0 24px 60px rgba(32,26,18,.25),inset 0 1px 0 rgba(255,255,255,.05)!important;
    }
    body.cancello-card .hero:before{background:radial-gradient(circle at 50% 20%,rgba(198,165,106,.17),transparent 40%)!important}
    body.cancello-card .brand-mark{width:176px!important;height:96px!important;border-radius:18px!important;background:#f5efe3!important;border:1px solid rgba(198,165,106,.55)!important;padding:10px!important;box-shadow:0 16px 34px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.6)!important}
    body.cancello-card .brand-mark img{object-fit:contain!important;width:100%!important;height:100%!important}
    body.cancello-card .hero h1{font-family:"Cormorant Garamond",Georgia,serif!important;font-weight:600!important;letter-spacing:-.035em!important;font-size:clamp(48px,13vw,72px)!important}
    body.cancello-card .eyebrow{color:#c6a56a!important;letter-spacing:.22em!important}
    body.cancello-card .role{font-family:"Cormorant Garamond",Georgia,serif!important;font-size:18px!important;color:#efe4d2!important}
    body.cancello-card .tagline{max-width:380px!important;color:#bfb4a2!important}
    body.cancello-card .location{color:#a99e8d!important}
    body.cancello-card .action,body.cancello-card .action.primary{
      background:linear-gradient(150deg,#191713,#0e0d0b)!important;
      border-color:#3d372d!important;
      color:#f8f3e8!important;
      box-shadow:0 18px 38px rgba(29,24,17,.22),inset 0 1px 0 rgba(255,255,255,.05)!important;
    }
    body.cancello-card .action::before{background:linear-gradient(110deg,transparent 0 40%,rgba(198,165,106,.05) 50%,transparent 62%),radial-gradient(circle at 91% 15%,rgba(198,165,106,.11),transparent 29%)!important}
    body.cancello-card .action-icon-wrap{border-color:#514733!important;background:linear-gradient(150deg,#27231c,#12100d)!important;color:#d8b778!important}
    body.cancello-card .action-main:after{background:linear-gradient(180deg,transparent,rgba(198,165,106,.42),transparent)!important}
    body.cancello-card .action-label{color:#bcae97!important}
    body.cancello-card .action-value{color:#fbf7ef!important}
    body.cancello-card .action-note{color:#918572!important}
    body.cancello-card .arrow{color:#d8b778!important}
    body.cancello-card .section{background:linear-gradient(155deg,rgba(23,21,18,.97),rgba(13,12,10,.98))!important;border:1px solid #39342b!important;color:#f8f3e8!important;box-shadow:0 16px 38px rgba(32,26,18,.18)!important}
    body.cancello-card .section-title{color:#c6a56a!important}
    body.cancello-card .chip{background:#201d18!important;border-color:#41392d!important;color:#eee4d4!important}
    body.cancello-card .social{background:#181611!important;border-color:#3b352b!important;color:#f4ede1!important}
    body.cancello-card .menu-link,body.cancello-card .review-link{background:linear-gradient(150deg,#1b1814,#100f0d)!important;border-color:#40382b!important;color:#f7f0e4!important}
    body.cancello-card .footer{color:#6c6255!important;border-color:rgba(74,64,51,.18)!important}

    .cancello-intro{position:fixed;inset:0;z-index:10000;background:#090806;overflow:hidden;pointer-events:none;perspective:1200px}
    .cancello-intro:before{content:"CANCELLO";position:absolute;left:50%;top:50%;z-index:4;transform:translate(-50%,-50%);font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(34px,9vw,58px);letter-spacing:.22em;color:#e9dcc6;text-indent:.22em;opacity:0;animation:cancelloWord 1.05s .15s ease forwards}
    .cancello-gate{position:absolute;top:0;bottom:0;width:51%;background:linear-gradient(90deg,#080705,#15110d 48%,#090806);transform-origin:center right;will-change:transform;box-shadow:inset 0 0 0 1px #2d261d}
    .cancello-gate.right{right:0;transform-origin:center left;background:linear-gradient(90deg,#090806,#15110d 52%,#080705)}
    .cancello-gate.left{left:0}
    .cancello-iron{position:absolute;inset:6% 7%;border:2px solid #7c694c;border-radius:4px;background:repeating-linear-gradient(90deg,transparent 0 12%,rgba(198,165,106,.5) 12.2% 12.8%,transparent 13% 25%)}
    .cancello-iron:before,.cancello-iron:after{content:"";position:absolute;left:8%;right:8%;height:2px;background:#7c694c}
    .cancello-iron:before{top:29%}.cancello-iron:after{bottom:29%}
    .cancello-ornament{position:absolute;left:50%;top:50%;width:94px;height:94px;border:2px solid #927a55;border-radius:50%;transform:translate(-50%,-50%)}
    .cancello-ornament:before,.cancello-ornament:after{content:"";position:absolute;left:50%;top:50%;width:66px;height:2px;background:#927a55;transform-origin:center}
    .cancello-ornament:before{transform:translate(-50%,-50%) rotate(45deg)}.cancello-ornament:after{transform:translate(-50%,-50%) rotate(-45deg)}
    .cancello-intro.open .left{animation:gateLeft 1.25s .95s cubic-bezier(.16,.82,.2,1) forwards}.cancello-intro.open .right{animation:gateRight 1.25s .95s cubic-bezier(.16,.82,.2,1) forwards}.cancello-intro.open{animation:introHide .01s 2.28s forwards}
    body.cancello-card .shell{opacity:0;transform:translateY(12px) scale(.988)}body.cancello-card.cancello-revealed .shell{animation:cancelloPage .7s 1.22s cubic-bezier(.2,.75,.2,1) forwards}
    body.cancello-card.cancello-revealed .action{opacity:0;transform:translateY(16px)}body.cancello-card.cancello-revealed .action:nth-child(1){animation:cancelloItem .48s 1.52s ease forwards}body.cancello-card.cancello-revealed .action:nth-child(2){animation:cancelloItem .48s 1.62s ease forwards}body.cancello-card.cancello-revealed .action:nth-child(3){animation:cancelloItem .48s 1.72s ease forwards}body.cancello-card.cancello-revealed .action:nth-child(4){animation:cancelloItem .48s 1.82s ease forwards}body.cancello-card.cancello-revealed .action:nth-child(5){animation:cancelloItem .48s 1.92s ease forwards}
    @keyframes gateLeft{to{transform:rotateY(-106deg) translateX(-10%)}}@keyframes gateRight{to{transform:rotateY(106deg) translateX(10%)}}@keyframes cancelloWord{0%{opacity:0;letter-spacing:.32em}45%,70%{opacity:1;letter-spacing:.22em}100%{opacity:0;letter-spacing:.18em}}@keyframes introHide{to{visibility:hidden}}@keyframes cancelloPage{to{opacity:1;transform:none}}@keyframes cancelloItem{to{opacity:1;transform:none}}
    @media(max-width:420px){body.cancello-card .brand-mark{width:154px!important;height:84px!important}.cancello-iron{inset:5% 6%}.cancello-ornament{width:74px;height:74px}}
    @media(prefers-reduced-motion:reduce){.cancello-intro{display:none!important}body.cancello-card .shell,body.cancello-card .action{opacity:1!important;transform:none!important;animation:none!important}}
  `;
  document.head.appendChild(style);

  const intro=document.createElement('div');
  intro.className='cancello-intro';intro.setAttribute('aria-hidden','true');
  intro.innerHTML='<div class="cancello-gate left"><div class="cancello-iron"><div class="cancello-ornament"></div></div></div><div class="cancello-gate right"><div class="cancello-iron"><div class="cancello-ornament"></div></div></div>';
  document.body.prepend(intro);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{intro.classList.add('open');document.body.classList.add('cancello-revealed')}));
  window.addEventListener('pageshow',e=>{if(!e.persisted)return;intro.classList.remove('open');document.body.classList.remove('cancello-revealed');void intro.offsetWidth;requestAnimationFrame(()=>{intro.classList.add('open');document.body.classList.add('cancello-revealed')})});
})();
