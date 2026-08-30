(() => {
  if(window.__highStyleQualitySafeLoaded) return;
  window.__highStyleQualitySafeLoaded=true;
  const brands=window.HIGH_STYLE_BRANDS||{};
  const slug=(new URLSearchParams(location.search).get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];
  if(!brand) return;

  const icons={
    booking:'<path d="M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><path d="M12 8v8M8 12h8"/>',
    phone:'<path d="M7.7 4.5h2.5c.5 0 .9.3 1 .8l.6 3c.1.4 0 .8-.3 1.1l-1.6 1.6a14 14 0 0 0 4.6 4.6l1.6-1.6c.3-.3.7-.4 1.1-.3l3 .6c.5.1.8.5.8 1v2.5c0 .6-.4 1-.9 1.1-.8.1-1.7.2-2.5.2C10.2 20.6 3.4 13.8 3.4 5.9c0-.8.1-1.7.2-2.5.1-.5.5-.9 1.1-.9Z"/>',
    whatsapp:'<path d="M20 11.6a8 8 0 0 1-11.8 7l-4.2 1.1 1.1-4.1A8 8 0 1 1 20 11.6Z"/>',
    email:'<path d="M4 6h16v12H4z"/><path d="m5 7 7 6 7-6"/>',
    website:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8Z"/>',
    instagram:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>',
    linkedin:'<path d="M6.5 9.5V18M6.5 6.5v.01M10.5 18v-5.1c0-2 1.1-3.4 3-3.4 1.8 0 3 1.2 3 3.4V18"/>',
    tiktok:'<path d="M14 5v8.2a3.8 3.8 0 1 1-3.2-3.8M14 5c.8 2 2.1 3.2 4 3.6"/>',
    save:'<path d="M12 4v10M8 10l4 4 4-4"/><path d="M5 17v2h14v-2"/>'
  };
  const notes={booking:'Open booking or enquiry',phone:'Tap to call',whatsapp:'Start a WhatsApp chat',email:'Send an email',website:'Open website',instagram:'View Instagram',linkedin:'View LinkedIn',tiktok:'View TikTok',save:'Save details to phone'};
  function typeFor(a){
    const href=String(a.getAttribute('href')||'');
    if(a.id==='saveContact') return 'save';
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
  function classify(a){
    const value=a.querySelector('.action-value');
    if(!value) return;
    const len=(value.textContent||'').trim().length;
    a.classList.remove('text-medium','text-long','text-xlong');
    if(len>34) a.classList.add('text-xlong');
    else if(len>24) a.classList.add('text-long');
    else if(len>17) a.classList.add('text-medium');
  }
  function decorate(a){
    if(!a) return;
    if(a.dataset.qualitySafe!=='1'){
      const type=typeFor(a);
      let copy=a.querySelector('.action-copy');
      if(!copy) return;
      const main=document.createElement('span');main.className='action-main';
      const icon=document.createElement('span');icon.className='action-icon-wrap';
      icon.innerHTML=`<svg class="action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[type]||icons.website}</svg>`;
      const note=document.createElement('span');note.className='action-note';note.textContent=notes[type]||'Open link';
      if(!copy.querySelector('.action-note')) copy.appendChild(note);
      a.insertBefore(main,copy);main.append(icon,copy);
      a.dataset.qualitySafe='1';
    }
    classify(a);
  }
  function enhance(){
    document.querySelectorAll('#actions .action,#saveContact.action').forEach(decorate);
    const app=document.getElementById('app');if(app){app.style.opacity='1';app.style.visibility='visible';}
  }
  const actions=document.getElementById('actions');
  if(actions){
    let queued=false;
    const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});};
    new MutationObserver(queue).observe(actions,{childList:true,subtree:true,characterData:true});
  }
  setTimeout(enhance,60);setTimeout(enhance,300);
})();