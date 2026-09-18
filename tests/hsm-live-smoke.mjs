import { chromium } from 'playwright';

const ROOT=(process.env.HSM_ROOT||'http://127.0.0.1:4173/').replace(/\/?$/,'/');
const HSM=ROOT+'high-style-match/';
const now=Date.now(),failures=[],passes=[];
const fail=m=>{failures.push(m);console.error('FAIL:',m)};
const pass=m=>{passes.push(m);console.log('PASS:',m)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
const settle=(ms=350)=>page.waitForTimeout(ms);
async function visible(sel,label,timeout=10000){
  try{await page.locator(sel).first().waitFor({state:'visible',timeout});pass(label)}
  catch(e){fail(label+': '+e.message)}
}
try{
  // Canonical High Style Match route must resolve into the photographer auth flow.
  await page.goto(HSM+'?smoke='+now,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForURL(/high-style-match\/(app\/|sign-in\/)/,{timeout:10000}).catch(()=>{});
  await settle(1000);
  if(page.url().includes('/sign-in/')) pass('Unauthenticated main route reaches photographer sign-in');
  else if(page.url().includes('/app/')) pass('Canonical main route reaches production app');
  else fail('Canonical High Style Match route did not reach app/sign-in: '+page.url());

  // Canonical sign-in.
  await page.goto(HSM+'sign-in/?smoke='+now,{waitUntil:'domcontentloaded',timeout:30000});
  await visible('#authForm','Photographer sign-in form renders');
  await visible('#email','Email field renders');
  await visible('[data-mode="signup"]','Create account control renders');
  if(await page.locator('[data-role="customer"]').count()) fail('Legacy client account selector is still present');
  else pass('Client accounts are absent from photographer sign-in');

  // Production app assets must be present and must not contain the broken querySelector().forEach pattern.
  const appJs=await context.request.get(HSM+'app/app.js?smoke='+now);
  if(appJs.ok()){
    pass('Production app JavaScript is available');
    const js=await appJs.text();
    const bad=/(?<!\$)\$\(([^)]*)\)\.forEach/g.test(js);
    if(bad) fail('Production app contains querySelector().forEach event-binding bug');
    else pass('Production app collection event bindings are valid');
    if(js.includes('Send Client Review')&&js.includes('sender_email')&&js.includes('Client Reviews')) pass('New client review sender/dashboard code is present');
    else fail('Client review sender/dashboard code is missing');
  }else fail('Production app JavaScript unavailable: '+appJs.status());

  const css=await context.request.get(HSM+'app/styles.css?smoke='+now);
  if(css.ok()){
    const t=await css.text();
    if(t.includes('High Style transfer send panel')&&t.includes('high-style-otp')) pass('Transfer sender and verification styles are present');
    else fail('Transfer sender or verification styles are missing');
  }else fail('Production app stylesheet unavailable');

  // Standalone sender demo must visibly work without login.
  await page.goto(ROOT+'high-style-match-send-demo/?smoke='+now,{waitUntil:'domcontentloaded',timeout:30000});
  await visible('#sendForm','Standalone send-review demo renders');
  await page.locator('#from').fill('photographer@example.com');
  await page.locator('#to').fill('client@example.com');
  await page.locator('#sendForm button[type="submit"]').click();
  await visible('.email','Email preview opens from Send Review');
  const emailText=(await page.locator('.email').innerText()).toLowerCase();
  if(emailText.includes('verification code')&&emailText.includes('view your photographs')) pass('Sender demo shows verification email');
  else fail('Sender demo email preview is incomplete');
  await page.locator('#close').click();

  // Client demo: verification must be first and unlock review.
  await page.goto(ROOT+'high-style-match-delivery-demo/?smoke='+now,{waitUntil:'domcontentloaded',timeout:30000});
  await visible('.otp','Client experience opens on verification first');
  const inputs=page.locator('.otp input');
  const code='482691';
  for(let i=0;i<6;i++) await inputs.nth(i).fill(code[i]);
  await settle(500);
  await visible('.gallery','Correct verification code unlocks Client Review');
  const body=(await page.locator('body').innerText()).toLowerCase();
  if(body.includes('add a note for the photographer')&&body.includes('submit selections')) pass('Client Review selection controls render');
  else fail('Client Review controls are incomplete');

  // Mobile sender demo.
  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e.message||e)));
  await mobile.goto(ROOT+'high-style-match-send-demo/?mobile='+now,{waitUntil:'domcontentloaded',timeout:30000});
  if(await mobile.locator('#sendForm').isVisible()) pass('Send-review demo works on mobile');
  else fail('Send-review demo missing on mobile');
  if(mobileErrors.length) fail('Mobile demo page errors: '+mobileErrors.join(' | '));
  await mobile.close();
}catch(e){
  fail('Smoke test crashed: '+(e.stack||e.message||e));
}
if(pageErrors.length) fail('Uncaught page errors: '+pageErrors.join(' | '));
await browser.close();
console.log('\n--- HIGH STYLE MATCH PRODUCTION SMOKE TEST ---');
console.log('Passes: '+passes.length);
console.log('Failures: '+failures.length);
if(failures.length){
  console.log(failures.map((x,i)=>(i+1)+'. '+x).join('\n'));
  process.exit(1);
}
console.log('All smoke tests passed.');
