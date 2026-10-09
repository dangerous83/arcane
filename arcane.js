'use strict';
// The interior opening becomes the visible page hero within three seconds.
function introHero(){
 const hero=document.querySelector('body.project-view #project-page .hero')||
  document.querySelector('body.editorial-view .editorial-page:not([hidden]) .hero')||
  document.querySelector('#home');
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
const projects=[
{id:'wynn-al-marjan',name:'Wynn Al Marjan Island',location:'Ras Al Khaimah',group:'landmark',scope:'Specialist GRG, ceiling and wall partition works across hospitality venues.',client:'Island AMI 3',contractor:'ALEC Fit Out',status:'Ongoing in the supplied profile'},
{id:'burj-binghatti',name:'Burj Binghatti Jacob & Co Residences',location:'Business Bay, Dubai',group:'landmark',scope:'200,000 sqm of gypsum ceilings and partitions.',client:'Binghatti Properties Investments Limited',contractor:'Granada Europe Engineering Construction LLC',status:'Ongoing in the supplied profile; target October 2026'},
{id:'district-01-west',name:'District 01 West',location:'Dubai',group:'landmark',scope:'150,000 sqm of ceiling and partition works.',client:'Meydan Group LLC',contractor:'GINCO General Contracting LLC',status:'Ongoing in the supplied profile; target June 2026 does not establish completion'},
{id:'dubai-harbour',name:'Dubai Harbour Residences',location:'Dubai Harbour',group:'landmark',scope:'Ceiling and partition works within the residential development.',client:'SHAMAL Holding',contractor:'Khansaheb Civil Engineering LLC',status:'Started June 2026, according to the supplied profile'},
{id:'serenia-living',name:'Serenia Living',location:'Palm Jumeirah, Dubai',group:'landmark',scope:'Two towers; 120,000 sqm of gypsum ceiling per tower, as reported.',client:'Serenia Residences Limited',contractor:'Khansaheb Civil Engineering',status:'Project page reports snagging; register reports completed'},
{id:'dubai-exhibition',name:'Dubai Exhibition Centre',location:'Expo City, Dubai',group:'landmark',scope:'30,000 sqm of gypsum partitions.',client:'Dubai World Trade Center',contractor:'Khansaheb Civil Engineering',status:'Completed January 2026, according to the supplied profile'},
{id:'forte-towers',name:'Forte Towers, D1 / D2',location:'Downtown Dubai',group:'residential',scope:'False gypsum ceilings and fit-out works, including wall coverings, flooring and carpet packages.',client:'Emaar',contractor:'Target',status:'Completed in the supplied profile'},
{id:'golf-ville',name:'Golf Ville',location:'Dubai Hills, Dubai',group:'residential',scope:'Gypsum and cement board ceilings.',client:'Emaar',contractor:'GINCO',status:'Completed in the supplied profile'},
{id:'golf-place',name:'Golf Place',location:'Dubai Hills, Dubai',group:'residential',scope:'Gypsum and cement board ceilings.',client:'Emaar',contractor:'Trojan',status:'Completed in the supplied profile'},
{id:'murooj-al-furjan',name:'Murooj Al Furjan',location:'Al Furjan, Dubai',group:'residential',scope:'Gypsum and cement board ceilings.',client:'Nakheel',contractor:'GINCO',status:'Completed in the supplied profile'},
{id:'green-view',name:'The Green View',location:'South Dubai',group:'residential',scope:'Gypsum ceilings and cement board works.',client:'Emaar',contractor:'GINCO',status:'Completed in the supplied profile'},
{id:'binghatti-orchid',name:'Binghatti Orchid',location:'JVC, Dubai',group:'residential',scope:'Gypsum ceilings and wall partitions.',client:'Binghatti Properties Investments Limited',contractor:'Granada Europe',status:'Completed in the supplied profile'},
{id:'binghatti-dusk',name:'Binghatti Dusk',location:'JVC, Dubai',group:'residential',scope:'Gypsum ceilings and wall partitions.',client:'Binghatti Properties Investments Limited',contractor:'Granada Europe',status:'Completed in the supplied profile'},
{id:'j-one-tower',name:'J One Tower',location:'Downtown Dubai',group:'residential',scope:'Gypsum ceilings and wall partitions.',client:'Dar Al Arkan',contractor:'Shapoorji Pallonji',status:'Completed in the supplied profile'},
{id:'empower-headquarters',name:'EMPOWER Headquarters',location:'Jadaf, Dubai',group:'workplace',scope:'Gypsum ceilings and glass mat board partitions.',client:'EMPOWER',contractor:'China Railway',status:'Completed in the supplied profile'},
{id:'boulevard-heights',name:'Boulevard Heights',location:'Downtown Dubai',group:'workplace',scope:'Wallpaper, carpet and wood cladding.',client:'Emaar',contractor:'Target',status:'2018, as stated in the supplied profile'},
{id:'sheikh-zayed-showroom',name:'Sheikh Zayed Showroom',location:'Dubai, UAE',group:'workplace',scope:'Wood flooring and wood cladding at Sheikh Zayed Showroom, Plot 21.',client:'Omniyat',contractor:'Arcane Interior Decorations',status:'2021, as stated in the supplied profile'}
];
const services=[
{id:'grg',name:'Sculptural GRG',image:'expertise-grg.png',location:'FORM · SPECIALIST CRAFTSMANSHIP',group:'expertise',scope:'Precision moulding, decorative ceilings and sculptural architectural forms, developed through specialist casting and careful on-site assembly.',facts:[['Specialist work','Curved surfaces, decorative columns, mouldings and wall panels'],['Our process','Mould development, precision casting and coordinated installation']]},
{id:'ceilings',name:'Ceilings & partitions',image:'expertise-ceilings.png',location:'STRUCTURE · COORDINATED SYSTEMS',group:'expertise',scope:'Integrated ceilings and partition systems, coordinated with architecture, structure and embedded services for a precisely resolved interior.',facts:[['Specialist systems','Gypsum, metal, acoustic systems, cement board, glass and composite partitions'],['Our process','Technical coordination, installation and detailed inspection']]},
{id:'fitout',name:'Interior fit-out',image:'expertise-fitout.png',location:'FINISH · MATERIAL & DETAIL',group:'expertise',scope:'Complete interior finishing packages, from bespoke joinery and wall coverings to flooring and carefully resolved material interfaces.',facts:[['Specialist work','Joinery, wood cladding, wall coverings, raised floors, wood and vinyl flooring, carpets'],['Our process','Material coordination, specialist execution and finish inspection']]}
];
const icons={landmark:'<path d="M4 21V7l8-4 8 4v14M9 21v-4h6v4M8 9h1m6 0h1M8 12h1m6 0h1M2 21h20"/>',residential:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7M8 10h1m6 0h1"/>',workplace:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>'};
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];const asset=p=>'project-'+p.id+'.png';const navigation=$('#navigation');const menuButtons=$$('[data-menu]');
let menuCloseTimer;let pinnedMenu=null;
const hoverNavigation=window.matchMedia('(hover: hover) and (pointer: fine)');
function closeMenus(){clearTimeout(menuCloseTimer);pinnedMenu=null;for(const b of menuButtons){b.setAttribute('aria-expanded','false');$('#'+b.dataset.menu).hidden=true;}}
function closeNavigation(){navigation.classList.remove('open');$('.mobile-toggle').setAttribute('aria-expanded','false');}
function loadHero(img,p){img.dataset.loaded='false';img.setAttribute('aria-busy','true');img.onload=()=>{img.dataset.loaded='true';img.setAttribute('aria-busy','false');};img.onerror=()=>{img.dataset.loaded='error';img.setAttribute('aria-busy','false');};img.alt='Illustrative interior concept for '+p.name;img.src=p.image||asset(p);}
function menuHero(p){loadHero($('#menu-image'),p);$('#menu-caption').textContent=p.name;$('.menu-hero').hidden=false;}
for(const p of projects){const button=document.createElement('button');button.className='menu-project';button.dataset.project=p.id;button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[p.group]+'</svg>';const name=document.createElement('span');name.textContent=p.name;const location=document.createElement('small');location.textContent=p.location;name.append(location);button.append(name);button.addEventListener('pointerenter',()=>menuHero(p));button.addEventListener('focus',()=>menuHero(p));button.addEventListener('click',()=>openProject(p));$('#menu-'+p.group).append(button);
const tile=document.createElement('button');tile.className='project-tile';tile.dataset.group=p.group;tile.dataset.project=p.id;const small=document.createElement('small');small.textContent=p.group==='landmark'?'Landmark project':p.group==='residential'?'Residential portfolio':'Workplace & fit-out';const heading=document.createElement('h3');heading.textContent=p.name;const loc=document.createElement('p');loc.textContent=p.location;const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');tile.append(small,heading,loc,arrow);tile.addEventListener('click',()=>openProject(p));$('#project-grid').append(tile);}
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
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{closeMenus();closeNavigation();const href=a.getAttribute('href');if(href==='#project-details')return;e.preventDefault();if(location.hash!==href)history.pushState(null,'',href);showRoute();}));
$('.mobile-toggle').addEventListener('click',()=>{const open=!navigation.classList.contains('open');navigation.classList.toggle('open',open);$('.mobile-toggle').setAttribute('aria-expanded',String(open));if(!open)closeMenus();});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{$$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$$('.project-tile').forEach(t=>t.hidden=button.dataset.filter!=='all'&&t.dataset.group!==button.dataset.filter);}));
function openProject(p){const next='#project/'+p.id;if(location.hash!==next)history.pushState(null,'',next);showRoute();}
function markSection(id){$$('[data-section]').forEach(el=>{if(el.dataset.section===id)el.setAttribute('aria-current','location');else el.removeAttribute('aria-current');});}
function showRoute(){
 const hash=decodeURIComponent(location.hash.slice(1));
 const p=hash.startsWith('project/')?projects.find(p=>p.id===hash.slice(8)):hash.startsWith('expertise/')?services.find(p=>p.id===hash.slice(10)):null;
 const editorial=hash==='company'||hash==='company-details'?'company':hash==='approach'||hash==='approach-details'?'approach':null;
 closeMenus();closeNavigation();document.body.classList.toggle('project-view',!!p);document.body.classList.toggle('editorial-view',!!editorial);$('#project-page').hidden=!p;
 for(const id of ['company','approach'])$('#'+id+'-page').hidden=id!==editorial;
 if(editorial){
  document.title=(editorial==='company'?'The company':'Our approach')+' | Arcane Interior Decorations';
  markSection(editorial);
  if(hash.endsWith('-details'))$('#'+hash).scrollIntoView({behavior:'instant'});
  else{window.scrollTo({top:0,behavior:'instant'});$('#'+editorial+'-title').focus({preventScroll:true});}
  return;
 }
 if(p){
  loadHero($('#project-hero-image'),p);$('#project-hero-title').textContent=p.name;
  $('#project-hero-location').textContent=p.group==='expertise'?p.location:p.location+' · '+(p.group==='landmark'?'Landmark project':p.group==='residential'?'Residential portfolio':'Workplace & fit-out');$('#project-page .project-back').href=p.group==='expertise'?'#expertise':'#projects';$('#project-page .project-back').textContent=p.group==='expertise'?'← Our expertise':'← All projects';
  $('#project-hero-intro').textContent=p.scope;$('#project-scope').textContent=p.scope;
  const facts=$('#project-facts');facts.replaceChildren();
  for(const [label,value] of (p.facts||[['Client / developer',p.client],['Contractor',p.contractor]])){const wrap=document.createElement('div');const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value;wrap.append(dt,dd);facts.append(wrap);}
  document.title=p.name+' | Arcane Interior Decorations';markSection(p.group==='expertise'?'expertise':'projects');window.scrollTo({top:0,behavior:'instant'});$('#project-hero-title').focus({preventScroll:true});
 }else{
  document.title='Arcane Interior Decorations | Shaping spaces. Defining detail.';
  const target=document.getElementById(hash||'home');if(target){target.querySelectorAll('.reveal').forEach(el=>el.classList.add('revealed'));target.scrollIntoView({behavior:'instant'});}
  if(['grg','ceilings','fitout'].includes(hash)){window.dispatchEvent(new CustomEvent('arcane-expertise-select',{detail:['grg','ceilings','fitout'].indexOf(hash)}));$('#expertise').scrollIntoView({behavior:'instant'});}markSection(['grg','ceilings','fitout'].includes(hash)?'expertise':hash);
 }
}
// Project details are part of the page; section navigation returns to the main website.
$('#project-page a[href="#project-details"]').addEventListener('click',e=>{e.preventDefault();$('#project-details').scrollIntoView({behavior:'smooth'});});
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.addEventListener('popstate',showRoute);window.addEventListener('hashchange',showRoute);showRoute();syncIntroScene();
const sectionObserver=new IntersectionObserver(entries=>{
 if(document.body.classList.contains('project-view')||document.body.classList.contains('editorial-view'))return;
 const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
 if(visible.length)markSection(visible[0].target.id);
},{rootMargin:'-20% 0px -55% 0px',threshold:[0,.1,.5]});
$$('#main > section:not(#project-page)').forEach(section=>sectionObserver.observe(section));
const theme=$('#theme');function applyTheme(dark){document.body.classList.toggle('dark',dark);theme.textContent=dark?'☀':'☾';theme.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');}try{applyTheme(localStorage.getItem('arcane-theme')==='dark');}catch{}theme.addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);try{localStorage.setItem('arcane-theme',dark?'dark':'light');}catch{}});
const music=$('#background-music');const musicButton=$('#music');music.volume=.2;let userMuted=false;
function syncMusic(){musicButton.setAttribute('aria-pressed',String(userMuted));musicButton.setAttribute('aria-label',userMuted?'Unmute background music':'Mute background music');musicButton.textContent=userMuted?'Sound off':'Sound on';$('#music-status').textContent=!music.paused?'Background music is playing on loop.':userMuted?'Background music is muted.':'Background music starts after your first interaction.';}
function startMusic(){if(!userMuted&&music.paused)music.play().catch(()=>{});}
musicButton.addEventListener('click',()=>{userMuted=!userMuted;if(userMuted)music.pause();else startMusic();syncMusic();});
document.addEventListener('pointerdown',startMusic,{passive:true});document.addEventListener('keydown',startMusic);music.addEventListener('play',syncMusic);music.addEventListener('pause',syncMusic);startMusic();syncMusic();

$('#lead-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);const message='Hello Arcane, I would like to discuss a project.\n\nName: '+values.get('name')+'\nEmail: '+values.get('email')+'\nPhone: '+(values.get('phone')||'Not supplied')+'\nExpertise: '+values.get('service')+'\n\n'+values.get('message');window.open('https://wa.me/971588923604?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');$('#lead-status').textContent='Your enquiry is ready in WhatsApp. Send the message there to contact our team.';});
// Scroll motion never blocks access to the page content.
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
 const revealTargets=$$('.section-heading,.company>div,.service-grid article,.expertise-carousel,.project-tile,.steps article,.contact>div,.lead-section>div,.lead-section>form,.footer-grid>div');
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('revealed');revealObserver.unobserve(entry.target);}},{threshold:.08});
 for(const [i,el]of revealTargets.entries()){el.classList.add('reveal');el.style.setProperty('--reveal-delay',(i%4)*90+'ms');revealObserver.observe(el);}document.documentElement.classList.add('motion-ready');
}

const profileDialog=$('#profile-dialog');let profileOpener=null;
$$('[data-profile-open]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();closeMenus();closeNavigation();profileOpener=button;profileDialog.showModal();document.body.classList.add('profile-open');$('#profile-email').focus();}));
$('#profile-close').addEventListener('click',()=>profileDialog.close());
profileDialog.addEventListener('click',e=>{if(e.target!==profileDialog)return;const r=profileDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)profileDialog.close();});
profileDialog.addEventListener('close',()=>{document.body.classList.remove('profile-open');profileOpener?.focus();$('#profile-form').reset();$('#profile-status').textContent='';$('#profile-download-again').hidden=true;});
$('#profile-form').addEventListener('submit',e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const link=$('#profile-download-again');link.hidden=false;link.click();$('#profile-status').textContent='Your company profile download has started. Use the link below if you need it again.';});
const carousel=$('.expertise-carousel');const slides=$$('.expertise-slide');const dots=$$('[data-slide-to]');const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let slideIndex=Math.max(0,['grg','ceilings','fitout'].indexOf(location.hash.slice(1)));let slideTimer;let slidePaused=motionPreference.matches;let slideHover=false;let slideFocused=false;let slideInView=false;
function selectExpertise(index,announce=false){slideIndex=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{const active=i===slideIndex;slide.classList.toggle('is-active',active);slide.inert=!active;slide.setAttribute('aria-hidden',String(!active));});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===slideIndex)));if(announce)$('#expertise-slide-status').textContent=slides[slideIndex].querySelector('h3').textContent;}
function syncSlideshow(){clearInterval(slideTimer);$('#expertise-pause').setAttribute('aria-pressed',String(slidePaused));$('#expertise-pause').setAttribute('aria-label',slidePaused?'Play expertise slideshow':'Pause expertise slideshow');$('#expertise-pause').textContent=slidePaused?'▶':'Ⅱ';if(slidePaused||slideHover||slideFocused||!slideInView||document.hidden||profileDialog.open)return;slideTimer=setInterval(()=>selectExpertise(slideIndex+1),4000);}
function manualSlide(index){selectExpertise(index,true);syncSlideshow();}
dots.forEach(dot=>dot.addEventListener('click',()=>manualSlide(Number(dot.dataset.slideTo))));$('#expertise-prev').addEventListener('click',()=>manualSlide(slideIndex-1));$('#expertise-next').addEventListener('click',()=>manualSlide(slideIndex+1));$('#expertise-pause').addEventListener('click',()=>{slidePaused=!slidePaused;syncSlideshow();});
carousel.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){slideHover=true;syncSlideshow();}});carousel.addEventListener('pointerleave',()=>{slideHover=false;syncSlideshow();});carousel.addEventListener('focusin',()=>{slideFocused=true;syncSlideshow();});carousel.addEventListener('focusout',()=>{setTimeout(()=>{slideFocused=carousel.contains(document.activeElement);syncSlideshow();},0);});document.addEventListener('visibilitychange',syncSlideshow);motionPreference.addEventListener('change',()=>{slidePaused=motionPreference.matches;syncSlideshow();});window.addEventListener('arcane-expertise-select',e=>manualSlide(e.detail));profileDialog.addEventListener('close',syncSlideshow);new MutationObserver(syncSlideshow).observe(profileDialog,{attributes:true,attributeFilter:['open']});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{slideInView=entries[0].isIntersecting;syncSlideshow();},{threshold:.2}).observe(carousel);else slideInView=true;
selectExpertise(slideIndex);syncSlideshow();
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
  const request=(async()=>{try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:assistantHistory.slice(-12),page:location.hash||'#home'}),signal:AbortSignal.timeout(20000)});const data=await r.json();if(r.ok&&typeof data.reply==='string')return data;if(r.status===429)return{reply:data.error,mode:'site-guide',contact:true};}catch{}return window.ArcaneGuide.answer(text);})();
  const [data]=await Promise.all([request,delay]);pending.textContent=data.reply;pending.classList.remove('pending');$('#assistant-connection').textContent=data.mode==='ai'?'AI assistant · informed by Arcane’s website.':'Answers from Arcane’s website.';assistantHistory.push({role:'assistant',content:data.reply});if(data.contact)addContactOptions();
 }finally{assistantBusy=false;$('#assistant-send').disabled=false;$('#assistant-messages').setAttribute('aria-busy','false');scrollChat();}
});
