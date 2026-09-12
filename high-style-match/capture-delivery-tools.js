(function(){
  'use strict';
  function load(src,key){
    if(document.querySelector(`script[data-${key}]`))return;
    const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'true');document.head.appendChild(s);
  }
  function boot(){
    load('./functional-runtime.js?v=20260912-1','hsm-functional-runtime');
    load('./site-compliance.js?v=20260912-1','hsm-compliance');
    document.querySelectorAll('.hsm-c1-tools,[data-nav="live"]').forEach(el=>el.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
