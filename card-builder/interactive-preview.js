(() => {
  if (window.__highStyleInteractivePreviewLoaded) return;
  window.__highStyleInteractivePreviewLoaded = true;
  if (typeof updatePreview !== 'function') return;

  const baseUpdatePreview = updatePreview;

  const style = document.createElement('style');
  style.textContent = `
    .preview-btn{cursor:pointer;text-decoration:none!important;position:relative;z-index:2;pointer-events:auto;-webkit-tap-highlight-color:transparent}
    .preview-btn:hover{transform:translateY(-1px);filter:brightness(1.04)}
    .preview-btn:focus-visible{outline:2px solid var(--accent,#fff);outline-offset:2px}
    .preview-brand::before{pointer-events:none}
    button{pointer-events:auto;position:relative}
    button.control-click{transform:scale(.985)}
  `;
  document.head.appendChild(style);

  function cleanPhone(value){ return String(value || '').replace(/\s+/g,''); }
  function actionHref(type,c){
    if (type === 'booking') return c.bookingUrl || '';
    if (type === 'phone') return c.phone ? 'tel:' + cleanPhone(c.phone) : '';
    if (type === 'whatsapp') return c.whatsapp ? 'https://wa.me/' + String(c.whatsapp).replace(/\D/g,'') : '';
    if (type === 'email') return c.email ? 'mailto:' + c.email : '';
    if (type === 'website') return c.website || '';
    if (type === 'instagram') return c.instagram || '';
    if (type === 'linkedin') return c.linkedin || '';
    if (type === 'tiktok') return c.tiktok || '';
    return '';
  }

  function actionText(type,c,custom){
    if (custom) return custom;
    if (type === 'booking') return c.bookingLabel || 'Make an Enquiry';
    if (type === 'phone') return 'Call · ' + (c.phoneDisplay || c.phone || 'Phone');
    if (type === 'whatsapp') return 'WhatsApp';
    if (type === 'email') return 'Email';
    if (type === 'website') return 'Visit Website';
    if (type === 'instagram') return c.instagramLabel || 'Instagram';
    if (type === 'linkedin') return 'LinkedIn';
    if (type === 'tiktok') return 'TikTok';
    return type;
  }

  function defaultActions(c){
    const list = [];
    if (c.bookingUrl) list.push({type:'booking',primary:true});
    if (c.phone) list.push({type:'phone'});
    if (c.whatsapp) list.push({type:'whatsapp'});
    if (c.email) list.push({type:'email'});
    if (c.instagram) list.push({type:'instagram'});
    if (c.website) list.push({type:'website'});
    if (c.linkedin) list.push({type:'linkedin'});
    if (c.tiktok) list.push({type:'tiktok'});
    if (!list.some(a=>a.primary) && list.length) list[0].primary = true;
    return list;
  }

  function downloadContact(c){
    const esc = v => String(v || '').replace(/\n/g,' ').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const lines = [
      'BEGIN:VCARD','VERSION:3.0',
      'FN:' + esc(c.personName || c.businessName || 'Contact'),
      'ORG:' + esc(c.businessName || ''),
      'TITLE:' + esc(c.role || '')
    ];
    if (c.phone) lines.push('TEL;TYPE=CELL:' + c.phone);
    if (c.email) lines.push('EMAIL:' + c.email);
    if (c.website) lines.push('URL:' + c.website);
    lines.push('END:VCARD');
    const blob = new Blob([lines.join('\r\n')],{type:'text/vcard'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ((c.businessName || 'contact').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'') || 'contact') + '.vcf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    if (typeof showStatus === 'function') showStatus('Contact download tested from the preview.');
  }

  function buildButton(container,action,c){
    const href = actionHref(action.type,c);
    if (!href) return;
    const a = document.createElement('a');
    a.className = 'preview-btn' + (action.primary ? ' primary' : '');
    a.href = href;
    a.setAttribute('aria-label','Test ' + actionText(action.type,c,action.label));
    a.title = 'Test this card button';
    if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    const left = document.createElement('span');
    left.textContent = actionText(action.type,c,action.label);
    const arrow = document.createElement('span'); arrow.textContent = '→';
    a.append(left,arrow);
    a.addEventListener('click',()=>{
      if (typeof showStatus === 'function') showStatus(`${left.textContent} button opened for testing.`);
    });
    container.appendChild(a);
  }

  function rebuildButtons(c){
    const container = document.getElementById('previewButtons');
    if (!container) return;
    container.innerHTML = '';
    const actions = Array.isArray(c.actions) && c.actions.length ? c.actions : defaultActions(c);
    actions.forEach(action => buildButton(container,action,c));

    if (c.phone || c.email || c.website) {
      const a = document.createElement('a');
      a.className = 'preview-btn'; a.href = '#'; a.title = 'Test Save Contact';
      a.innerHTML = '<span>Save Contact</span><span>＋</span>';
      a.addEventListener('click',e=>{e.preventDefault();downloadContact(c)});
      container.appendChild(a);
    }
  }

  updatePreview = function(c){
    baseUpdatePreview(c);
    rebuildButtons(c);
  };

  // Make every builder control explicitly non-submit and clickable, including controls added later.
  function hardenButtons(root=document){
    root.querySelectorAll?.('button').forEach(button => {
      button.type = 'button';
      button.style.pointerEvents = 'auto';
      if (!button.dataset.clickFeedback) {
        button.dataset.clickFeedback = '1';
        button.addEventListener('pointerdown',()=>button.classList.add('control-click'));
        ['pointerup','pointercancel','mouseleave'].forEach(name=>button.addEventListener(name,()=>button.classList.remove('control-click')));
      }
    });
  }
  hardenButtons();
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(node=>{if(node.nodeType===1) hardenButtons(node)}))).observe(document.body,{childList:true,subtree:true});

  window.addEventListener('unhandledrejection',e=>{
    console.error('Builder action error:',e.reason);
    if (typeof showStatus === 'function') showStatus('A builder action hit an error. Refresh the page and try again.',true);
  });

  try { update(); } catch(e) { console.error(e); }
})();