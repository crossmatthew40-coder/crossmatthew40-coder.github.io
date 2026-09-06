// High Style Match cloud client
// Browser-safe: public Supabase URL + anon key only. Never expose service-role or Stripe secrets here.
(function(){
  'use strict';

  let client=null;
  let loader=null;
  const QUEUE_KEY='hsmCloudQueueV1';
  const HASH_KEY='hsmCloudHashesV1';

  const config=()=>window.HSM_AUTH||{};
  const configured=()=>{
    const c=config();
    return c.provider==='supabase'&&!!c.url&&!!c.anonKey;
  };

  async function getClient(){
    if(!configured()) throw new Error('High Style Match cloud is not configured yet.');
    if(client) return client;
    if(!loader){
      loader=import('https://esm.sh/@supabase/supabase-js@2').then(({createClient})=>{
        const c=config();
        client=createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
        return client;
      });
    }
    return loader;
  }

  async function getSession(){
    const sb=await getClient();
    const {data,error}=await sb.auth.getSession();
    if(error) throw error;
    return data.session||null;
  }

  async function requireSession(){
    const session=await getSession();
    if(!session) throw new Error('You need to sign in first.');
    return session;
  }

  async function getProfile(){
    const sb=await getClient();
    const session=await requireSession();
    const {data,error}=await sb.from('profiles').select('*').eq('id',session.user.id).single();
    if(error) throw error;
    return data;
  }

  async function updateProfile(values){
    const sb=await getClient();
    const session=await requireSession();
    const allowed={display_name:values.display_name||null};
    const {data,error}=await sb.from('profiles').update(allowed).eq('id',session.user.id).select().single();
    if(error) throw error;
    return data;
  }

  async function listProjects(){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('projects')
      .select('id,name,client_name,shoot_date,status,notes,local_project_id,created_at,updated_at')
      .order('shoot_date',{ascending:false,nullsFirst:false})
      .order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  async function getProject(projectId){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('projects').select('*').eq('id',projectId).single();
    if(error) throw error;
    return data;
  }

  async function listShotItems(projectId){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('shot_items').select('*').eq('project_id',projectId)
      .order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(error) throw error;
    return data||[];
  }

  async function listPhotos(projectId){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('project_photos').select('*').eq('project_id',projectId)
      .order('capture_at',{ascending:true,nullsFirst:false}).order('created_at',{ascending:true});
    if(error) throw error;
    return data||[];
  }

  async function listReviews(projectId){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('project_reviews').select('*').eq('project_id',projectId).order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  async function saveReview({projectId,photoId=null,decision,comment=''}){
    const sb=await getClient();
    const session=await requireSession();
    const payload={project_id:projectId,photo_id:photoId,user_id:session.user.id,decision,comment:comment||null};
    const {data,error}=await sb.from('project_reviews').insert(payload).select().single();
    if(error) throw error;
    return data;
  }

  async function listDeliveries(projectId){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('deliveries').select('*').eq('project_id',projectId).order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  async function createDelivery(projectId,values={}){
    const sb=await getClient();
    const session=await requireSession();
    const payload={
      project_id:projectId,created_by:session.user.id,provider:values.provider||'link',
      delivery_url:values.delivery_url||null,version:values.version||'1',delivered_at:values.delivered_at||new Date().toISOString(),
      expires_at:values.expires_at||null,metadata:values.metadata||{}
    };
    const {data,error}=await sb.from('deliveries').insert(payload).select().single();
    if(error) throw error;
    return data;
  }

  async function signedPreviewUrl(path,expiresIn=3600){
    if(!path) return null;
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.storage.from('project-previews').createSignedUrl(path,expiresIn);
    if(error) throw error;
    return data?.signedUrl||null;
  }

  async function uploadPreview(projectId,localPhotoId,blob,filename='preview.jpg'){
    if(!blob) throw new Error('Preview file is missing.');
    const sb=await getClient();
    await requireSession();
    const safe=(filename||'preview.jpg').replace(/[^a-z0-9._-]+/gi,'-').toLowerCase();
    const path=`${projectId}/${localPhotoId}-${safe}`;
    const {error:uploadError}=await sb.storage.from('project-previews').upload(path,blob,{upsert:true,contentType:blob.type||'image/jpeg',cacheControl:'3600'});
    if(uploadError) throw uploadError;
    const {error:updateError}=await sb.from('project_photos').update({preview_path:path})
      .eq('project_id',projectId).eq('local_photo_id',String(localPhotoId));
    if(updateError) throw updateError;
    return path;
  }

  async function createCustomerAccount(name){
    const sb=await getClient();
    const session=await requireSession();
    const {data,error}=await sb.from('customer_accounts').insert({name,created_by:session.user.id}).select().single();
    if(error) throw error;
    return data;
  }

  async function listCustomerAccounts(){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('customer_accounts').select('*').order('name');
    if(error) throw error;
    return data||[];
  }

  async function listInvitations(){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('invitations').select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  async function createInvitationRecord({projectId,customerAccountId=null,email,permission='review',expiresAt=null}){
    const sb=await getClient();
    const session=await requireSession();
    const {data,error}=await sb.from('invitations').insert({
      project_id:projectId,customer_account_id:customerAccountId,email,permission,status:'pending',invited_by:session.user.id,expires_at:expiresAt
    }).select().single();
    if(error) throw error;
    return data;
  }

  async function revokeInvitation(id){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.from('invitations').update({status:'revoked'}).eq('id',id).select().single();
    if(error) throw error;
    return data;
  }

  async function invokeFunction(name,body={}){
    const sb=await getClient();
    await requireSession();
    const {data,error}=await sb.functions.invoke(name,{body});
    if(error) throw error;
    return data;
  }

  async function sendCustomerInvite(payload){
    return invokeFunction('invite-customer',payload);
  }

  async function createCheckoutSession(priceId){
    return invokeFunction('create-checkout-session',{priceId});
  }

  async function createBillingPortal(){
    return invokeFunction('create-billing-portal',{});
  }

  function normalizeProjectStatus(shoot){
    if(shoot?.delivery?.status==='delivered'||shoot?.delivery?.deliveredAt) return 'delivered';
    if(shoot?.reviewApproved) return 'approved';
    if((shoot?.photos||[]).length) return 'shooting';
    return 'planned';
  }

  async function syncLocalShoot(shoot){
    if(!shoot?.id) throw new Error('Local shoot has no id.');
    const sb=await getClient();
    const session=await requireSession();
    const projectPayload={
      owner_id:session.user.id,
      local_project_id:String(shoot.id),
      name:shoot.name||shoot.client||'Untitled Shoot',
      client_name:shoot.client||null,
      shoot_date:shoot.date||null,
      status:normalizeProjectStatus(shoot),
      notes:shoot.location?`Location: ${shoot.location}`:null
    };

    let {data:project,error:findError}=await sb.from('projects').select('*')
      .eq('owner_id',session.user.id).eq('local_project_id',String(shoot.id)).maybeSingle();
    if(findError) throw findError;
    if(project){
      const {data,error}=await sb.from('projects').update(projectPayload).eq('id',project.id).select().single();
      if(error) throw error; project=data;
    }else{
      const {data,error}=await sb.from('projects').insert(projectPayload).select().single();
      if(error) throw error; project=data;
    }

    const shots=(shoot.shots||[]).map((s,i)=>({
      project_id:project.id,local_shot_id:String(s.id||`${i}`),subject:s.subject||s.name||`Shot ${i+1}`,
      variant:s.variant||null,notes:s.notes||null,sort_order:i,
      state:s.skip?'skipped':(s.state||'missing')
    }));
    if(shots.length){
      const {error}=await sb.from('shot_items').upsert(shots,{onConflict:'project_id,local_shot_id'});
      if(error) throw error;
    }

    const photos=(shoot.photos||[]).map((p,i)=>({
      project_id:project.id,local_photo_id:String(p.id||`${i}`),local_shot_id:p.shotId?String(p.shotId):null,
      original_filename:p.name||`Photo ${i+1}`,orientation:p.orientation||null,width:p.width||null,height:p.height||null,
      capture_at:p.captureAt?new Date(p.captureAt).toISOString():null,
      status:p.cullExcluded?'rejected':(p.cullManualPick?'pick':'captured'),
      metadata:{size:p.size||null,lastModified:p.lastModified||null,ext:p.ext||null,needsReconnect:!!p.needsReconnect}
    }));
    if(photos.length){
      const {error}=await sb.from('project_photos').upsert(photos,{onConflict:'project_id,local_photo_id'});
      if(error) throw error;
    }

    await recordEvent('project_sync',{project_id:project.id,local_project_id:String(shoot.id),shot_count:shots.length,photo_count:photos.length});
    return project;
  }

  async function recordEvent(type,payload={}){
    if(!configured()) return null;
    try{
      const sb=await getClient();
      const session=await getSession();
      if(!session) return null;
      const {data,error}=await sb.from('audit_events').insert({user_id:session.user.id,event_type:type,payload}).select().single();
      if(error) throw error;
      return data;
    }catch(e){
      console.warn('HSM audit event failed',e);
      return null;
    }
  }

  async function logClientError(message,details={}){
    if(!configured()) return null;
    try{
      const sb=await getClient();
      const session=await getSession();
      const {data,error}=await sb.from('app_errors').insert({
        user_id:session?.user?.id||null,message:String(message||'Unknown client error').slice(0,2000),
        page_url:location.href,user_agent:navigator.userAgent,details
      }).select().single();
      if(error) throw error;
      return data;
    }catch(e){
      console.warn('HSM error report failed',e);
      return null;
    }
  }

  async function adminOverview(){
    const profile=await getProfile();
    if(profile.role!=='admin') throw new Error('Admin access required.');
    const sb=await getClient();
    const [projects,users,invites,errors,subs]=await Promise.all([
      sb.from('projects').select('id',{count:'exact',head:true}),
      sb.from('profiles').select('id',{count:'exact',head:true}),
      sb.from('invitations').select('id',{count:'exact',head:true}).eq('status','pending'),
      sb.from('app_errors').select('id',{count:'exact',head:true}).gte('created_at',new Date(Date.now()-86400000).toISOString()),
      sb.from('subscriptions').select('id',{count:'exact',head:true}).eq('status','active')
    ]);
    const firstError=[projects,users,invites,errors,subs].find(x=>x.error)?.error;
    if(firstError) throw firstError;
    return {projects:projects.count||0,users:users.count||0,pendingInvites:invites.count||0,errors24h:errors.count||0,activeSubscriptions:subs.count||0};
  }

  function queue(){
    try{return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch{return[]}
  }
  function setQueue(items){localStorage.setItem(QUEUE_KEY,JSON.stringify(items.slice(-200)))}
  function enqueue(op){const q=queue();q.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),at:Date.now(),tries:0,...op});setQueue(q);return q.length}
  async function flushQueue(){
    if(!configured()||!navigator.onLine) return {processed:0,remaining:queue().length};
    const q=queue();const remaining=[];let processed=0;
    for(const item of q){
      try{
        if(item.type==='sync_project') await syncLocalShoot(item.payload);
        else if(item.type==='audit') await recordEvent(item.eventType,item.payload||{});
        processed++;
      }catch(e){
        remaining.push({...item,tries:(item.tries||0)+1,lastError:String(e.message||e)});
      }
    }
    setQueue(remaining.filter(x=>x.tries<6));
    return {processed,remaining:queue().length};
  }

  function getHashes(){try{return JSON.parse(localStorage.getItem(HASH_KEY)||'{}')}catch{return{}}}
  function setHashes(v){localStorage.setItem(HASH_KEY,JSON.stringify(v||{}))}

  async function signOut(){
    const sb=await getClient();
    const {error}=await sb.auth.signOut();
    if(error) throw error;
  }

  window.HSMCloud={
    configured,getClient,getSession,requireSession,getProfile,updateProfile,
    listProjects,getProject,listShotItems,listPhotos,listReviews,saveReview,
    listDeliveries,createDelivery,signedPreviewUrl,uploadPreview,
    createCustomerAccount,listCustomerAccounts,listInvitations,createInvitationRecord,revokeInvitation,
    invokeFunction,sendCustomerInvite,createCheckoutSession,createBillingPortal,
    syncLocalShoot,recordEvent,logClientError,adminOverview,
    queue,enqueue,flushQueue,getHashes,setHashes,signOut
  };
})();
