(() => {
  if(window.__highStyleLiveIconCustomizerLoaded)return;
  window.__highStyleLiveIconCustomizerLoaded=true;
  const brands=window.HIGH_STYLE_BRANDS||{};
  const slug=(new URLSearchParams(location.search).get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];if(!brand)return;

  const ICONS={
    calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    phone:'<path d="M7.7 4.5h2.5c.5 0 .9.3 1 .8l.6 3c.1.4 0 .8-.3 1.1l-1.6 1.6a14 14 0 0 0 4.6 4.6l1.6-1.6c.3-.3.7-.4 1.1-.3l3 .6c.5.1.8.5.8 1v2.5c0 .6-.4 1-.9 1.1-.8.1-1.7.2-2.5.2C10.2 20.6 3.4 13.8 3.4 5.9c0-.8.1-1.7.2-2.5.1-.5.5-.9 1.1-.9Z"/>',
    chat:'<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 10h8M8 13h5"/>',
    mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m5 7 7 6 7-6"/>',
    globe:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8Z"/>',
    camera:'<path d="M5 7h3l1.4-2h5.2L16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    pin:'<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    heart:'<path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 8 3.5Z"/>',
    menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
    instagram:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>',
    linkedin:'<path d="M6.5 9.5V18M6.5 6.5v.01M10.5 18v-5.1c0-2 1.1-3.4 3-3.4 1.8 0 3 1.2 3 3.4V18"/>',
    tiktok:'<path d="M14 5v8.2a3.8 3.8 0 1 1-3.2-3.8M14 5c.8 2 2.1 3.2 4 3.6"/>'
  };
  const defaults={booking:'calendar',phone:'phone',whatsapp:'chat',email:'mail',website:'globe',instagram:'instagram',linkedin:'linkedin',tiktok:'tiktok',save:'plus'};
  const s=brand.iconSettings||{};
  const settings={enabled:s.enabled!==false,shape:s.shape||'rounded',size:s.size||'medium',stroke:s.stroke||'regular',background:s.background||'panel',border:s.border!==false,color:s.color||'text',icons:s.icons||{}};

  function typeFor(a){const href=String(a.getAttribute('href')||'');if(a.id==='saveContact')return'save';if(brand.bookingUrl&&href===brand.bookingUrl)return'booking';if(href.startsWith('tel:'))return'phone';if(/wa\.me\//i.test(href))return'whatsapp';if(href.startsWith('mailto:'))return'email';if(brand.instagram&&href===brand.instagram)return'instagram';if(brand.linkedin&&href===brand.linkedin)return'linkedin';if(brand.tiktok&&href===brand.tiktok)return'tiktok';if(brand.website&&href===brand.website)return'website';return'website'}
  function stroke(){return settings.stroke==='thin'?'1.25':settings.stroke==='bold'?'2.25':'1.7'}
  function applyOne(a){
    const wrap=a.querySelector('.action-icon-wrap');if(!wrap)return;
    const type=typeFor(a),choice=settings.icons[type]||'auto',key=choice==='auto'?(defaults[type]||'globe'):choice;
    const hidden=!settings.enabled||key==='none';wrap.style.display=hidden?'none':'grid';
    const main=a.querySelector('.action-main');if(main)main.style.gap=hidden?'0':'13px';
    if(hidden)return;
    const svg=wrap.querySelector('svg');if(svg){svg.innerHTML=ICONS[key]||ICONS[defaults[type]]||ICONS.globe;svg.setAttribute('stroke-width',stroke())}
    const px=settings.size==='small'?36:settings.size==='large'?50:43;wrap.style.width=px+'px';wrap.style.height=px+'px';
    wrap.style.borderRadius=settings.shape==='square'?'6px':settings.shape==='soft'?'17px':settings.shape==='circle'?'50%':'13px';
    wrap.style.border=settings.border?'1px solid color-mix(in srgb,var(--text) 11%,var(--border))':'0';
    wrap.style.background=settings.background==='none'?'transparent':settings.background==='accent'?'color-mix(in srgb,var(--accent) 18%,var(--surface))':'color-mix(in srgb,var(--bg) 60%,var(--surface) 40%)';
    wrap.style.color=settings.color==='accent'?'var(--accent)':settings.color==='muted'?'var(--muted)':'var(--text)';
  }
  function apply(){document.querySelectorAll('#actions .action,#saveContact.action').forEach(applyOne)}
  const actions=document.getElementById('actions');if(actions)new MutationObserver(()=>requestAnimationFrame(apply)).observe(actions,{childList:true,subtree:true});
  setTimeout(apply,90);setTimeout(apply,350);
})();