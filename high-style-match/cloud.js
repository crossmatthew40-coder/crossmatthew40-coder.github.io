// High Style Match cloud client
// Safe for GitHub Pages: uses only the public Supabase URL + anon key from auth-config.js.
// Never place a Supabase service-role key or other server secret in this file.
(function(){
  'use strict';

  let client = null;
  let loader = null;

  function config(){
    return window.HSM_AUTH || {};
  }

  function configured(){
    const c = config();
    return c.provider === 'supabase' && !!c.url && !!c.anonKey;
  }

  async function getClient(){
    if(!configured()) throw new Error('High Style Match cloud is not configured yet.');
    if(client) return client;
    if(!loader){
      loader = import('https://esm.sh/@supabase/supabase-js@2').then(({createClient})=>{
        const c = config();
        client = createClient(c.url, c.anonKey, {
          auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
        });
        return client;
      });
    }
    return loader;
  }

  async function getSession(){
    const sb = await getClient();
    const {data,error} = await sb.auth.getSession();
    if(error) throw error;
    return data.session || null;
  }

  async function requireSession(){
    const session = await getSession();
    if(!session) throw new Error('You need to sign in first.');
    return session;
  }

  async function getProfile(){
    const sb = await getClient();
    const session = await requireSession();
    const {data,error} = await sb.from('profiles').select('*').eq('id',session.user.id).single();
    if(error) throw error;
    return data;
  }

  async function listProjects(){
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb
      .from('projects')
      .select('id,name,client_name,shoot_date,status,notes,created_at,updated_at')
      .order('shoot_date',{ascending:false,nullsFirst:false})
      .order('created_at',{ascending:false});
    if(error) throw error;
    return data || [];
  }

  async function getProject(projectId){
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb
      .from('projects')
      .select('*')
      .eq('id',projectId)
      .single();
    if(error) throw error;
    return data;
  }

  async function listShotItems(projectId){
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb
      .from('shot_items')
      .select('*')
      .eq('project_id',projectId)
      .order('sort_order',{ascending:true})
      .order('created_at',{ascending:true});
    if(error) throw error;
    return data || [];
  }

  async function listPhotos(projectId){
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb
      .from('project_photos')
      .select('*')
      .eq('project_id',projectId)
      .order('capture_at',{ascending:true,nullsFirst:false})
      .order('created_at',{ascending:true});
    if(error) throw error;
    return data || [];
  }

  async function listReviews(projectId){
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb
      .from('project_reviews')
      .select('*')
      .eq('project_id',projectId)
      .order('created_at',{ascending:false});
    if(error) throw error;
    return data || [];
  }

  async function saveReview({projectId,photoId=null,decision,comment=''}){
    const sb = await getClient();
    const session = await requireSession();
    const payload = {
      project_id:projectId,
      photo_id:photoId,
      user_id:session.user.id,
      decision,
      comment:comment || null
    };
    const {data,error} = await sb.from('project_reviews').insert(payload).select().single();
    if(error) throw error;
    return data;
  }

  async function listDeliveries(projectId){
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb
      .from('deliveries')
      .select('*')
      .eq('project_id',projectId)
      .order('created_at',{ascending:false});
    if(error) throw error;
    return data || [];
  }

  async function signedPreviewUrl(path,expiresIn=3600){
    if(!path) return null;
    const sb = await getClient();
    await requireSession();
    const {data,error} = await sb.storage.from('project-previews').createSignedUrl(path,expiresIn);
    if(error) throw error;
    return data?.signedUrl || null;
  }

  async function signOut(){
    const sb = await getClient();
    const {error} = await sb.auth.signOut();
    if(error) throw error;
  }

  window.HSMCloud = {
    configured,
    getClient,
    getSession,
    requireSession,
    getProfile,
    listProjects,
    getProject,
    listShotItems,
    listPhotos,
    listReviews,
    saveReview,
    listDeliveries,
    signedPreviewUrl,
    signOut
  };
})();
