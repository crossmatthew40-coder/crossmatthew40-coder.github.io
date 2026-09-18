import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL="https://wmuuvcrrmzftayyynhki.supabase.co";
const SUPABASE_KEY="sb_publishable_fZGXwGrbYXEDHIj1PAxkfg_7Bh3Xkiv";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const app=document.getElementById("app"), modalRoot=document.getElementById("modalRoot");
const S={user:null,profile:null,workspace:null,member:null,route:"dashboard",projects:[],project:null,tab:"overview",photos:[],reviews:[],deliveries:[],activity:[],shotItems:[],photoUrls:new Map(),allPhotos:[],clients:[],noteTimers:new Map(),notifications:[],mfaFactor:null,reviewDetail:null,reviewFilter:"selected"};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const cleanName=s=>String(s).replace(/[^a-zA-Z0-9._-]+/g,"_").slice(0,150);
const fmtDate=s=>s?new Date(s).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"}):"—";
const statusLabel=s=>String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2600)}
function showModal(html){modalRoot.innerHTML='<div class="modal-back"><div class="modal">'+html+"</div></div>";$(".modal-back").onclick=e=>{if(e.target.classList.contains("modal-back"))closeModal()};$$("[data-close]",modalRoot).forEach(b=>b.onclick=closeModal)}
function closeModal(){modalRoot.innerHTML=""}
async function api(name,body,requiresAuth=true){
 const {data:{session}}=await supabase.auth.getSession();
 const bearer=requiresAuth?session?.access_token:SUPABASE_KEY;
 if(requiresAuth&&!bearer)throw new Error("Please sign in again.");
 const r=await fetch(SUPABASE_URL+"/functions/v1/"+name,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+bearer},body:JSON.stringify(body)});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw new Error(data.error||"Request failed");
 return data;
}
async function signed(bucket,path,seconds=3600){
 if(!path)return null;
 const key=bucket+":"+path;
 if(S.photoUrls.has(key))return S.photoUrls.get(key);
 const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,seconds);
 if(error)return null;S.photoUrls.set(key,data.signedUrl);return data.signedUrl;
}
function clientUrl(kind,token){const u=new URL(location.href);u.search="";u.hash="";u.searchParams.set(kind,token);return u.toString()}
function pageHead(title,copy,actions=""){return '<div class="page-head"><div><h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p></div><div class="actions">'+actions+"</div></div>"}
function currentStep(status){
 const map={draft:1,uploading:2,culling:3,best_picks:5,awaiting_client_review:6,client_reviewing:6,approved_for_edit:7,editing:8,ready_for_delivery:9,delivered:9,archived:9};return map[status]||1
}
function workflow(project){
 const labels=["Shot List","Upload Photos","Smart Cull","AI Vision","Best Picks","Client Review","Approved for Edit","Editing","Final Delivery"],a=currentStep(project.status);
 return '<div class="card workflow"><div class="steps">'+labels.map((x,i)=>'<div class="step '+(i+1<a?"done ":"")+(i+1===a?"active":"")+'"><div class="n">'+(i+1<a?"✓":i+1)+'</div><b>'+x+"</b></div>").join("")+"</div></div>"
}

async function init(){
 const q=new URLSearchParams(location.search);
 if(q.get("review"))return renderClient("review",q.get("review"));
 if(q.get("delivery"))return renderClient("delivery",q.get("delivery"));
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){
   location.replace("/high-style-match/sign-in/?returnTo="+encodeURIComponent("/high-style-match/app/"));
   return;
 }
 S.user=session.user;
 if(await ensureMfa()) await bootUser();
 supabase.auth.onAuthStateChange(async(_e,next)=>{
   if(!next){
     S.user=null;
     location.replace("/high-style-match/sign-in/?returnTo="+encodeURIComponent("/high-style-match/app/"));
     return;
   }
   S.user=next.user;
 })
}

async function ensureMfa(){
 try{
  const {data,error}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error)throw error;
  if(data?.nextLevel==="aal2"&&data?.currentLevel!=="aal2"){
   const {data:factors,error:fErr}=await supabase.auth.mfa.listFactors();
   if(fErr)throw fErr;
   const factor=(factors?.totp||[]).find(x=>x.status==="verified")||(factors?.phone||[]).find(x=>x.status==="verified");
   if(!factor) return true;
   S.mfaFactor=factor;renderMfaChallenge(factor);return false;
  }
  return true;
 }catch(err){
  app.innerHTML='<div class="auth-shell"><div class="card gate-card"><h2>Security check unavailable</h2><p>'+esc(err.message||String(err))+'</p><button class="btn secondary" id="mfaRetry">Try again</button></div></div>';
  $("#mfaRetry").onclick=()=>location.reload();return false;
 }
}
function renderMfaChallenge(factor){
 app.innerHTML='<div class="auth-shell"><div class="card auth-card"><section class="auth-art"><div class="auth-tag">High Style Match Security</div><div><h1>One more security check.</h1><p>This photographer account has two-step verification enabled.</p></div><div>Your project data stays locked until this check succeeds.</div></section><section class="auth-form"><div class="kicker">TWO-STEP VERIFICATION</div><h2>Enter your authenticator code</h2><p>Open your authenticator app and enter the current six-digit code.</p><form id="mfaForm" class="form-grid"><div class="field full"><label>Verification code</label><input id="mfaCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" required></div><div class="field full"><button class="btn primary" id="mfaSubmit">Verify & Open High Style Match</button></div></form><div id="mfaError" class="notice danger hidden"></div><button class="btn secondary" id="mfaSignOut" style="width:100%;margin-top:9px">Sign out</button></section></div></div>';
 $("#mfaCode").focus();
 $("#mfaForm").onsubmit=async e=>{e.preventDefault();const btn=$("#mfaSubmit"),code=$("#mfaCode").value.replace(/\D/g,"");if(code.length!==6)return showMfaError("Enter all six digits.");btn.disabled=true;try{const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:factor.id,code});if(error)throw error;await supabase.auth.refreshSession();await bootUser()}catch(err){showMfaError(err.message||String(err))}finally{btn.disabled=false}};
 $("#mfaSignOut").onclick=()=>supabase.auth.signOut({scope:"local"});
}
function showMfaError(message){const e=$("#mfaError");e.textContent=message;e.classList.remove("hidden")}
function renderAuth(signup=false,message=""){
 app.innerHTML='<div class="auth-shell"><div class="card auth-card"><section class="auth-art"><div class="auth-tag">High Style Match</div><div><h1>Shoot. Select. Approve. Edit. Deliver.</h1><p>A photography workflow built around the part that usually gets lost in emails, messages and transfer links.</p></div><div>Great photos move people.</div></section><section class="auth-form"><h2>'+(signup?"Create your account":"Welcome back")+'</h2><p>'+(signup?"Start your High Style Match workspace.":"Sign in to your photography workspace.")+'</p>'+(message?'<div class="notice success" style="margin-bottom:14px">'+esc(message)+"</div>":"")+'<form id="authForm" class="form-grid">'+(signup?'<div class="field"><label>First name</label><input id="firstName" required autocomplete="given-name"></div><div class="field"><label>Business / studio</label><input id="businessName" required autocomplete="organization"></div>':"")+'<div class="field full"><label>Email</label><input id="email" type="email" required autocomplete="email"></div><div class="field full"><label>Password</label><input id="password" type="password" minlength="8" required autocomplete="'+(signup?"new-password":"current-password")+'"></div><div class="field full"><button class="btn primary" type="submit">'+(signup?"Create account":"Sign in")+'</button></div></form><div class="auth-switch">'+(signup?'Already have an account? <button id="authSwitch">Sign in</button>':'New to High Style Match? <button id="authSwitch">Create account</button>')+"</div></section></div></div>";
 $("#authSwitch").onclick=()=>renderAuth(!signup);
 $("#authForm").onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{
   const email=$("#email").value.trim(),password=$("#password").value;
   if(signup){
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{first_name:$("#firstName").value.trim(),business_name:$("#businessName").value.trim(),display_name:$("#businessName").value.trim()||$("#firstName").value.trim()||email,account_type:"photographer",requested_role:"photographer"}}});if(error)throw error;
    if(data.session){S.user=data.user;await bootUser()}else renderAuth(false,"Account created. Check your email to confirm your address, then sign in.");
   }else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;S.user=data.user;await bootUser()}
  }catch(err){toast(err.message)}finally{btn.disabled=false}}
}

async function bootUser(){
 try{
  let member=null;
  for(let i=0;i<4&&!member;i++){const {data}=await supabase.from("hsm_workspace_members").select("workspace_id,role").eq("user_id",S.user.id).limit(1).maybeSingle();member=data;if(!member)await new Promise(r=>setTimeout(r,600))}
  if(!member)throw new Error("Your High Style workspace has not finished provisioning. Sign out and sign back in.");
  S.member=member;
  const [{data:ws,error:wse},{data:profile}]=await Promise.all([
   supabase.from("hsm_workspaces").select("*").eq("id",member.workspace_id).single(),
   supabase.from("hsm_profiles").select("*").eq("id",S.user.id).maybeSingle()
  ]);
  if(wse)throw wse;S.workspace=ws;S.profile=profile||{};
  await loadProjects();
  if(!S.profile?.onboarding_completed_at) renderOnboarding();
  else renderShell();
 }catch(err){
  app.innerHTML='<div class="auth-shell"><div class="card gate-card"><div class="kicker">ACCOUNT SETUP</div><h2>We could not open your workspace.</h2><p>'+esc(err.message||String(err))+'</p><div class="actions" style="justify-content:center"><button class="btn primary" id="retryWorkspace">Retry</button><button class="btn secondary" id="workspaceSignOut">Sign out</button></div></div></div>';
  $("#retryWorkspace").onclick=()=>location.reload();$("#workspaceSignOut").onclick=()=>supabase.auth.signOut({scope:"local"});
 }
}
function renderOnboarding(){
 app.innerHTML='<div class="auth-shell"><div class="card auth-card"><section class="auth-art"><div class="auth-tag">WELCOME TO HIGH STYLE MATCH</div><div><h1>Set up your photography workspace.</h1><p>These defaults can be changed at any time in Settings.</p></div><div>Photographer account • Private workspace • Secure client galleries</div></section><section class="auth-form"><div class="kicker">FIRST-TIME SETUP</div><h2>Make High Style Match yours</h2><p>Tell us how you normally work so new projects start with the right setup.</p><form id="onboardingForm" class="form-grid"><div class="field"><label>First name</label><input id="oFirst" value="'+esc(S.profile?.first_name||"")+'" autocomplete="given-name"></div><div class="field"><label>Last name</label><input id="oLast" value="'+esc(S.profile?.last_name||"")+'" autocomplete="family-name"></div><div class="field full"><label>Business / studio name</label><input id="oBusiness" value="'+esc(S.profile?.business_name||S.workspace.name||"")+'" required></div><div class="field"><label>Default project type</label><select id="oType"><option>food</option><option>drink</option><option>hotel</option><option>restaurant</option><option>commercial</option><option>portrait</option><option>event</option><option>street</option><option>landscape</option><option>other</option></select></div><div class="field"><label>Default workflow</label><select id="oMode"><option value="studio">Studio Mode — brief / shot list</option><option value="roam">Roam Mode — discovery</option></select></div><div class="field"><label>Client gallery expiry</label><select id="oExpiry"><option value="24">24 hours</option><option value="168" selected>7 days</option><option value="336">14 days</option><option value="720">30 days</option></select></div><div class="field"><label>Country</label><input id="oCountry" value="'+esc(S.profile?.country||"United Kingdom")+'"></div><div class="field full"><button class="btn primary" type="submit">Finish Setup & Open High Style Match</button></div></form></section></div></div>';
 $("#oType").value=S.profile?.default_project_type||"food";$("#oMode").value=S.profile?.default_mode||"studio";$("#oExpiry").value=String(S.profile?.default_gallery_expiry_hours||168);
 $("#onboardingForm").onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const patch={id:S.user.id,first_name:$("#oFirst").value.trim()||null,last_name:$("#oLast").value.trim()||null,business_name:$("#oBusiness").value.trim(),country:$("#oCountry").value.trim()||"United Kingdom",default_project_type:$("#oType").value,default_mode:$("#oMode").value,default_gallery_expiry_hours:+$("#oExpiry").value,onboarding_completed_at:new Date().toISOString()};const {error}=await supabase.from("hsm_profiles").upsert(patch);if(error)throw error;const {error:w}=await supabase.from("hsm_workspaces").update({name:patch.business_name}).eq("id",S.workspace.id);if(w)throw w;S.profile={...S.profile,...patch};S.workspace.name=patch.business_name;renderShell();toast("Workspace ready")}catch(err){toast(err.message)}finally{btn.disabled=false}}
}
async function loadProjects(){const {data,error}=await supabase.from("hsm_projects").select("*").eq("workspace_id",S.workspace.id).order("updated_at",{ascending:false});if(error)throw error;S.projects=data||[]}
function renderShell(){
 app.innerHTML='<div class="app-shell"><aside class="sidebar"><div class="brand">High Style Match<small>Photographer workspace</small></div><nav class="nav" id="nav">'+
 [["dashboard","⌂","Home"],["projects","▢","Projects"],["reviews","♡","Client Reviews"],["library","◉","Library"],["clients","♙","Clients"],["analytics","⌁","Analytics"],["ai","✦","AI Tools"],["exports","↑","Exports"],["settings","⚙","Settings"]].map(([r,i,n])=>'<button data-route="'+r+'" class="'+(S.route===r&&!S.project?"on":"")+'"><span class="ico">'+i+"</span><span>"+n+'</span>'+(r==="ai"?'<span class="soon">SOON</span>':"")+"</button>").join("")+
 '</nav><div class="sidebar-bottom"><div class="user-mini"><b>'+esc(S.profile?.business_name||S.workspace.name)+'</b><span>'+esc(S.user.email)+'</span></div><button class="btn secondary small" id="signOut" style="width:100%;margin-top:10px">Sign out</button></div></aside><main class="main"><div class="topbar"><input class="search" id="globalSearch" placeholder="Search projects, photos or clients…"><div class="top-actions"><button class="icon-btn" id="notificationsTop" title="Notifications">◌<span id="notificationDot" class="notification-dot hidden"></span></button><button class="icon-btn" id="newProjectTop" title="New project">＋</button><button class="icon-btn" id="refreshTop" title="Refresh">↻</button></div></div><div class="content" id="content"></div></main></div>';
 $$("#nav button").forEach(b=>b.onclick=()=>navigate(b.dataset.route));
 $("#signOut").onclick=()=>supabase.auth.signOut({scope:"local"});
 $("#notificationsTop").onclick=openNotifications;
 $("#newProjectTop").onclick=openNewProject;
 $("#refreshTop").onclick=async()=>{if(S.project)await openProject(S.project.id,S.tab);else{await loadProjects();renderRoute()}toast("Refreshed")};
 $("#globalSearch").oninput=e=>{if(e.target.value.trim().length>1)renderSearch(e.target.value.trim());else renderRoute()};
 loadNotificationCount();renderRoute();
}
async function loadNotificationCount(){const {data}=await supabase.from("hsm_notifications").select("id,read_at").eq("user_id",S.user.id).is("read_at",null).limit(50);const dot=$("#notificationDot");if(dot)dot.classList.toggle("hidden",!(data||[]).length)}
async function openNotifications(){
 const {data,error}=await supabase.from("hsm_notifications").select("*").eq("user_id",S.user.id).order("created_at",{ascending:false}).limit(50);if(error)return toast(error.message);S.notifications=data||[];
 showModal('<div class="modal-head"><div><div class="kicker">PHOTOGRAPHER WORKSPACE</div><h2>Notifications</h2></div><button class="close" data-close>×</button></div><div class="notification-list">'+(S.notifications.length?S.notifications.map(n=>'<button class="notification-item '+(!n.read_at?"unread":"")+'" data-notification="'+n.id+'" data-project-target="'+(n.project_id||"")+'"><b>'+esc(n.title)+'</b><span>'+esc(n.body||"")+'</span><small>'+fmtDate(n.created_at)+'</small></button>').join(""):'<div class="empty"><h3>You are all caught up</h3><p>Client approvals and final downloads will appear here.</p></div>')+'</div>');
 $$("[data-notification]",modalRoot).forEach(b=>b.onclick=async()=>{await supabase.from("hsm_notifications").update({read_at:new Date().toISOString()}).eq("id",b.dataset.notification);const pid=b.dataset.projectTarget;closeModal();loadNotificationCount();if(pid)openProject(pid,"overview")});
}
function navigate(route){S.project=null;S.reviewDetail=null;S.route=route;S.tab="overview";renderShell()}
function renderRoute(){if(S.project)return renderProject();if(S.route==="dashboard")renderDashboard();else if(S.route==="projects")renderProjects();else if(S.route==="reviews")renderClientReviews();else if(S.route==="library")renderLibrary();else if(S.route==="clients")renderClients();else if(S.route==="analytics")renderAnalytics();else if(S.route==="settings")renderSettings();else if(S.route==="ai")renderAI();else renderExports()}
async function renderDashboard(){
 const C=$("#content");C.innerHTML=pageHead("Good morning","Turn your vision into remarkable photos.",'<button class="btn primary" id="newProject">＋ New Project</button>')+'<div id="dashBody"><div class="empty">Loading your workspace…</div></div>';$("#newProject").onclick=openNewProject;
 const [{data:photos},{data:reviews}]=await Promise.all([
  supabase.from("hsm_photos").select("id,best_pick,editing_status").eq("workspace_id",S.workspace.id),
  supabase.from("hsm_client_reviews").select("id,status,hsm_projects!inner(workspace_id)").eq("hsm_projects.workspace_id",S.workspace.id)
 ]);
 const p=photos||[],r=reviews||[];$("#dashBody").innerHTML='<div class="grid stats"><div class="card stat"><label>Projects</label><strong>'+S.projects.filter(x=>x.status!=="archived").length+'</strong><span>active workspace projects</span><div class="meter"><i style="width:72%"></i></div></div><div class="card stat"><label>Photos uploaded</label><strong>'+p.length+'</strong><span>stored in High Style Match</span><div class="meter"><i style="width:90%"></i></div></div><div class="card stat"><label>Best Picks</label><strong>'+p.filter(x=>x.best_pick).length+'</strong><span>selected for review</span><div class="meter"><i style="width:65%"></i></div></div><div class="card stat"><label>Awaiting edit</label><strong>'+p.filter(x=>x.editing_status==="awaiting_edit").length+'</strong><span>approved by clients</span><div class="meter"><i style="width:45%"></i></div></div></div><div class="grid two" style="margin-top:14px"><section class="card panel"><div class="panel-head"><div><h2>Recent Projects</h2><p class="sub">Continue where you left off.</p></div><button class="btn secondary small" id="allProjects">View all</button></div>'+(S.projects.length?'<div class="grid project-grid">'+S.projects.slice(0,4).map(projectCard).join("")+"</div>":'<div class="empty"><h3>Create your first project</h3><p>Projects hold the photos, approvals, editing notes and final delivery together.</p><button class="btn primary" id="emptyCreate">New Project</button></div>')+'</section><aside class="card panel"><div class="panel-head"><div><h2>Client Reviews</h2><p class="sub">Live approval status.</p></div><button class="btn secondary small" id="allReviews">View all</button></div><div class="review-list">'+(r.length?r.slice(0,6).map(x=>'<div class="review-row"><b>'+statusLabel(x.status)+'</b><span>Secure gallery</span><span></span><span class="pill '+(x.status==="submitted"?"green":"blue")+'">'+statusLabel(x.status)+'</span></div>').join(""):'<div class="notice">No client reviews sent yet.</div>')+"</div></aside></div>";
 $("#allProjects").onclick=()=>navigate("projects");$("#allReviews")?.addEventListener("click",()=>navigate("reviews"));$("#emptyCreate")?.addEventListener("click",openNewProject);wireProjectCards();
}
function projectCard(p){return '<article class="card project-card" data-project="'+p.id+'"><div class="project-cover">High Style Match</div><h3>'+esc(p.name)+'</h3><div class="meta">'+esc(statusLabel(p.project_type))+(p.shoot_date?" • "+esc(p.shoot_date):"")+'</div><span class="status">'+esc(statusLabel(p.status))+"</span></article>"}
function wireProjectCards(){$$("[data-project]").forEach(x=>x.onclick=()=>openProject(x.dataset.project))}
function renderProjects(){const C=$("#content");C.innerHTML=pageHead("Projects","Every shoot, review and delivery in one place.",'<button class="btn primary" id="newProject">＋ New Project</button>')+(S.projects.length?'<div class="grid project-grid">'+S.projects.map(projectCard).join("")+"</div>":'<div class="empty"><h3>No projects yet</h3><p>Create a project and upload your first shoot.</p></div>');$("#newProject").onclick=openNewProject;wireProjectCards()}
function openNewProject(){
 showModal('<div class="modal-head"><h2>New Project</h2><button class="close" data-close>×</button></div><form id="projectForm" class="form-grid"><div class="field full"><label>Project name</label><input id="pName" required placeholder="Autumn Menu Shoot"></div><div class="field"><label>Project type</label><select id="pType"><option>food</option><option>drink</option><option>hotel</option><option>restaurant</option><option>property</option><option>portrait</option><option>event</option><option>street</option><option>landscape</option><option>commercial</option><option>other</option></select></div><div class="field"><label>Workflow mode</label><select id="pMode"><option value="studio">Studio Mode — shot list / brief</option><option value="roam">Roam Mode — discovery photography</option></select></div><div class="field"><label>Shoot date</label><input id="pDate" type="date"></div><div class="field"><label>Location</label><input id="pLocation" placeholder="Manchester"></div><div class="field"><label>Client name</label><input id="pClient"></div><div class="field"><label>Client email</label><input id="pClientEmail" type="email"></div><div class="field full"><label>Description</label><textarea id="pDescription" placeholder="What is this shoot for?"></textarea></div><div class="field full"><div class="actions" style="justify-content:flex-end"><button type="button" class="btn secondary" data-close>Cancel</button><button class="btn primary" type="submit">Create Project</button></div></div></form>');
 $("#pType").value=S.profile?.default_project_type||"food";$("#pMode").value=S.profile?.default_mode||"studio";
 $("#projectForm").onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{
   let clientId=null;const cn=$("#pClient").value.trim(),ce=$("#pClientEmail").value.trim();
   if(cn||ce){const {data:c,error}=await supabase.from("hsm_clients").insert({workspace_id:S.workspace.id,name:cn||ce, email:ce||null}).select("id").single();if(error)throw error;clientId=c.id}
   const {data:p,error}=await supabase.from("hsm_projects").insert({workspace_id:S.workspace.id,photographer_id:S.user.id,client_id:clientId,name:$("#pName").value.trim(),project_type:$("#pType").value,mode:$("#pMode").value,shoot_date:$("#pDate").value||null,location:$("#pLocation").value.trim()||null,description:$("#pDescription").value.trim()||null,status:"draft"}).select("*").single();if(error)throw error;
   await logActivity(p,"project_created",{mode:p.mode});closeModal();await loadProjects();await openProject(p.id,"overview");toast("Project created");
  }catch(err){toast(err.message)}finally{btn.disabled=false}}
}
async function logActivity(project,type,data={}){await supabase.from("hsm_activity_logs").insert({workspace_id:project.workspace_id,project_id:project.id,actor_type:"photographer",actor_id:S.user.id,activity_type:type,activity_data:data})}

async function openProject(id,tab="overview"){
 const {data:p,error}=await supabase.from("hsm_projects").select("*").eq("id",id).single();if(error)return toast(error.message);
 S.project=p;S.tab=tab;await loadProjectData();renderShell()
}
async function loadProjectData(){
 S.photoUrls.clear();
 const [ph,rv,dl,ac,sh]=await Promise.all([
  supabase.from("hsm_photos").select("*").eq("project_id",S.project.id).order("created_at"),
  supabase.from("hsm_client_reviews").select("*").eq("project_id",S.project.id).order("created_at",{ascending:false}),
  supabase.from("hsm_deliveries").select("*").eq("project_id",S.project.id).order("created_at",{ascending:false}),
  supabase.from("hsm_activity_logs").select("*").eq("project_id",S.project.id).order("created_at",{ascending:false}).limit(50),
  supabase.from("hsm_shot_list_items").select("*").eq("project_id",S.project.id).order("sort_order")
 ]);S.photos=ph.data||[];S.reviews=rv.data||[];S.deliveries=dl.data||[];S.activity=ac.data||[];S.shotItems=sh.data||[];
 for(const p of S.photos){if(p.proof_path||p.preview_path)p._url=await signed("hsm-proofs",p.proof_path||p.preview_path)}
}
function renderProject(){
 const C=$("#content"),p=S.project;
 const tabs=[["overview","Overview"],["shotlist",p.mode==="roam"?"Roam Targets":"Shot List"],["upload","Upload"],["cull","Smart Cull"],["aiVision","AI Vision"],["best","Best Picks"],["review","Client Review"],["approved","Approved for Edit"],["editing","Editing"],["delivery","Final Delivery"]];
 C.innerHTML=pageHead(p.name,statusLabel(p.project_type)+" • "+statusLabel(p.mode)+" • "+statusLabel(p.status),'<button class="btn secondary" id="duplicateProject">Duplicate</button><button class="btn secondary" id="archiveProject">'+(p.status==="archived"?"Restore":"Archive")+'</button><button class="btn secondary" id="backProjects">← Projects</button>')+workflow(p)+'<div class="tabs">'+tabs.map(([id,n])=>'<button data-tab="'+id+'" class="'+(S.tab===id?"on":"")+'">'+n+(id==="aiVision"?' · Soon':"")+"</button>").join("")+'</div><div id="projectBody"></div>';
 $("#backProjects").onclick=()=>navigate("projects");$$("[data-tab]").forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;renderProject()});
 if(S.tab==="overview")renderOverview();else if(S.tab==="shotlist")renderShotList();else if(S.tab==="upload")renderUpload();else if(S.tab==="cull")renderCull();else if(S.tab==="best")renderBest();else if(S.tab==="review")renderReview();else if(S.tab==="approved")renderApproved();else if(S.tab==="editing")renderEditing();else if(S.tab==="delivery")renderDelivery();else renderComingSoon("AI Vision")
}
async function duplicateCurrentProject(){
 if(!S.project)return;const source=S.project;try{
  const {data:p,error}=await supabase.from("hsm_projects").insert({workspace_id:source.workspace_id,photographer_id:S.user.id,client_id:source.client_id,name:source.name+" Copy",project_type:source.project_type,mode:source.mode,shoot_date:null,location:source.location,description:source.description,status:"draft"}).select("*").single();if(error)throw error;
  if(S.shotItems.length){const rows=S.shotItems.map((x,i)=>({project_id:p.id,title:x.title,description:x.description,required_orientation:x.required_orientation,category:x.category,sort_order:i,completed:false}));const {error:sErr}=await supabase.from("hsm_shot_list_items").insert(rows);if(sErr)throw sErr}
  await logActivity(p,"project_duplicated",{source_project_id:source.id});await loadProjects();await openProject(p.id,"overview");toast("Project duplicated")
 }catch(err){toast(err.message)}
}
async function toggleArchiveCurrentProject(){
 if(!S.project)return;const archive=S.project.status!=="archived";if(archive&&!confirm("Archive this project? It will remain searchable and can be restored."))return;
 const patch=archive?{status:"archived",archived_at:new Date().toISOString()}:{status:"draft",archived_at:null};const {error}=await supabase.from("hsm_projects").update(patch).eq("id",S.project.id);if(error)return toast(error.message);await loadProjects();await openProject(S.project.id,"overview");toast(archive?"Project archived":"Project restored")
}
function renderOverview(){
 const B=$("#projectBody"),p=S.project,picks=S.photos.filter(x=>x.best_pick).length,approved=S.photos.filter(x=>x.editing_status==="awaiting_edit"||x.editing_status==="editing"||x.editing_status==="complete").length;
 B.innerHTML='<div class="grid stats"><div class="card stat"><label>Photos</label><strong>'+S.photos.length+'</strong><span>uploaded</span><div class="meter"><i style="width:90%"></i></div></div><div class="card stat"><label>Best Picks</label><strong>'+picks+'</strong><span>selected</span><div class="meter"><i style="width:65%"></i></div></div><div class="card stat"><label>Client Reviews</label><strong>'+S.reviews.length+'</strong><span>sent</span><div class="meter"><i style="width:55%"></i></div></div><div class="card stat"><label>Approved</label><strong>'+approved+'</strong><span>for editing</span><div class="meter"><i style="width:45%"></i></div></div></div><div class="grid two" style="margin-top:14px"><section class="card panel"><div class="panel-head"><div><h2>Next action</h2><p class="sub">High Style Match keeps the project moving through one clear workflow.</p></div></div><div class="notice">'+(S.photos.length===0?"Upload photographs to begin.":picks===0?"Choose the images you want to send as Best Picks.":!S.reviews.length?"Your Best Picks are ready to send to the client.":p.status==="approved_for_edit"?"The client's approved photographs are ready for editing.":"Continue the workflow from the active stage.")+'</div><div class="actions" style="margin-top:14px"><button class="btn primary" id="nextAction">'+(S.photos.length===0?"Upload Photos":picks===0?"Open Best Picks":!S.reviews.length?"Send Client Review":p.status==="approved_for_edit"?"Approved for Edit":"Continue Workflow")+'</button></div></section><aside class="card panel"><div class="panel-head"><div><h2>Activity</h2><p class="sub">Project events are stored in the cloud.</p></div></div><div class="activity">'+(S.activity.length?S.activity.slice(0,8).map(a=>'<div class="activity-row"><b>'+esc(statusLabel(a.activity_type))+'</b><span>'+fmtDate(a.created_at)+"</span></div>").join(""):'<div class="notice">No activity yet.</div>')+"</div></aside></div>";
 $("#nextAction").onclick=()=>{S.tab=S.photos.length===0?"upload":picks===0?"best":!S.reviews.length?"review":p.status==="approved_for_edit"?"approved":"best";renderProject()}
}
function renderComingSoon(name){$("#projectBody").innerHTML='<div class="card panel"><div class="empty"><h3>'+esc(name)+' — Coming Soon</h3><p>This section is intentionally labelled Coming Soon rather than pretending the AI analysis is already running. The production data, review and delivery pipeline is live first.</p></div></div>'}

function renderShotList(){
 const B=$("#projectBody"),roam=S.project.mode==="roam";
 B.innerHTML='<div class="grid two"><section class="card panel"><div class="panel-head"><div><h2>'+(roam?"Roam Targets":"Shot List")+'</h2><p class="sub">'+(roam?"Roam Mode does not require a fixed brief. Add optional targets if there are subjects or locations you still want to cover.":"Build the brief the shoot should cover. Each line stays attached to the project.")+'</p></div><button class="btn primary" id="addShot">＋ Add Item</button></div><div class="shot-list">'+(S.shotItems.length?S.shotItems.map((s,i)=>'<div class="shot-row"><button class="shot-check '+(s.completed?"done":"")+'" data-shot-complete="'+s.id+'">'+(s.completed?"✓":"")+'</button><div><b>'+esc(s.title)+'</b><span>'+esc(s.description||s.category||"")+'</span></div><span class="pill">'+(s.required_orientation?esc(statusLabel(s.required_orientation)):"Any")+'</span><button class="btn secondary small" data-shot-delete="'+s.id+'">Delete</button></div>').join(""):'<div class="empty"><h3>'+(roam?"No targets added":"No shot-list items yet")+'</h3><p>'+(roam?"That is fine in Roam Mode — the shoot can stay discovery-led.":"Add items manually or paste a list to import the brief.")+'</p></div>')+'</div></section><aside class="card panel"><div class="panel-head"><div><h2>Quick Import</h2><p class="sub">Paste one required shot per line.</p></div></div><textarea id="shotImport" class="big-textarea" placeholder="Burger hero\nCocktail overhead\nRestaurant interior\nTeam portrait"></textarea><div class="actions" style="margin-top:12px"><button class="btn primary" id="importShots">Import List</button></div><div class="notice" style="margin-top:14px">'+S.shotItems.filter(x=>x.completed).length+' of '+S.shotItems.length+' items marked complete.</div></aside></div>';
 $("#addShot").onclick=()=>openShotItem();
 $("#importShots").onclick=async()=>{const lines=$("#shotImport").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return toast("Paste at least one shot first.");const start=S.shotItems.length;const rows=lines.map((title,i)=>({project_id:S.project.id,title,sort_order:start+i}));const {error}=await supabase.from("hsm_shot_list_items").insert(rows);if(error)return toast(error.message);await loadProjectData();renderShotList();toast(lines.length+" shot-list items imported")};
 $$("[data-shot-complete]").forEach(b=>b.onclick=async()=>{const s=S.shotItems.find(x=>x.id===b.dataset.shotComplete);const {error}=await supabase.from("hsm_shot_list_items").update({completed:!s.completed}).eq("id",s.id);if(error)return toast(error.message);s.completed=!s.completed;renderShotList()});
 $$("[data-shot-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("Delete this shot-list item?"))return;const {error}=await supabase.from("hsm_shot_list_items").delete().eq("id",b.dataset.shotDelete);if(error)return toast(error.message);await loadProjectData();renderShotList()})
}
function openShotItem(){
 showModal('<div class="modal-head"><h2>Add Shot-List Item</h2><button class="close" data-close>×</button></div><form id="shotForm" class="form-grid"><div class="field full"><label>Title</label><input id="shotTitle" required placeholder="Burger hero"></div><div class="field"><label>Orientation</label><select id="shotOrientation"><option value="">Any</option><option value="landscape">Landscape</option><option value="portrait">Portrait</option><option value="overhead">Overhead</option></select></div><div class="field"><label>Category</label><input id="shotCategory" placeholder="Food / Drink / Interior"></div><div class="field full"><label>Notes</label><textarea id="shotNotes"></textarea></div><div class="field full"><button class="btn primary">Add Item</button></div></form>');
 $("#shotForm").onsubmit=async e=>{e.preventDefault();const {error}=await supabase.from("hsm_shot_list_items").insert({project_id:S.project.id,title:$("#shotTitle").value.trim(),required_orientation:$("#shotOrientation").value||null,category:$("#shotCategory").value.trim()||null,description:$("#shotNotes").value.trim()||null,sort_order:S.shotItems.length});if(error)return toast(error.message);closeModal();await loadProjectData();renderShotList();toast("Shot-list item added")}
}

function hamming(a,b){let d=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])d++;return d+Math.abs(a.length-b.length)}
async function analyzeProof(url){
 return await new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{try{const size=128,c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true});c.width=size;c.height=size;ctx.drawImage(im,0,0,size,size);const d=ctx.getImageData(0,0,size,size).data;let lum=0,edges=0,count=0;const gray=new Uint8Array(size*size);for(let i=0,j=0;i<d.length;i+=4,j++){const g=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];gray[j]=g;lum+=g}for(let y=1;y<size;y++)for(let x=1;x<size;x++){const i=y*size+x;edges+=Math.abs(gray[i]-gray[i-1])+Math.abs(gray[i]-gray[i-size]);count+=2}const brightness=lum/(size*size);const sharp=edges/Math.max(1,count);let score=65-Math.min(45,Math.abs(brightness-128)*.38)+Math.min(35,sharp*1.8);score=Math.max(0,Math.min(100,score));let hash="";for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){let s=0,n=0;for(let y=by*16;y<(by+1)*16;y+=4)for(let x=bx*16;x<(bx+1)*16;x+=4){s+=gray[y*size+x];n++}hash+=(s/n)>brightness?"1":"0"}resolve({score:Math.round(score),brightness:Math.round(brightness),sharpness:+sharp.toFixed(2),hash})}catch(e){reject(e)}};im.onerror=reject;im.src=url});
}
async function runSmartCull(){
 if(!S.photos.length)return toast("Upload photos first.");
 const usable=S.photos.filter(p=>p._url);if(!usable.length)return toast("No browser-compatible proof images are ready yet.");
 const btn=$("#runCull");if(btn){btn.disabled=true;btn.textContent="Analysing…"}
 const results=[];
 for(let i=0;i<usable.length;i++){const p=usable[i];try{const a=await analyzeProof(p._url);results.push({p,a});const prog=$("#cullProgress");if(prog)prog.textContent="Analysed "+(i+1)+" of "+usable.length}catch(e){results.push({p,a:{score:50,brightness:null,sharpness:null,hash:""}})}}
 results.sort((x,y)=>y.a.score-x.a.score);
 const duplicateIds=new Set();
 for(let i=0;i<results.length;i++)for(let j=i+1;j<results.length;j++){if(results[i].a.hash&&results[j].a.hash&&hamming(results[i].a.hash,results[j].a.hash)<=3)duplicateIds.add(results[j].p.id)}
 for(const {p,a} of results){
   let bucket=duplicateIds.has(p.id)?"duplicate":a.score>=72?"best_pick":a.score>=58?"strong_option":a.score>=42?"review":"reject";
   const best=bucket==="best_pick";
   await supabase.from("hsm_photos").update({cull_bucket:bucket,best_pick:best,ai_analysis:{...(p.ai_analysis||{}),local_cull:{score:a.score,brightness:a.brightness,sharpness:a.sharpness,duplicate:duplicateIds.has(p.id),analysed_at:new Date().toISOString()}}}).eq("id",p.id);
 }
 await supabase.from("hsm_projects").update({status:"best_picks"}).eq("id",S.project.id);await logActivity(S.project,"smart_cull_completed",{analysed:results.length,duplicates:duplicateIds.size});await openProject(S.project.id,"cull");toast("Smart Cull complete")
}
function renderCull(){
 const B=$("#projectBody"),groups=["best_pick","strong_option","review","duplicate","reject"],counts=Object.fromEntries(groups.map(g=>[g,S.photos.filter(p=>p.cull_bucket===g).length]));
 B.innerHTML='<section class="card panel"><div class="panel-head"><div><h2>Smart Cull</h2><p class="sub">A working local image-quality pass checks brightness, edge detail and near-duplicate similarity. It never deletes originals and you can override every result in Best Picks.</p></div><button class="btn primary" id="runCull">'+(S.photos.some(p=>p.cull_bucket)?"Run Again":"Run Smart Cull")+'</button></div><div class="grid stats cull-stats">'+groups.map(g=>'<div class="card stat"><label>'+statusLabel(g)+'</label><strong>'+counts[g]+'</strong><span>photos</span></div>').join("")+'</div><div id="cullProgress" class="notice" style="margin-top:14px">'+(S.photos.some(p=>p.cull_bucket)?"Last cull results are saved to this project.":"Ready to analyse "+S.photos.filter(p=>p._url).length+" proof images.")+'</div><div class="photo-grid" style="margin-top:14px">'+S.photos.map(p=>photoCard(p,"cull")).join("")+'</div></section>';
 $("#runCull").onclick=runSmartCull
}

function renderUpload(){
 const B=$("#projectBody");B.innerHTML='<section class="card panel"><div class="panel-head"><div><h2>Upload Photos</h2><p class="sub">Original files stay private. Browser-compatible proof JPEGs are generated for JPEG, PNG and WebP uploads.</p></div></div><div class="upload-zone" id="drop"><h3>Drop your photographs here</h3><p>JPEG, PNG, WebP and common RAW files are accepted. RAW originals are preserved; automated RAW preview extraction is marked Coming Soon.</p><input id="fileInput" type="file" multiple accept="image/jpeg,image/png,image/webp,.cr3,.cr2,.nef,.arw,.dng,.raf,.orf,.rw2,.tif,.tiff,.heic" hidden><button class="btn primary" id="chooseFiles">Choose Photos</button></div><div class="queue" id="queue"></div></section>';
 const inp=$("#fileInput"),drop=$("#drop");$("#chooseFiles").onclick=()=>inp.click();inp.onchange=()=>uploadFiles([...inp.files]);
 ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag")}));["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag")}));drop.addEventListener("drop",e=>uploadFiles([...e.dataTransfer.files]));
}
async function makeProof(file){
 if(!file.type.startsWith("image/")||!["image/jpeg","image/png","image/webp"].includes(file.type))return null;
 const bmp=await createImageBitmap(file),max=1800,scale=Math.min(1,max/Math.max(bmp.width,bmp.height)),w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale));
 const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(bmp,0,0,w,h);bmp.close();
 const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",.86));return {blob,w,h}
}
async function uploadFiles(files){
 if(!files.length)return;const q=$("#queue");await supabase.from("hsm_projects").update({status:"uploading"}).eq("id",S.project.id);
 for(const file of files){
  const id=crypto.randomUUID(),row=document.createElement("div");row.className="queue-row";row.innerHTML='<div class="name">'+esc(file.name)+'</div><div class="progress"><i style="width:4%"></i></div><div class="pct">Starting</div>';q.appendChild(row);const bar=$("i",row),pct=$(".pct",row);
  try{
   const base=S.workspace.id+"/"+S.project.id+"/"+id+"_"+cleanName(file.name);bar.style.width="22%";pct.textContent="Original";
   const {error:uErr}=await supabase.storage.from("hsm-originals").upload(base,file,{upsert:false,contentType:file.type||"application/octet-stream"});if(uErr)throw uErr;
   let proofPath=null,dims={w:null,h:null};bar.style.width="50%";pct.textContent="Preview";
   try{const proof=await makeProof(file);if(proof){proofPath=S.workspace.id+"/"+S.project.id+"/"+id+".jpg";dims={w:proof.w,h:proof.h};const {error:pErr}=await supabase.storage.from("hsm-proofs").upload(proofPath,proof.blob,{upsert:true,contentType:"image/jpeg"});if(pErr)throw pErr}}catch(e){console.warn("proof",e)}
   bar.style.width="78%";pct.textContent="Saving";
   const {error:iErr}=await supabase.from("hsm_photos").insert({id,project_id:S.project.id,workspace_id:S.workspace.id,original_filename:file.name,display_filename:file.name,original_path:base,proof_path:proofPath,preview_path:proofPath,thumbnail_path:proofPath,mime_type:file.type||null,width:dims.w,height:dims.h,file_size:file.size,upload_status:"uploaded",processing_status:proofPath?"ready":"pending"});if(iErr)throw iErr;
   bar.style.width="100%";pct.textContent="Done";
  }catch(err){pct.textContent="Failed";row.classList.add("danger");toast(file.name+": "+err.message)}
 }
 await supabase.from("hsm_projects").update({status:"best_picks"}).eq("id",S.project.id);await logActivity(S.project,"photos_uploaded",{count:files.length});await openProject(S.project.id,"best")
}

function photoCard(p,mode="best"){
 const url=p._url,raw=!url;return '<article class="card photo-card" data-photo="'+p.id+'"><div class="photo-media">'+(url?'<img src="'+esc(url)+'" alt="" loading="lazy">':'<div><b>'+esc(p.original_filename.split(".").pop().toUpperCase())+'</b><br><small>Preview processing '+(p.processing_status==="pending"?"pending":"unavailable")+"</small></div>")+(p.best_pick?'<span class="badge">Best Pick</span>':"")+'</div><div class="photo-body"><div class="photo-name">'+esc(p.display_filename||p.original_filename)+'</div><div class="photo-meta">'+(p.width?p.width+" × "+p.height+" • ":"")+statusLabel(p.editing_status)+'</div><div class="star-row">'+[1,2,3,4,5].map(n=>'<button class="star '+(p.rating>=n?"on":"")+'" data-rate="'+n+'" data-id="'+p.id+'">★</button>').join("")+'</div>'+(mode==="best"?'<div class="photo-actions"><button class="btn small '+(p.best_pick?"pick":"secondary")+'" data-pick="'+p.id+'">'+(p.best_pick?"✓ Best Pick":"☆ Best Pick")+"</button></div>":"")+"</div></article>"
}
function renderBest(){
 const B=$("#projectBody"),picks=S.photos.filter(x=>x.best_pick);B.innerHTML='<section class="card panel"><div class="panel-head"><div><h2>Best Picks</h2><p class="sub">Choose the photographs worth putting in front of the client.</p></div><div class="actions"><span class="pill blue">'+picks.length+" selected</span>"+(picks.length?'<button class="btn primary" id="sendPicks">↗ Send to Client</button>':"")+'</div></div>'+(S.photos.length?'<div class="photo-grid">'+S.photos.map(p=>photoCard(p)).join("")+"</div>":'<div class="empty"><h3>No photos yet</h3><p>Upload photographs first.</p><button class="btn primary" id="goUpload">Upload Photos</button></div>')+"</section>";
 $("#goUpload")?.addEventListener("click",()=>{S.tab="upload";renderProject()});$("#sendPicks")?.addEventListener("click",openSendReview);
 $$("[data-pick]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const p=S.photos.find(x=>x.id===b.dataset.pick),v=!p.best_pick;const {error}=await supabase.from("hsm_photos").update({best_pick:v,cull_bucket:v?"best_pick":null}).eq("id",p.id);if(error)return toast(error.message);p.best_pick=v;renderBest()});
 $$("[data-rate]").forEach(b=>b.onclick=async()=>{const p=S.photos.find(x=>x.id===b.dataset.id),n=+b.dataset.rate;await supabase.from("hsm_photos").update({rating:n}).eq("id",p.id);p.rating=n;renderBest()})
}
async function getProjectClient(){
 if(!S.project?.client_id)return null;
 const {data,error}=await supabase.from("hsm_clients").select("*").eq("id",S.project.client_id).maybeSingle();
 if(error)return null;return data||null
}
async function openSendReview(){
 const picks=S.photos.filter(x=>x.best_pick);if(!picks.length)return toast("Choose at least one Best Pick first.");
 const client=await getProjectClient(),latest=S.reviews[0];
 const recipientName=client?.name||latest?.recipient_name||"";
 const recipientEmail=client?.email||latest?.recipient_email||"";
 const senderEmail=S.user?.email||"";
 const profileName=[S.profile?.first_name,S.profile?.last_name].filter(Boolean).join(" ").trim();
 const senderName=profileName||S.profile?.business_name||S.user?.email||"Your photographer";
 const expiry=String(S.profile?.default_gallery_expiry_hours||168);
 const thumb=picks.slice(0,5).map((p,i)=>p._url?'<img src="'+esc(p._url)+'" alt="">':'<span>'+(i+1)+'</span>').join("");
 showModal('<div class="modal-head transfer-modal-head"><div><div class="kicker">HIGH STYLE TRANSFER</div><h2>Send Client Review</h2><p class="sub">A private review link and fresh verification code will be emailed to your client.</p></div><button class="close" data-close>×</button></div>'+
 '<div class="transfer-shell">'+
   '<form id="reviewForm" class="transfer-form">'+
    '<div class="transfer-row"><label>Your email</label><input id="rSenderEmail" type="email" required value="'+esc(senderEmail)+'" placeholder="you@studio.com"></div>'+
    '<div class="transfer-row"><label>Send to</label><input id="rEmail" type="email" required value="'+esc(recipientEmail)+'" placeholder="client@company.com"></div>'+
    '<div class="transfer-row"><label>Client name</label><input id="rName" value="'+esc(recipientName)+'" placeholder="Client name"></div>'+
    '<div class="transfer-project"><div><span>Project</span><b>'+esc(S.project.name)+'</b></div><strong>'+picks.length+' photos</strong></div>'+
    '<div class="transfer-row"><label>Message</label><textarea id="rMessage" rows="4">Hi, here are the photographs from our shoot. Please select the images you would like edited.</textarea></div>'+
    '<div class="transfer-options"><div class="field"><label>Review expires</label><select id="rExpiry"><option value="24">24 hours</option><option value="168">7 days</option><option value="336">14 days</option><option value="720">30 days</option></select></div><div class="field"><label>Proof watermark</label><select id="rWatermark"><option value="yes">On</option><option value="no">Off</option></select></div></div>'+
    '<button class="btn primary transfer-send" type="submit"><span>Send Review</span><span>→</span></button>'+
    '<p class="transfer-small">The client receives a High Style Match email from our secure delivery system. Replies go directly to <b id="replyPreview">'+esc(senderEmail||"your email")+'</b>.</p>'+
   '</form>'+
   '<aside class="transfer-visual">'+
    '<div class="transfer-visual-top"><div><div class="kicker">CLIENT WILL RECEIVE</div><h3>'+esc(senderName)+' sent you a photo review.</h3><p>'+esc(S.project.name)+'</p></div><div class="transfer-badge">Secure</div></div>'+
    '<div class="transfer-thumb-stack">'+thumb+'</div>'+
    '<div class="transfer-preview-message"><span>'+picks.length+' photographs</span><b>View Your Photographs</b></div>'+
    '<div class="transfer-code-preview"><div class="kicker">VERIFICATION CODE</div><div><i>4</i><i>8</i><i>2</i><i>6</i><i>9</i><i>1</i></div><p>A brand-new code is generated every time you send or resend.</p></div>'+
   '</aside>'+
 '</div><div id="reviewResult"></div>');
 $(".modal").classList.add("transfer-modal");
 $("#rExpiry").value=["24","168","336","720"].includes(expiry)?expiry:"168";
 $("#rSenderEmail").oninput=()=>{$("#replyPreview").textContent=$("#rSenderEmail").value.trim()||"your email"};
 $("#reviewForm").onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;const old=btn.innerHTML;btn.innerHTML='<span>Sending securely…</span><span>↗</span>';try{
   const sender=$("#rSenderEmail").value.trim().toLowerCase(),recipient=$("#rEmail").value.trim().toLowerCase(),name=$("#rName").value.trim();
   if(!sender||!recipient)throw new Error("Enter both your email and the client's email.");
   if(S.project.client_id){
     const {error:clientErr}=await supabase.from("hsm_clients").update({name:name||recipient,email:recipient}).eq("id",S.project.client_id);
     if(clientErr)throw clientErr;
   }
   const data=await api("hsm-create-review",{project_id:S.project.id,photo_ids:picks.map(x=>x.id),sender_email:sender,sender_name:senderName,recipient_email:recipient,recipient_name:name||null,message:$("#rMessage").value.trim(),gallery_expires_hours:+$("#rExpiry").value,watermark_enabled:$("#rWatermark").value==="yes"});
   const link=clientUrl("review",data.gallery_token);
   $("#reviewResult").innerHTML='<div class="transfer-success"><div class="transfer-success-mark">✓</div><div><div class="kicker">REVIEW CREATED</div><h3>'+(data.email_status==="sent"?'Sent to '+esc(recipient):'Secure review ready')+'</h3><p>'+(data.email_status==="sent"?'The client has been emailed a private review link and a new six-digit verification code.':'Transactional email is not configured yet. Use the test code below until the email provider is connected.')+'</p>'+(data.test_code?'<strong class="test-code">'+esc(data.test_code)+'</strong>':'')+'</div><div class="actions"><button class="btn primary" type="button" id="openReviewLink">Open Client Gallery</button><button class="btn secondary" type="button" id="copyReviewLink">Copy Link</button></div></div>';
   $("#openReviewLink").onclick=()=>window.open(link,"_blank");$("#copyReviewLink").onclick=()=>navigator.clipboard.writeText(link).then(()=>toast("Link copied"));await loadProjectData();
 }catch(err){toast(err.message)}finally{btn.disabled=false;btn.innerHTML=old}}
}
async function renderReview(){
 const B=$("#projectBody"),client=await getProjectClient(),picks=S.photos.filter(x=>x.best_pick);
 const latest=S.reviews[0];
 const recipientEmail=client?.email||latest?.recipient_email||"No client email saved";
 const recipientName=client?.name||latest?.recipient_name||"Client";
 B.innerHTML='<section class="card panel"><div class="panel-head"><div><h2>Client Review</h2><p class="sub">Selection only — clients cannot download proof images.</p></div><div class="actions"><button class="btn secondary" id="previewClientReview">◉ Preview Client View</button><button class="btn primary" id="newReview" '+(!picks.length?'disabled':'')+'>↗ Send Client Review</button></div></div>'+
 '<div class="review-send-card"><div><div class="kicker">REVIEW RECIPIENT</div><h3>'+esc(recipientName)+'</h3><p>'+esc(recipientEmail)+'</p></div><div class="review-send-meta"><b>'+picks.length+'</b><span>Best Picks ready</span></div></div>'+
 (S.reviews.length?'<div class="review-list">'+S.reviews.map(r=>'<div class="review-row"><div><b>'+esc(r.recipient_name||r.recipient_email)+'</b><span>'+esc(r.recipient_email)+" • "+fmtDate(r.created_at)+'</span></div><span>'+statusLabel(r.status)+'</span><span>'+esc(r.email_status)+'</span><div class="actions"><button class="btn secondary small" data-open-review="'+r.gallery_token+'">Open</button><button class="btn secondary small" data-view-review="'+r.id+'">Results</button>'+(r.status==="submitted"?'<button class="btn secondary small" data-reopen-review="'+r.id+'">Reopen</button>':"")+(r.status!=="revoked"?'<button class="btn danger small" data-revoke-review="'+r.id+'">Revoke</button>':"")+'</div></div>').join("")+"</div>":'<div class="empty"><h3>No review has been sent</h3><p>Select Best Picks, confirm the client email above and send a secure review.</p></div>')+"</section>";
 $("#newReview").onclick=openSendReview;$("#previewClientReview").onclick=previewClientReview;
 $$("[data-open-review]").forEach(b=>b.onclick=()=>window.open(clientUrl("review",b.dataset.openReview),"_blank"));
 $$("[data-view-review]").forEach(b=>b.onclick=()=>renderClientReviewDetail(b.dataset.viewReview));
 $$("[data-reopen-review]").forEach(b=>b.onclick=async()=>{if(!confirm("Reopen this submitted review? The client will be able to change selections again."))return;const {error}=await supabase.from("hsm_client_reviews").update({status:"in_progress",submitted_at:null}).eq("id",b.dataset.reopenReview);if(error)return toast(error.message);await supabase.from("hsm_projects").update({status:"client_reviewing"}).eq("id",S.project.id);await loadProjectData();renderReview();toast("Review reopened")});
 $$("[data-revoke-review]").forEach(b=>b.onclick=async()=>{if(!confirm("Revoke this client gallery now? Existing access will stop immediately."))return;const now=new Date().toISOString(),{error}=await supabase.from("hsm_client_reviews").update({status:"revoked",revoked_at:now}).eq("id",b.dataset.revokeReview);if(error)return toast(error.message);await loadProjectData();renderReview();toast("Client access revoked")})
}
function previewClientReview(){
 const photos=S.photos.filter(x=>x.best_pick).slice(0,12);
 if(!photos.length)return toast("Choose some Best Picks first so the preview can show your real shortlist.");
 showModal('<div class="modal-head"><div><div class="kicker">CLIENT EXPERIENCE PREVIEW</div><h2>What your client sees</h2><p class="sub">This preview does not save likes or notes. The real secure gallery does.</p></div><button class="close" data-close>×</button></div><div class="client-preview-shell"><div class="client-preview-top"><div><div class="kicker">CLIENT REVIEW — BEFORE EDITING</div><h3>'+esc(S.project.name)+'</h3><p>Like the photographs you want edited and leave a note if needed.</p></div><div class="client-preview-count"><strong id="previewLikedCount">0 / '+photos.length+'</strong><span>selected</span></div></div><div class="review-gallery preview-gallery">'+photos.map(p=>'<article class="card client-photo preview-photo"><div style="position:relative">'+(p._url?'<img src="'+esc(p._url)+'" alt="" draggable="false">':'<div class="photo-media">Photo preview</div>')+'<div class="watermark">HIGH STYLE — CLIENT PROOF</div></div><div class="client-photo-body"><div class="photo-name">'+esc(p.display_filename||p.original_filename)+'</div><div class="client-actions"><button class="btn secondary small" type="button" data-preview-like="'+p.id+'">♡ Like</button></div><textarea class="note-area" placeholder="Add a note for the photographer…"></textarea></div></article>').join("")+'</div><div class="card sticky-submit"><span><b id="previewBottomLiked">0</b> photos selected. In the real gallery this saves automatically.</span><button class="btn primary" type="button" id="previewSubmit">Submit Selections →</button></div></div>');
 let liked=new Set();
 $$("[data-preview-like]",modalRoot).forEach(b=>b.onclick=()=>{const id=b.dataset.previewLike;if(liked.has(id)){liked.delete(id);b.classList.remove("pick");b.classList.add("secondary");b.textContent="♡ Like"}else{liked.add(id);b.classList.add("pick");b.classList.remove("secondary");b.textContent="♥ Liked"}$("#previewLikedCount").textContent=liked.size+" / "+photos.length;$("#previewBottomLiked").textContent=liked.size});
 $("#previewSubmit").onclick=()=>{if(!liked.size)return toast("The client must like at least one photo.");showModal('<div class="modal-head"><div><div class="kicker">CLIENT CONFIRMATION</div><h2>Submit selections?</h2></div><button class="close" data-close>×</button></div><p>The client would see a confirmation showing <b>'+liked.size+" of "+photos.length+'</b> photographs selected for editing.</p><div class="notice success">After confirmation, those liked photographs and any notes appear in Client Reviews and Approved for Edit.</div><div class="actions" style="justify-content:flex-end;margin-top:14px"><button class="btn secondary" data-close>Back</button><button class="btn primary" data-close>Preview Complete</button></div>')}
}
async function previewFinalDelivery(){
 const photos=S.photos.filter(x=>x.final_path).slice(0,12);
 if(!photos.length)return toast("Upload at least one final edited photograph first.");
 const previewPhotos=[];
 for(const p of photos){previewPhotos.push({...p,_finalPreview:await signed("hsm-finals",p.final_path,900)})}
 showModal('<div class="modal-head"><div><div class="kicker">FINAL DELIVERY PREVIEW</div><h2>What your client receives</h2><p class="sub">Final Delivery is a separate send with a fresh verification code.</p></div><button class="close" data-close>×</button></div><div class="client-preview-shell"><div class="client-preview-top"><div><div class="kicker">FINAL DELIVERY</div><h3>'+esc(S.project.name)+'</h3><p>'+previewPhotos.length+' finished photographs ready to view and download.</p></div><button class="btn primary" type="button">↓ Download All</button></div><div class="review-gallery preview-gallery">'+previewPhotos.map(p=>'<article class="card client-photo preview-photo"><div>'+(p._finalPreview?'<img src="'+esc(p._finalPreview)+'" alt="">':'<div class="photo-media">Final photograph</div>')+'</div><div class="client-photo-body"><div class="photo-name">'+esc(p.display_filename||p.original_filename)+'</div><button class="btn primary download-btn" type="button">↓ Download</button></div></article>').join("")+'</div></div>')
}
async function getApprovedRows(){
 const r=S.reviews.find(x=>x.status==="submitted")||S.reviews.find(x=>x.submitted_at);if(!r)return [];
 const {data,error}=await supabase.from("hsm_client_review_photos").select("photo_id,liked,note,hsm_photos(*)").eq("review_id",r.id).eq("liked",true).order("order_index");if(error){toast(error.message);return []}
 const rows=data||[];for(const row of rows){const p=row.hsm_photos;if(p&&(p.proof_path||p.preview_path))p._url=await signed("hsm-proofs",p.proof_path||p.preview_path)}return rows
}
async function renderApproved(){
 const B=$("#projectBody");
 B.innerHTML='<div class="card panel"><div class="empty">Loading client approvals…</div></div>';
 const rows=await getApprovedRows();
 const items=rows.map(row=>{
   const p=row.hsm_photos;
   const preview=p._url
     ? '<img src="'+esc(p._url)+'" alt="">'
     : '<div class="project-cover" style="width:90px;height:70px">'+esc(p.original_filename.split(".").pop())+'</div>';
   return '<div class="approved-item"><div>'+preview+'</div><div><h4>'+esc(p.display_filename||p.original_filename)+' • ♥ Client selected</h4><p>'+(row.note?'“'+esc(row.note)+'”':'No client note.')+'</p></div><select class="field-select" data-edit-status="'+p.id+'"><option value="awaiting_edit" '+(p.editing_status==="awaiting_edit"?'selected':'')+'>Awaiting Edit</option><option value="editing" '+(p.editing_status==="editing"?'selected':'')+'>Editing</option><option value="complete" '+(p.editing_status==="complete"?'selected':'')+'>Complete</option></select></div>';
 }).join("");
 B.innerHTML='<section class="card panel"><div class="panel-head"><div><h2>Approved for Edit</h2><p class="sub">Only photographs chosen by the client, with their notes attached.</p></div><span class="pill green">'+rows.length+' approved</span></div>'+(rows.length?'<div class="approved-list">'+items+'</div>':'<div class="empty"><h3>Waiting for client approval</h3><p>When the client submits their selection, chosen photos and notes appear here automatically.</p></div>')+'</section>';
 $$("[data-edit-status]").forEach(s=>s.onchange=async()=>{await supabase.from("hsm_photos").update({editing_status:s.value}).eq("id",s.dataset.editStatus);toast("Editing status updated")});
}
async function renderEditing(){
 const B=$("#projectBody");B.innerHTML='<div class="card panel"><div class="empty">Loading editing queue…</div></div>';const rows=await getApprovedRows();
 B.innerHTML='<section class="card panel"><div class="panel-head"><div><h2>Editing</h2><p class="sub">Upload the final edited file against each approved photograph.</p></div></div>'+(rows.length?'<div class="approved-list">'+rows.map(row=>{const p=row.hsm_photos;return '<div class="approved-item"><div>'+(p._url?'<img src="'+esc(p._url)+'">':'<div class="project-cover" style="width:90px;height:70px">RAW</div>')+'</div><div><h4>'+esc(p.display_filename||p.original_filename)+'</h4><p>'+esc(row.note||"No client note.")+'<br><span class="pill '+(p.final_path?"green":"orange")+'">'+(p.final_path?"Final uploaded":"Needs final file")+'</span></p></div><div><input type="file" id="final_'+p.id+'" accept="image/jpeg,image/png,image/tiff" hidden><button class="btn '+(p.final_path?"secondary":"primary")+' small" data-final="'+p.id+'">'+(p.final_path?"Replace Final":"Upload Final")+"</button></div></div>"}).join("")+"</div>":'<div class="empty"><h3>No approved photographs yet</h3><p>Client-approved photographs appear here after review submission.</p></div>')+"</section>";
 $$("[data-final]").forEach(b=>b.onclick=()=>{const i=$("#final_"+b.dataset.final);i.click();i.onchange=()=>uploadFinal(b.dataset.final,i.files[0])})
}
async function uploadFinal(photoId,file){
 if(!file)return;try{toast("Uploading final…");const path=S.workspace.id+"/"+S.project.id+"/finals/"+photoId+"_"+cleanName(file.name);const {error:u}=await supabase.storage.from("hsm-finals").upload(path,file,{upsert:true,contentType:file.type||"application/octet-stream"});if(u)throw u;const {error:d}=await supabase.from("hsm_photos").update({final_path:path,editing_status:"complete",display_filename:file.name}).eq("id",photoId);if(d)throw d;await loadProjectData();const approved=await getApprovedRows();if(approved.length&&approved.every(r=>r.hsm_photos.final_path))await supabase.from("hsm_projects").update({status:"ready_for_delivery"}).eq("id",S.project.id);toast("Final file uploaded");renderEditing()}catch(err){toast(err.message)}
}
async function renderDelivery(){
 const finals=S.photos.filter(p=>p.final_path),B=$("#projectBody"),last=S.reviews[0];B.innerHTML='<div class="grid two"><section class="card panel"><div class="panel-head"><div><h2>Final Delivery</h2><p class="sub">Send finished, downloadable photographs with a fresh verification code.</p></div><div class="actions"><button class="btn secondary small" id="previewFinalDelivery">◉ Preview Client View</button><span class="pill green">'+finals.length+' finals ready</span></div></div>'+(finals.length?'<form id="deliveryForm" class="form-grid"><div class="field"><label>Client name</label><input id="dName" value="'+esc(last?.recipient_name||"")+'"></div><div class="field"><label>Client email</label><input id="dEmail" type="email" required value="'+esc(last?.recipient_email||"")+'"></div><div class="field"><label>Expiry</label><select id="dExpiry"><option value="168">7 days</option><option value="336" selected>14 days</option><option value="720">30 days</option></select></div><div class="field"><label>Quality</label><select id="dQuality"><option value="full">Full Resolution</option><option value="web">Web Size</option><option value="both">Both</option></select></div><div class="field full"><label>Message</label><textarea id="dMessage">Your finished High Style photographs are ready to view and download.</textarea></div><div class="field full"><div class="notice">'+finals.length+' edited files will be included in this delivery.</div></div><div class="field full"><button class="btn primary" type="submit">Send Final Gallery</button></div></form><div id="deliveryResult"></div>':'<div class="empty"><h3>No final files uploaded</h3><p>Upload edited versions in the Editing stage before final delivery.</p></div>')+'</section><aside class="card panel"><div class="panel-head"><div><h2>Delivery History</h2><p class="sub">Final galleries and download state.</p></div></div><div class="review-list">'+(S.deliveries.length?S.deliveries.map(d=>'<div class="review-row"><div><b>'+esc(d.recipient_name||d.recipient_email)+'</b><span>'+fmtDate(d.created_at)+'</span></div><span>'+statusLabel(d.status)+'</span><span>'+esc(d.email_status)+'</span><button class="btn secondary small" data-open-delivery="'+d.gallery_token+'">Open</button></div>').join(""):'<div class="notice">No deliveries yet.</div>')+"</div></aside></div>";
 $("#previewFinalDelivery")?.addEventListener("click",previewFinalDelivery);
 if($("#dExpiry")){const preferred=String(S.profile?.default_gallery_expiry_hours||336);if(["168","336","720"].includes(preferred))$("#dExpiry").value=preferred}
 $("#deliveryForm")?.addEventListener("submit",async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const data=await api("hsm-create-delivery",{project_id:S.project.id,photo_ids:finals.map(x=>x.id),recipient_email:$("#dEmail").value.trim(),recipient_name:$("#dName").value.trim()||null,message:$("#dMessage").value.trim(),gallery_expires_hours:+$("#dExpiry").value,quality:$("#dQuality").value});const link=clientUrl("delivery",data.gallery_token);$("#deliveryResult").innerHTML='<div class="code-result">'+(data.email_status==="sent"?'<p>Final delivery email sent.</p>':'<p>Transactional email is not configured yet. Use this test code until the email secret is connected.</p><strong>'+esc(data.test_code||"—")+"</strong>")+'<div class="actions" style="margin-top:10px"><button class="btn primary" id="openDelivery">Open Gallery</button><button class="btn secondary" id="copyDelivery">Copy Link</button></div></div>';$("#openDelivery").onclick=()=>window.open(link,"_blank");$("#copyDelivery").onclick=()=>navigator.clipboard.writeText(link).then(()=>toast("Link copied"));await loadProjectData()}catch(err){toast(err.message)}finally{btn.disabled=false}});
 $$("[data-open-delivery]").forEach(b=>b.onclick=()=>window.open(clientUrl("delivery",b.dataset.openDelivery),"_blank"))
}


async function renderClientReviews(){
 const C=$("#content");
 C.innerHTML=pageHead("Client Reviews","Track every proof gallery from send to final client selection.")+'<div class="card panel"><div class="empty">Loading client reviews…</div></div>';
 const {data,error}=await supabase.from("hsm_client_reviews")
   .select("*,hsm_projects!inner(id,name,workspace_id,status)")
   .eq("hsm_projects.workspace_id",S.workspace.id)
   .order("created_at",{ascending:false});
 if(error){toast(error.message);return}
 const rows=data||[];
 const awaiting=rows.filter(r=>!["verified","in_progress","submitted"].includes(r.status));
 const reviewing=rows.filter(r=>["verified","in_progress"].includes(r.status));
 const complete=rows.filter(r=>r.status==="submitted");
 const renderGroup=(title,copy,list,tone="")=>'<section class="review-board-section"><div class="review-board-title"><div><h2>'+title+'</h2><p>'+copy+'</p></div><span class="pill '+tone+'">'+list.length+'</span></div>'+(list.length?'<div class="review-board-grid">'+list.map(reviewDashboardCard).join("")+'</div>':'<div class="empty compact"><p>No reviews here right now.</p></div>')+'</section>';
 C.innerHTML=pageHead("Client Reviews","Track every proof gallery from send to final client selection.")+
   '<div class="review-summary grid three"><div class="card stat"><label>Awaiting Review</label><strong>'+awaiting.length+'</strong><span>sent but not submitted</span></div><div class="card stat"><label>Reviewing</label><strong>'+reviewing.length+'</strong><span>opened or verified</span></div><div class="card stat"><label>Completed</label><strong>'+complete.length+'</strong><span>client selections received</span></div></div>'+
   '<div class="card panel review-board">'+
    renderGroup("Awaiting Review","Waiting for the client to open or verify.",awaiting,"orange")+
    renderGroup("Reviewing","The client has verified and is making selections.",reviewing,"blue")+
    renderGroup("Completed","Submitted selections ready for editing.",complete,"green")+
   '</div>';
 $$("[data-review-detail]").forEach(b=>b.onclick=()=>renderClientReviewDetail(b.dataset.reviewDetail))
}
function reviewDashboardCard(r){
 const p=r.hsm_projects||{};
 const sent=!!r.created_at,opened=!!r.opened_at,verified=!!r.verified_at,submitted=!!r.submitted_at;
 const progress='<div class="review-progress"><span class="'+(sent?"done":"")+'">Sent</span><span class="'+(opened?"done":"")+'">Opened</span><span class="'+(verified?"done":"")+'">Verified</span><span class="'+(submitted?"done":"")+'">Submitted</span></div>';
 return '<article class="review-dashboard-card"><div class="review-card-top"><div><div class="kicker">'+esc(r.recipient_name||"CLIENT REVIEW")+'</div><h3>'+esc(p.name||"Project")+'</h3><p>'+esc(r.recipient_email||"")+'</p></div><span class="pill '+(submitted?"green":verified?"blue":"orange")+'">'+statusLabel(r.status)+'</span></div>'+progress+'<div class="review-card-meta"><span>Sent '+fmtDate(r.created_at)+'</span>'+(submitted?'<b>'+Number(r.selected_count||0)+' selected'+(r.note_count?(' • '+r.note_count+' notes'):"")+'</b>':'<b>'+statusLabel(r.email_status||"queued")+'</b>')+'</div><button class="btn '+(submitted?"primary":"secondary")+' small" data-review-detail="'+r.id+'">'+(submitted?"View Selection":"View Review")+'</button></article>'
}
async function renderClientReviewDetail(reviewId){
 S.route="reviews";S.reviewDetail=reviewId;S.project=null;
 const C=$("#content");C.innerHTML=pageHead("Client Review","Loading review details…",'<button class="btn secondary" id="backReviews">← Client Reviews</button>')+'<div class="card panel"><div class="empty">Loading photographs…</div></div>';
 $("#backReviews").onclick=()=>{S.reviewDetail=null;renderClientReviews()};
 const {data:r,error}=await supabase.from("hsm_client_reviews").select("*,hsm_projects!inner(id,name,workspace_id,status)").eq("id",reviewId).single();
 if(error)return toast(error.message);
 if(r.hsm_projects.workspace_id!==S.workspace.id)return toast("This review is not in your workspace.");
 const {data:rows,error:rowErr}=await supabase.from("hsm_client_review_photos").select("photo_id,liked,note,viewed,order_index,hsm_photos(*)").eq("review_id",reviewId).order("order_index");
 if(rowErr)return toast(rowErr.message);
 const all=rows||[];
 for(const row of all){const p=row.hsm_photos;if(p&&(p.proof_path||p.preview_path))p._url=await signed("hsm-proofs",p.proof_path||p.preview_path,1800)}
 const selected=all.filter(x=>x.liked),notes=all.filter(x=>String(x.note||"").trim());
 const filter=S.reviewFilter||"selected";
 const visible=filter==="all"?all:filter==="notes"?notes:selected;
 const action=r.status==="submitted"?'<button class="btn primary" id="moveApproved">Move Selection to Approved for Edit →</button>':'';
 C.innerHTML=pageHead((r.recipient_name||r.recipient_email)+" — Client Selection",r.hsm_projects.name,'<button class="btn secondary" id="backReviews">← Client Reviews</button>')+
  '<div class="grid three review-detail-stats"><div class="card stat"><label>Selected</label><strong>'+selected.length+'</strong><span>liked by client</span></div><div class="card stat"><label>Not selected</label><strong>'+(all.length-selected.length)+'</strong><span>not chosen</span></div><div class="card stat"><label>Notes</label><strong>'+notes.length+'</strong><span>client comments</span></div></div>'+
  '<section class="card panel" style="margin-top:14px"><div class="panel-head"><div><h2>Review Results</h2><p class="sub">'+(r.submitted_at?"Submitted "+fmtDate(r.submitted_at):"Client review is still in progress.")+'</p></div><div class="actions">'+action+'</div></div>'+
  '<div class="tabs review-filter-tabs"><button data-review-filter="selected" class="'+(filter==="selected"?"on":"")+'">Selected Only</button><button data-review-filter="notes" class="'+(filter==="notes"?"on":"")+'">Photos With Notes</button><button data-review-filter="all" class="'+(filter==="all"?"on":"")+'">Show All Images</button></div>'+
  (visible.length?'<div class="review-result-grid">'+visible.map(row=>{const p=row.hsm_photos||{};return '<article class="card review-result-photo '+(row.liked?"selected":"")+'"><div class="photo-media">'+(p._url?'<img src="'+esc(p._url)+'" alt="">':'Preview unavailable')+(row.liked?'<span class="badge">♥ Selected</span>':'')+'</div><div class="photo-body"><div class="photo-name">'+esc(p.display_filename||p.original_filename||"Photo")+'</div><div class="review-note">'+(row.note?'“'+esc(row.note)+'”':'No client note.')+'</div></div></article>'}).join("")+'</div>':'<div class="empty"><h3>No photographs in this filter</h3><p>Choose another view above.</p></div>')+
  '</section>';
 $("#backReviews").onclick=()=>{S.reviewDetail=null;renderClientReviews()};
 $$("[data-review-filter]").forEach(b=>b.onclick=()=>{S.reviewFilter=b.dataset.reviewFilter;renderClientReviewDetail(reviewId)});
 $("#moveApproved")?.addEventListener("click",async()=>{
   const {error:e}=await supabase.from("hsm_projects").update({status:"approved_for_edit"}).eq("id",r.project_id);
   if(e)return toast(e.message);
   await loadProjects();toast(selected.length+" photos ready for editing");await openProject(r.project_id,"approved")
 })
}
async function renderLibrary(){
 const C=$("#content");C.innerHTML=pageHead("Library","Photographs across every High Style Match project.")+'<div class="card panel"><div class="empty">Loading library…</div></div>';
 const {data,error}=await supabase.from("hsm_photos").select("*,hsm_projects(name)").eq("workspace_id",S.workspace.id).order("created_at",{ascending:false}).limit(500);if(error)return toast(error.message);S.allPhotos=data||[];
 for(const p of S.allPhotos){if(p.proof_path||p.preview_path)p._url=await signed("hsm-proofs",p.proof_path||p.preview_path)}
 C.innerHTML=pageHead("Library","Photographs across every High Style Match project.")+'<section class="card panel">'+(S.allPhotos.length?'<div class="photo-grid">'+S.allPhotos.map(p=>photoCard(p,"library")).join("")+"</div>":'<div class="empty"><h3>Your library is empty</h3><p>Uploaded project photos will appear here.</p></div>')+"</section>"
}
async function renderClients(){
 const C=$("#content");C.innerHTML=pageHead("Clients","Keep project history and gallery recipients together.",'<button class="btn primary" id="addClient">＋ Add Client</button>')+'<div class="card panel"><div class="empty">Loading clients…</div></div>';
 const {data,error}=await supabase.from("hsm_clients").select("*").eq("workspace_id",S.workspace.id).order("created_at",{ascending:false});if(error)return toast(error.message);S.clients=data||[];
 C.innerHTML=pageHead("Clients","Keep project history and gallery recipients together.",'<button class="btn primary" id="addClient">＋ Add Client</button>')+'<section class="card panel"><div class="review-list">'+(S.clients.length?S.clients.map(c=>'<div class="review-row"><div><b>'+esc(c.name)+'</b><span>'+esc(c.company||"")+'</span></div><span>'+esc(c.email||"—")+'</span><span>'+esc(c.phone||"")+'</span><span class="pill">Client</span></div>').join(""):'<div class="empty"><h3>No clients saved</h3><p>Clients are also created when you make a project.</p></div>')+"</div></section>";$("#addClient").onclick=openClient
}
function openClient(){showModal('<div class="modal-head"><h2>Add Client</h2><button class="close" data-close>×</button></div><form id="clientForm" class="form-grid"><div class="field"><label>Name</label><input id="cName" required></div><div class="field"><label>Company</label><input id="cCompany"></div><div class="field"><label>Email</label><input id="cEmail" type="email"></div><div class="field"><label>Phone</label><input id="cPhone"></div><div class="field full"><label>Notes</label><textarea id="cNotes"></textarea></div><div class="field full"><button class="btn primary">Save Client</button></div></form>');$("#clientForm").onsubmit=async e=>{e.preventDefault();const {error}=await supabase.from("hsm_clients").insert({workspace_id:S.workspace.id,name:$("#cName").value.trim(),company:$("#cCompany").value.trim()||null,email:$("#cEmail").value.trim()||null,phone:$("#cPhone").value.trim()||null,notes:$("#cNotes").value.trim()||null});if(error)return toast(error.message);closeModal();renderClients();toast("Client saved")}}
function renderAI(){$("#content").innerHTML=pageHead("AI Tools","High Style Match intelligence will live here.")+'<section class="card panel"><div class="empty"><h3>AI Vision — Coming Soon</h3><p>Smart Cull is now a working local image-analysis feature. Semantic AI Vision remains clearly labelled Coming Soon until a production vision provider is connected.</p><button class="btn secondary" disabled>Coming Soon</button></div></section>'}
async function renderAnalytics(){
 const C=$("#content");C.innerHTML=pageHead("Analytics","A live view of your photography workflow.")+'<div class="card panel"><div class="empty">Loading analytics…</div></div>';
 const [{data:photos},{data:reviews},{data:deliveries},{data:downloads}]=await Promise.all([
   supabase.from("hsm_photos").select("id,best_pick,editing_status,file_size").eq("workspace_id",S.workspace.id),
   supabase.from("hsm_client_reviews").select("id,status,created_at,submitted_at,hsm_projects!inner(workspace_id)").eq("hsm_projects.workspace_id",S.workspace.id),
   supabase.from("hsm_deliveries").select("id,status,hsm_projects!inner(workspace_id)").eq("hsm_projects.workspace_id",S.workspace.id),
   supabase.from("hsm_download_events").select("id,created_at")
 ]);
 const p=photos||[],r=reviews||[],d=deliveries||[],dw=downloads||[],storage=p.reduce((a,x)=>a+Number(x.file_size||0),0);
 const submitted=r.filter(x=>x.submitted_at),avg=submitted.length?Math.round(submitted.reduce((a,x)=>a+(new Date(x.submitted_at)-new Date(x.created_at)),0)/submitted.length/60000):0;
 C.innerHTML=pageHead("Analytics","A live view of your photography workflow.")+'<div class="grid stats"><div class="card stat"><label>Projects</label><strong>'+S.projects.length+'</strong><span>all projects</span></div><div class="card stat"><label>Photos</label><strong>'+p.length+'</strong><span>uploaded</span></div><div class="card stat"><label>Best Picks</label><strong>'+p.filter(x=>x.best_pick).length+'</strong><span>selected</span></div><div class="card stat"><label>Client approvals</label><strong>'+r.filter(x=>x.status==="submitted").length+'</strong><span>completed reviews</span></div></div><div class="grid two" style="margin-top:14px"><section class="card panel"><div class="panel-head"><div><h2>Workflow</h2><p class="sub">Current workspace activity.</p></div></div><div class="review-list"><div class="review-row"><div><b>Average review time</b><span>From send to client submission</span></div><span></span><span></span><span class="pill">'+(avg?avg+" min":"—")+'</span></div><div class="review-row"><div><b>Final deliveries</b><span>Secure galleries created</span></div><span></span><span></span><span class="pill">'+d.length+'</span></div><div class="review-row"><div><b>Downloads</b><span>Tracked final-image downloads</span></div><span></span><span></span><span class="pill">'+dw.length+'</span></div></div></section><aside class="card panel"><div class="panel-head"><div><h2>Storage</h2><p class="sub">Original upload size recorded in the database.</p></div></div><div class="storage-number">'+(storage/1073741824).toFixed(2)+' GB</div><p class="sub">of '+(Number(S.workspace.storage_limit_bytes||0)/1073741824).toFixed(0)+' GB workspace allowance</p><div class="meter"><i style="width:'+Math.min(100,storage/Number(S.workspace.storage_limit_bytes||1)*100)+'%"></i></div></aside></div>'
}
function downloadText(name,text,type="text/csv"){
 const blob=new Blob([text],{type:type+";charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)
}
async function exportProjectManifest(projectId){
 const [{data:p},{data:photos},{data:reviews}]=await Promise.all([
  supabase.from("hsm_projects").select("*").eq("id",projectId).single(),
  supabase.from("hsm_photos").select("*").eq("project_id",projectId).order("created_at"),
  supabase.from("hsm_client_reviews").select("id,status,recipient_email").eq("project_id",projectId)
 ]);
 const head=["filename","rating","best_pick","cull_bucket","editing_status","has_final"],rows=(photos||[]).map(x=>[x.display_filename||x.original_filename,x.rating,x.best_pick,x.cull_bucket||"",x.editing_status,!!x.final_path]);
 const csv=[head,...rows].map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");
 downloadText(cleanName(p?.name||"project")+"_manifest.csv",csv);toast("Project manifest exported")
}
async function renderExports(){
 const C=$("#content");C.innerHTML=pageHead("Exports","Download project manifests and workflow data.")+'<section class="card panel"><div class="panel-head"><div><h2>Project Exports</h2><p class="sub">Export filenames, ratings, cull status and editing state as CSV.</p></div></div><div class="review-list">'+(S.projects.length?S.projects.map(p=>'<div class="review-row"><div><b>'+esc(p.name)+'</b><span>'+esc(statusLabel(p.status))+'</span></div><span>'+esc(p.project_type)+'</span><span></span><button class="btn secondary small" data-export-project="'+p.id+'">Export CSV</button></div>').join(""):'<div class="notice">No projects available to export.</div>')+'</div></section>';
 $$("[data-export-project]").forEach(b=>b.onclick=()=>exportProjectManifest(b.dataset.exportProject))
}
async function renderSettings(){
 const C=$("#content");
 C.innerHTML=pageHead("Settings","Profile, workflow defaults, security and account data.")+'<div class="settings-grid"><section class="card panel"><div class="panel-head"><div><h2>Photographer Profile</h2><p class="sub">Shown inside your workspace and used for gallery branding later.</p></div></div><form id="settingsForm" class="form-grid"><div class="field"><label>First name</label><input id="sFirst" value="'+esc(S.profile?.first_name||"")+'"></div><div class="field"><label>Last name</label><input id="sLast" value="'+esc(S.profile?.last_name||"")+'"></div><div class="field"><label>Business name</label><input id="sBusiness" value="'+esc(S.profile?.business_name||S.workspace.name)+'"></div><div class="field"><label>Workspace name</label><input id="sWorkspace" value="'+esc(S.workspace.name)+'"></div><div class="field"><label>Phone</label><input id="sPhone" value="'+esc(S.profile?.phone||"")+'"></div><div class="field"><label>Website</label><input id="sWebsite" value="'+esc(S.profile?.website||"")+'"></div><div class="field"><label>Instagram</label><input id="sInstagram" value="'+esc(S.profile?.instagram||"")+'"></div><div class="field"><label>Country</label><input id="sCountry" value="'+esc(S.profile?.country||"United Kingdom")+'"></div><div class="field full"><button class="btn primary">Save Profile</button></div></form></section><section class="card panel"><div class="panel-head"><div><h2>Workflow Defaults</h2><p class="sub">Used whenever you start a new project.</p></div></div><form id="defaultsForm" class="form-grid"><div class="field"><label>Project type</label><select id="sDefaultType"><option>food</option><option>drink</option><option>hotel</option><option>restaurant</option><option>commercial</option><option>portrait</option><option>event</option><option>street</option><option>landscape</option><option>other</option></select></div><div class="field"><label>Workflow</label><select id="sDefaultMode"><option value="studio">Studio Mode</option><option value="roam">Roam Mode</option></select></div><div class="field"><label>Gallery expiry</label><select id="sDefaultExpiry"><option value="24">24 hours</option><option value="168">7 days</option><option value="336">14 days</option><option value="720">30 days</option></select></div><div class="field"><label>Time zone</label><input id="sTimezone" value="'+esc(S.profile?.timezone||"Europe/London")+'"></div><div class="field full"><button class="btn primary">Save Defaults</button></div></form></section><section class="card panel security-panel"><div class="panel-head"><div><h2>Account Security</h2><p class="sub">Protect the photographer account that owns your client work.</p></div><span class="pill green">'+(S.user.email_confirmed_at?"Email verified":"Email pending")+'</span></div><div class="security-row"><div><b>Password</b><span>Change the password used to sign in.</span></div><button class="btn secondary small" id="changePassword">Change</button></div><div class="security-row"><div><b>Two-step verification</b><span id="mfaStatus">Checking authenticator status…</span></div><button class="btn secondary small" id="mfaAction">Checking…</button></div><div class="security-row"><div><b>Other devices</b><span>End every other High Style Match session while keeping this device signed in.</span></div><button class="btn secondary small" id="signOutOthers">Sign out others</button></div><div class="security-row"><div><b>All sessions</b><span>Sign out this account everywhere.</span></div><button class="btn danger small" id="signOutAll">Sign out everywhere</button></div></section><section class="card panel"><div class="panel-head"><div><h2>Your Data</h2><p class="sub">Export a copy of your High Style Match workspace metadata.</p></div></div><div class="security-row"><div><b>Account data export</b><span>Downloads projects, clients, photo records, shot lists, reviews and activity as JSON. Image files remain in private storage.</span></div><button class="btn secondary small" id="exportAccountData">Export JSON</button></div></section></div>';
 $("#sDefaultType").value=S.profile?.default_project_type||"food";$("#sDefaultMode").value=S.profile?.default_mode||"studio";$("#sDefaultExpiry").value=String(S.profile?.default_gallery_expiry_hours||168);
 $("#settingsForm").onsubmit=async e=>{e.preventDefault();const patch={id:S.user.id,first_name:$("#sFirst").value.trim()||null,last_name:$("#sLast").value.trim()||null,business_name:$("#sBusiness").value.trim(),phone:$("#sPhone").value.trim()||null,website:$("#sWebsite").value.trim()||null,instagram:$("#sInstagram").value.trim()||null,country:$("#sCountry").value.trim()||null};const [a,b]=await Promise.all([supabase.from("hsm_profiles").upsert(patch),supabase.from("hsm_workspaces").update({name:$("#sWorkspace").value.trim()}).eq("id",S.workspace.id)]);if(a.error||b.error)return toast((a.error||b.error).message);S.profile={...S.profile,...patch};S.workspace.name=$("#sWorkspace").value.trim();toast("Profile saved");renderShell()};
 $("#defaultsForm").onsubmit=async e=>{e.preventDefault();const patch={default_project_type:$("#sDefaultType").value,default_mode:$("#sDefaultMode").value,default_gallery_expiry_hours:+$("#sDefaultExpiry").value,timezone:$("#sTimezone").value.trim()||"Europe/London"};const {error}=await supabase.from("hsm_profiles").update(patch).eq("id",S.user.id);if(error)return toast(error.message);S.profile={...S.profile,...patch};toast("Workflow defaults saved")};
 $("#changePassword").onclick=openChangePassword;$("#signOutOthers").onclick=async()=>{const {error}=await supabase.auth.signOut({scope:"others"});if(error)return toast(error.message);toast("Other sessions signed out")};$("#signOutAll").onclick=async()=>{if(!confirm("Sign out High Style Match on every device?"))return;await supabase.auth.signOut({scope:"global"})};$("#exportAccountData").onclick=exportAccountData;await refreshMfaSettings()
}
async function refreshMfaSettings(){
 const status=$("#mfaStatus"),button=$("#mfaAction");if(!status||!button)return;const {data,error}=await supabase.auth.mfa.listFactors();if(error){status.textContent=error.message;button.disabled=true;return}const factor=(data?.totp||[]).find(x=>x.status==="verified");if(factor){status.textContent="Authenticator app is enabled. This account requires the second factor at sign-in.";button.textContent="Manage";button.disabled=false;button.onclick=()=>openManageMfa(factor)}else{status.textContent="Not enabled. Add an authenticator app for stronger account protection.";button.textContent="Set up";button.disabled=false;button.onclick=openEnrollMfa}
}
function openChangePassword(){showModal('<div class="modal-head"><div><div class="kicker">ACCOUNT SECURITY</div><h2>Change password</h2></div><button class="close" data-close>×</button></div><form id="changePasswordForm" class="form-grid"><div class="field full"><label>New password</label><input id="newAccountPassword" type="password" minlength="8" autocomplete="new-password" required></div><div class="field full"><label>Confirm password</label><input id="newAccountPassword2" type="password" minlength="8" autocomplete="new-password" required></div><div class="field full"><button class="btn primary">Update password</button></div></form>');$("#changePasswordForm").onsubmit=async e=>{e.preventDefault();const one=$("#newAccountPassword").value,two=$("#newAccountPassword2").value;if(one!==two)return toast("Passwords do not match");const {error}=await supabase.auth.updateUser({password:one});if(error)return toast(error.message);closeModal();toast("Password updated")}
}
async function openEnrollMfa(){
 try{const {data,error}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"High Style Match"});if(error)throw error;const factor=data;showModal('<div class="modal-head"><div><div class="kicker">TWO-STEP VERIFICATION</div><h2>Scan with your authenticator app</h2></div><button class="close" data-close>×</button></div><p class="sub">Use Google Authenticator, Microsoft Authenticator, 1Password or another TOTP app.</p><div class="mfa-qr"><img src="'+esc(factor.totp.qr_code)+'" alt="Authenticator QR code"></div><div class="notice"><b>Manual setup key</b><br><code>'+esc(factor.totp.secret)+'</code></div><form id="verifyMfaEnroll" class="form-grid" style="margin-top:14px"><div class="field full"><label>Six-digit code from your app</label><input id="mfaEnrollCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required></div><div class="field full"><button class="btn primary">Enable Two-Step Verification</button></div></form>');$("#verifyMfaEnroll").onsubmit=async e=>{e.preventDefault();const code=$("#mfaEnrollCode").value.replace(/\D/g,"");const {error:vErr}=await supabase.auth.mfa.challengeAndVerify({factorId:factor.id,code});if(vErr)return toast(vErr.message);closeModal();toast("Two-step verification enabled");await supabase.auth.refreshSession();renderSettings()}}
 catch(err){toast(err.message)}
}
function openManageMfa(factor){showModal('<div class="modal-head"><div><div class="kicker">TWO-STEP VERIFICATION</div><h2>Authenticator enabled</h2></div><button class="close" data-close>×</button></div><div class="notice success">Your account is protected by an authenticator app.</div><p class="sub">To disable it, verify this session at AAL2 and then remove the factor.</p><div class="actions" style="margin-top:14px"><button class="btn danger" id="disableMfa">Disable authenticator</button></div>');$("#disableMfa").onclick=async()=>{if(!confirm("Disable two-step verification for this account?"))return;const {error}=await supabase.auth.mfa.unenroll({factorId:factor.id});if(error)return toast(error.message);await supabase.auth.refreshSession();closeModal();toast("Two-step verification disabled");renderSettings()}}
async function exportAccountData(){
 const btn=$("#exportAccountData");btn.disabled=true;try{const [projects,clients,photos,shots,reviews,reviewPhotos,deliveries,activity]=await Promise.all([
  supabase.from("hsm_projects").select("*").eq("workspace_id",S.workspace.id),
  supabase.from("hsm_clients").select("*").eq("workspace_id",S.workspace.id),
  supabase.from("hsm_photos").select("*").eq("workspace_id",S.workspace.id),
  supabase.from("hsm_shot_list_items").select("*,hsm_projects!inner(workspace_id)").eq("hsm_projects.workspace_id",S.workspace.id),
  supabase.from("hsm_client_reviews").select("*,hsm_projects!inner(workspace_id)").eq("hsm_projects.workspace_id",S.workspace.id),
  supabase.from("hsm_client_review_photos").select("*,hsm_client_reviews!inner(project_id,hsm_projects!inner(workspace_id))").eq("hsm_client_reviews.hsm_projects.workspace_id",S.workspace.id),
  supabase.from("hsm_deliveries").select("*,hsm_projects!inner(workspace_id)").eq("hsm_projects.workspace_id",S.workspace.id),
  supabase.from("hsm_activity_logs").select("*").eq("workspace_id",S.workspace.id)
 ]);const results=[projects,clients,photos,shots,reviews,reviewPhotos,deliveries,activity];const err=results.find(x=>x.error)?.error;if(err)throw err;const payload={exported_at:new Date().toISOString(),account:{email:S.user.email,profile:S.profile,workspace:S.workspace},projects:projects.data||[],clients:clients.data||[],photos:photos.data||[],shot_list_items:shots.data||[],reviews:reviews.data||[],review_photos:reviewPhotos.data||[],deliveries:deliveries.data||[],activity:activity.data||[]};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="high-style-match-account-export-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Account data exported")}catch(err){toast(err.message)}finally{btn.disabled=false}
}
async function renderSearch(q){
 S.project=null;const C=$("#content");const projects=S.projects.filter(p=>(p.name+" "+p.project_type+" "+(p.location||"")).toLowerCase().includes(q.toLowerCase()));
 const {data:clients}=await supabase.from("hsm_clients").select("*").eq("workspace_id",S.workspace.id).or("name.ilike.%"+q.replaceAll("%","")+"%,email.ilike.%"+q.replaceAll("%","")+"%").limit(20);
 C.innerHTML=pageHead("Search","Results for “"+q+"”")+'<div class="grid two"><section class="card panel"><div class="panel-head"><h2>Projects</h2></div>'+(projects.length?'<div class="grid project-grid">'+projects.map(projectCard).join("")+"</div>":'<div class="notice">No matching projects.</div>')+'</section><section class="card panel"><div class="panel-head"><h2>Clients</h2></div><div class="review-list">'+((clients||[]).length?(clients||[]).map(c=>'<div class="review-row"><div><b>'+esc(c.name)+'</b><span>'+esc(c.email||"")+'</span></div><span></span><span></span><span></span></div>').join(""):'<div class="notice">No matching clients.</div>')+"</div></section></div>";wireProjectCards()
}

/* Client review & delivery — no photographer account required */
async function renderClient(kind,token){
 S.clientKind=kind;S.clientToken=token;
 app.innerHTML='<div class="client-shell"><div class="client-wrap"><div class="client-top"><div class="client-brand">High Style Match</div><div class="secure">◉ Secure '+(kind==="review"?"Client Review":"Final Delivery")+'</div></div><div id="clientBody"><div class="gate"><section class="card gate-card"><p>Opening secure gallery…</p></section></div></div></div></div>';
 try{await api("hsm-client",{action:"open",kind,gallery_token:token},false)}catch(err){$("#clientBody").innerHTML='<div class="gate"><section class="card gate-card"><div class="kicker">SECURE GALLERY</div><h1>Gallery unavailable.</h1><p>'+esc(err.message||String(err))+'</p></section></div>';return}
 const saved=sessionStorage.getItem("hsm_"+kind+"_"+token);if(saved){try{return await loadClientGallery(saved)}catch{sessionStorage.removeItem("hsm_"+kind+"_"+token)}}
 renderGate();
}
function renderGate(testCode=""){
 const B=$("#clientBody");
 B.innerHTML='<div class="gate verification-gate"><section class="card gate-card"><div class="kicker">'+(S.clientKind==="review"?"PRIVATE CLIENT REVIEW":"FINAL DELIVERY")+'</div><h1>Your photos are ready.</h1><p>Enter the six-digit verification code sent to your email to unlock this private gallery.</p><div class="otp high-style-otp">'+Array.from({length:6},(_,i)=>'<span class="otp-card" style="--i:'+i+'"><input inputmode="numeric" maxlength="1" aria-label="Verification digit '+(i+1)+'"></span>').join("")+'</div><div id="gateError" class="notice danger hidden"></div><div class="verification-help">Each new code is unique to this project and replaces the previous code.</div><div class="actions" style="justify-content:center"><button class="btn ghost" id="resendCode">Resend code</button></div>'+(testCode?'<div class="code-result"><p>Email is not configured on this build. Use the test code:</p><strong>'+esc(testCode)+"</strong></div>":"")+"</section></div>";
 const inputs=$$(".otp input"),cards=$$(".otp-card");
 inputs.forEach((x,i)=>{x.onfocus=()=>cards[i]?.classList.add("active");x.onblur=()=>cards[i]?.classList.remove("active");x.oninput=()=>{x.value=x.value.replace(/\D/g,"").slice(0,1);cards[i]?.classList.toggle("filled",!!x.value);if(x.value&&inputs[i+1])inputs[i+1].focus();if(inputs.every(v=>v.value))verifyClient(inputs.map(v=>v.value).join(""))};x.onkeydown=e=>{if(e.key==="Backspace"&&!x.value&&inputs[i-1])inputs[i-1].focus()};x.onpaste=e=>{const d=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);if(d){e.preventDefault();d.split("").forEach((n,j)=>{if(inputs[j]){inputs[j].value=n;cards[j]?.classList.add("filled")}});if(d.length===6)verifyClient(d)}}});inputs[0]?.focus();
 $("#resendCode").onclick=async()=>{try{const d=await api("hsm-client",{action:"resend_code",kind:S.clientKind,gallery_token:S.clientToken},false);toast(d.email_status==="sent"?"A fresh code was sent":"A fresh test code was generated");if(d.test_code)renderGate(d.test_code)}catch(err){showGateError(err.message)}}
}
function showGateError(msg){const e=$("#gateError");if(e){e.textContent=msg;e.classList.remove("hidden");const gate=$(".verification-gate");gate?.classList.remove("code-error");void gate?.offsetWidth;gate?.classList.add("code-error");setTimeout(()=>gate?.classList.remove("code-error"),520)}}
async function verifyClient(code){
 try{
  const d=await api("hsm-client",{action:"verify",kind:S.clientKind,gallery_token:S.clientToken,code},false);
  const gate=$(".verification-gate");$$(".otp-card").forEach(x=>x.classList.add("success"));gate?.classList.add("verified");
  sessionStorage.setItem("hsm_"+S.clientKind+"_"+S.clientToken,d.session_token);
  await new Promise(r=>setTimeout(r,650));
  await loadClientGallery(d.session_token)
 }catch(err){showGateError(err.message)}
}
async function loadClientGallery(sessionToken){
 const d=await api("hsm-client",{action:"get",kind:S.clientKind,gallery_token:S.clientToken,session_token:sessionToken},false);S.clientSession=sessionToken;S.clientGallery=d;if(S.clientKind==="review")renderClientReviewGallery(d);else renderFinalGallery(d)
}
function updateClientReviewCounts(photos){
 const n=photos.filter(x=>x.liked).length;
 if($("#likedCount"))$("#likedCount").textContent=n+" / "+photos.length;
 if($("#bottomLiked"))$("#bottomLiked").textContent=n;
}
async function toggleClientReviewLike(photo,button){
 const v=!photo.liked;
 try{
  await api("hsm-client",{action:"update_review_photo",kind:"review",gallery_token:S.clientToken,session_token:S.clientSession,photo_id:photo.id,liked:v},false);
  photo.liked=v;
  if(button){button.classList.toggle("pick",v);button.classList.toggle("secondary",!v);button.textContent=v?"♥ Liked":"♡ Like"}
  const gridButton=document.querySelector('[data-like="'+photo.id+'"]');
  if(gridButton&&gridButton!==button){gridButton.classList.toggle("pick",v);gridButton.classList.toggle("secondary",!v);gridButton.textContent=v?"♥ Liked":"♡ Like"}
  updateClientReviewCounts(S.clientGallery?.photos||[]);
  return true;
 }catch(err){toast(err.message);return false}
}
function openClientLightbox(index,kind){
 const d=S.clientGallery,photos=d?.photos||[],p=photos[index];if(!p)return;
 const proof=kind==="review";
 modalRoot.innerHTML='<div class="client-lightbox-back"><div class="client-lightbox"><div class="client-lightbox-top"><div><div class="kicker">'+(proof?"CLIENT REVIEW":"FINAL DELIVERY")+'</div><b>'+esc(p.filename)+'</b></div><button class="client-lightbox-close" id="closeClientLightbox">×</button></div><div class="client-lightbox-media">'+(p.signed_url?'<img src="'+esc(p.signed_url)+'" alt="" draggable="false">':'<div class="photo-media">Preview unavailable</div>')+(proof&&d.review?.watermark_enabled?'<div class="watermark">HIGH STYLE — CLIENT PROOF</div>':"")+'</div><div class="client-lightbox-foot"><button class="btn secondary" id="clientPrev">← Previous</button>'+(proof?'<button class="btn '+(p.liked?"pick":"secondary")+'" id="clientLightboxLike">'+(p.liked?"♥ Liked":"♡ Like")+'</button>':'<button class="btn primary" id="clientLightboxDownload">↓ Download</button>')+'<button class="btn secondary" id="clientNext">Next →</button></div></div></div>';
 $("#closeClientLightbox").onclick=closeModal;
 $("#clientPrev").onclick=()=>openClientLightbox((index-1+photos.length)%photos.length,kind);
 $("#clientNext").onclick=()=>openClientLightbox((index+1)%photos.length,kind);
 if(proof)$("#clientLightboxLike").onclick=async()=>{await toggleClientReviewLike(p,$("#clientLightboxLike"))};
 else $("#clientLightboxDownload").onclick=()=>downloadClientPhoto(p.id,$("#clientLightboxDownload"))
}
function renderClientReviewGallery(d){
 const B=$("#clientBody"),photos=d.photos||[],liked=photos.filter(p=>p.liked).length,submitted=d.review?.submitted_at||d.review?.status==="submitted";
 if(submitted){B.innerHTML='<div class="gate"><section class="card gate-card"><div style="font-size:50px">✓</div><div class="kicker">SELECTIONS RECEIVED</div><h1>Selections sent.</h1><p>Your choices have been returned to '+esc(d.studio_name||"the photographer")+' and are ready for editing.</p></section></div>';return}
 B.innerHTML='<div class="gallery-head"><div><div class="kicker">CLIENT REVIEW — BEFORE EDITING'+(d.studio_name?' • '+esc(d.studio_name):'')+'</div><h1>'+esc(d.project.name)+'</h1><p>'+esc(d.review?.message||"Choose the photographs you would like edited.")+'<br>'+photos.length+' photographs • Like the images you want edited and leave notes where needed.</p></div><div class="gallery-count"><strong id="likedCount">'+liked+" / "+photos.length+'</strong><div class="kicker">selected</div></div></div><div class="review-gallery">'+photos.map((p,i)=>'<article class="card client-photo" data-cp="'+p.id+'"><div style="position:relative" class="client-photo-open" data-client-open="'+i+'">'+(p.signed_url?'<img src="'+esc(p.signed_url)+'" draggable="false" oncontextmenu="return false">':'<div class="photo-media">Preview unavailable</div>')+(d.review.watermark_enabled?'<div class="watermark">HIGH STYLE — CLIENT PROOF</div>':"")+'</div><div class="client-photo-body"><div class="photo-name">'+esc(p.filename)+'</div><div class="client-actions"><button class="btn small '+(p.liked?"pick":"secondary")+'" data-like="'+p.id+'">'+(p.liked?"♥ Liked":"♡ Like")+'</button><button class="btn secondary small" data-client-open="'+i+'">View</button></div><textarea class="note-area" data-note="'+p.id+'" placeholder="Add a note for the photographer…">'+esc(p.note||"")+"</textarea></div></article>").join("")+'</div><div class="card sticky-submit"><span><b id="bottomLiked">'+liked+'</b> photos selected. Your progress saves automatically.</span><button class="btn primary" id="submitReview">Submit Selections →</button></div>';
 $$("[data-like]").forEach(b=>b.onclick=()=>{const p=photos.find(x=>x.id===b.dataset.like);toggleClientReviewLike(p,b)});
 $$("[data-client-open]").forEach(x=>x.onclick=e=>{if(e.target.closest("[data-like]"))return;openClientLightbox(+x.dataset.clientOpen,"review")});
 $$("[data-note]").forEach(t=>t.oninput=()=>{clearTimeout(S.noteTimers.get(t.dataset.note));S.noteTimers.set(t.dataset.note,setTimeout(async()=>{try{await api("hsm-client",{action:"update_review_photo",kind:"review",gallery_token:S.clientToken,session_token:S.clientSession,photo_id:t.dataset.note,note:t.value},false);const p=photos.find(x=>x.id===t.dataset.note);if(p)p.note=t.value}catch(err){toast(err.message)}},500))});
 $("#submitReview").onclick=async()=>{const n=photos.filter(x=>x.liked).length;if(!n)return toast("Like at least one photograph first.");showModal('<div class="modal-head"><div><div class="kicker">CLIENT CONFIRMATION</div><h2>Submit selections?</h2></div><button class="close" data-close>×</button></div><p>You selected <b>'+n+" of "+photos.length+'</b> photographs. These will be returned to the photographer for editing.</p><div class="notice success">Once submitted, the photographer gets a notification and your selected images appear in their Client Reviews dashboard.</div><div class="actions" style="justify-content:flex-end"><button class="btn secondary" data-close>Keep Reviewing</button><button class="btn primary" id="confirmSubmit">Approve '+n+' Photos</button></div>');$("#confirmSubmit").onclick=async()=>{try{await api("hsm-client",{action:"submit_review",kind:"review",gallery_token:S.clientToken,session_token:S.clientSession},false);closeModal();await loadClientGallery(S.clientSession)}catch(err){toast(err.message)}}}
}
async function downloadClientPhoto(photoId,button){
 if(button)button.disabled=true;
 try{
  const r=await api("hsm-client",{action:"download",kind:"delivery",gallery_token:S.clientToken,session_token:S.clientSession,photo_id:photoId},false);
  const a=document.createElement("a");a.href=r.url;a.download=r.filename||"";document.body.appendChild(a);a.click();a.remove()
 }catch(err){toast(err.message)}finally{if(button)button.disabled=false}
}
function renderFinalGallery(d){
 const B=$("#clientBody"),photos=d.photos||[],expiry=d.delivery?.expires_at?new Date(d.delivery.expires_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"";
 B.innerHTML='<section class="card final-delivery-hero"><div><div class="kicker">FINAL DELIVERY'+(d.studio_name?' • '+esc(d.studio_name):'')+'</div><h1>'+esc(d.project.name)+'</h1><p>'+esc(d.delivery?.message||"Your finished photographs are ready to view and download.")+'</p><div class="final-delivery-meta"><span>'+photos.length+' finished photographs</span>'+(expiry?'<span>Available until '+esc(expiry)+'</span>':'')+'<span>'+esc(statusLabel(d.delivery?.quality||"full"))+' resolution</span></div></div><button class="btn primary" id="downloadAllFinals">↓ Download All</button></section><div class="review-gallery final-gallery-grid">'+photos.map((p,i)=>'<article class="card client-photo"><div class="client-photo-open" data-final-open="'+i+'">'+(p.signed_url?'<img src="'+esc(p.signed_url)+'" alt="">':'<div class="photo-media">Final preview unavailable</div>')+'</div><div class="client-photo-body"><div class="photo-name">'+esc(p.filename)+'</div><div class="client-actions"><button class="btn secondary small" data-final-open="'+i+'">View</button><button class="btn primary small" data-download="'+p.id+'">↓ Download</button></div></div></article>').join("")+"</div>";
 $$("[data-final-open]").forEach(x=>x.onclick=()=>openClientLightbox(+x.dataset.finalOpen,"delivery"));
 $$("[data-download]").forEach(b=>b.onclick=()=>downloadClientPhoto(b.dataset.download,b));
 $("#downloadAllFinals").onclick=async()=>{const btn=$("#downloadAllFinals");btn.disabled=true;btn.textContent="Preparing ZIP…";try{const {default:JSZip}=await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");const zip=new JSZip();let i=0;for(const p of photos){if(!p.downloadable)continue;i++;btn.textContent="Adding "+i+" / "+photos.length;const r=await api("hsm-client",{action:"download",kind:"delivery",gallery_token:S.clientToken,session_token:S.clientSession,photo_id:p.id},false);const b=await fetch(r.url).then(x=>x.blob());zip.file(r.filename||p.filename,b)}btn.textContent="Creating ZIP…";const blob=await zip.generateAsync({type:"blob"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=cleanName(d.project.name)+"_High_Style_Delivery.zip";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}catch(err){toast(err.message)}finally{btn.disabled=false;btn.textContent="↓ Download All"}}
}

init();
