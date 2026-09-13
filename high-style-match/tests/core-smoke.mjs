import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inlineScripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);

for(const source of inlineScripts)new Function(source);
assert.match(html,/window\.HSMCore=/,'core module bridge is missing');
assert.match(html,/window\.HSMAIVision\?\.aiMatch\?\.\(s\)/,'Brief Match is not connected to AI Vision suggestions');
assert.doesNotMatch(html,/high-style-purple-theme\.css/,'retired purple theme is still linked');

const app=inlineScripts[0];
function between(start,end){
  const from=app.indexOf(start),to=app.indexOf(end,from);
  assert.ok(from>=0&&to>from,`could not extract ${start}`);
  return app.slice(from,to);
}

const parserSource=`function uid(prefix='id'){return prefix+'_'+Math.random()}\n${between('function parseDelimitedLine','function coverage')};return parseShotList`;
const parseShotList=new Function(parserSource)();
assert.equal(parseShotList('Burger — Landscape\nBurger — Portrait\nCake — Overhead x2').length,4);
assert.equal(parseShotList('Dish,Landscape,Portrait\nBurger,x,x\nSoup,1,').length,3);
assert.equal(parseShotList('[{"subject":"Cocktail","variant":"Portrait"}]').length,1);

const zipSource=`${between('function u16','async function storageEstimate')};return buildStoredZip`;
const buildStoredZip=new Function(zipSource)();
const zip=await buildStoredZip([
  {name:'one.txt',file:new Blob(['one'])},
  {name:'two.txt',file:new Blob(['two'])},
]);
const bytes=new Uint8Array(await zip.arrayBuffer());
assert.deepEqual([...bytes.slice(0,4)],[0x50,0x4b,0x03,0x04]);
assert.ok(bytes.some((_,index)=>bytes[index]===0x50&&bytes[index+1]===0x4b&&bytes[index+2]===0x05&&bytes[index+3]===0x06),'ZIP end record is missing');

const adobe=fs.readFileSync(path.join(root,'adobe-actions.js'),'utf8');
const bestPicks=fs.readFileSync(path.join(root,'best-picks-studio.js'),'utf8');
const ai=fs.readFileSync(path.join(root,'ai-vision-v2.js'),'utf8');
const config=fs.readFileSync(path.join(root,'app-config.js'),'utf8');
assert.match(adobe,/HSMCore\?\.getShoot/,'Adobe handoff does not read the active project');
assert.match(bestPicks,/buildStoredZip/,'Best Picks ZIP export is not connected');
assert.match(ai,/runCompatible/,'AI compatibility pass is missing');
assert.match(config,/hsm-nav-tab/,'Collapsible mobile navigation tab is missing');
assert.match(config,/hsm-mobile-nav-open/,'Mobile navigation does not expose an open state');

console.log('High Style Match core smoke checks passed.');
