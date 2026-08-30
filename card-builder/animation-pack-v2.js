(() => {
  if (window.__highStyleAnimationPackV2) return;
  window.__highStyleAnimationPackV2 = true;
  const entrance=document.getElementById('animationEntrance');
  const buttons=document.getElementById('animationButtons');
  const accent=document.getElementById('animationAccent');
  if(!entrance||!buttons||!accent) return;

  const add=(select,value,label)=>{if([...select.options].some(o=>o.value===value))return;const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o)};
  add(entrance,'blur-in','Blur reveal');
  add(entrance,'slide-left','Slide from left');
  add(entrance,'slide-right','Slide from right');
  add(entrance,'drop-in','Soft drop in');
  add(entrance,'reveal','Luxury reveal');
  add(buttons,'wave','Wave in');
  add(buttons,'breathe','Gentle breathe');
  add(buttons,'shimmer','Soft shimmer');
  add(buttons,'lift','Hover lift');
  add(accent,'halo','Halo breathe');
  add(accent,'sweep','Slow light sweep');
  add(accent,'orbit','Soft orbit');

  const style=document.createElement('style');
  style.textContent=`
    .card-preview.anim-entrance-blur-in.anim-replay .preview-brand{animation:hsV2Blur .62s cubic-bezier(.2,.7,.2,1) both}
    .card-preview.anim-entrance-slide-left.anim-replay .preview-brand{animation:hsV2Left .62s cubic-bezier(.2,.7,.2,1) both}
    .card-preview.anim-entrance-slide-right.anim-replay .preview-brand{animation:hsV2Right .62s cubic-bezier(.2,.7,.2,1) both}
    .card-preview.anim-entrance-drop-in.anim-replay .preview-brand{animation:hsV2Drop .58s cubic-bezier(.2,.7,.2,1) both}
    .card-preview.anim-entrance-reveal.anim-replay .preview-brand{animation:hsV2Reveal .72s cubic-bezier(.16,.8,.24,1) both}
    .card-preview.anim-buttons-wave.anim-replay .preview-btn{animation:hsV2Wave .5s ease both}.card-preview.anim-buttons-wave.anim-replay .preview-btn:nth-child(2){animation-delay:.07s}.card-preview.anim-buttons-wave.anim-replay .preview-btn:nth-child(3){animation-delay:.14s}.card-preview.anim-buttons-wave.anim-replay .preview-btn:nth-child(4){animation-delay:.21s}.card-preview.anim-buttons-wave.anim-replay .preview-btn:nth-child(5){animation-delay:.28s}
    .card-preview.anim-buttons-breathe .preview-btn{animation:hsV2Breathe 4.8s ease-in-out infinite}.card-preview.anim-buttons-breathe .preview-btn:nth-child(even){animation-delay:-2.4s}
    .card-preview.anim-buttons-shimmer .preview-btn:after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.08) 48%,transparent 70%);transform:translateX(-130%);animation:hsV2Shimmer 4.8s ease-in-out infinite;pointer-events:none}
    .card-preview.anim-buttons-lift .preview-btn{transition:transform .22s ease,filter .22s ease}.card-preview.anim-buttons-lift .preview-btn:hover{transform:translateY(-3px);filter:brightness(1.04)}
    .card-preview.anim-accent-halo .preview-brand:before{animation:hsV2Halo 4.8s ease-in-out infinite}
    .card-preview.anim-accent-sweep .preview-brand:after{content:'';position:absolute;inset:-40% -80%;background:linear-gradient(110deg,transparent 42%,color-mix(in srgb,var(--accent,#fff) 14%,transparent) 50%,transparent 58%);animation:hsV2Sweep 7s linear infinite;pointer-events:none}
    .card-preview.anim-accent-orbit .preview-brand:before{animation:hsV2Orbit 7s ease-in-out infinite}
    @keyframes hsV2Blur{from{opacity:0;filter:blur(12px);transform:translateY(8px)}to{opacity:1;filter:blur(0);transform:none}}
    @keyframes hsV2Left{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@keyframes hsV2Right{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
    @keyframes hsV2Drop{from{opacity:0;transform:translateY(-18px) scale(.985)}to{opacity:1;transform:none}}@keyframes hsV2Reveal{from{opacity:0;clip-path:inset(0 0 100% 0);transform:translateY(12px)}to{opacity:1;clip-path:inset(0 0 0 0);transform:none}}
    @keyframes hsV2Wave{from{opacity:0;transform:translateY(12px) rotateX(-8deg)}to{opacity:1;transform:none}}@keyframes hsV2Breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.008)}}@keyframes hsV2Shimmer{0%,72%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
    @keyframes hsV2Halo{0%,100%{opacity:.5;filter:blur(18px);transform:scale(.92)}50%{opacity:1;filter:blur(24px);transform:scale(1.12)}}@keyframes hsV2Sweep{to{transform:translateX(55%)}}@keyframes hsV2Orbit{0%,100%{transform:translate(-10px,5px) scale(.96)}33%{transform:translate(12px,-6px) scale(1.05)}66%{transform:translate(5px,12px) scale(1)}}
    @media(prefers-reduced-motion:reduce){.card-preview .preview-brand,.card-preview .preview-btn,.card-preview .preview-brand:before,.card-preview .preview-brand:after,.card-preview .preview-btn:after{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);
})();