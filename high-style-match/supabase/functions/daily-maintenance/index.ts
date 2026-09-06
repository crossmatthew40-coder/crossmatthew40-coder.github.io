import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  const expected=Deno.env.get('HSM_CRON_SECRET');
  if(!expected||req.headers.get('x-cron-secret')!==expected) return json({error:'Unauthorized'},401);
  const url=Deno.env.get('SUPABASE_URL')!;
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const now=new Date().toISOString();
  try{
    const {data:expiredInvites}=await admin.from('invitations').update({status:'expired'}).eq('status','pending').lt('expires_at',now).select('id');

    const {data:expiredDeliveries}=await admin.from('deliveries').select('id,project_id').not('expires_at','is',null).lt('expires_at',now);
    for(const d of (expiredDeliveries||[])){
      const {count}=await admin.from('delivery_events').select('id',{head:true,count:'exact'}).eq('delivery_id',d.id).eq('event_type','expired');
      if(!count) await admin.from('delivery_events').insert({delivery_id:d.id,project_id:d.project_id,event_type:'expired',metadata:{expired_at:now}});
    }

    // Metadata backup snapshots for active projects. RAW/original files are intentionally not copied here.
    const {data:projects,error:projectError}=await admin.from('projects').select('*').neq('status','archived');
    if(projectError) throw projectError;
    let snapshots=0;
    for(const p of (projects||[])){
      const [shots,photos,reviews,deliveries]=await Promise.all([
        admin.from('shot_items').select('*').eq('project_id',p.id),
        admin.from('project_photos').select('id,project_id,local_photo_id,local_shot_id,original_filename,preview_path,orientation,width,height,capture_at,status,metadata,created_at,updated_at').eq('project_id',p.id),
        admin.from('project_reviews').select('*').eq('project_id',p.id),
        admin.from('deliveries').select('*').eq('project_id',p.id)
      ]);
      await admin.from('project_versions').insert({project_id:p.id,created_by:p.owner_id,label:`Automatic backup ${now.slice(0,10)}`,snapshot:{project:p,shots:shots.data||[],photos:photos.data||[],reviews:reviews.data||[],deliveries:deliveries.data||[]}});
      snapshots++;
    }

    // Retain 30 days of resolved client error records.
    const old=new Date(Date.now()-30*86400000).toISOString();
    await admin.from('app_errors').delete().not('resolved_at','is',null).lt('created_at',old);

    return json({ok:true,expiredInvites:expiredInvites?.length||0,expiredDeliveries:expiredDeliveries?.length||0,snapshots});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});
