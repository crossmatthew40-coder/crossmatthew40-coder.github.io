(() => {
  if(window.__highStyleQualityV4Loaded) return;
  window.__highStyleQualityV4Loaded=true;
  const brands=window.HIGH_STYLE_BRANDS||{};
  const slug=(new URLSearchParams(location.search).get('brand')||'high-style').toLowerCase();
  const brand=brands[slug]; if(!brand) return;

  const icons={
    booking:'<rect class="icon-soft" x="3.4" y="4.4" width="17.2" height="16.2" rx="5"/><path class="icon-stroke" d="M7.2 3.8v3.1M16.8 3.8v3.1M5.3 9.3h13.4"/><path class="icon-stroke" d="M8 13h3M8 16.2h5.7"/><circle class="icon-fill" cx="16.4" cy="15.8" r="1.55"/>',
    phone:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M7.2 5.8h2.5c.45 0 .82.3.92.73l.63 2.75c.1.42-.03.84-.34 1.13L9.5 11.8a13.3 13.3 0 0 0 4.7 4.7l1.39-1.4c.3-.3.72-.43 1.13-.33l2.75.63c.43.1.73.48.73.92v2.48c0 .56-.4 1.04-.96 1.12-.73.1-1.48.15-2.23.15-7.35 0-13.32-5.97-13.32-13.32 0-.75.05-1.5.15-2.23.08-.55.56-.96 1.12-.96H7.2"/>',
    whatsapp:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M19.1 11.7a7.1 7.1 0 0 1-10.45 6.25L5 18.9l.96-3.55A7.1 7.1 0 1 1 19.1 11.7Z"/><path class="icon-stroke" d="M9.25 8.55c.15-.3.31-.31.55-.31h.39c.16 0 .32.01.42.28l.65 1.54c.1.24.08.4-.08.59l-.58.66c-.14.16-.08.33.02.49.45.78 1.12 1.43 1.9 1.87.16.09.33.15.48 0l.73-.8c.17-.18.34-.19.58-.09l1.52.72c.24.11.34.26.34.43 0 .33-.16.87-.55 1.25-.42.4-1.06.67-1.82.51-.95-.2-2.1-.68-3.44-1.86-1.08-.96-1.92-2.2-2.17-3.04-.23-.73 0-1.42.31-1.8Z"/>',
    email:'<rect class="icon-soft" x="2.5" y="4.7" width="19" height="14.6" rx="4.2"/><rect class="icon-stroke" x="3.8" y="5.9" width="16.4" height="12.2" rx="3"/><path class="icon-stroke" d="m5.3 8 6.7 5 6.7-5"/><path class="icon-stroke" d="m5.2 16 4.4-3.5M18.8 16l-4.4-3.5"/>',
    website:'<circle class="icon-soft" cx="12" cy="12" r="10"/><circle class="icon-stroke" cx="12" cy="12" r="8.2"/><path class="icon-stroke" d="M3.8 12h16.4M12 3.8c2.15 2.32 3.25 5.04 3.25 8.2S14.15 17.88 12 20.2C9.85 17.88 8.75 15.16 8.75 12S9.85 6.12 12 3.8Z"/>',
    instagram:'<rect class="icon-soft" x="2.8" y="2.8" width="18.4" height="18.4" rx="6.2"/><rect class="icon-stroke" x="4.1" y="4.1" width="15.8" height="15.8" rx="5.2"/><circle class="icon-stroke" cx="12" cy="12" r="3.75"/><circle class="icon-fill" cx="17.2" cy="6.8" r="1.05"/>',
    linkedin:'<rect class="icon-soft" x="2.7" y="2.7" width="18.6" height="18.6" rx="5.2"/><rect class="icon-stroke" x="4" y="4" width="16" height="16" rx="4.3"/><circle class="icon-fill" cx="7.5" cy="8" r="1.1"/><path class="icon-stroke" d="M7.5 11v5.5M11.2 16.5v-5.3M11.2 13.1c.25-1.35 1.16-2.25 2.55-2.25 1.55 0 2.75 1.07 2.75 3.15v2.5"/>',
    tiktok:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="M14.2 5.2v8.15a4 4 0 1 1-3.4-3.95"/><path class="icon-stroke" d="M14.2 5.2c.82 2.02 2.15 3.28 4.05 3.65"/><circle class="icon-fill" cx="10.1" cy="15.4" r="1.15"/>',
    save:'<rect class="icon-soft" x="3" y="3" width="18" height="18" rx="5.4"/><path class="icon-stroke" d="M12 5.8v8.4M8.8 11l3.2 3.2 3.2-3.2M6.3 17.2h11.4"/>',
    menu:'<rect class="icon-soft" x="3" y="2.8" width="18" height="18.4" rx="5.2"/><path class="icon-stroke" d="M8.2 7.3h7.6M8.2 11.2h7.6M8.2 15.1h4.8"/><circle class="icon-fill" cx="16.8" cy="15.1" r="1.15"/>',
    reviews:'<circle class="icon-soft" cx="12" cy="12" r="10"/><path class="icon-stroke" d="m12 4.8 2.05 4.16 4.59.67-3.32 3.23.78 4.57L12 15.28l-4.1 2.15.78-4.57-3.32-3.23 4.59-.67L12 4.8Z"/><circle class="icon-fill" cx="12" cy="12" r="1.15"/>'
  };
  const labels={booking:'Bookings',phone:'Phone',whatsapp:'WhatsApp',email:'Email',website:'Website',instagram:'Instagram',linkedin:'LinkedIn',tiktok:'TikTok',save:'Contact',menu:'Menu',reviews:'Reviews'};
  const notes={booking:'Open booking or enquiry',phone:'Tap to call',whatsapp:'Start a WhatsApp chat',email:'Compose a new email',website:'Open official website',instagram:'View Instagram profile',linkedin:'View LinkedIn profile',tiktok:'View TikTok profile',save:'Save details to your phone',menu:'View food & drink menu',reviews:'Read reviews on Tripadvisor'};

  function typeFor(a){
    const href=String(a.getAttribute('href')||'');
    if(a.id==='saveContact') return 'save';
    if(a.classList.contains('menu-link')) return 'menu';
    if(a.classList.contains('review-link')) return 'reviews';
    if(brand.bookingUrl&&href===brand.bookingUrl) return 'booking';
    if(href.startsWith('tel:')) return 'phone';
    if(/wa\.me\//i.test(href)) return 'whatsapp';
    if(href.startsWith('mailto:')) return 'email';
    if(brand.instagram&&href===brand.instagram) return 'instagram';
    if(brand.linkedin&&href===brand.linkedin) return 'linkedin';
    if(brand.tiktok&&href===brand.tiktok) return 'tiktok';
    if(brand.website&&href===brand.website) return 'website';
    return 'website';
  }

  function premiumChevron(type){
    if(type==='save') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v10M8.5 11.5 12 15l3.5-3.5M6.5 19h11"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  }

  function specialValue(type){
    if(type==='menu') return brand.menuLabel||'View Menu';
    if(type==='reviews') return 'Read our reviews';
    return '';
  }

  function decorate(a){
    if(a.dataset.qualityV4) return;
    a.dataset.qualityV4='1';
    const type=typeFor(a);
    a.dataset.actionType=type;

    if(type==='menu'||type==='reviews'){
      a.classList.add('action','premium-section-action');
      a.innerHTML='<span class="action-copy"><span class="action-label"></span><span class="action-value"></span><span class="action-note"></span></span><span class="arrow"></span>';
      a.querySelector('.action-label').textContent=labels[type];
      a.querySelector('.action-value').textContent=specialValue(type);
      a.querySelector('.action-note').textContent=notes[type];
    }

    let copy=a.querySelector('.action-copy');
    if(!copy){
      copy=document.createElement('span');copy.className='action-copy';
      const arrowExisting=a.querySelector('.arrow');
      while(a.firstChild&&a.firstChild!==arrowExisting)copy.appendChild(a.firstChild);
      a.insertBefore(copy,arrowExisting);
    }

    const oldMain=a.querySelector('.action-main');
    if(oldMain){
      const existingCopy=oldMain.querySelector('.action-copy');
      if(existingCopy) copy=existingCopy;
      oldMain.remove();
    }

    const wrapper=document.createElement('span');wrapper.className='action-main';
    const icon=document.createElement('span');icon.className='action-icon-wrap';
    icon.innerHTML=`<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[type]||icons.website}</svg>`;
    a.insertBefore(wrapper,a.querySelector('.arrow'));
    wrapper.append(icon,copy);

    let label=copy.querySelector('.action-label');
    if(label) label.textContent=labels[type]||label.textContent||'Link';
    let note=copy.querySelector('.action-note');
    if(!note){note=document.createElement('span');note.className='action-note';copy.appendChild(note);}
    note.textContent=notes[type]||'Open link';

    let arrow=a.querySelector('.arrow');
    if(!arrow){arrow=document.createElement('span');arrow.className='arrow';a.appendChild(arrow);}
    arrow.innerHTML=premiumChevron(type);
  }

  const runtime=document.createElement('style');
  runtime.textContent='.menu-section .menu-link.action,.tripadvisor-reviews .review-link.action{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:15px 15px 15px 16px!important;border-radius:24px!important;background:radial-gradient(circle at 14% 0%,color-mix(in srgb,var(--text) 5%,transparent),transparent 35%),linear-gradient(145deg,var(--hsq-surface-1),var(--hsq-surface-2))!important;color:var(--text)!important;border:1px solid var(--hsq-line)!important;box-shadow:0 16px 38px rgba(0,0,0,.16),0 3px 9px rgba(0,0,0,.10),inset 0 1px 0 color-mix(in srgb,var(--text) 10%,transparent)!important}.menu-section,.tripadvisor-reviews{overflow:visible}.menu-section .action-value,.tripadvisor-reviews .action-value{font-size:clamp(16px,4.5vw,20px)!important}.menu-section .action-note,.tripadvisor-reviews .action-note{font-size:9px!important;letter-spacing:.07em!important}.menu-section .arrow,.tripadvisor-reviews .arrow{font-size:0!important}';
  document.head.appendChild(runtime);

  function decorateAll(){document.querySelectorAll('#actions .action,#saveContact.action,.menu-section .menu-link,.tripadvisor-reviews .review-link').forEach(decorate)}
  decorateAll();
  const target=document.getElementById('app')||document.body;
  new MutationObserver(decorateAll).observe(target,{childList:true,subtree:true});
})();