// High Style Match account router — role-aware session handling.
(function(){
  'use strict';
  let client=null,loader=null;
  const cfg=()=>window.HSM_AUTH||{};
  const configured=()=>{const c=cfg();return c.provider==='supabase'&&!!c.url&&!!c.anonKey};
  async function getClient(){
    if(!configured()) throw new Error('Secure accounts are not connected yet.');
    if(client) return client;
    if(!loader) loader=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({createClient})=>{
      const c=cfg();
      client=createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      return client;
    });
    return loader;
  }
  function homeForRole(role){
    if(role==='customer') return '/high-style-match/customer/';
    if(role==='admin') return '/high-style-match/admin/';
    return '/high-style-match/';
  }
  async function session(){const sb=await getClient();const {data,error}=await sb.auth.getSession();if(error)throw error;return data.session||null}
  async function profile(){
    const sb=await getClient(),s=await session();
    if(!s) return null;
    const {data,error}=await sb.from('profiles').select('id,email,display_name,role,created_at').eq('id',s.user.id).single();
    if(error) throw error;
    return data;
  }
  async function context(){const s=await session();if(!s)return null;const p=await profile();return{session:s,profile:p,home:homeForRole(p?.role)}}
  async function routeAfterSignIn(expectedRole=null,returnTo=null){
    const c=await context();
    if(!c) throw new Error('No signed-in session was found.');
    const role=c.profile?.role||'customer';
    if(expectedRole==='photographer'&&!['photographer','admin'].includes(role)) throw new Error('This account is a client account. Choose Client sign in.');
    if(expectedRole==='customer'&&role!=='customer') throw new Error('This account is a photographer account. Choose Photographer sign in.');
    const safe=returnTo&&String(returnTo).startsWith('/high-style-match/')?returnTo:null;
    location.href=safe||c.home;
  }
  async function signOut(){const sb=await getClient();const {error}=await sb.auth.signOut();if(error)throw error}
  window.HSMAuthRouter={configured,getClient,session,profile,context,homeForRole,routeAfterSignIn,signOut};
})();
