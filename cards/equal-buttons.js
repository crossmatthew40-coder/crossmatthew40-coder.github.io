(() => {
  document.querySelectorAll('#actions .action.primary').forEach(el=>el.classList.remove('primary'));
  const style=document.createElement('style');
  style.textContent=`
    #actions .action,#actions .action.primary{background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 92%,var(--accent) 8%),color-mix(in srgb,var(--surface) 98%,var(--bg) 2%))!important;color:var(--text)!important;border-color:color-mix(in srgb,var(--text) 10%,var(--border))!important;box-shadow:var(--premium-soft-shadow,0 12px 34px rgba(0,0,0,.14)),inset 0 1px 0 color-mix(in srgb,var(--text) 9%,transparent)!important}
    body.anim-buttons-glow .action{animation:hsEqualLiveGlow 2.8s ease-in-out infinite}body.anim-buttons-glow .action:nth-child(even){animation-delay:-1.4s}@keyframes hsEqualLiveGlow{0%,100%{filter:none}50%{filter:brightness(1.05);box-shadow:0 16px 34px color-mix(in srgb,var(--accent) 14%,transparent)}}
  `;document.head.appendChild(style);
})();