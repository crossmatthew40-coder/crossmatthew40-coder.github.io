import { chromium } from 'playwright';

const BASE=(process.env.HSM_BASE||'https://crossmatthew40-coder.github.io/high-style-match/').replace(/\/?$/,'/');
const now=Date.now(),failures=[],passes=[];
const fail=m=>{failures.push(m);console.error('FAIL:',m)},pass=m=>{passes.push(m);console.log('PASS:',m)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
const settle=(ms=300)=>page.waitForTimeout(ms);
async function visible(sel,label,timeout=7000){try{await page.locator(sel).first().waitFor({state:'visible',timeout});pass(label)}catch(e){fail(`${label}: ${e.message}`)}}
async function open(path,sel,label){try{await page.goto(`${BASE}${path}${path.includes('?')?'&':'?'}smoke=${now}`,{waitUntil:'domcontentloaded',timeout:30000});await settle();await visible(sel,label)}catch(e){fail(`${label}: ${e.message}`)}}

try{
  await page.addInitScript(()=>sessionStorage.setItem('hsm_gate_seen','1'));
  await page.goto(`${BASE}?smoke=${now}`,{waitUntil:'domcontentloaded',timeout:30000});
  await visible('#nav','Main navigation renders');await visible('#content','Main content renders');

  const seed={shoots:[{id:'shoot_smoke',client:'Smoke Test Client',name:'Smoke Test Shoot',date:'2026-09-08',location:'Test Studio',createdAt:now,updatedAt:now,shotText:'Burger — Landscape\nBurger — Portrait\nCocktail — Overhead',shotSourceName:'Smoke test',shots:[{id:'shot_1',subject:'Burger',variant:'Landscape',skip:false},{id:'shot_2',subject:'Burger',variant:'Portrait',skip:false},{id:'shot_3',subject:'Cocktail',variant:'Overhead',skip:false}],photos:[],templateId:'t1',renameOverrides:{},renameSettings:{separator:'_',caseMode:'asis',numberStart:1,numberPad:3},reviewApproved:false,cullCompleted:false,cullSkipped:false,undoStack:[],delivery:{history:[]}}],templates:[{id:'t1',name:'Client · Subject · Orientation',pattern:'{client}_{subject}_{orientation}_{number}'}],history:[],activity:[],settings:{defaultTemplate:'t1',groupGapSeconds:45,analysisConcurrency:2,defaultSeparator:'_',defaultCase:'asis',numberStart:1,numberPad:3,deliveryProvider:'high-style-match'}};
  await page.evaluate(data=>localStorage.setItem('hsmPremium1',JSON.stringify(data)),seed);
  await page.reload({waitUntil:'domcontentloaded'});await settle(650);

  const sidebar=[['home','Dashboard'],['shoots','Projects'],['live','Tether Mode'],['photos','Photos'],['cull','Cull'],['review','Review'],['deliver','Deliver'],['clients','Clients'],['globalhistory','History'],['settings','Settings']];
  for(const [id,label] of sidebar){const b=page.locator(`#nav button[data-nav="${id}"]`);if(!await b.count()){fail(`Sidebar item missing: ${label}`);continue}try{await b.click();await settle();pass(`Sidebar works: ${label}`)}catch(e){fail(`Sidebar click failed: ${label} — ${e.message}`)}}

  await page.locator('#nav button[data-nav="photos"]').click();await settle();await visible('#tabs','Project tabs render');
  const tabs=['overview','shotlist','live','photos','cull','review','rename','deliver','history'];
  for(const id of tabs){const b=page.locator(`#tabs button[data-tab="${id}"]`);if(!await b.count()){fail(`Project tab missing: ${id}`);continue}try{await b.click();await settle();if(String(await b.getAttribute('class')||'').includes('on'))pass(`Project tab works: ${id}`);else fail(`Project tab did not activate: ${id}`);if(!(await page.locator('#workspaceBody').innerHTML()).trim())fail(`Project tab rendered empty content: ${id}`)}catch(e){fail(`Project tab failed: ${id} — ${e.message}`)}}

  const theme=await page.evaluate(()=>({body:getComputedStyle(document.body).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()}));
  if(theme.body==='rgb(0, 0, 0)'||theme.body==='rgb(8, 9, 11)')pass('Monochrome near-black background applied');else fail(`Unexpected body background ${theme.body}`);
  if(['#fff','#FFFFFF','white'].includes(theme.accent))pass('Monochrome white accent applied');else fail(`Expected white accent, got ${theme.accent}`);

  if(await page.locator('.hsm-skip').count())pass('Skip-to-content accessibility link is present');else fail('Skip-to-content link missing');
  if(await page.locator('.hsm-legal-footer').count())pass('Legal footer is present');else fail('Legal footer missing');
  if(await page.locator('.hsm-cookie').count())pass('Essential storage notice renders');else fail('Essential storage notice missing');

  await open('tether/?shoot=shoot_smoke','body','Desktop Tether Mode loads');
  if((await page.locator('body').innerText()).toLowerCase().includes('capture'))pass('Tether capture workflow present');else fail('Tether capture workflow text missing');

  await open('mobile-live/?shoot=shoot_smoke','body','Mobile Live loads');
  const mobileLiveText=(await page.locator('body').innerText()).toLowerCase();
  if(mobileLiveText.includes('mobile live')&&mobileLiveText.includes('now shooting'))pass('Mobile Live workflow present');else fail('Mobile Live workflow incomplete');

  await open('transfer/','body','Deliver workspace loads');
  const transferText=(await page.locator('body').innerText()).toLowerCase();
  if(transferText.includes('delivery')||transferText.includes('deliver'))pass('Deliver interface content present');else fail('Deliver interface content missing');

  await open('delivery/','body','Client delivery page loads');

  await open('sign-in/','#form','Unified sign-in form loads');
  if(await page.locator('[data-role="photographer"]').count()&&await page.locator('[data-role="customer"]').count())pass('Photographer and client account choices are present');else fail('Account role choices missing');
  if(await page.locator('#signupTab').count())pass('Photographer account creation control is present');else fail('Photographer signup control missing');
  await page.locator('[data-role="customer"]').click();await settle(80);if(await page.locator('#clientInvite.on').count())pass('Client invite-only guidance appears');else fail('Client invite guidance missing');
  if(await page.locator('.hsm-form-notice').count())pass('Personal-data form notice is present');else fail('Personal-data form notice missing');

  await open('account/','body','Legacy photographer sign-in route loads');
  await open('profile/','body','Account profile page loads');

  await open('subscribe/','#openLocal','Subscription gate has local access fallback');
  const subText=await page.locator('body').innerText();
  if(subText.includes('£25')&&subText.includes('High Style Match Complete'))pass('Single £25 Complete subscription is displayed');else fail('Single £25 plan is not clearly displayed');
  if(subText.includes('BILLING NOT LIVE'))pass('Subscription page does not pretend billing is live');else fail('Subscription page billing state is unclear');

  for(const [path,heading] of [['privacy/','Privacy Policy'],['cookies/','Cookie & local storage policy'],['terms/','Terms of Use'],['refunds/','Refunds & cancellation'],['accessibility/','Accessibility'],['copyright/','Copyright & image rights'],['legal/','Legal & business information']]){
    await open(path,'h1',`${heading} page loads`);const text=await page.locator('h1').innerText();if(text.includes(heading.split(' ')[0]))pass(`${heading} heading present`);else fail(`${heading} heading unexpected: ${text}`)
  }

  for(const asset of ['manifest.webmanifest','sw.js','app-config.js','cloud.js','production.js','functional-runtime.js','capture-delivery-tools.js','delivery-config.js','site-compliance.js','auth-router.js','role-guard.js']){const r=await context.request.get(`${BASE}${asset}?smoke=${now}`);if(r.ok())pass(`Asset available: ${asset}`);else fail(`Asset unavailable: ${asset} (${r.status()})`)}

  const m=await browser.newPage({viewport:{width:390,height:844}});const errs=[];m.on('pageerror',e=>errs.push(String(e.message||e)));await m.addInitScript(()=>sessionStorage.setItem('hsm_gate_seen','1'));await m.goto(`${BASE}?mobileSmoke=${now}`,{waitUntil:'domcontentloaded',timeout:30000});await m.waitForTimeout(550);if(await m.locator('#content').count())pass('Main mobile layout loads');else fail('Main mobile layout missing');if(errs.length)fail(`Mobile page errors: ${errs.join(' | ')}`);await m.close();
}catch(e){fail(`Smoke test crashed: ${e.stack||e.message||e}`)}
if(pageErrors.length)fail(`Uncaught page errors: ${pageErrors.join(' | ')}`);
await browser.close();
console.log('\n--- HIGH STYLE MATCH SMOKE TEST ---');console.log(`Passes: ${passes.length}`);console.log(`Failures: ${failures.length}`);if(failures.length){console.log(failures.map((x,i)=>`${i+1}. ${x}`).join('\n'));process.exit(1)}console.log('All smoke tests passed.');
