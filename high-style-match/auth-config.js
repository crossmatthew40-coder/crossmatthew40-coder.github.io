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

  function addMonoTheme(){
    if(document.getElementById('hsm-signin-mono')) return;
    const style=document.createElement('style');
    style.id='hsm-signin-mono';
    style.textContent=`
      :root{--accent:#fff!important;--accent2:#fff!important;--ink:#fff!important;--muted:#a3a3a3!important;--bg:#000!important;--line:#292929!important;--surface:#0b0b0b!important;--dark:#000!important}
      html,body,.page{background:#000!important;color:#fff!important}
      .brand-panel{background:#000!important;background-image:none!important;border-right:1px solid #242424!important}
      .brand-panel:before,.brand-panel:after{display:none!important}
      .brand-copy h1,.brand b,.login-wrap h2,.field label,.invite b{color:#fff!important}
      .brand-copy p,.brand span,.brand-foot,.intro,.invite,.secure-note,.remember,.back{color:#999!important}
      .eyebrow,.portal-label,.text-link{color:#fff!important}
      .portal-label{background:#111!important;border:1px solid #333!important;border-radius:3px!important}
      .login-panel,.login-wrap{background:#000!important;color:#fff!important}
      .field input{background:#050505!important;color:#fff!important;border:1px solid #333!important;border-radius:3px!important;box-shadow:none!important}
      .field input:focus{border-color:#fff!important;box-shadow:0 0 0 1px #fff!important}
      .primary{background:#fff!important;color:#000!important;border:1px solid #fff!important;border-radius:3px!important;box-shadow:none!important}
      .primary:hover{background:#e8e8e8!important;color:#000!important;transform:none!important;box-shadow:none!important}
      .secondary{background:#111!important;color:#fff!important;border:1px solid #333!important;border-radius:3px!important}
      .secondary:hover{background:#1a1a1a!important}
      .divider{color:#777!important}.divider:before,.divider:after{background:#292929!important}
      .show-pass{color:#aaa!important}.show-pass:hover{color:#fff!important}
      .status{border-radius:3px!important}.status.info,.status.success,.status.error{background:#111!important;color:#fff!important;border-color:#333!important}
      .check,.lock{background:#151515!important;color:#fff!important;border-radius:3px!important}
      .hsm-signin-logo{filter:none!important}
    `;
    document.head.appendChild(style);
  }

  function run(){
    addMonoTheme();
    const logoUrl='/high-style-logo.svg';

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
