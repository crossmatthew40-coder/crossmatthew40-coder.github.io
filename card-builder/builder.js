const $ = id => document.getElementById(id);

const defaults = {
  slug: "new-brand",
  businessName: "Your Brand",
  displayName: "Your Brand",
  eyebrow: "Digital business card",
  personName: "",
  role: "Your role or service",
  tagline: "A short line that explains what makes the brand different.",
  logo: "",
  initials: "YB",
  theme: {
    background: "#f3efe7",
    surface: "#ffffff",
    text: "#181818",
    muted: "#6b675f",
    accent: "#181818",
    accentText: "#ffffff",
    border: "#ded8cc"
  },
  phone: "",
  phoneDisplay: "",
  whatsapp: "",
  email: "",
  website: "",
  instagram: "",
  instagramLabel: "",
  linkedin: "",
  tiktok: "",
  bookingUrl: "",
  bookingLabel: "Make an Enquiry",
  services: ["Service One", "Service Two", "Service Three"],
  review: "",
  location: "",
  gallery: [],
  footer: "Powered by High Style Cards"
};

const highStyle = {
  slug: "high-style",
  businessName: "High Style Creative",
  displayName: "High Style Creative",
  eyebrow: "Digital business card",
  personName: "",
  role: "Hospitality Photography & Content",
  tagline: "Capturing Culinary Creativity",
  logo: "../high-style-logo.svg",
  initials: "HS",
  theme: {
    background: "#050505",
    surface: "#101010",
    text: "#ffffff",
    muted: "#9a9a9a",
    accent: "#ffffff",
    accentText: "#050505",
    border: "#262626"
  },
  phone: "+447555481441",
  phoneDisplay: "07555 481441",
  whatsapp: "+447555481441",
  email: "",
  website: "",
  instagram: "https://www.instagram.com/high_style_creative/",
  instagramLabel: "@high_style_creative",
  linkedin: "",
  tiktok: "",
  bookingUrl: "../booking.html",
  bookingLabel: "Book a Shoot",
  services: ["Food Photography", "Drink Photography", "Hospitality Content", "Social Content"],
  review: "",
  location: "UK",
  gallery: [],
  footer: "Powered by High Style Cards"
};

const fields = [
  "businessName","slug","personName","role","tagline","location","logo",
  "phone","phoneDisplay","whatsapp","email","website","bookingUrl","bookingLabel",
  "instagram","instagramLabel","linkedin","tiktok","review","footer"
];
const colours = ["background","surface","text","muted","accent"];
let uploadedLogo = "";

function cleanSlug(value){
  return (value || "new-brand").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "new-brand";
}
function initials(name){
  return (name || "Your Brand").split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join("").toUpperCase();
}
function splitLines(value){
  return (value || "").split(/\n+/).map(v=>v.trim()).filter(Boolean);
}
function normalisePhone(value){
  const v=(value||"").replace(/\s+/g,"");
  if(v.startsWith("0")) return "+44"+v.slice(1);
  return v;
}
function getTheme(){
  return {
    background: $("backgroundText").value || $("background").value,
    surface: $("surfaceText").value || $("surface").value,
    text: $("textText").value || $("text").value,
    muted: $("mutedText").value || $("muted").value,
    accent: $("accentText").value || $("accent").value,
    accentText: $("accentTextColourText").value || $("accentTextColour").value,
    border: mixBorder($("surfaceText").value || $("surface").value,$("textText").value || $("text").value)
  };
}
function mixBorder(surface,text){
  // Keep export predictable without relying on browser colour APIs.
  return surface.toLowerCase()==="#ffffff" ? "#dedede" : text.toLowerCase()==="#ffffff" ? "#2a2a2a" : "#d5d5d5";
}
function getConfig(){
  const businessName = $("businessName").value.trim() || "Your Brand";
  return {
    businessName,
    displayName: businessName,
    eyebrow: "Digital business card",
    personName: $("personName").value.trim(),
    role: $("role").value.trim(),
    tagline: $("tagline").value.trim(),
    logo: uploadedLogo || $("logo").value.trim(),
    initials: initials(businessName),
    theme: getTheme(),
    phone: normalisePhone($("phone").value.trim()),
    phoneDisplay: $("phoneDisplay").value.trim() || $("phone").value.trim(),
    whatsapp: normalisePhone($("whatsapp").value.trim()),
    email: $("email").value.trim(),
    website: $("website").value.trim(),
    instagram: $("instagram").value.trim(),
    instagramLabel: $("instagramLabel").value.trim(),
    linkedin: $("linkedin").value.trim(),
    tiktok: $("tiktok").value.trim(),
    bookingUrl: $("bookingUrl").value.trim(),
    bookingLabel: $("bookingLabel").value.trim() || "Make an Enquiry",
    services: splitLines($("services").value),
    review: $("review").value.trim(),
    location: $("location").value.trim(),
    gallery: splitLines($("gallery").value),
    footer: $("footer").value.trim() || "Powered by High Style Cards"
  };
}
function getPackage(){ return { slug: cleanSlug($("slug").value), config: getConfig() }; }

function setValue(id,value){ if($(id)) $(id).value = value ?? ""; }
function setColour(name,value){
  const safe = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000";
  $(name).value=safe;
  $(name+"Text").value=safe;
}
function loadConfig(data){
  const d = data.config || data;
  uploadedLogo = "";
  setValue("slug", data.slug || d.slug || cleanSlug(d.businessName));
  fields.filter(x=>x!=="slug").forEach(id=>setValue(id,d[id]));
  setValue("services",(d.services||[]).join("\n"));
  setValue("gallery",(d.gallery||[]).join("\n"));
  const t=d.theme||defaults.theme;
  setColour("background",t.background||defaults.theme.background);
  setColour("surface",t.surface||defaults.theme.surface);
  setColour("text",t.text||defaults.theme.text);
  setColour("muted",t.muted||defaults.theme.muted);
  setColour("accent",t.accent||defaults.theme.accent);
  $("accentTextColour").value=/^#[0-9a-f]{6}$/i.test(t.accentText||"")?t.accentText:defaults.theme.accentText;
  $("accentTextColourText").value=$("accentTextColour").value;
  update();
}

function addPreviewButton(container,label,primary=false){
  const el=document.createElement("div");
  el.className="preview-btn"+(primary?" primary":"");
  el.innerHTML=`<span>${escapeHtml(label)}</span><span>→</span>`;
  container.appendChild(el);
}
function escapeHtml(str){
  return String(str||"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}
function updatePreview(c){
  const card=$("cardPreview");
  card.style.setProperty("--surface",c.theme.surface);
  card.style.setProperty("--text",c.theme.text);
  card.style.setProperty("--muted",c.theme.muted);
  card.style.setProperty("--accent",c.theme.accent);
  card.style.setProperty("--accentText",c.theme.accentText);
  card.style.setProperty("--border",c.theme.border);
  card.style.background=c.theme.background;
  card.style.color=c.theme.text;

  $("previewBusiness").textContent=c.businessName;
  $("previewPerson").textContent=c.personName;
  $("previewPerson").style.display=c.personName?"block":"none";
  $("previewRole").textContent=c.role;
  $("previewRole").style.display=c.role?"block":"none";
  $("previewTagline").textContent=c.tagline;
  $("previewTagline").style.display=c.tagline?"block":"none";
  $("previewLocation").textContent=c.location;
  $("previewLocation").style.display=c.location?"block":"none";
  $("previewFooter").textContent=c.footer;

  const logo=$("previewLogo");
  logo.style.background=c.theme.accent;
  logo.style.color=c.theme.accentText;
  if(c.logo){
    logo.innerHTML=`<img src="${escapeHtml(c.logo)}" alt="">`;
  }else{
    logo.textContent=c.initials;
  }

  const buttons=$("previewButtons"); buttons.innerHTML="";
  if(c.bookingUrl) addPreviewButton(buttons,c.bookingLabel||"Make an Enquiry",true);
  if(c.phone) addPreviewButton(buttons,"Call · "+(c.phoneDisplay||c.phone));
  if(c.whatsapp) addPreviewButton(buttons,"WhatsApp");
  if(c.email) addPreviewButton(buttons,"Email");
  if(c.instagram) addPreviewButton(buttons,c.instagramLabel||"Instagram");
  if(c.website) addPreviewButton(buttons,"Website");
  if(c.linkedin) addPreviewButton(buttons,"LinkedIn");
  if(c.tiktok) addPreviewButton(buttons,"TikTok");
  if(c.phone||c.email) addPreviewButton(buttons,"Save Contact");

  const services=$("previewServices"); services.innerHTML="";
  c.services.forEach(s=>{const chip=document.createElement("span");chip.className="chip";chip.textContent=s;services.appendChild(chip)});
  $("previewServicesWrap").style.display=c.services.length?"block":"none";
  $("previewReview").textContent=c.review;
  $("previewReviewWrap").style.display=c.review?"block":"none";
  const gallery=$("previewGallery"); gallery.innerHTML="";
  c.gallery.forEach(src=>{const img=document.createElement("img");img.src=src;img.alt="Gallery preview";gallery.appendChild(img)});
  $("previewGalleryWrap").style.display=c.gallery.length?"block":"none";
}
function updateOutput(pkg){
  $("configOutput").textContent=`"${pkg.slug}": ${JSON.stringify(pkg.config,null,2)}`;
}
function update(){
  $("slug").value=cleanSlug($("slug").value);
  const pkg=getPackage();
  updatePreview(pkg.config);
  updateOutput(pkg);
}

function syncColourPair(colourId,textId){
  $(colourId).addEventListener("input",()=>{ $(textId).value=$(colourId).value; update(); });
  $(textId).addEventListener("input",()=>{
    if(/^#[0-9a-f]{6}$/i.test($(textId).value)) $(colourId).value=$(textId).value;
    update();
  });
}

function showStatus(message,error=false){
  $("status").textContent=message;
  $("status").style.color=error?"#ef8f8f":"#9acb9a";
  clearTimeout(showStatus.timer);
  showStatus.timer=setTimeout(()=>$("status").textContent="",3200);
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true}catch(e){
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok;
  }
}

fields.forEach(id=>{ if($(id)) $(id).addEventListener("input",update); });
["services","gallery"].forEach(id=>$(id).addEventListener("input",update));
syncColourPair("background","backgroundText");
syncColourPair("surface","surfaceText");
syncColourPair("text","textText");
syncColourPair("muted","mutedText");
syncColourPair("accent","accentText");
syncColourPair("accentTextColour","accentTextColourText");

$("businessName").addEventListener("input",()=>{
  const current=$("slug").dataset.manual;
  if(!current) $("slug").value=cleanSlug($("businessName").value);
  update();
});
$("slug").addEventListener("input",()=>{$("slug").dataset.manual="1";update()});

$("logoUpload").addEventListener("change",e=>{
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  if(file.size>1500000){showStatus("Logo is quite large — use a smaller file for the final live card.",true)}
  const reader=new FileReader();
  reader.onload=()=>{uploadedLogo=reader.result;update();showStatus("Logo loaded into this draft.")};
  reader.readAsDataURL(file);
});
$("logo").addEventListener("input",()=>{uploadedLogo="";update()});

$("saveDraft").addEventListener("click",()=>{
  localStorage.setItem("highStyleCardBuilderDraft",JSON.stringify(getPackage()));
  showStatus("Draft saved on this browser.");
});
$("loadHighStyle").addEventListener("click",()=>{
  loadConfig({slug:highStyle.slug,config:highStyle});
  $("slug").dataset.manual="1";
  showStatus("High Style loaded.");
});
$("resetBuilder").addEventListener("click",()=>{
  localStorage.removeItem("highStyleCardBuilderDraft");
  $("slug").dataset.manual="";
  loadConfig({slug:defaults.slug,config:defaults});
  showStatus("Builder reset.");
});
$("copyConfig").addEventListener("click",async()=>{
  const pkg=getPackage();
  const snippet=`"${pkg.slug}": ${JSON.stringify(pkg.config,null,2)}`;
  showStatus(await copyText(snippet)?"Brand config copied.":"Could not copy automatically.",false);
});
$("downloadConfig").addEventListener("click",()=>{
  const pkg=getPackage();
  const blob=new Blob([JSON.stringify(pkg,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=pkg.slug+"-card.json";a.click();URL.revokeObjectURL(url);
  showStatus("JSON downloaded.");
});
$("copyPreviewLink").addEventListener("click",async()=>{
  const raw=JSON.stringify(getPackage());
  const encoded=btoa(unescape(encodeURIComponent(raw)));
  const url=location.origin+location.pathname+"#draft="+encoded;
  showStatus(await copyText(url)?"Builder preview link copied.":"Could not copy link.");
});

function loadFromHash(){
  if(!location.hash.startsWith("#draft="))return false;
  try{
    const raw=decodeURIComponent(escape(atob(location.hash.slice(7))));
    loadConfig(JSON.parse(raw));
    return true;
  }catch(e){return false}
}
function boot(){
  if(loadFromHash()) { showStatus("Preview draft loaded from link."); return; }
  const saved=localStorage.getItem("highStyleCardBuilderDraft");
  if(saved){
    try{loadConfig(JSON.parse(saved));showStatus("Saved draft restored.");return}catch(e){}
  }
  loadConfig({slug:highStyle.slug,config:highStyle});
  $("slug").dataset.manual="1";
}
boot();
