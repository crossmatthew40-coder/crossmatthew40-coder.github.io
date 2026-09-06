import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  const secret=Deno.env.get('HSM_INTERNAL_SECRET');
  if(!secret||req.headers.get('x-hsm-secret')!==secret) return json({error:'Unauthorized'},401);
  const resend=Deno.env.get('RESEND_API_KEY');
  const from=Deno.env.get('HSM_NOTIFICATION_FROM')||'High Style Match <notifications@highstylegroup.co.uk>';
  if(!resend) return json({error:'Email provider is not configured'},503);
  try{
    const {to,subject,html,text,eventType,userId,projectId}=await req.json();
    if(!to||!subject||(!html&&!text)) return json({error:'to, subject and message are required'},400);
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'content-type':'application/json'},body:JSON.stringify({from,to:Array.isArray(to)?to:[to],subject,html,text})});
    const data=await r.json();
    if(!r.ok) return json({error:data?.message||'Email send failed'},400);
    const url=Deno.env.get('SUPABASE_URL');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(url&&service){
      const admin=createClient(url,service,{auth:{persistSession:false}});
      await admin.from('audit_events').insert({user_id:userId||null,project_id:projectId||null,event_type:eventType||'notification_sent',payload:{to,subject,email_id:data.id}});
    }
    return json({ok:true,id:data.id});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});
