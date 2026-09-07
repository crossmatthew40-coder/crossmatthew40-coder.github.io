import { chromium } from 'playwright';

const BASE=(process.env.HSM_BASE||'https://crossmatthew40-coder.github.io/high-style-match/').replace(/\/?$/,'/');
const now=Date.now();
const failures=[];
const notes=[];
const fail=msg=>{failures.push(msg);console.error('FAIL:',msg)};
const pass=msg=>{notes.push(msg);console.log('PASS:',msg)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
const settle=(ms=220)=>page.waitForTimeout(ms);
async function expectVisible(sel,label){try{await page.locator(sel).first().waitFor({state:'visible',timeout:6000});pass(label)}catch{fail(`${label} (${sel})`)}}
async function expectPage(path,selector,label){try{await page.goto(`${BASE}${path}${path.includes('?')?'&':'?'}smoke=${now}`,{waitUntil:'domcontentloaded',timeout:30000});await settle(250);await expectVisible(selector,label)}catch(e){fail(`${label}: ${e.message}`)}}

try{
  await page.goto(`${BASE}?smoke=${now}`,{waitUntil:'domcontentloaded',timeout:30000});
  await expectVisible('#nav','Main navigation renders');
  await expectVisible('#content','Main content renders');

  const seed={shoots:[{id:'shoot_smoke',client:'Smoke Test Client',name:'Smoke Test Shoot',date:'2026-09-06',location:'Test Studio',createdAt:now,updatedAt:now,shotText:'Burger — Landscape\nBurger — Portrait\nCocktail — Overhead',shotSourceName:'Smoke test',shots:[{id:'shot_1',subject:'Burger',variant:'Landscape',skip:false},{id:'shot_2',subject:'Burger',variant:'Portrait',skip:false},{id:'shot_3',subject:'Cocktail',variant:'Overhead',skip:false}],photos:[],templateId:'t1',renameOverrides:{},renameSettings:{separator:'_',caseMode:'asis',numberStart:1,numberPad:3},reviewApproved:true,cullCompleted:true,cullSkipped:false,undoStack:[],delivery:{provider:'wetransfer',method:'link',recipient:'client@example.com',title:'Smoke Test Delivery',message:'Test delivery',transferUrl:'',openedAt:null,deliveredAt:null,exportId:null,status:'ready',history:[],lastExportId:'hist_smoke',lastExportAt:now,lastZipName:'Smoke_Test.zip',lastCount:0}}],templates:[{id:'t1',name:'Client · Shoot · Subject',pattern:'{client}_{shoot}_{subject}_{number}'},{id:'t2',name:'Shoot · Subject',pattern:'{shoot}_{subject}_{number}'},{id:'t3',name:'Client · Subject',pattern:'{client}_{subject}_{number}'}],history:[{id:'hist_smoke',shootId:'shoot_smoke',at:now,count:0,template:'Smoke',zipName:'Smoke_Test.zip'}],activity:[],settings:{defaultTemplate:'t1',groupGapSeconds:45,analysisConcurrency:2,defaultSeparator:'_',defaultCase:'asis',numberStart:1,numberPad:3,deliveryProvider:'wetransfer'}};
  await page.evaluate(data=>localStorage.setItem('hsmPremium1',JSON.stringify(data)),seed);
  await page.reload({waitUntil:'domcontentloaded'});await settle(350);

  const sidebar=[['home','Dashboard'],['shoots','Projects'],['live','Tether Mode'],['photos','Photos'],['cull','Cull'],['review','Review'],['deliver','Deliver'],['clients','Clients'],['globalhistory','History'],['settings','Settings']];
  for(const [id,label] of sidebar){const b=page.locator(`#nav button[data-nav="${id}"]`);if(await b.count()===0){fail(`Sidebar item missing: ${label}`);continue}try{await b.click();await settle();pass(`Sidebar works: ${label}`)}catch(e){fail(`Sidebar click failed: ${label} — ${e.message}`)}}

  await page.locator('#nav button[data-nav="photos"]').click();await settle();await expectVisible('#tabs','Project tabs render');
  const tabs=[['overview','Overview'],['shotlist','Shot List'],['live','Tether'],['photos','Photos'],['cull','Cull'],['review','Review'],['rename','Rename'],['deliver','Deliver'],['history','History']];
  for(const [id,label] of tabs){const b=page.locator(`#tabs button[data-tab="${id}"]`);if(await b.count()===0){fail(`Project tab missing: ${label}`);continue}try{await b.click();await settle(250);const cls=await b.getAttribute('class');if(!String(cls||'').includes('on'))fail(`Project tab did not activate: ${label}`);else pass(`Project tab works: ${label}`);const html=await page.locator('#workspaceBody').innerHTML();if(!html.trim())fail(`Project tab rendered empty content: ${label}`)}catch(e){fail(`Project tab click failed: ${label} — ${e.message}`)}}

  const bodyBg=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);if(bodyBg==='rgb(12, 12, 16)')pass('Studio near-black background theme applied');else fail(`Expected Studio background rgb(12, 12, 16), got ${bodyBg}`);
  const accent=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());if(accent==='#9674ff')pass('Studio purple accent applied');else fail(`Expected Studio purple accent #9674ff, got ${accent}`);
  if(await page.locator('.hsm-opening').count()===0)pass('Opening logo animation dismisses');else fail('Opening logo animation did not dismiss');
  const scripts=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));if(scripts.some(x=>String(x).includes('production.js')))pass('Production runtime is loaded');else fail('Production runtime is not loaded on main app');

  await expectPage('tether/?shoot=shoot_smoke','body','Tether Mode loads');
  const tetherText=(await page.locator('body').innerText()).toLowerCase();if(tetherText.includes('tether'))pass('Tether Mode content present');else fail('Tether Mode content missing');

  await expectPage('sign-in/','#signInForm','Customer sign-in form loads');const before=await page.locator('#password').getAttribute('type');await page.locator('#showPassword').click();const after=await page.locator('#password').getAttribute('type');if(before==='password'&&after==='text')pass('Show password control works');else fail(`Show password control failed (${before} -> ${after})`);
  await expectPage('customer/','#projectCount','Customer portal loads');
  await expectPage('account/','#form','Photographer sign-in page loads');
  await expectPage('onboarding/','#createProject','Onboarding page loads');
  await expectPage('invite/','#send','Customer invitation page loads');
  await expectPage('admin/','#gate','Admin console safely gates access');
  await expectPage('status/','#checks','System status page loads');
  await expectPage('privacy/','h1','Privacy page loads');if((await page.locator('h1').innerText()).includes('Privacy'))pass('Privacy content present');else fail('Privacy heading missing');
  await expectPage('terms/','h1','Terms page loads');if((await page.locator('h1').innerText()).includes('Terms'))pass('Terms content present');else fail('Terms heading missing');

  for(const asset of ['manifest.webmanifest','sw.js','app-config.js','cloud.js','production.js']){const r=await context.request.get(`${BASE}${asset}?smoke=${now}`);if(r.ok())pass(`Asset available: ${asset}`);else fail(`Asset unavailable: ${asset} (${r.status()})`)}

  const mobile=await browser.newPage({viewport:{width:390,height:844}});const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e.message||e)));await mobile.goto(`${BASE}?mobileSmoke=${now}`,{waitUntil:'domcontentloaded',timeout:30000});await mobile.waitForTimeout(350);if(await mobile.locator('#content').count())pass('Mobile layout loads');else fail('Mobile layout did not load');if(mobileErrors.length)fail(`Mobile page errors: ${mobileErrors.join(' | ')}`);await mobile.close();
}catch(e){fail(`Smoke test crashed: ${e.stack||e.message||e}`)}
if(pageErrors.length)fail(`Uncaught page errors: ${pageErrors.join(' | ')}`);
await browser.close();
console.log('\n--- HIGH STYLE MATCH PRODUCTION SMOKE TEST ---');console.log(`Passes: ${notes.length}`);console.log(`Failures: ${failures.length}`);if(failures.length){console.log(failures.map((x,i)=>`${i+1}. ${x}`).join('\n'));process.exit(1)}console.log('All production smoke tests passed.');
