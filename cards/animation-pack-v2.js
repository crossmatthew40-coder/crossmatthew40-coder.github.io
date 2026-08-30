(() => {
  const style=document.createElement('style');
  style.textContent=`
    body.anim-entrance-blur-in .hero{animation:hsLiveV2Blur .62s cubic-bezier(.2,.7,.2,1) both}
    body.anim-entrance-slide-left .hero{animation:hsLiveV2Left .62s cubic-bezier(.2,.7,.2,1) both}
    body.anim-entrance-slide-right .hero{animation:hsLiveV2Right .62s cubic-bezier(.2,.7,.2,1) both}
    body.anim-entrance-drop-in .hero{animation:hsLiveV2Drop .58s cubic-bezier(.2,.7,.2,1) both}
    body.anim-entrance-reveal .hero{animation:hsLiveV2Reveal .72s cubic-bezier(.16,.8,.24,1) both}
    body.anim-buttons-wave .action{animation:hsLiveV2Wave .5s ease both}body.anim-buttons-wave .action:nth-child(2){animation-delay:.07s}body.anim-buttons-wave .action:nth-child(3){animation-delay:.14s}body.anim-buttons-wave .action:nth-child(4){animation-delay:.21s}body.anim-buttons-wave .action:nth-child(5){animation-delay:.28s}
    body.anim-buttons-breathe .action{animation:hsLiveV2Breathe 4.8s ease-in-out infinite}body.anim-buttons-breathe .action:nth-child(even){animation-delay:-2.4s}
    body.anim-buttons-shimmer .action:before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 25%,color-mix(in srgb,var(--text) 8%,transparent) 48%,transparent 70%);transform:translateX(-130%);animation:hsLiveV2Shimmer 4.8s ease-in-out infinite;pointer-events:none;z-index:0}body.anim-buttons-shimmer .action>*{position:relative;z-index:1}
    body.anim-buttons-lift .action{transition:transform .22s ease,filter .22s ease}body.anim-buttons-lift .action:hover{transform:translateY(-3px);filter:brightness(1.04)}
    body.anim-accent-halo .hero:before{animation:hsLiveV2Halo 4.8s ease-in-out infinite}
    body.anim-accent-sweep .hero:after{animation:hsLiveV2Sweep 7s linear infinite}
    body.anim-accent-orbit .hero:before{animation:hsLiveV2Orbit 7s ease-in-out infinite}
    @keyframes hsLiveV2Blur{from{opacity:0;filter:blur(12px);transform:translateY(8px)}to{opacity:1;filter:blur(0);transform:none}}@keyframes hsLiveV2Left{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@keyframes hsLiveV2Right{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
    @keyframes hsLiveV2Drop{from{opacity:0;transform:translateY(-18px) scale(.985)}to{opacity:1;transform:none}}@keyframes hsLiveV2Reveal{from{opacity:0;clip-path:inset(0 0 100% 0);transform:translateY(12px)}to{opacity:1;clip-path:inset(0 0 0 0);transform:none}}
    @keyframes hsLiveV2Wave{from{opacity:0;transform:translateY(12px) rotateX(-8deg)}to{opacity:1;transform:none}}@keyframes hsLiveV2Breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.008)}}@keyframes hsLiveV2Shimmer{0%,72%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
    @keyframes hsLiveV2Halo{0%,100%{opacity:.5;filter:blur(18px);transform:scale(.92)}50%{opacity:1;filter:blur(24px);transform:scale(1.12)}}@keyframes hsLiveV2Sweep{to{transform:translateX(55%)}}@keyframes hsLiveV2Orbit{0%,100%{transform:translate(-10px,5px) scale(.96)}33%{transform:translate(12px,-6px) scale(1.05)}66%{transform:translate(5px,12px) scale(1)}}
    @media(prefers-reduced-motion:reduce){body .hero,body .action,body .hero:before,body .hero:after,body .action:before{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);
})();