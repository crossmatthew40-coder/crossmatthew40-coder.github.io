(() => {
  const scanResults = document.getElementById('scanResults');
  const scanButton = document.getElementById('scanWebsite');
  if (!scanResults || !scanButton) return;

  let lastName = '';
  let lastLogo = '';
  let scanRun = 0;

  function textValueFor(labelPattern){
    const rows = [...scanResults.querySelectorAll('.scan-item')];
    for (const row of rows) {
      const title = row.querySelector('.scan-item-title')?.textContent?.trim() || '';
      if (!labelPattern.test(title)) continue;
      return row.querySelector('.scan-item-value')?.textContent?.trim() || '';
    }
    return '';
  }

  function visualLogo(){
    const img = document.querySelector('#designLogo img');
    if (!img) return '';
    return img.currentSrc || img.src || '';
  }

  function validLogo(value){
    if (!value) return '';
    try {
      const u = new URL(value, location.href);
      return /^https?:$/i.test(u.protocol) || /^data:/i.test(value) ? u.href : '';
    } catch(e) {
      return /^data:image\//i.test(value) ? value : '';
    }
  }

  function applyIdentity(silent=false){
    if (!scanResults.classList.contains('show')) return false;

    const name = textValueFor(/^business name$/i);
    const logo = validLogo(textValueFor(/^logo$/i)) || validLogo(visualLogo());
    let changed = false;
    let nameChanged = false;
    let logoChanged = false;

    if (name && name !== lastName) {
      const nameInput = document.getElementById('businessName');
      if (nameInput && nameInput.value.trim() !== name) {
        setValue('businessName', name);
        nameChanged = true;
        changed = true;
      }
      const slug = document.getElementById('slug');
      if (slug) {
        slug.dataset.manual = '';
        const nextSlug = cleanSlug(name);
        if (slug.value !== nextSlug) {
          setValue('slug', nextSlug);
          changed = true;
        }
      }
      lastName = name;
    }

    if (logo && logo !== lastLogo) {
      const logoInput = document.getElementById('logo');
      if (logoInput && logoInput.value.trim() !== logo) {
        try { uploadedLogo = ''; } catch(e) {}
        setValue('logo', logo);
        logoChanged = true;
        changed = true;
      }
      lastLogo = logo;
    }

    if (changed) {
      update();
      if (!silent) {
        if (nameChanged && logoChanged) showStatus('Business name, card URL and logo added automatically from the website.');
        else if (nameChanged) showStatus('Business name and card URL added automatically from the website.');
        else if (logoChanged) showStatus('Website logo added automatically to the card.');
      }
    }
    return changed;
  }

  const observer = new MutationObserver(() => applyIdentity(true));
  observer.observe(scanResults, {attributes:true, childList:true, subtree:true, attributeFilter:['class','src']});

  const designLogo = document.getElementById('designLogo');
  if (designLogo) {
    new MutationObserver(() => applyIdentity(false)).observe(designLogo, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  }

  function startIdentityWatch(){
    scanRun += 1;
    const thisRun = scanRun;
    lastName = '';
    lastLogo = '';
    const slug = document.getElementById('slug');
    if (slug) slug.dataset.manual = '';
    [250, 700, 1500, 3000, 5500].forEach((delay, index) => {
      setTimeout(() => {
        if (thisRun !== scanRun) return;
        applyIdentity(index < 4);
      }, delay);
    });
  }

  scanButton.addEventListener('click', startIdentityWatch);

  const scanUrl = document.getElementById('scanUrl');
  if (scanUrl) {
    scanUrl.addEventListener('keydown', e => {
      if (e.key === 'Enter') startIdentityWatch();
    });
  }
})();