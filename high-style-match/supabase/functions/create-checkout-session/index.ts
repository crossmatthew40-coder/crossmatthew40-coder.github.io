import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const stripeKey=Deno.env.get('STRIPE_SECRET_KEY');
    const priceId=Deno.env.get('HSM_STRIPE_PRICE_ID');
    const site=(Deno.env.get('HSM_SITE_URL')||'https://crossmatthew40-coder.github.io').replace(/\/$/,'');
    if(!stripeKey||!priceId) return json({error:'Billing is not configured'},503);

    const auth=req.headers.get('Authorization')||'';
    const sb=createClient(supabaseUrl,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error}=await sb.auth.getUser();
    if(error||!user) return json({error:'Authentication required'},401);

    const form=new URLSearchParams();
    form.set('mode','subscription');
    form.set('client_reference_id',user.id);
    form.set('customer_email',user.email||'');
    form.set('line_items[0][price]',priceId);
    form.set('line_items[0][quantity]','1');
    form.set('allow_promotion_codes','true');
    form.set('success_url',`${site}/high-style-match/?billing=success&session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url',`${site}/high-style-match/?billing=cancelled`);
    form.set('metadata[user_id]',user.id);

    const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${stripeKey}`,'content-type':'application/x-www-form-urlencoded'},body:form});
    const data=await r.json();
    if(!r.ok) return json({error:data?.error?.message||'Stripe checkout failed'},400);
    return json({url:data.url,id:data.id});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});
