(() => {
  const editor = document.querySelector('.editor-panel');
  if (!editor || document.getElementById('websiteScanner')) return;

  const style = document.createElement('style');
  style.textContent = `
    .scan-card{border:1px solid #262626;border-radius:22px;background:linear-gradient(145deg,#111,#0b0b0b);padding:20px;margin-bottom:26px;box-shadow:0 18px 55px rgba(0,0,0,.18)}
    .scan-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:14px}.scan-head h2{margin:3px 0 5px;font-size:22px}.scan-head p{margin:0;color:#888;font-size:13px;line-height:1.45;max-width:560px}.scan-badge{font-size:10px;letter-spacing:.14em;text-transform:uppercase;border:1px solid #333;border-radius:999px;padding:7px 9px;color:#bbb;white-space:nowrap}
    .scan-input-row{display:grid;grid-template-columns:1fr auto;gap:10px}.scan-input-row input{min-width:0}.scan-button{border:0;border-radius:13px;background:#fff;color:#050505;font-weight:800;padding:0 18px;cursor:pointer;min-height:48px}.scan-button:disabled{opacity:.55;cursor:wait}
    .scan-progress{display:none;margin-top:12px;border:1px solid #242424;background:#090909;border-radius:14px;padding:12px 14px;color:#aaa;font-size:12px}.scan-progress.show{display:block}.scan-progress strong{color:#fff}
    .scan-results{display:none;margin-top:16px}.scan-results.show{display:block}.scan-rec-title{font-size:11px;color:#777;letter-spacing:.14em;text-transform:uppercase;margin:16px 0 9px}.scan-recommended{display:flex;flex-wrap:wrap;gap:7px}.scan-rec{border:1px solid #303030;background:#151515;border-radius:999px;padding:7px 10px;font-size:11px;color:#ddd}.scan-rec.strong{background:#fff;color:#050505;border-color:#fff}
    .scan-list{display:grid;gap:8px}.scan-item{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:flex-start;border:1px solid #242424;border-radius:14px;padding:11px 12px;background:#0b0b0b}.scan-item input{margin-top:3px;width:17px;height:17px;accent-color:#fff}.scan-item-title{font-size:11px;color:#777;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}.scan-item-value{font-size:13px;color:#eee;line-height:1.45;overflow-wrap:anywhere}.scan-item-value.multi{white-space:pre-line}
    .scan-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.scan-actions button{border:1px solid #333;border-radius:12px;padding:10px 13px;background:#171717;color:#fff;font-weight:700;cursor:pointer}.scan-actions button.primary{background:#fff;color:#050505;border-color:#fff}.scan-meta{font-size:11px;color:#666;margin:10px 0 0;line-height:1.45}
    @media(max-width:620px){.scan-head{display:block}.scan-badge{display:inline-block;margin-top:10px}.scan-input-row{grid-template-columns:1fr}.scan-button{min-height:46px}}
  `;
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'scan-card';
  card.id = 'websiteScanner';
  card.innerHTML = `
    <div class="scan-head">
      <div>
        <p class="kicker">Smart setup</p>
        <h2>Scan a customer website</h2>
        <p>Paste their website and the builder will look for the most useful information for a digital card — services, contact details, social links, booking, location, logo and key imagery.</p>
      </div>
      <span class="scan-badge">Public websites only</span>
    </div>
    <div class="scan-input-row">
      <input id="scanUrl" inputmode="url" placeholder="https://customerwebsite.co.uk" aria-label="Website to scan">
      <button class="scan-button" id="scanWebsite">Scan website</button>
    </div>
    <div class="scan-progress" id="scanProgress"></div>
    <div class="scan-results" id="scanResults">
      <div class="scan-rec-title">Recommended card sections</div>
      <div class="scan-recommended" id="scanRecommended"></div>
      <div class="scan-rec-title">What I found</div>
      <div class="scan-list" id="scanList"></div>
      <div class="scan-actions">
        <button class="primary" id="applyScan">Add selected to card</button>
        <button id="selectAllScan">Select all</button>
        <button id="clearScan">Clear scan</button>
      </div>
      <p class="scan-meta" id="scanMeta"></p>
    </div>
  `;
  editor.insertBefore(card, editor.firstElementChild);

  const q = id => document.getElementById(id);
  let scanData = null;

  function normaliseUrl(raw){
    let value = String(raw || '').trim();
    if (!value) throw new Error('Enter a website address first.');
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    const u = new URL(value);
    if (!['http:','https:'].includes(u.protocol)) throw new Error('Use a normal http or https website.');
    u.hash = '';
    return u.href;
  }

  async function readPage(url){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    try{
      const res = await fetch('https://r.jina.ai/' + url, {
        headers: {'Accept':'text/plain'},
        signal: controller.signal
      });
      if (!res.ok) throw new Error('Could not read ' + new URL(url).hostname);
      const text = await res.text();
      return text.slice(0, 90000);
    } finally { clearTimeout(timer); }
  }

  function pageTitle(text){
    const m = text.match(/^Title:\s*(.+)$/mi);
    if (m) return m[1].trim();
    const h = text.match(/^#\s+(.+)$/m);
    return h ? h[1].trim() : '';
  }

  function cleanBusinessName(title, url){
    let name = (title || '').replace(/\s+/g,' ').trim();
    if (name) {
      name = name.split(/\s+[|–—]\s+|\s+-\s+/)[0].trim();
      name = name.replace(/^(home|welcome to)\s*[-:|]?\s*/i,'').trim();
    }
    if (!name || name.length > 70) {
      const host = new URL(url).hostname.replace(/^www\./,'').split('.')[0];
      name = host.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    }
    return name;
  }

  function markdownLinks(text, base){
    const out = [];
    const re = /\[([^\]]{1,100})\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
    let m;
    while ((m = re.exec(text))) {
      try {
        const url = new URL(m[2], base).href;
        out.push({label:m[1].replace(/[*_`]/g,'').trim(), url});
      } catch(e) {}
    }
    return out;
  }

  function importantSubpages(links, home){
    const host = new URL(home).hostname.replace(/^www\./,'');
    const weights = [
      [/service|what-we-do|what we do|solutions|treatment|menu|rooms|accommodation|portfolio|work/i, 9],
      [/contact|find-us|find us|location|visit/i, 8],
      [/book|booking|reserve|reservation|enquir|appointment/i, 8],
      [/about|our-story|our story|team/i, 6],
      [/gallery|photos|projects/i, 5]
    ];
    return links.map(l => {
      let score = 0;
      const hay = l.label + ' ' + l.url;
      weights.forEach(([re,w]) => { if (re.test(hay)) score = Math.max(score,w); });
      let same = false;
      try { same = new URL(l.url).hostname.replace(/^www\./,'') === host; } catch(e) {}
      return {...l, score: same ? score : 0};
    }).filter(l => l.score > 0 && l.url !== home)
      .sort((a,b)=>b.score-a.score)
      .filter((l,i,a)=>a.findIndex(x=>new URL(x.url).pathname===new URL(l.url).pathname)===i)
      .slice(0,5);
  }

  function firstUsefulParagraph(text){
    const cleaned = text.replace(/^Title:.*$/gmi,'').replace(/^URL Source:.*$/gmi,'').replace(/^Published Time:.*$/gmi,'');
    const blocks = cleaned.split(/\n\s*\n/).map(v=>v.replace(/^#+\s*/gm,'').replace(/\[[^\]]+\]\([^)]+\)/g,'').replace(/[*_`>#]/g,'').replace(/\s+/g,' ').trim());
    return blocks.find(v => v.length >= 35 && v.length <= 190 && !/(cookie|privacy|terms|skip to|copyright|all rights reserved|accept|navigation|menu)/i.test(v)) || '';
  }

  function findEmail(text){
    const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || [];
    return matches.find(v=>!/(example\.|sentry\.|wixpress|cloudflare)/i.test(v)) || '';
  }

  function findPhone(text){
    const lines = text.split('\n');
    const re = /(?:\+44\s?(?:\(0\)\s?)?|0)(?:\d[\s().-]?){9,11}\d/g;
    for (const line of lines) {
      const m = line.match(re);
      if (m) return m[0].replace(/\s{2,}/g,' ').trim();
    }
    return '';
  }

  function findLocation(text){
    const lines = text.split('\n').map(v=>v.replace(/[*_>#`]/g,'').replace(/\[[^\]]+\]\([^)]+\)/g,'').trim()).filter(Boolean);
    const postcode = /\b(?:GIR ?0AA|(?:[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}))\b/i;
    const line = lines.find(v=>postcode.test(v) && v.length < 180);
    return line ? line.replace(/\s+/g,' ') : '';
  }

  function socialFromLinks(links, domain){
    const hit = links.find(l=>new URL(l.url).hostname.toLowerCase().includes(domain));
    return hit ? hit.url : '';
  }

  function bookingFromLinks(links){
    const candidates = links.filter(l=>/(book|booking|reserve|reservation|enquir|appointment|contact us|get in touch)/i.test(l.label+' '+l.url));
    return candidates.length ? candidates[0].url : '';
  }

  function findImages(text, base){
    const all = [];
    const re = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
    let m;
    while ((m = re.exec(text))) {
      try { all.push({alt:m[1], url:new URL(m[2],base).href}); } catch(e) {}
    }
    const logo = all.find(x=>/logo|brand/i.test(x.alt+' '+x.url));
    const gallery = all.filter(x=>!/(logo|icon|favicon|avatar|badge|pixel|svg)/i.test(x.alt+' '+x.url)).map(x=>x.url).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
    return {logo:logo?logo.url:'', gallery};
  }

  function findServices(pages){
    const found = [];
    const blocked = /^(home|about|contact|contact us|book|booking|gallery|news|blog|privacy|terms|services|our services|what we do|welcome|menu)$/i;
    const serviceContext = /service|what-we-do|what we do|solution|treatment|menu|room|accommodation|portfolio|our work|expertise|offer/i;
    pages.forEach(p=>{
      const pageIsService = serviceContext.test(p.url);
      let context = '';
      p.text.split('\n').forEach(raw=>{
        const line = raw.trim();
        const heading = line.match(/^#{2,4}\s+(.+)/);
        if (heading) {
          context = heading[1].replace(/[*_`]/g,'').trim();
          const val = context.replace(/\[[^\]]+\]\([^)]+\)/g,'').trim();
          if (pageIsService && val.length>=3 && val.length<=55 && !blocked.test(val) && !/(cookie|privacy|terms|contact|about us|testimonials|faq)/i.test(val)) found.push(val);
          return;
        }
        const bullet = line.match(/^[-*]\s+(.+)/);
        if (bullet && serviceContext.test(context+' '+p.url)) {
          let val = bullet[1].replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_`]/g,'').trim();
          if (val.length>=3 && val.length<=65 && !blocked.test(val)) found.push(val);
        }
      });
    });
    return found.map(v=>v.replace(/\s+/g,' ')).filter((v,i,a)=>a.findIndex(x=>x.toLowerCase()===v.toLowerCase())===i).slice(0,6);
  }

  function buildRecommendations(data){
    const rec = [];
    const add=(label,strong=false)=>rec.push({label,strong});
    if(data.bookingUrl) add('Booking / enquiry', true);
    if(data.phone) add('Call', true);
    if(data.whatsapp) add('WhatsApp');
    if(data.email) add('Email');
    if(data.services.length) add('Services', true);
    if(data.instagram) add('Instagram');
    if(data.linkedin) add('LinkedIn');
    if(data.tiktok) add('TikTok');
    if(data.location) add('Location');
    if(data.website) add('Website');
    if(data.gallery.length) add('Gallery');
    return rec;
  }

  function renderScan(data){
    const recommended = q('scanRecommended');
    recommended.innerHTML = '';
    buildRecommendations(data).forEach(r=>{
      const s=document.createElement('span'); s.className='scan-rec'+(r.strong?' strong':''); s.textContent=r.label; recommended.appendChild(s);
    });

    const entries = [
      ['businessName','Business name',data.businessName],
      ['tagline','Short description / tagline',data.tagline],
      ['role','Suggested role / category',data.role],
      ['services','Services',data.services.join('\n')],
      ['phone','Phone',data.phone],
      ['whatsapp','WhatsApp',data.whatsapp],
      ['email','Email',data.email],
      ['website','Website',data.website],
      ['bookingUrl','Booking / enquiry link',data.bookingUrl],
      ['instagram','Instagram',data.instagram],
      ['linkedin','LinkedIn',data.linkedin],
      ['tiktok','TikTok',data.tiktok],
      ['location','Location / address',data.location],
      ['logo','Logo',data.logo],
      ['gallery','Gallery images',data.gallery.join('\n')]
    ].filter(x=>x[2]);

    const list=q('scanList'); list.innerHTML='';
    entries.forEach(([key,label,value])=>{
      const row=document.createElement('label'); row.className='scan-item';
      const checked = !['role','logo','gallery'].includes(key) || key==='logo';
      row.innerHTML=`<input type="checkbox" data-scan-key="${key}" ${checked?'checked':''}><div><div class="scan-item-title">${label}</div><div class="scan-item-value ${String(value).includes('\n')?'multi':''}"></div></div>`;
      row.querySelector('.scan-item-value').textContent=value;
      list.appendChild(row);
    });
    q('scanMeta').textContent=`Scanned ${data.pagesScanned} page${data.pagesScanned===1?'':'s'} from ${new URL(data.website).hostname}. Review the suggestions before adding them to the card.`;
    q('scanResults').classList.add('show');
  }

  function applyScan(){
    if(!scanData) return;
    const selected = [...document.querySelectorAll('[data-scan-key]:checked')].map(x=>x.dataset.scanKey);
    const has = key=>selected.includes(key);
    if(has('businessName')) {
      setValue('businessName',scanData.businessName);
      if(!q('slug').dataset.manual) setValue('slug',cleanSlug(scanData.businessName));
    }
    if(has('tagline')) setValue('tagline',scanData.tagline);
    if(has('role')) setValue('role',scanData.role);
    if(has('services')) setValue('services',scanData.services.join('\n'));
    if(has('phone')) { setValue('phone',scanData.phone); setValue('phoneDisplay',scanData.phone); }
    if(has('whatsapp')) setValue('whatsapp',scanData.whatsapp);
    if(has('email')) setValue('email',scanData.email);
    if(has('website')) setValue('website',scanData.website);
    if(has('bookingUrl')) setValue('bookingUrl',scanData.bookingUrl);
    if(has('instagram')) { setValue('instagram',scanData.instagram); try{ const p=new URL(scanData.instagram).pathname.replace(/^\/+|\/+$/g,''); setValue('instagramLabel',p?'@'+p.replace(/^@/,''):'Instagram'); }catch(e){} }
    if(has('linkedin')) setValue('linkedin',scanData.linkedin);
    if(has('tiktok')) setValue('tiktok',scanData.tiktok);
    if(has('location')) setValue('location',scanData.location);
    if(has('logo')) setValue('logo',scanData.logo);
    if(has('gallery')) setValue('gallery',scanData.gallery.join('\n'));
    if(scanData.bookingUrl && !q('bookingLabel').value.trim()) setValue('bookingLabel','Make an Enquiry');
    update();
    showStatus(`Added ${selected.length} website suggestion${selected.length===1?'':'s'} to the card.`);
  }

  async function scanWebsite(){
    let home;
    try { home=normaliseUrl(q('scanUrl').value); } catch(e) { showStatus(e.message,true); return; }
    const btn=q('scanWebsite'); const progress=q('scanProgress');
    btn.disabled=true; btn.textContent='Scanning…'; progress.classList.add('show'); q('scanResults').classList.remove('show');
    try{
      progress.innerHTML='<strong>1/3</strong> Reading the homepage…';
      const homeText=await readPage(home);
      const homeLinks=markdownLinks(homeText,home);
      const candidates=importantSubpages(homeLinks,home);
      const pages=[{url:home,text:homeText}];

      if(candidates.length){
        progress.innerHTML=`<strong>2/3</strong> Checking ${Math.min(candidates.length,5)} useful page${candidates.length===1?'':'s'}…`;
        const extra=await Promise.allSettled(candidates.map(c=>readPage(c.url).then(text=>({url:c.url,text}))));
        extra.forEach(r=>{if(r.status==='fulfilled') pages.push(r.value)});
      }

      progress.innerHTML='<strong>3/3</strong> Picking the best card information…';
      const combined=pages.map(p=>p.text).join('\n\n');
      const allLinks=pages.flatMap(p=>markdownLinks(p.text,p.url));
      const title=pageTitle(homeText);
      const images=findImages(combined,home);
      const instagram=socialFromLinks(allLinks,'instagram.com');
      const linkedin=socialFromLinks(allLinks,'linkedin.com');
      const tiktok=socialFromLinks(allLinks,'tiktok.com');
      const phone=findPhone(combined);
      const email=findEmail(combined);
      const services=findServices(pages);
      let role='';
      if(services.length===1) role=services[0];
      else {
        const h2=homeText.match(/^##\s+(.{3,55})$/m);
        if(h2 && !/(about|contact|welcome|latest|news|services)/i.test(h2[1])) role=h2[1].replace(/[*_`]/g,'').trim();
      }
      scanData={
        businessName:cleanBusinessName(title,home),
        tagline:firstUsefulParagraph(homeText),
        role,
        services,
        phone,
        whatsapp:phone,
        email,
        website:home,
        bookingUrl:bookingFromLinks(allLinks),
        instagram,linkedin,tiktok,
        location:findLocation(combined),
        logo:images.logo,
        gallery:images.gallery,
        pagesScanned:pages.length
      };
      renderScan(scanData);
      progress.classList.remove('show');
      showStatus('Website scan complete — review the suggestions.');
    } catch(e) {
      console.error(e);
      progress.innerHTML='<strong>Scan failed.</strong> This site may block automated reading, be private, or be temporarily unavailable.';
      showStatus('Could not scan that website.',true);
    } finally {
      btn.disabled=false; btn.textContent='Scan website';
    }
  }

  q('scanWebsite').addEventListener('click',scanWebsite);
  q('scanUrl').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();scanWebsite();}});
  q('applyScan').addEventListener('click',applyScan);
  q('selectAllScan').addEventListener('click',()=>document.querySelectorAll('[data-scan-key]').forEach(x=>x.checked=true));
  q('clearScan').addEventListener('click',()=>{scanData=null;q('scanUrl').value='';q('scanList').innerHTML='';q('scanRecommended').innerHTML='';q('scanResults').classList.remove('show');q('scanProgress').classList.remove('show');});
})();
