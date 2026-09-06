import Stripe from 'npm:stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async req=>{
  if(req.method!=='POST') return new Response('Method not allowed',{status:405});
  const stripeKey=Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret=Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if(!stripeKey||!webhookSecret) return new Response('Billing is not configured',{status:503});
  const sig=req.headers.get('stripe-signature');
  if(!sig) return new Response('Missing signature',{status:400});
  const body=await req.text();
  const stripe=new Stripe(stripeKey,{apiVersion:'2025-08-27.basil'});
  let event:Stripe.Event;
  try{
    event=await stripe.webhooks.constructEventAsync(body,sig,webhookSecret,undefined,Stripe.createSubtleCryptoProvider());
  }catch(error){return new Response(`Invalid webhook: ${error instanceof Error?error.message:String(error)}`,{status:400})}

  const admin=createClient(supabaseUrl,service,{auth:{persistSession:false}});
  try{
    if(event.type==='checkout.session.completed'){
      const session=event.data.object as Stripe.Checkout.Session;
      const userId=(session.metadata?.user_id||session.client_reference_id) as string|undefined;
      if(userId){
        await admin.from('subscriptions').upsert({
          user_id:userId,provider:'stripe',provider_customer_id:String(session.customer||''),
          provider_subscription_id:String(session.subscription||''),status:'active'
        },{onConflict:'user_id,provider'});
        await admin.from('audit_events').insert({user_id:userId,event_type:'billing_checkout_completed',payload:{session_id:session.id}});
      }
    }
    if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      const sub=event.data.object as Stripe.Subscription;
      const status=event.type==='customer.subscription.deleted'?'cancelled':sub.status;
      await admin.from('subscriptions').update({status,provider_customer_id:String(sub.customer||''),current_period_end:new Date((sub.items.data[0]?.current_period_end||Math.floor(Date.now()/1000))*1000).toISOString()})
        .eq('provider_subscription_id',sub.id);
    }
    return new Response(JSON.stringify({received:true}),{headers:{'content-type':'application/json'}});
  }catch(error){return new Response(`Webhook processing failed: ${error instanceof Error?error.message:String(error)}`,{status:500})}
});
