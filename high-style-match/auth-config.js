// High Style Match customer authentication configuration.
// This file intentionally contains no private server secret.
// When Supabase is connected, set the public project URL and public anon key here.
// Protect customer data with Supabase Row Level Security policies before enabling real accounts.
window.HSM_AUTH = {
  provider: 'supabase',
  url: '',
  anonKey: '',
  afterSignIn: '/high-style-match/customer/'
};

(function enhanceHighStyleSignIn(){
  if(!location.pathname.includes('/high-style-match/sign-in/')) return;

  function run(){
    const logoUrl='/high-style-logo.svg';

    // Replace the placeholder mark with the High Style artwork.
    const mark=document.querySelector('.brand .mark');
    if(mark && !mark.querySelector('img')){
      mark.innerHTML='';
      Object.assign(mark.style,{
        width:'72px',height:'72px',background:'transparent',border:'0',
        borderRadius:'0',boxShadow:'none',display:'grid',placeItems:'center'
      });
      const img=document.createElement('img');
      img.src=logoUrl;
      img.alt='High Style';
      Object.assign(img.style,{width:'100%',height:'100%',objectFit:'contain',display:'block'});
      mark.appendChild(img);
    }

    // Put the brand mark directly into the sign-in panel as well.
    const wrap=document.querySelector('.login-wrap');
    if(wrap && !wrap.querySelector('.hsm-signin-logo')){
      const logo=document.createElement('img');
      logo.className='hsm-signin-logo';
      logo.src=logoUrl;
      logo.alt='High Style Match';
      Object.assign(logo.style,{
        width:'108px',height:'108px',objectFit:'contain',display:'block',
        margin:'0 0 18px',background:'transparent'
      });
      wrap.prepend(logo);
    }

    // Preview path: skips account login but does not grant authenticated customer access.
    if(wrap && !document.getElementById('skipLogin')){
      const divider=document.createElement('div');
      divider.className='divider';
      divider.textContent='OR';

      const skip=document.createElement('button');
      skip.id='skipLogin';
      skip.type='button';
      skip.className='secondary';
      skip.textContent='Skip for now';
      skip.style.marginTop='0';
      skip.addEventListener('click',()=>{
        sessionStorage.setItem('hsm_gate_seen','1');
        sessionStorage.setItem('hsm_login_skipped','1');
        location.href='../';
      });

      const status=document.getElementById('status');
      if(status){
        status.insertAdjacentElement('afterend',divider);
        divider.insertAdjacentElement('afterend',skip);
      }else{
        wrap.append(divider,skip);
      }
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
