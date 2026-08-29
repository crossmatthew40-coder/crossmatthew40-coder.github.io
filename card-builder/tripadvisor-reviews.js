(() => {
  if (window.__highStyleTripadvisorBuilderLoaded) return;
  window.__highStyleTripadvisorBuilderLoaded = true;

  const scanButton = document.getElementById('scanWebsite');
  const scanUrl = document.getElementById('scanUrl');
  const previewFooter = document.getElementById('previewFooter');
  if (!scanButton || !scanUrl || !previewFooter) return;

  let tripadvisorUrl = '';
  let scanRun = 0;

  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;
  const baseUpdatePreview = updatePreview;

  const style = document.createElement('style');
  style.textContent = `
    .tripadvisor-preview{display:none;margin-top:20px;padding-top:18px;border-top:1px solid var(--border,#333)}
    .tripadvisor-preview.show{display:block}
    .tripadvisor-preview-link{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border:1px solid var(--border,#333);border-radius:15px;background:var(--surface,#111);color:var(--text,#fff);font-size:12px;font-weight:850;text-decoration:none}
    .tripadvisor-preview-link span:last-child{font-size:17px}
    .tripadvisor-scan-note{display:none;margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid #284d38;background:#0e1a13;color:#91d2a3;font-size:11px;line-height:1.45}
    .tripadvisor-scan-note.show{display:block}
  `;
  document.head.appendChild(style);

  const preview = document.createElement('div');
  preview.id = 'previewTripadvisorReviews';
  preview.className = 'tripadvisor-preview';
  preview.innerHTML = `
    <p class="preview-label">Reviews</p>
    <a class="tripadvisor-preview-link" id="previewTripadvisorLink" href="#" target="_blank" rel="noopener">
      <span>Read our reviews on Tripadvisor</span><span>→</span>
    </a>`;
  previewFooter.parentNode.insertBefore(preview, previewFooter);

  const scanner = document.getElementById('websiteScanner');
  if (scanner) {
    const note = document.createElement('div');
    note.id = 'tripadvisorScanNote';
    note.className = 'tripadvisor-scan-note';
    note.textContent = 'Tripadvisor found — a Reviews section has been added to the card.';
    scanner.appendChild(note);
  }

  function normalise(raw){
    let value = String(raw || '').trim();
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    try { return new URL(value).href; } catch(e) { return ''; }
  }

  function cleanTripadvisor(url){
    try {
      const u = new URL(url.replace(/[.,;]+$/,''));
      const host = u.hostname.toLowerCase().replace(/^www\./,'');
      if (!/^tripadvisor\./.test(host)) return '';
      u.hash = '';
      return u.href;
    } catch(e) { return ''; }
  }

  function extractTripadvisor(text){
    const urls = String(text || '').match(/https?:\/\/(?:www\.)?tripadvisor\.[a-z.]{2,20}\/[^\s)\]<>"']+/gi) || [];
    const cleaned = urls.map(cleanTripadvisor).filter(Boolean);
    const preferred = cleaned.find(u => /Hotel_Review|Restaurant_Review|Attraction_Review|ShowUserReviews|Reviews/i.test(u));
    return preferred || cleaned[0] || '';
  }

  async function fetchPage(url){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);
    try {
      const res = await fetch('https://r.jina.ai/' + url, {headers:{'Accept':'text/plain'}, signal:controller.signal});
      if (!res.ok) return '';
      return (await res.text()).slice(0,100000);
    } catch(e) {
      return '';
    } finally {
      clearTimeout(timer);
    }
  }

  function render(){
    const wrap = document.getElementById('previewTripadvisorReviews');
    const link = document.getElementById('previewTripadvisorLink');
    if (!wrap || !link) return;
    if (tripadvisorUrl) {
      link.href = tripadvisorUrl;
      wrap.classList.add('show');
    } else {
      link.removeAttribute('href');
      wrap.classList.remove('show');
    }
    document.getElementById('tripadvisorScanNote')?.classList.toggle('show', !!tripadvisorUrl);
  }

  getConfig = function(){
    const c = baseGetConfig();
    c.tripadvisorUrl = tripadvisorUrl;
    return c;
  };

  loadConfig = function(data){
    const d = data?.config || data || {};
    tripadvisorUrl = d.tripadvisorUrl || '';
    baseLoadConfig(data);
    render();
  };

  updatePreview = function(c){
    baseUpdatePreview(c);
    tripadvisorUrl = c?.tripadvisorUrl ?? tripadvisorUrl;
    render();
  };

  async function scanTripadvisor(run){
    const url = normalise(scanUrl.value);
    if (!url) return '';
    tripadvisorUrl = '';
    render();
    const text = await fetchPage(url);
    if (run !== scanRun) return '';
    tripadvisorUrl = extractTripadvisor(text);
    update();
    render();
    if (tripadvisorUrl) showStatus('Tripadvisor found — Reviews section added automatically.');
    return tripadvisorUrl;
  }

  window.applyHighStyleTripadvisorReviews = async function(silent=false){
    if (!tripadvisorUrl) {
      scanRun += 1;
      await scanTripadvisor(scanRun);
    } else {
      render();
      update();
    }
    if (!silent) {
      showStatus(tripadvisorUrl ? 'Tripadvisor Reviews added to the card.' : 'No Tripadvisor link was found on this website.', !tripadvisorUrl);
    }
    return !!tripadvisorUrl;
  };

  scanButton.addEventListener('click', () => {
    scanRun += 1;
    scanTripadvisor(scanRun);
  });

  scanUrl.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    scanRun += 1;
    scanTripadvisor(scanRun);
  });

  try {
    const saved = localStorage.getItem('highStyleCardBuilderDraft');
    if (saved) {
      const parsed = JSON.parse(saved);
      tripadvisorUrl = parsed?.config?.tripadvisorUrl || parsed?.tripadvisorUrl || tripadvisorUrl;
    }
  } catch(e) {}

  update();
  render();
})();