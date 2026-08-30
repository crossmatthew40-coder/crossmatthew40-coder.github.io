(() => {
  if(window.__highStyleLiveIconCustomizerLoaded)return;
  window.__highStyleLiveIconCustomizerLoaded=true;
  const brands=window.HIGH_STYLE_BRANDS||{};
  const slug=(new URLSearchParams(location.search).get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];if(!brand)return;

  const ICONS={
    calendar:'<rect class="icon-soft" x="3.4" y="4.4" width="17.2" height="16.2" rx="5"/><path class="icon-stroke" d="M7.2 3.8v3.1M16.8 3.8v3.1M5.3 9.3h13.4M8 13h3M8 16.2h5.7"/><circle class="icon-fill" cx="16.4" cy="15.8" r="1.55"/>',
    phone:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M7.2 5.8h2.5c.45 0 .82.3.92.73l.63 2.75c.1.42-.03.84-.34 1.13L9.5 11.8a13.3 13.3 0 0 0 4.7 4.7l1.39-1.4c.3-.3.72-.43 1.13-.33l2.75.63c.43.1.73.48.73.92v2.48c0 .56-.4 1.04-.96 1.12-.73.1-1.48.15-2.23.15-7.35 0-13.32-5.97-13.32-13.32 0-.75.05-1.5.15-2.23.08-.55.56-.96 1.12-.96H7.2"/>',
    chat:'<rect class="icon-soft" x="2.7" y="3.1" width="18.6" height="16.2" rx="5.3"/><path class="icon-stroke" d="M5.2 5.6h13.6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4.8 3v-3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"/><path class="icon-stroke" d="M8 10h8M8 13h5"/>',
    mail:'<rect class="icon-soft" x="2.5" y="4.7" width="19" height="14.6" rx="4.2"/><rect class="icon-stroke" x="3.8" y="5.9" width="16.4" height="12.2" rx="3"/><path class="icon-stroke" d="m5.3 8 6.7 5 6.7-5"/>',
    globe:'<circle class="icon-soft" cx="12" cy="12" r="10"/><circle class="icon-stroke" cx="12" cy="12" r="8.2"/><path class="icon-stroke" d="M3.8 12h16.4M12 3.8c2.15 2.32 3.25 5.04 3.25 8.2S14.15 17.88 12 20.2C9.85 17.88 8.75 15.16 8.75 12S9.85 6.12 12 3.8Z"/>',
    camera:'<rect class="icon-soft" x="2.7" y="5.2" width="18.6" height="14.3" rx="4.5"/><path class="icon-stroke" d="M5 7h3l1.4-2h5.2L16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle class="icon-stroke" cx="12" cy="13" r="3.5"/><circle class="icon-fill" cx="18" cy="9.7" r=".9"/>',
    star:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    pin:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle class="icon-fill" cx="12" cy="10" r="1.7"/>',
    heart:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 8 3.5Z"/>',
    menu:'<rect class="icon-soft" x="3" y="2.8" width="18" height="18.4" rx="5.2"/><path class="icon-stroke" d="M8.2 7.3h7.6M8.2 11.2h7.6M8.2 15.1h4.8"/><circle class="icon-fill" cx="16.8" cy="15.1" r="1.15"/>',
    plus:'<rect class="icon-soft" x="3" y="3" width="18" height="18" rx="5.4"/><path class="icon-stroke" d="M12 7v10M7 12h10"/>',
    arrow:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M5 12h14M14 7l5 5-5 5"/>',
    instagram:'<rect class="icon-soft" x="2.8" y="2.8" width="18.4" height="18.4" rx="6.2"/><rect class="icon-stroke" x="4.1" y="4.1" width="15.8" height="15.8" rx="5.2"/><circle class="icon-stroke" cx="12" cy="12" r="3.75"/><circle class="icon-fill" cx="17.2" cy="6.8" r="1.05"/>',
    linkedin:'<rect class="icon-soft" x="2.7" y="2.7" width="18.6" height="18.6" rx="5.2"/><rect class="icon-stroke" x="4" y="4" width="16" height="16" rx="4.3"/><circle class="icon-fill" cx="7.5" cy="8" r="1.1"/><path class="icon-stroke" d="M7.5 11v5.5M11.2 16.5v-5.3M11.2 13.1c.25-1.35 1.16-2.25 2.55-2.25 1.55 0 2.75 1.07 2.75 3.15v2.5"/>',
    tiktok:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M14.2 5.2v8.15a4 4 0 1 1-3.4-3.95M14.2 5.2c.82 2.02 2.15 3.28 4.05 3.65"/><circle class="icon-fill" cx="10.1" cy="15.4" r="1.15"/>'
  };
  const defaults={booking:'calendar',phone:'phone',whatsapp:'chat',email:'mail',website:'globe',instagram:'instagram',linkedin:'linkedin',tiktok:'tiktok',save:'plus'};
  const s=brand.iconSettings||{};
  const settings={enabled:s.enabled!==false,shape:s.shape||'rounded',size:s.size||'medium',stroke:s.stroke||'regular',background:s.background||'panel',border:s.border!==false,color:s.color||'text',icons:s.icons||{}};

  function typeFor(a){const href=String(a.getAttribute('href')||'');if(a.id==='saveContact')return'save';if(brand.bookingUrl&&href===brand.bookingUrl)return'booking';if(href.startsWith('tel:'))return'phone';if(/wa\.me\//i.test(href))return'whatsapp';if(href.startsWith('mailto:'))return'email';if(brand.instagram&&href===brand.instagram)return'instagram';if(brand.linkedin&&href===brand.linkedin)return'linkedin';if(brand.tiktok&&href===brand.tiktok)return'tiktok';if(brand.website&&href===brand.website)return'website';return'website'}
  function stroke(){return settings.stroke==='thin'?'1.3':settings.stroke==='bold'?'2.05':'1.65'}

  function applyOne(a){
    const wrap=a.querySelector('.action-icon-wrap');if(!wrap)return;
    const type=typeFor(a),choice=settings.icons[type]||'auto',key=choice==='auto'?(defaults[type]||'globe'):choice,hidden=!settings.enabled||key==='none';
    wrap.style.display=hidden?'none':'grid';
    const main=a.querySelector('.action-main');if(main)main.style.gap=hidden?'0':'14px';
    if(hidden)return;

    const svg=wrap.querySelector('svg');
    if(svg&&choice!=='auto'){
      const signature=key+'|'+stroke();
      if(wrap.dataset.iconRender!==signature){svg.innerHTML=ICONS[key]||ICONS[defaults[type]]||ICONS.globe;wrap.dataset.iconRender=signature;}
    }
    if(svg){svg.setAttribute('stroke-width',stroke());svg.classList.add('action-icon');}

    const px=settings.size==='small'?44:settings.size==='large'?60:52;
    wrap.style.width=px+'px';wrap.style.height=px+'px';wrap.style.minWidth=px+'px';wrap.style.flexBasis=px+'px';
    wrap.style.borderRadius=settings.shape==='square'?'10px':settings.shape==='soft'?'20px':settings.shape==='circle'?'50%':'17px';
    wrap.style.border=settings.border?'1px solid color-mix(in srgb,var(--text) 14%,var(--border))':'0';
    wrap.style.background=settings.background==='none'?'transparent':settings.background==='accent'?'radial-gradient(circle at 28% 18%,color-mix(in srgb,var(--accent) 28%,transparent),transparent 45%),linear-gradient(145deg,color-mix(in srgb,var(--surface) 72%,var(--accent) 28%),color-mix(in srgb,var(--bg) 70%,var(--surface) 30%))':'radial-gradient(circle at 28% 18%,color-mix(in srgb,var(--text) 12%,transparent),transparent 42%),linear-gradient(145deg,color-mix(in srgb,var(--surface) 66%,var(--bg) 34%),color-mix(in srgb,var(--bg) 72%,var(--surface) 28%))';
    wrap.style.boxShadow=settings.background==='none'?'none':'0 9px 22px rgba(0,0,0,.18),inset 0 1px 0 color-mix(in srgb,var(--text) 13%,transparent),inset 0 -1px 0 rgba(0,0,0,.22)';
    wrap.style.color=settings.color==='accent'?'var(--accent)':settings.color==='muted'?'var(--muted)':'var(--text)';
  }

  function apply(){document.querySelectorAll('#actions .action,#saveContact.action').forEach(applyOne)}
  const actions=document.getElementById('actions');if(actions){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}).observe(actions,{childList:true,subtree:true})}
  setTimeout(apply,90);setTimeout(apply,350);
})();