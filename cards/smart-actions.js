(() => {
  const brands=window.HIGH_STYLE_BRANDS||{};
  const params=new URLSearchParams(window.location.search);
  const slug=(params.get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];
  if(!brand) return;

  const adaptive=document.createElement('style');
  adaptive.textContent=`
    body.smart-style-luxury .hero h1{font-family:Georgia,"Times New Roman",serif;font-weight:600;letter-spacing:-.035em}
    body.smart-style-luxury .action{border-radius:12px}
    body.smart-style-luxury .brand-mark{border-radius:50%}
    body.smart-style-bold .hero h1{font-weight:950;letter-spacing:-.065em;text-transform:uppercase}
    body.smart-style-bold .action{border-radius:12px;border-width:2px}
    body.smart-style-bold .brand-mark{border-radius:13px}
    body.smart-style-soft .action{border-radius:28px}
    body.smart-style-soft .brand-mark{border-radius:50%}
    body.smart-style-soft .chip,body.smart-style-soft .social{border-radius:22px}
    body.smart-style-clean .action{border-radius:20px}
  `;
  document.head.appendChild(adaptive);
  document.body.classList.add('smart-style-'+(brand.designStyle||'clean'));

  if(!Array.isArray(brand.actions)||!brand.actions.length) return;
  const actions=document.getElementById('actions');
  if(!actions) return;
  actions.innerHTML='';

  function hrefFor(type){
    if(type==='booking') return brand.bookingUrl||'';
    if(type==='phone') return brand.phone?'tel:'+brand.phone:'';
    if(type==='whatsapp') return brand.whatsapp?'https://wa.me/'+brand.whatsapp.replace(/\D/g,''):'';
    if(type==='email') return brand.email?'mailto:'+brand.email:'';
    if(type==='website') return brand.website||'';
    if(type==='instagram') return brand.instagram||'';
    if(type==='linkedin') return brand.linkedin||'';
    if(type==='tiktok') return brand.tiktok||'';
    return '';
  }
  function valueFor(a){
    if(a.label) return a.label;
    if(a.type==='booking') return brand.bookingLabel||'Make an Enquiry';
    if(a.type==='phone') return brand.phoneDisplay||brand.phone||'Call';
    if(a.type==='whatsapp') return 'WhatsApp';
    if(a.type==='email') return 'Email';
    if(a.type==='website') return 'Visit Website';
    if(a.type==='instagram') return brand.instagramLabel||'Instagram';
    if(a.type==='linkedin') return 'LinkedIn';
    if(a.type==='tiktok') return 'TikTok';
    return a.type;
  }
  function labelFor(type){
    const map={booking:'Recommended',phone:'Phone',whatsapp:'Message',email:'Email',website:'Website',instagram:'Instagram',linkedin:'LinkedIn',tiktok:'TikTok'};
    return map[type]||'Link';
  }

  brand.actions.forEach(a=>{
    const href=hrefFor(a.type);
    if(!href) return;
    const el=document.createElement('a');
    el.className='action'+(a.primary?' primary':'');
    el.href=href;
    if(/^https?:/i.test(href)){el.target='_blank';el.rel='noopener'}
    el.innerHTML='<span class="action-copy"><span class="action-label"></span><span class="action-value"></span></span><span class="arrow">→</span>';
    el.querySelector('.action-label').textContent=labelFor(a.type);
    el.querySelector('.action-value').textContent=valueFor(a);
    actions.appendChild(el);
  });
})();