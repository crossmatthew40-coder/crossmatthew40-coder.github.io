(() => {
  if (window.__highStyleFontControlsLoaded) return;
  window.__highStyleFontControlsLoaded = true;
  if (typeof getConfig !== 'function' || typeof loadConfig !== 'function' || typeof updatePreview !== 'function') return;

  const SYSTEM = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const choices = {
    auto:{label:'Auto from website',description:'Follows the branding scan automatically.',heading:SYSTEM,body:SYSTEM},
    modern:{label:'Modern',description:'Clean, minimal and professional.',heading:'"Helvetica Neue", Arial, sans-serif',body:'"Helvetica Neue", Arial, sans-serif'},
    inter:{label:'Inter',description:'Clean digital branding with excellent readability.',heading:'Inter, Arial, sans-serif',body:'Inter, Arial, sans-serif'},
    manrope:{label:'Manrope',description:'Premium modern sans-serif with a softer edge.',heading:'Manrope, Arial, sans-serif',body:'Manrope, Arial, sans-serif'},
    montserrat:{label:'Montserrat',description:'Strong geometric hospitality and lifestyle feel.',heading:'Montserrat, Arial, sans-serif',body:'Montserrat, Arial, sans-serif'},
    poppins:{label:'Poppins',description:'Rounded, polished and contemporary.',heading:'Poppins, Arial, sans-serif',body:'Poppins, Arial, sans-serif'},
    space:{label:'Space Grotesk',description:'Modern creative and design-led character.',heading:'"Space Grotesk", Arial, sans-serif',body:'"Space Grotesk", Arial, sans-serif'},
    luxury:{label:'Luxury',description:'Elegant high-end serif headings.',heading:'Didot, "Bodoni 72", Georgia, "Times New Roman", serif',body:SYSTEM},
    playfair:{label:'Playfair Display',description:'Luxury editorial serif for hotels and restaurants.',heading:'"Playfair Display", Georgia, serif',body:'Manrope, Arial, sans-serif'},
    cormorant:{label:'Cormorant',description:'Refined luxury serif with a boutique feel.',heading:'"Cormorant Garamond", Georgia, serif',body:'Manrope, Arial, sans-serif'},
    dmserif:{label:'DM Serif',description:'Confident premium serif with strong personality.',heading:'"DM Serif Display", Georgia, serif',body:'Inter, Arial, sans-serif'},
    editorial:{label:'Editorial',description:'Refined hospitality and lifestyle feel.',heading:'Baskerville, Georgia, "Times New Roman", serif',body:'"Helvetica Neue", Arial, sans-serif'},
    lora:{label:'Lora',description:'Warm editorial serif that still feels modern.',heading:'Lora, Georgia, serif',body:'Lora, Georgia, serif'},
    bold:{label:'Bold',description:'High-impact modern branding.',heading:'"Arial Black", "Helvetica Neue", Arial, sans-serif',body:'"Helvetica Neue", Arial, sans-serif'},
    oswald:{label:'Oswald',description:'Tall confident headings for bold brands.',heading:'Oswald, Arial, sans-serif',body:'Inter, Arial, sans-serif'},
    rounded:{label:'Rounded',description:'Friendly, soft and approachable.',heading:'"Avenir Next Rounded", "Trebuchet MS", "Segoe UI", Arial, sans-serif',body:'"Avenir Next", "Segoe UI", Arial, sans-serif'},
    classic:{label:'Classic',description:'Traditional and established.',heading:'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',body:'Georgia, "Times New Roman", serif'}
  };

  let selected = 'auto';
  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;
  const baseUpdatePreview = updatePreview;

  function autoKey(){
    const mood = (document.getElementById('designMood')?.textContent || '').toLowerCase();
    const smart = (document.getElementById('smartDesignStyle')?.textContent || '').toLowerCase();
    const hay = `${mood} ${smart}`;
    if (/luxury|premium|understated/.test(hay)) return 'cormorant';
    if (/editorial|refined/.test(hay)) return 'playfair';
    if (/bold/.test(hay)) return 'montserrat';
    if (/soft|warm|welcoming|rounded/.test(hay)) return 'poppins';
    if (/modern|creative/.test(hay)) return 'space';
    return 'manrope';
  }

  function plan(key = selected){
    const resolved = key === 'auto' ? autoKey() : key;
    return {...(choices[resolved] || choices.manrope), key:resolved, mode:key};
  }

  function inferSavedChoice(theme){
    if (theme?.fontChoice && choices[theme.fontChoice]) return theme.fontChoice;
    const label = String(theme?.fontLabel || '').toLowerCase();
    for (const [key,item] of Object.entries(choices)) {
      if (key !== 'auto' && label.includes(item.label.toLowerCase())) return key;
    }
    if (label.includes('elegant serif')) return 'luxury';
    if (label.includes('warm')) return 'rounded';
    return 'auto';
  }

  getConfig = function(){
    const c = baseGetConfig();
    const p = plan();
    c.theme = c.theme || {};
    c.theme.headingFont = p.heading;
    c.theme.bodyFont = p.body;
    c.theme.fontLabel = selected === 'auto' ? `Auto · ${p.label}` : p.label;
    c.theme.fontChoice = selected;
    return c;
  };

  loadConfig = function(data){
    const d = data?.config || data || {};
    selected = inferSavedChoice(d.theme || {});
    baseLoadConfig(data);
    renderSelected();
  };

  updatePreview = function(c){
    baseUpdatePreview(c);
    const p = c?.theme?.headingFont && c?.theme?.bodyFont ? {heading:c.theme.headingFont,body:c.theme.bodyFont} : plan();
    const card=document.getElementById('cardPreview');
    const heading=document.getElementById('previewBusiness');
    if(card) card.style.fontFamily=p.body;
    if(heading) heading.style.fontFamily=p.heading;
    document.querySelectorAll('.preview-btn,.chip,.preview-role,.preview-tagline,.preview-location,.preview-person,.preview-footer,.preview-label,.preview-eyebrow,.tripadvisor-preview-link,.menu-preview-link').forEach(el=>el.style.fontFamily=p.body);
  };

  const style=document.createElement('style');
  style.textContent=`
    .font-controls-card{margin:8px 0 2px;padding:18px;border:1px solid #272727;border-radius:20px;background:linear-gradient(145deg,#111,#0a0a0a);box-shadow:0 14px 36px rgba(0,0,0,.14)}
    .font-controls-card h3{margin:0;font-size:16px}.font-controls-card>p{margin:5px 0 14px;color:#747474;font-size:11px;line-height:1.5}
    .font-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.font-choice{position:relative;text-align:left;border:1px solid #2e2e2e;border-radius:14px;background:#121212;color:#fff;padding:12px;cursor:pointer;min-height:88px;transition:.18s ease}
    .font-choice:hover{border-color:#555;transform:translateY(-1px)}.font-choice.active{border-color:#fff;box-shadow:0 0 0 1px #fff inset;background:#181818}
    .font-choice-name{display:block;font-size:18px;line-height:1.05;margin-bottom:7px}.font-choice-desc{display:block;color:#777;font-size:9px;line-height:1.35;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
    .font-choice.active:after{content:'✓';position:absolute;right:9px;top:8px;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#050505;font:900 10px Arial}
    .font-current{margin-top:10px;padding:10px 11px;border:1px solid #272727;border-radius:12px;background:#0b0b0b;color:#888;font-size:10px}.font-current strong{color:#fff}
    @media(max-width:900px){.font-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.font-choice-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='font-controls-card'; panel.id='fontControls';
  panel.innerHTML=`<h3>Font Styles</h3><p>Choose from premium modern, editorial and luxury fonts. Auto keeps following the website branding scan.</p><div class="font-choice-grid" id="fontChoiceGrid"></div><div class="font-current" id="fontCurrent"></div>`;
  const contactHead=[...document.querySelectorAll('.section-head')].find(el=>/contact/i.test(el.textContent));
  const editor=document.querySelector('.editor-panel');
  if(contactHead?.parentNode) contactHead.parentNode.insertBefore(panel,contactHead); else editor?.appendChild(panel);

  const grid=document.getElementById('fontChoiceGrid');
  Object.entries(choices).forEach(([key,item])=>{
    const button=document.createElement('button'); button.type='button'; button.className='font-choice'; button.dataset.fontChoice=key;
    button.innerHTML=`<span class="font-choice-name">${item.label}</span><span class="font-choice-desc">${item.description}</span>`;
    button.querySelector('.font-choice-name').style.fontFamily=key==='auto'?SYSTEM:item.heading;
    button.addEventListener('click',()=>{selected=key;renderSelected();update();if(typeof showStatus==='function')showStatus(key==='auto'?'Font set to Auto — it will follow the website branding.':`${item.label} font applied.`);});
    grid.appendChild(button);
  });

  function renderSelected(){
    document.querySelectorAll('[data-font-choice]').forEach(el=>el.classList.toggle('active',el.dataset.fontChoice===selected));
    const p=plan(); const current=document.getElementById('fontCurrent');
    if(current) current.innerHTML=`Current: <strong>${selected==='auto'?`Auto · ${p.label}`:choices[selected].label}</strong>`;
  }

  ['designMood','smartDesignStyle','designType'].forEach(id=>{const el=document.getElementById(id);if(!el)return;new MutationObserver(()=>{if(selected==='auto'){renderSelected();update();}}).observe(el,{childList:true,subtree:true,characterData:true});});
  const branding=document.getElementById('applyWebsiteDesign'); if(branding) branding.addEventListener('click',()=>setTimeout(()=>{renderSelected();update();},0));
  try{const current=baseGetConfig();selected=inferSavedChoice(current?.theme||{});}catch(e){}
  window.highStyleFontControls={select(key){if(choices[key]){selected=key;renderSelected();update();return true}return false},get(){return{selected,...plan()}},choices:Object.keys(choices)};
  renderSelected(); update();
})();