import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  const expected=Deno.env.get('HSM_CRON_SECRET');
  if(!expected||req.headers.get('x-cron-secret')!==expected) return json({error:'Unauthorized'},401);
  const url=Deno.env.get('SUPABASE_URL')!;
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resend=Deno.env.get('RESEND_API_KEY');
  const from=Deno.env.get('HSM_NOTIFICATION_FROM')||'High Style Match <notifications@highstylegroup.co.uk>';
  if(!resend) return json({error:'Email provider is not configured'},503);
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const {data:items,error}=await admin.from('notification_outbox').select('*').eq('status','pending').order('created_at').limit(50);
  if(error) return json({error:error.message},500);
  let sent=0,failed=0;
  for(const item of (items||[])){
    try{
      const project=item.payload?.project||'your project';
      const comment=item.payload?.comment?`<p style="color:#555">${String(item.payload.comment).replace(/[<>&]/g,'')}</p>`:'';
      const html=`<div style="font-family:Arial,sans-serif;max-width:560px"><h2>High Style Match</h2><p>${item.event_type==='customer_approval'?'A customer approved':'A customer left feedback on'} <strong>${project}</strong>.</p>${comment}<p><a href="${(Deno.env.get('HSM_SITE_URL')||'https://crossmatthew40-coder.github.io').replace(/\/$/,'')}/high-style-match/">Open High Style Match</a></p></div>`;
      const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'content-type':'application/json'},body:JSON.stringify({from,to:[item.recipient_email],subject:item.subject,html})});
      const response=await r.json();
      if(!r.ok) throw new Error(response?.message||'Email send failed');
      await admin.from('notification_outbox').update({status:'sent',sent_at:new Date().toISOString(),attempts:(item.attempts||0)+1,last_error:null}).eq('id',item.id);
      sent++;
    }catch(error){
      const attempts=(item.attempts||0)+1;
      await admin.from('notification_outbox').update({status:attempts>=5?'failed':'pending',attempts,last_error:error instanceof Error?error.message:String(error)}).eq('id',item.id);
      failed++;
    }
  }
  return json({ok:true,sent,failed,remaining:Math.max(0,(items||[]).length-sent-failed)});
});
