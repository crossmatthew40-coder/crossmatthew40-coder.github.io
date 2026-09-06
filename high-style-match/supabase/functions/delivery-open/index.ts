import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const auth=req.headers.get('Authorization')||'';
    const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await userClient.auth.getUser();
    if(userError||!user) return json({error:'Authentication required'},401);
    const {deliveryId}=await req.json();
    if(!deliveryId) return json({error:'deliveryId required'},400);
    const {data:delivery,error}=await userClient.from('deliveries').select('id,project_id,delivery_url,opened_at').eq('id',deliveryId).single();
    if(error||!delivery) return json({error:'Delivery not found or access denied'},404);
    const admin=createClient(url,service,{auth:{persistSession:false}});
    const openedAt=delivery.opened_at||new Date().toISOString();
    await admin.from('deliveries').update({opened_at:openedAt}).eq('id',delivery.id);
    await admin.from('delivery_events').insert({delivery_id:delivery.id,project_id:delivery.project_id,user_id:user.id,event_type:'opened',metadata:{}});
    return json({ok:true,url:delivery.delivery_url,openedAt});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});
