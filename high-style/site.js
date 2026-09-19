
const b=document.querySelector('.mobile-btn'), l=document.querySelector('.links');
if(b){b.addEventListener('click',()=>l.classList.toggle('open'))}
document.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',()=>l?.classList.remove('open')));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(x=>io.observe(x));
const f=document.querySelector('#bookingForm');
if(f){f.addEventListener('submit',e=>{e.preventDefault();document.querySelector('#formMessage').textContent='Your enquiry is ready. The delivery address still needs to be connected before launch.'})}
