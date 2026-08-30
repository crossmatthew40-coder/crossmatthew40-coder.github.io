(() => {
  const brands=window.HIGH_STYLE_BRANDS||{};
  const params=new URLSearchParams(location.search);
  const slug=(params.get('brand')||'high-style').toLowerCase();
  const brand=brands[slug];
  if(!brand||!brand.menuUrl)return;
  let safe='';
  try{const u=new URL(brand.menuUrl);if(!/^https?:$/.test(u.protocol))return;safe=u.href}catch(e){return}
  const section=document.createElement('section');
  section.className='section menu-section';section.id='menuSection';
  section.innerHTML=`<h2 class="section-title">Menu</h2><a class="menu-link" target="_blank" rel="noopener"><span><strong></strong><small>Food & drink</small></span><span class="menu-arrow">→</span></a>`;
  const link=section.querySelector('a');link.href=safe;link.querySelector('strong').textContent=brand.menuLabel||'View Menu';
  const services=document.getElementById('servicesSection');const social=document.getElementById('socialSection');const anchor=services||social||document.getElementById('reviewSection')||document.getElementById('footer');
  anchor?.parentNode?.insertBefore(section,anchor);
  const style=document.createElement('style');
  style.textContent=`.menu-link{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border:1px solid color-mix(in srgb,var(--text) 9%,var(--border));border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 90%,var(--accent) 10%),var(--surface));color:var(--text);text-decoration:none;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--text) 8%,transparent)}.menu-link strong{font-size:15px}.menu-link small{display:block;margin-top:4px;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.menu-arrow{font-size:23px}`;
  document.head.appendChild(style);
})();