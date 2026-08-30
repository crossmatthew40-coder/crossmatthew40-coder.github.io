(function(){
  const brands=window.HIGH_STYLE_BRANDS||{};
  const params=new URLSearchParams(window.location.search);
  const slug=(params.get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];
  const $=(id)=>document.getElementById(id);

  if(!brand){
    $('app').innerHTML='<div class="error"><strong>Card not found.</strong><br>Check the brand name in the link, or add the brand to <code>cards/brands.js</code>.</div>';
    return;
  }

  const theme=brand.theme||{};
  const root=document.documentElement;
  const vars={background:'--bg',surface:'--surface',text:'--text',muted:'--muted',accent:'--accent',accentText:'--accent-text',border:'--border'};
  Object.keys(vars).forEach(k=>{if(theme[k])root.style.setProperty(vars[k],theme[k])});

  document.title=(brand.businessName||'Digital Business Card')+' | Digital Card';
  $('eyebrow').textContent=brand.eyebrow||'Digital business card';
  $('name').textContent=brand.displayName||brand.businessName||'';
  $('tagline').textContent=brand.tagline||'';
  $('tagline').classList.toggle('hidden',!brand.tagline);
  $('person').textContent=brand.personName||'';
  $('person').classList.toggle('hidden',!brand.personName);
  $('role').textContent=brand.role||'';
  $('role').classList.toggle('hidden',!brand.role);
  $('location').textContent=brand.location||'';
  $('location').classList.toggle('hidden',!brand.location);
  $('footer').textContent=brand.footer||'Powered by High Style Cards';

  const mark=$('brandMark');
  if(brand.logo){
    const img=document.createElement('img');
    img.src=brand.logo;img.alt=(brand.businessName||'Brand')+' logo';
    img.onerror=()=>{mark.textContent=brand.initials||'•'};
    mark.appendChild(img);
  }else{mark.textContent=brand.initials||((brand.businessName||'B').match(/\b\w/g)||['B']).slice(0,2).join('').toUpperCase())}

  const actions=$('actions');
  function addAction(label,value,href,primary,kind){
    if(!href)return;
    const a=document.createElement('a');
    a.className='action'+(primary?' primary':'')+(kind?' '+kind:'');
    a.href=href;
    if(/^https?:/i.test(href)){a.target='_blank';a.rel='noopener'}
    a.innerHTML='<span class="action-copy"><span class="action-label"></span><span class="action-value"></span></span><span class="arrow">→</span>';
    a.querySelector('.action-label').textContent=label;
    a.querySelector('.action-value').textContent=value;
    actions.appendChild(a);
  }

  addAction('Enquiries',brand.bookingLabel||'Make an Enquiry',brand.bookingUrl,true);
  addAction('Phone',brand.phoneDisplay||brand.phone,brand.phone?'tel:'+brand.phone:'',false);
  addAction('WhatsApp','Message on WhatsApp',brand.whatsapp?'https://wa.me/'+brand.whatsapp.replace(/\D/g,''):'',false);
  addAction('Email',brand.email,brand.email?'mailto:'+brand.email:'',false);
  addAction('Website','Visit Website',brand.website,false);

  // Wallet buttons are only shown when a real pass URL has been supplied for this customer.
  addAction('Apple Wallet','Add to Apple Wallet',brand.appleWalletUrl,false,'wallet-action apple-wallet');
  addAction('Google Wallet','Add to Google Wallet',brand.googleWalletUrl,false,'wallet-action google-wallet');

  const save=$('saveContact');
  if(brand.phone||brand.email||brand.website){
    save.classList.remove('hidden');
    save.addEventListener('click',function(e){
      e.preventDefault();
      const lines=['BEGIN:VCARD','VERSION:3.0','FN:'+esc(brand.personName||brand.businessName||'Contact'),'ORG:'+esc(brand.businessName||''),'TITLE:'+esc(brand.role||'')];
      if(brand.phone)lines.push('TEL;TYPE=CELL:'+brand.phone);
      if(brand.email)lines.push('EMAIL:'+brand.email);
      if(brand.website)lines.push('URL:'+brand.website);
      lines.push('END:VCARD');
      const blob=new Blob([lines.join('\r\n')],{type:'text/vcard'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=((brand.businessName||'contact').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'contact')+'.vcf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
  }

  const socials=$('socials');
  [['Instagram',brand.instagram,brand.instagramLabel||'Instagram'],['LinkedIn',brand.linkedin,'LinkedIn'],['TikTok',brand.tiktok,'TikTok']].forEach(([name,url,label])=>{
    if(!url)return;
    const a=document.createElement('a');
    a.className='social';
    a.href=url;
    a.target='_blank';
    a.rel='noopener';
    a.textContent=label||name;
    socials.appendChild(a)
  });
  $('socialSection').classList.toggle('hidden',!socials.children.length);

  const services=$('services');
  (brand.services||[]).forEach(s=>{
    const el=document.createElement('span');
    el.className='chip';
    el.textContent=s;
    services.appendChild(el)
  });
  $('servicesSection').classList.toggle('hidden',!services.children.length);

  $('review').textContent=brand.review||'';
  $('reviewSection').classList.toggle('hidden',!brand.review);

  const gallery=$('gallery');
  (brand.gallery||[]).forEach(src=>{
    const img=document.createElement('img');
    img.src=src;
    img.alt='';
    img.loading='lazy';
    gallery.appendChild(img)
  });
  $('gallerySection').classList.toggle('hidden',!gallery.children.length);

  function esc(v){return String(v||'').replace(/\n/g,' ').replace(/,/g,'\\,').replace(/;/g,'\\;')}
})();
