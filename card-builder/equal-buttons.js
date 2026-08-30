(() => {
  if(window.__highStyleEqualButtonsLoaded)return;
  window.__highStyleEqualButtonsLoaded=true;
  if(typeof getConfig!=='function'||typeof updatePreview!=='function')return;
  const baseGetConfig=getConfig,baseUpdatePreview=updatePreview;
  getConfig=function(){const c=baseGetConfig();if(Array.isArray(c.actions))c.actions=c.actions.map(a=>({...a,primary:false}));return c};
  updatePreview=function(c){
    if(Array.isArray(c.actions))c={...c,actions:c.actions.map(a=>({...a,primary:false}))};
    baseUpdatePreview(c);
    document.querySelectorAll('#previewButtons .preview-btn.primary').forEach(el=>el.classList.remove('primary'));
  };
  const style=document.createElement('style');
  style.textContent=`
    #previewButtons .preview-btn,#previewButtons .preview-btn.primary{background:linear-gradient(145deg,color-mix(in srgb,var(--surface,#111) 90%,var(--accent,#fff) 10%),var(--surface,#111))!important;color:var(--text,#fff)!important;border-color:color-mix(in srgb,var(--text,#fff) 10%,var(--border,#333))!important;box-shadow:0 10px 24px rgba(0,0,0,.13),inset 0 1px 0 color-mix(in srgb,var(--text,#fff) 9%,transparent)!important}
    .card-preview.anim-buttons-glow .preview-btn{animation:hsEqualGlow 2.8s ease-in-out infinite}.card-preview.anim-buttons-glow .preview-btn:nth-child(even){animation-delay:-1.4s}@keyframes hsEqualGlow{0%,100%{filter:none}50%{filter:brightness(1.05);box-shadow:0 14px 30px color-mix(in srgb,var(--accent,#fff) 14%,transparent)}}
  `;document.head.appendChild(style);
  const select=document.getElementById('animationButtons');if(select){const opt=[...select.options].find(o=>o.value==='glow');if(opt)opt.textContent='Soft button glow';}
  try{update()}catch(e){}
})();