#!/usr/bin/env node
'use strict';

const fs=require('fs');
const fsp=fs.promises;
const path=require('path');
const http=require('http');
const crypto=require('crypto');
const {spawn}=require('child_process');
const {URL}=require('url');

const args=process.argv.slice(2);
function arg(name,fallback=null){const i=args.indexOf(name);return i>=0&&args[i+1]?args[i+1]:fallback;}

const port=Number(arg('--port',process.env.HSM_PORT||'4177'));
const captureFolder=path.resolve(arg('--folder',process.env.HSM_CAPTURE_FOLDER||process.cwd()));
const outputArg=arg('--output',process.env.HSM_OUTPUT_FOLDER||'');
const outputFolder=outputArg?path.resolve(outputArg):'';
const remoteUrl=process.env.HSM_REMOTE_URL||'';
const remoteToken=process.env.HSM_REMOTE_TOKEN||'';
const allowedOrigins=new Set((process.env.HSM_ALLOWED_ORIGINS||'https://crossmatthew40-coder.github.io').split(',').map(x=>x.trim()).filter(Boolean));
const SUPPORTED=new Set(['.jpg','.jpeg','.png','.webp','.tif','.tiff','.heic','.heif','.cr2','.cr3','.nef','.nrw','.arw','.raf','.orf','.rw2','.dng']);
const OUTPUT_SUPPORTED=new Set([...SUPPORTED,'.psd','.psb','.zip']);
const RAW=new Set(['.cr2','.cr3','.nef','.nrw','.arw','.raf','.orf','.rw2','.dng']);
const CACHE=path.join(__dirname,'.preview-cache');
fs.mkdirSync(CACHE,{recursive:true});

const clients=new Set();
const knownCapture=new Map();
const knownOutput=new Map();
const shots=[];
const exportsSeen=[];
const MAX_SHOTS=500;
const MAX_EXPORTS=250;
let running=true;
let lastScan=0;
const startedAt=Date.now();

function iso(){return new Date().toISOString();}
function idFor(filePath,stat){return crypto.createHash('sha1').update(`${filePath}:${stat.size}:${stat.mtimeMs}`).digest('hex').slice(0,18);}
function orientation(w,h){if(!w||!h)return'unknown';if(w===h)return'square';return w>h?'landscape':'portrait';}
function isAllowedOrigin(origin){if(!origin)return true;if(allowedOrigins.has(origin))return true;return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin);}
function cors(req,res){
  const origin=req.headers.origin||'';
  if(isAllowedOrigin(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin||'*');
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','content-type');
    res.setHeader('Access-Control-Allow-Private-Network','true');
  }
}
function sendEvent(type,data){const out=`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;for(const res of clients){try{res.write(out)}catch{clients.delete(res)}}}

async function listFiles(dir,extensions,depth=0){
  if(!dir||depth>4)return[];
  let entries;try{entries=await fsp.readdir(dir,{withFileTypes:true})}catch{return[]}
  const out=[];
  for(const e of entries){
    if(e.name.startsWith('.'))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())out.push(...await listFiles(p,extensions,depth+1));
    else if(extensions.has(path.extname(e.name).toLowerCase()))out.push(p);
  }
  return out;
}

async function dims(filePath){
  if(process.platform!=='darwin')return null;
  return new Promise(resolve=>{
    const p=spawn('sips',['-g','pixelWidth','-g','pixelHeight',filePath],{stdio:['ignore','pipe','ignore']});
    let txt='';p.stdout.on('data',d=>txt+=d.toString());p.on('error',()=>resolve(null));p.on('close',()=>{const w=/pixelWidth:\s*(\d+)/.exec(txt),h=/pixelHeight:\s*(\d+)/.exec(txt);resolve(w&&h?{width:+w[1],height:+h[1]}:null)});
  });
}

async function preview(filePath,id){
  const ext=path.extname(filePath).toLowerCase();
  if(['.jpg','.jpeg','.png','.webp'].includes(ext))return{previewUrl:`/media/${id}`};
  if(process.platform!=='darwin')return{previewUrl:null};
  const outDir=path.join(CACHE,id);await fsp.mkdir(outDir,{recursive:true});
  let made=(await fsp.readdir(outDir).catch(()=>[])).find(n=>n.toLowerCase().endsWith('.png'));
  if(!made){
    await new Promise(resolve=>{const p=spawn('qlmanage',['-t','-s','1400','-o',outDir,filePath],{stdio:'ignore'});p.on('error',resolve);p.on('close',resolve)});
    made=(await fsp.readdir(outDir).catch(()=>[])).find(n=>n.toLowerCase().endsWith('.png'));
  }
  return made?{previewUrl:`/preview/${id}`,previewFile:path.join(outDir,made)}:{previewUrl:null};
}

function localAnalysis(shot){
  const notes=[];
  if(shot.orientation==='landscape')notes.push('Landscape coverage detected');
  if(shot.orientation==='portrait')notes.push('Portrait coverage detected');
  if(shot.raw)notes.push('Original RAW left untouched');
  return{status:shot.raw?'RAW received':'Frame received',score:null,summary:'Hugo received the new Capture One frame.',notes,mode:'bridge'};
}

async function remoteAnalysis(shot){
  if(!remoteUrl||typeof fetch!=='function')return null;
  try{
    const r=await fetch(remoteUrl,{method:'POST',headers:{'content-type':'application/json',...(remoteToken?{'authorization':`Bearer ${remoteToken}`}:{})},body:JSON.stringify({id:shot.id,name:shot.name,capturedAt:shot.capturedAt,bytes:shot.bytes,extension:shot.extension,orientation:shot.orientation,relativePath:shot.relativePath})});
    if(!r.ok)throw new Error(`Remote AI ${r.status}`);
    return await r.json();
  }catch(e){return{error:e.message}}
}

function publicShot(s){const{filePath,previewFile,...safe}=s;return safe;}
function publicExport(s){const{filePath,...safe}=s;return safe;}

async function processCapture(filePath,stat){
  const id=idFor(filePath,stat),old=knownCapture.get(filePath);if(old?.id===id)return;
  knownCapture.set(filePath,{id,size:stat.size,mtimeMs:stat.mtimeMs});
  const ext=path.extname(filePath).toLowerCase(),d=await dims(filePath),p=await preview(filePath,id);
  const shot={id,name:path.basename(filePath),filePath,relativePath:path.relative(captureFolder,filePath),extension:ext,raw:RAW.has(ext),bytes:stat.size,capturedAt:new Date(stat.mtimeMs).toISOString(),receivedAt:iso(),width:d?.width||null,height:d?.height||null,orientation:orientation(d?.width,d?.height),previewUrl:p.previewUrl,previewFile:p.previewFile||null,analysis:null};
  shot.analysis=localAnalysis(shot);shots.unshift(shot);if(shots.length>MAX_SHOTS)shots.pop();sendEvent('capture',publicShot(shot));
  const remote=await remoteAnalysis(shot);if(remote?.analysis){shot.analysis={...shot.analysis,...remote.analysis,mode:'remote'};sendEvent('analysis',publicShot(shot));}
}

async function processExport(filePath,stat){
  const id=idFor(filePath,stat),old=knownOutput.get(filePath);if(old?.id===id)return;
  knownOutput.set(filePath,{id,size:stat.size,mtimeMs:stat.mtimeMs});
  const item={id,name:path.basename(filePath),filePath,relativePath:outputFolder?path.relative(outputFolder,filePath):path.basename(filePath),bytes:stat.size,receivedAt:iso()};
  exportsSeen.unshift(item);if(exportsSeen.length>MAX_EXPORTS)exportsSeen.pop();sendEvent('export',publicExport(item));
}

async function scanFolder(root,extensions,known,processor){
  if(!root||!fs.existsSync(root))return;
  const files=await listFiles(root,extensions);files.sort();
  for(const p of files){
    let st;try{st=await fsp.stat(p)}catch{continue}
    if(Date.now()-st.mtimeMs<900)continue;
    const old=known.get(p);if(!old||old.size!==st.size||old.mtimeMs!==st.mtimeMs)await processor(p,st);
  }
}

async function scan(){
  if(!running)return;
  await scanFolder(captureFolder,SUPPORTED,knownCapture,processCapture);
  if(outputFolder)await scanFolder(outputFolder,OUTPUT_SUPPORTED,knownOutput,processExport);
  lastScan=Date.now();
}

function state(){return{product:'High Style Match Companion',version:'0.2.0',connected:fs.existsSync(captureFolder),captureFolder,outputFolder:outputFolder||null,running,startedAt:new Date(startedAt).toISOString(),lastScan:lastScan?new Date(lastScan).toISOString():null,photosDetected:shots.length,exportsDetected:exportsSeen.length,remoteAiConfigured:Boolean(remoteUrl),latest:shots.slice(0,60).map(publicShot),latestExports:exportsSeen.slice(0,20).map(publicExport)}};

function type(filePath){return({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(filePath).toLowerCase()]||'application/octet-stream';}
async function serve(res,filePath){try{const st=await fsp.stat(filePath);if(!st.isFile())throw 0;res.writeHead(200,{'content-type':type(filePath),'cache-control':'no-store'});fs.createReadStream(filePath).pipe(res)}catch{res.writeHead(404);res.end('Not found')}}

function home(){return`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>High Style Match Companion</title><style>body{margin:0;background:#08080b;color:#f5f3f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center;min-height:100vh}.c{width:min(620px,calc(100% - 36px));border:1px solid #2b2933;background:#101015;border-radius:20px;padding:28px}.e{font:800 10px/1.2 sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ae9cff}h1{font-size:34px;letter-spacing:-.04em;margin:8px 0}p{color:#9d99a4;line-height:1.55}.s{margin:20px 0;padding:14px;border:1px solid #292731;border-radius:13px;background:#0b0b0e}.s b{display:block;margin-bottom:4px}.s span{font-size:12px;color:#8c8893;word-break:break-all}a{display:inline-block;margin-top:4px;text-decoration:none;background:#8d6cff;color:#fff;font-weight:800;border-radius:10px;padding:11px 14px}</style><body><div class="c"><div class="e">High Style Match · Live Bridge</div><h1>Companion is running.</h1><p>Leave this window or Terminal process open while you shoot. Capture One continues tethering normally; Match reads the Capture folder without moving or renaming the originals.</p><div class="s"><b>Watching Capture</b><span>${captureFolder.replace(/[&<>]/g,'')}</span></div>${outputFolder?`<div class="s"><b>Watching Output</b><span>${outputFolder.replace(/[&<>]/g,'')}</span></div>`:''}<a href="https://crossmatthew40-coder.github.io/high-style-match/capture-one/">Open High Style Match Live</a></div></body></html>`}

const server=http.createServer(async(req,res)=>{
  cors(req,res);if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  const u=new URL(req.url,`http://${req.headers.host||'127.0.0.1'}`);
  if(u.pathname==='/api/state'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(state()));return}
  if(u.pathname==='/api/events'){
    res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache','connection':'keep-alive'});res.write(`event: state\ndata: ${JSON.stringify(state())}\n\n`);clients.add(res);req.on('close',()=>clients.delete(res));return;
  }
  if(u.pathname==='/api/rescan'&&req.method==='POST'){await scan();res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(state()));return}
  if(u.pathname.startsWith('/media/')){const id=u.pathname.split('/').pop(),s=shots.find(x=>x.id===id);if(!s){res.writeHead(404);res.end();return}return serve(res,s.filePath)}
  if(u.pathname.startsWith('/preview/')){const id=u.pathname.split('/').pop(),s=shots.find(x=>x.id===id);if(!s?.previewFile){res.writeHead(404);res.end();return}return serve(res,s.previewFile)}
  if(u.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(home());return}
  res.writeHead(404);res.end('Not found');
});

server.listen(port,'127.0.0.1',()=>{
  console.log('\nHigh Style Match Companion');
  console.log(`Local bridge: http://127.0.0.1:${port}`);
  console.log(`Capture folder: ${captureFolder}`);
  console.log(`Output folder:  ${outputFolder||'not set'}`);
  console.log(remoteUrl?`Hugo endpoint:  ${remoteUrl}`:'Hugo endpoint:  local bridge mode');
});

const timer=setInterval(scan,900);scan();
function shutdown(){running=false;clearInterval(timer);for(const c of clients)try{c.end()}catch{}server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),600).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
