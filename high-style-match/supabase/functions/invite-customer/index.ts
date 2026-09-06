import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const site=(Deno.env.get('HSM_SITE_URL')||'https://crossmatthew40-coder.github.io').replace(/\/$/,'');
    const auth=req.headers.get('Authorization')||'';
    if(!auth) return json({error:'Authentication required'},401);

    const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await userClient.auth.getUser();
    if(userError||!user) return json({error:'Invalid session'},401);

    const {projectId,email,permission='review',customerAccountId=null}=await req.json();
    if(!projectId||!email) return json({error:'projectId and email are required'},400);
    if(!['view','review','approve'].includes(permission)) return json({error:'Invalid permission'},400);

    const admin=createClient(url,service,{auth:{persistSession:false}});
    const {data:project,error:projectError}=await admin.from('projects').select('id,owner_id,name').eq('id',projectId).single();
    if(projectError||!project) return json({error:'Project not found'},404);
    if(project.owner_id!==user.id) return json({error:'Only the project owner can invite customers'},403);

    const redirectTo=`${site}/high-style-match/customer/?project=${encodeURIComponent(projectId)}`;
    const {data:invite,error:inviteError}=await admin.auth.admin.inviteUserByEmail(String(email).trim().toLowerCase(),{
      redirectTo,
      data:{hsm_project_id:projectId,hsm_permission:permission}
    });
    if(inviteError) return json({error:inviteError.message},400);

    const invitedUser=invite.user;
    if(invitedUser?.id){
      await admin.from('project_access').upsert({project_id:projectId,user_id:invitedUser.id,permission},{onConflict:'project_id,user_id'});
      if(customerAccountId){
        await admin.from('customer_members').upsert({customer_account_id:customerAccountId,user_id:invitedUser.id,role:'member'},{onConflict:'customer_account_id,user_id'});
      }
    }

    await admin.from('invitations').insert({
      project_id:projectId,customer_account_id:customerAccountId,email:String(email).trim().toLowerCase(),permission,
      status:'pending',invited_by:user.id,expires_at:new Date(Date.now()+7*86400000).toISOString()
    });
    await admin.from('audit_events').insert({user_id:user.id,project_id:projectId,event_type:'customer_invited',payload:{email,permission}});

    return json({ok:true,projectId,email,permission});
  }catch(error){
    return json({error:error instanceof Error?error.message:String(error)},500);
  }
});
