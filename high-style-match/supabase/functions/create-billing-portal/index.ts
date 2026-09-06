import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey=Deno.env.get('STRIPE_SECRET_KEY');
    const site=(Deno.env.get('HSM_SITE_URL')||'https://crossmatthew40-coder.github.io').replace(/\/$/,'');
    if(!stripeKey) return json({error:'Billing is not configured'},503);
    const auth=req.headers.get('Authorization')||'';
    const userClient=createClient(supabaseUrl,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error}=await userClient.auth.getUser();
    if(error||!user) return json({error:'Authentication required'},401);
    const admin=createClient(supabaseUrl,service,{auth:{persistSession:false}});
    const {data:sub}=await admin.from('subscriptions').select('provider_customer_id').eq('user_id',user.id).eq('provider','stripe').maybeSingle();
    if(!sub?.provider_customer_id) return json({error:'No Stripe customer is linked to this account'},404);
    const form=new URLSearchParams();
    form.set('customer',sub.provider_customer_id);
    form.set('return_url',`${site}/high-style-match/`);
    const r=await fetch('https://api.stripe.com/v1/billing_portal/sessions',{method:'POST',headers:{Authorization:`Bearer ${stripeKey}`,'content-type':'application/x-www-form-urlencoded'},body:form});
    const data=await r.json();
    if(!r.ok) return json({error:data?.error?.message||'Unable to create billing portal session'},400);
    return json({url:data.url});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});
