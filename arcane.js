'use strict';
// The interior opening becomes the visible page hero within three seconds.
function introHero(){
 const hero=document.querySelector('#main .hero');
 if(!hero)return null;
 const bounds=hero.getBoundingClientRect();
 return bounds.bottom>0&&bounds.top<window.innerHeight?hero:null;
}
function syncIntroScene(){
 if(!document.documentElement.classList.contains('is-loading'))return;
 const hero=introHero();const image=hero?.querySelector('.hero-image');
 const roomImage=document.querySelector('.loader-room img');
 if(image&&roomImage){
  const source=image.getAttribute('src');
  if(source&&roomImage.getAttribute('src')!==source)roomImage.src=source;
  roomImage.style.objectPosition=getComputedStyle(image).objectPosition;
 }
}
if(window.releaseArcaneIntro&&document.documentElement.classList.contains('is-loading')){
 for(const el of document.body.children){
  if(el.id!=='site-loader'&&!['SCRIPT','SVG','AUDIO'].includes(el.tagName)&&!el.inert){
   el.inert=true;el.setAttribute('data-intro-inert','');
  }
 }
 window.beginArcaneReveal=function(){
  const root=document.documentElement;
  if(!root.classList.contains('is-loading')||root.classList.contains('intro-bridging'))return;
  syncIntroScene();
  const hero=introHero();
  if(hero){
   const bounds=hero.getBoundingClientRect();
   for(const [name,value]of Object.entries({top:bounds.top,left:bounds.left,width:bounds.width,height:bounds.height})){
    root.style.setProperty('--intro-hero-'+name,value+'px');
   }
  }
  root.classList.add('intro-bridging');
  clearTimeout(window.arcaneIntroTimer);
  window.arcaneIntroTimer=setTimeout(window.releaseArcaneIntro,800);
 };
 clearTimeout(window.arcaneIntroTimer);
 const remaining=Math.max(0,2200-(performance.now()-window.arcaneIntroStarted));
 window.arcaneIntroTimer=setTimeout(window.beginArcaneReveal,remaining);
}
const projects=window.ArcaneKnowledge.projects;
const services=window.ArcaneKnowledge.services;
const icons={landmark:'<path d="M4 21V7l8-4 8 4v14M9 21v-4h6v4M8 9h1m6 0h1M8 12h1m6 0h1M2 21h20"/>',residential:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7M8 10h1m6 0h1"/>',workplace:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>'};
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];const asset=p=>'/project-'+p.id+'.png';const navigation=$('#navigation');const menuButtons=$$('[data-menu]');
let menuCloseTimer;let pinnedMenu=null;
const hoverNavigation=window.matchMedia('(hover: hover) and (pointer: fine)');
function closeMenus(){clearTimeout(menuCloseTimer);pinnedMenu=null;for(const b of menuButtons){b.setAttribute('aria-expanded','false');$('#'+b.dataset.menu).hidden=true;}}
function closeNavigation(){navigation.classList.remove('open');$('.mobile-toggle').setAttribute('aria-expanded','false');}
function loadHero(img,p){img.dataset.loaded='false';img.setAttribute('aria-busy','true');img.onload=()=>{img.dataset.loaded='true';img.setAttribute('aria-busy','false');};img.onerror=()=>{img.dataset.loaded='error';img.setAttribute('aria-busy','false');};img.alt='Illustrative interior concept for '+p.name;img.src=p.image?'/'+p.image:asset(p);}
function menuHero(p){loadHero($('#menu-image'),p);$('#menu-caption').textContent=p.name;$('.menu-hero').hidden=false;}
// Portfolio links are present in the HTML and work without JavaScript.
for(const link of $$('.menu-project')){const p=projects.find(p=>p.id===link.dataset.project);if(p){link.addEventListener('pointerenter',()=>menuHero(p));link.addEventListener('focus',()=>menuHero(p));}}
function openMenu(b){clearTimeout(menuCloseTimer);if(b.getAttribute('aria-expanded')==='true')return;closeMenus();b.setAttribute('aria-expanded','true');$('#'+b.dataset.menu).hidden=false;if(b.dataset.menu==='projects-menu')menuHero(projects[0]);}
function scheduleMenuClose(){clearTimeout(menuCloseTimer);menuCloseTimer=setTimeout(()=>{if(!pinnedMenu)closeMenus();},220);}
for(const b of menuButtons){
 const panel=$('#'+b.dataset.menu);
 b.addEventListener('pointerenter',()=>{if(hoverNavigation.matches)openMenu(b);});
 b.addEventListener('pointerleave',()=>{if(hoverNavigation.matches)scheduleMenuClose();});
 panel.addEventListener('pointerenter',()=>clearTimeout(menuCloseTimer));
 panel.addEventListener('pointerleave',()=>{if(hoverNavigation.matches)scheduleMenuClose();});
 b.addEventListener('click',()=>{if(pinnedMenu===b){closeMenus();return;}openMenu(b);pinnedMenu=b;});
 b.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openMenu(b);pinnedMenu=b;panel.querySelector('a,button')?.focus();}});
}
 document.addEventListener('focusin',e=>{if(!e.target.closest('.mega')&&!e.target.closest('[data-menu]'))closeMenus();});
document.addEventListener('click',e=>{if(!e.target.closest('.mega')&&!e.target.closest('[data-menu]'))closeMenus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenus();closeNavigation();}});
$('.mobile-toggle').addEventListener('click',()=>{const open=!navigation.classList.contains('open');navigation.classList.toggle('open',open);$('.mobile-toggle').setAttribute('aria-expanded',String(open));if(!open)closeMenus();});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{$$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$$('.project-tile').forEach(t=>t.hidden=button.dataset.filter!=='all'&&t.dataset.group!==button.dataset.filter);}));
function markSection(id){$$('[data-section]').forEach(el=>{if(el.dataset.section===id)el.setAttribute('aria-current','location');else el.removeAttribute('aria-current');});}
function legacyDestination(){
 if(location.pathname!=='/')return null;
 const key=location.hash.slice(1);
 if(key==='company'||key==='approach')return '/'+key+'/';
 if(key==='company-details'||key==='approach-details')return '/'+key.split('-')[0]+'/#'+key;
 if(key.startsWith('project/')&&projects.some(p=>p.id===key.slice(8)))return '/projects/'+key.slice(8)+'/';
 if(key.startsWith('expertise/')&&services.some(p=>p.id===key.slice(10)))return '/'+key+'/';
 return null;
}
const legacy=legacyDestination();if(legacy)location.replace(legacy);
window.addEventListener('hashchange',()=>{const next=legacyDestination();if(next)location.replace(next);});
document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(!link||link.hasAttribute('download')||link.hasAttribute('data-profile-open')||link.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname!==location.pathname){try{sessionStorage.setItem('arcane-internal-navigation','1');}catch{}}});
markSection(document.body.dataset.pageSection||'home');syncIntroScene();
if(document.body.dataset.pageSection==='home'&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)markSection(visible[0].target.id);},{rootMargin:'-20% 0px -55% 0px',threshold:[0,.1,.5]});$$('#main > section').forEach(section=>observer.observe(section));}
const theme=$('#theme');function applyTheme(dark){document.body.classList.toggle('dark',dark);theme.textContent=dark?'☀':'☾';theme.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');}try{applyTheme(localStorage.getItem('arcane-theme')==='dark');}catch{}theme.addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);try{localStorage.setItem('arcane-theme',dark?'dark':'light');}catch{}});
const music=$('#background-music');const musicButton=$('#music');music.volume=.2;let userMuted=false;
function syncMusic(){musicButton.setAttribute('aria-pressed',String(userMuted));musicButton.setAttribute('aria-label',userMuted?'Unmute background music':'Mute background music');musicButton.textContent=userMuted?'Sound off':'Sound on';$('#music-status').textContent=!music.paused?'Background music is playing on loop.':userMuted?'Background music is muted.':'Background music starts after your first interaction.';}
function startMusic(){if(!userMuted&&music.paused)music.play().catch(()=>{});}
musicButton.addEventListener('click',()=>{userMuted=!userMuted;if(userMuted)music.pause();else startMusic();syncMusic();});
document.addEventListener('pointerdown',startMusic,{passive:true});document.addEventListener('keydown',startMusic);music.addEventListener('play',syncMusic);music.addEventListener('pause',syncMusic);startMusic();syncMusic();

$('#lead-form')?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);const message='Hello Arcane, I would like to discuss a project.\n\nName: '+values.get('name')+'\nEmail: '+values.get('email')+'\nPhone: '+(values.get('phone')||'Not supplied')+'\nExpertise: '+values.get('service')+'\n\n'+values.get('message');window.open('https://wa.me/971588923604?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');$('#lead-status').textContent='Your enquiry is ready in WhatsApp. Send the message there to contact our team.';});
// Scroll motion never blocks access to the page content.
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
 const revealTargets=$$('.section-heading,.company>div,.service-grid article,.expertise-carousel,.project-tile,.steps article,.contact>div,.lead-section>div,.lead-section>form,.footer-grid>div,.content-block,.reading-heading,.related-links,.page-cta,.faq-section');
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('revealed');revealObserver.unobserve(entry.target);}},{threshold:.08});
 for(const [i,el]of revealTargets.entries()){el.classList.add('reveal');el.style.setProperty('--reveal-delay',(i%4)*90+'ms');revealObserver.observe(el);}document.documentElement.classList.add('motion-ready');
}

const profileDialog=$('#profile-dialog');let profileOpener=null;
$$('[data-profile-open]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();closeMenus();closeNavigation();profileOpener=button;profileDialog.showModal();document.body.classList.add('profile-open');$('#profile-email').focus();}));
$('#profile-close').addEventListener('click',()=>profileDialog.close());
profileDialog.addEventListener('click',e=>{if(e.target!==profileDialog)return;const r=profileDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)profileDialog.close();});
profileDialog.addEventListener('close',()=>{document.body.classList.remove('profile-open');profileOpener?.focus();$('#profile-form').reset();$('#profile-status').textContent='';$('#profile-download-again').hidden=true;});
$('#profile-form').addEventListener('submit',e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const link=$('#profile-download-again');link.hidden=false;link.click();$('#profile-status').textContent='Your company profile download has started. Use the link below if you need it again.';});
if($('.expertise-carousel')){
const carousel=$('.expertise-carousel');const slides=$$('.expertise-slide');const dots=$$('[data-slide-to]');const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let slideIndex=Math.max(0,['grg','ceilings','fitout'].indexOf(location.hash.slice(1)));let slideTimer;let slidePaused=motionPreference.matches;let slideHover=false;let slideFocused=false;let slideInView=false;
function selectExpertise(index,announce=false){slideIndex=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{const active=i===slideIndex;slide.classList.toggle('is-active',active);slide.inert=!active;slide.setAttribute('aria-hidden',String(!active));});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===slideIndex)));if(announce)$('#expertise-slide-status').textContent=slides[slideIndex].querySelector('h3').textContent;}
function syncSlideshow(){clearInterval(slideTimer);$('#expertise-pause').setAttribute('aria-pressed',String(slidePaused));$('#expertise-pause').setAttribute('aria-label',slidePaused?'Play expertise slideshow':'Pause expertise slideshow');$('#expertise-pause').textContent=slidePaused?'▶':'Ⅱ';if(slidePaused||slideHover||slideFocused||!slideInView||document.hidden||profileDialog.open)return;slideTimer=setInterval(()=>selectExpertise(slideIndex+1),4000);}
function manualSlide(index){selectExpertise(index,true);syncSlideshow();}
dots.forEach(dot=>dot.addEventListener('click',()=>manualSlide(Number(dot.dataset.slideTo))));$('#expertise-prev').addEventListener('click',()=>manualSlide(slideIndex-1));$('#expertise-next').addEventListener('click',()=>manualSlide(slideIndex+1));$('#expertise-pause').addEventListener('click',()=>{slidePaused=!slidePaused;syncSlideshow();});
carousel.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){slideHover=true;syncSlideshow();}});carousel.addEventListener('pointerleave',()=>{slideHover=false;syncSlideshow();});carousel.addEventListener('focusin',()=>{slideFocused=true;syncSlideshow();});carousel.addEventListener('focusout',()=>{setTimeout(()=>{slideFocused=carousel.contains(document.activeElement);syncSlideshow();},0);});document.addEventListener('visibilitychange',syncSlideshow);motionPreference.addEventListener('change',()=>{slidePaused=motionPreference.matches;syncSlideshow();});window.addEventListener('arcane-expertise-select',e=>manualSlide(e.detail));profileDialog.addEventListener('close',syncSlideshow);new MutationObserver(syncSlideshow).observe(profileDialog,{attributes:true,attributeFilter:['open']});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{slideInView=entries[0].isIntersecting;syncSlideshow();},{threshold:.2}).observe(carousel);else slideInView=true;
selectExpertise(slideIndex);syncSlideshow();
}
function assistantPageContext(){return location.pathname.startsWith('/projects/')?'#project/'+location.pathname.split('/')[2]:location.pathname.startsWith('/expertise/')?'#expertise/'+location.pathname.split('/')[2]:'#'+(location.pathname.split('/')[1]||location.hash.slice(1)||'home');}
const assistantToggle=$('#assistant-toggle');const assistantPanel=$('#assistant-panel');let assistantBusy=false;const assistantHistory=[];
function closeAssistant(){assistantPanel.hidden=true;assistantToggle.setAttribute('aria-expanded','false');assistantToggle.focus();}
function scrollChat(){const log=$('#assistant-messages');log.scrollTop=log.scrollHeight;}
function assistantMessage(text,role){const p=document.createElement('p');p.className='chat-message '+role;p.textContent=text;$('#assistant-messages').append(p);scrollChat();return p;}
function addContactOptions(){const wrap=document.createElement('div');wrap.className='chat-contact-options';for(const [label,href]of [['Email · info@arcane.ae','mailto:info@arcane.ae'],['WhatsApp · +971 58 892 3604','https://wa.me/971588923604'],['Landline · +971 4 570 7248','tel:+97145707248']]){const a=document.createElement('a');a.textContent=label;a.href=href;if(href.startsWith('https:')){a.target='_blank';a.rel='noopener';}wrap.append(a);}$('#assistant-messages').append(wrap);scrollChat();}
assistantToggle.addEventListener('click',()=>{const opening=assistantPanel.hidden;assistantPanel.hidden=!opening;assistantToggle.setAttribute('aria-expanded',String(opening));if(opening)$('#assistant-input').focus();});
$('#assistant-close').addEventListener('click',closeAssistant);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!assistantPanel.hidden&&!profileDialog.open)closeAssistant();});
$('#assistant-form').addEventListener('submit',async e=>{
 e.preventDefault();if(assistantBusy)return;const text=$('#assistant-input').value.trim();if(!text)return;
 assistantBusy=true;$('#assistant-input').value='';assistantMessage(text,'user');assistantHistory.push({role:'user',content:text});
 const pending=assistantMessage('Reviewing your question','assistant pending');const typing=document.createElement('span');typing.className='typing-dots';typing.setAttribute('aria-hidden','true');typing.innerHTML='<i></i><i></i><i></i>';pending.append(typing);$('#assistant-send').disabled=true;$('#assistant-messages').setAttribute('aria-busy','true');
 const delay=new Promise(resolve=>setTimeout(resolve,2000));
 try{
  const request=(async()=>{try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:assistantHistory.slice(-12),page:assistantPageContext()}),signal:AbortSignal.timeout(20000)});const data=await r.json();if(r.ok&&typeof data.reply==='string')return data;if(r.status===429)return{reply:data.error,mode:'site-guide',contact:true};}catch{}return window.ArcaneGuide.answer(text,assistantPageContext());})();
  const [data]=await Promise.all([request,delay]);pending.textContent=data.reply;pending.classList.remove('pending');$('#assistant-connection').textContent=data.mode==='ai'?'AI assistant · informed by Arcane’s website.':'Answers from Arcane’s website.';assistantHistory.push({role:'assistant',content:data.reply});if(data.contact)addContactOptions();
 }finally{assistantBusy=false;$('#assistant-send').disabled=false;$('#assistant-messages').setAttribute('aria-busy','false');scrollChat();}
});

function compactContactWidgets(){document.body.classList.toggle('compact-widgets',window.scrollY>160);}
window.addEventListener('scroll',compactContactWidgets,{passive:true});compactContactWidgets();


// Temporary social-media presence in the footer. Links can be added later.
const footerBrand=$('.footer-brand');
if(footerBrand&&!$('.footer-socials')){
 const socials=[
  ['Instagram','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="social-dot"/>'],
  ['Facebook','<path class="social-fill" d="M14 8h3V4h-3c-3 0-5 2-5 5v3h-3v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z"/>'],
  ['LinkedIn','<rect x="4" y="9" width="4" height="11"/><circle cx="6" cy="5.5" r="2" class="social-fill"/><path d="M12 20V9h4v1.8c1-1.4 4-1.8 4 2.8V20h-4v-5.4c0-1.5-1.8-1.5-1.8 0V20Z"/>'],
  ['YouTube','<rect x="2.5" y="6" width="19" height="12" rx="4"/><path class="social-fill" d="m10 9 6 3-6 3Z"/>']
 ];
 const group=document.createElement('div');group.className='footer-socials';group.setAttribute('role','list');group.setAttribute('aria-label','Arcane social media');
 socials.forEach(([name,icon])=>{const item=document.createElement('span');item.className='footer-social-icon';item.setAttribute('role','listitem');item.setAttribute('aria-label',name+' — link coming soon');item.title=name+' — coming soon';item.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icon+'</svg>';group.append(item);});
 footerBrand.append(group);
}
