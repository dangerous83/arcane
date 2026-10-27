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
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];const asset=p=>'/assets/projects/'+p.id+'-hero.webp';const navigation=$('#navigation');const menuButtons=$$('[data-menu]');
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
 if(key==='approach')return '/approach.html';
 if(key==='company')return '/company/';
 if(key==='approach-details')return '/approach.html#approach-details';
 if(key==='company-details')return '/company/#company-details';
 if(key.startsWith('project/')&&projects.some(p=>p.id===key.slice(8)))return '/projects/'+key.slice(8)+'/';
 if(key.startsWith('expertise/')&&services.some(p=>p.id===key.slice(10)))return '/'+key+'/';
 return null;
}
const legacy=legacyDestination();if(legacy)location.replace(legacy);
window.addEventListener('hashchange',()=>{const next=legacyDestination();if(next)location.replace(next);});
document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(!link||link.hasAttribute('download')||link.hasAttribute('data-profile-open')||link.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname!==location.pathname){try{sessionStorage.setItem('arcane-internal-navigation','1');}catch{}}});
markSection(document.body.dataset.pageSection||'home');syncIntroScene();
if(document.body.dataset.pageSection==='home'&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)markSection(visible[0].target.id);},{rootMargin:'-20% 0px -55% 0px',threshold:[0,.1,.5]});$$('#main > section').forEach(section=>observer.observe(section));}
const theme=$('#theme');
function applyTheme(grey){
 document.body.classList.toggle('grey',grey);
 theme.classList.toggle('is-grey',grey);
 theme.innerHTML='<span class="theme-swatch" aria-hidden="true"></span>';
 const destination=grey?'green':'grey';
 theme.setAttribute('aria-label','Switch to '+destination+' brand theme');
 theme.title='Switch to '+destination+' brand theme';
}
try{applyTheme(localStorage.getItem('arcane-theme-v2')!=='green');}catch{applyTheme(true);}
theme.addEventListener('click',()=>{
 const grey=!document.body.classList.contains('grey');
 applyTheme(grey);
 try{localStorage.setItem('arcane-theme-v2',grey?'grey':'green');}catch{}
});
const music=$('#background-music');let musicButton=$('#music'),userMuted=false;
if(music){
 music.volume=.35;music.muted=false;music.loop=true;let fallbackLoading=false,fallbackUrl='';
 if(!musicButton){musicButton=document.createElement('button');musicButton.id='music';musicButton.type='button';musicButton.className='music-control';document.body.appendChild(musicButton);}
 musicButton.setAttribute('data-music-version','restored-2');
 musicButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9Z"/><path class="music-waves" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg><span data-music-label>Play music</span>';
 function syncMusic(){
  const playing=!music.paused&&!music.muted;
  musicButton.setAttribute('aria-pressed',String(playing));musicButton.setAttribute('aria-label',playing?'Mute background music':'Play background music');
  musicButton.querySelector('[data-music-label]').textContent=playing?'Music on':'Play music';musicButton.classList.toggle('is-playing',playing);
  const status=$('#music-status');if(status)status.textContent=playing?'Background music is playing on loop.':music.error?'Press Play music to retry background audio.':userMuted?'Background music is muted.':'Select Play music or interact with the page to start background music.';
 }
 // Some hosts reject media byte-range requests. A normal full-file GET keeps the same track playable.
 function loadMusicFallback(){
  if(fallbackLoading||fallbackUrl)return;fallbackLoading=true;
  fetch('/arcane-lounge.mp3',{cache:'force-cache'}).then(response=>{if(!response.ok)throw new Error('Audio unavailable');return response.blob();}).then(blob=>{
   if(!blob.size)throw new Error('Empty audio');fallbackUrl=URL.createObjectURL(blob);music.src=fallbackUrl;music.load();startMusic();
  }).catch(()=>syncMusic()).finally(()=>{fallbackLoading=false;});
 }
 function startMusic(event){
  if(event?.target?.closest?.('#music')||userMuted||document.hidden||$('#expertise-video-dialog')?.open||$('#enquiry-dialog')?.open)return;
  if(music.error&&!fallbackUrl){loadMusicFallback();return;}
  if(music.paused)music.play().then(syncMusic).catch(()=>{syncMusic();if(music.error)loadMusicFallback();});
 }
 musicButton.addEventListener('click',()=>{
  if(!music.paused){userMuted=true;music.pause();}else{userMuted=false;music.muted=false;if(music.error&&!fallbackUrl)loadMusicFallback();else music.play().then(syncMusic).catch(()=>{syncMusic();if(music.error)loadMusicFallback();});}syncMusic();
 });
 document.addEventListener('pointerdown',startMusic,{passive:true});document.addEventListener('keydown',startMusic);document.addEventListener('click',startMusic);
 music.addEventListener('play',syncMusic);music.addEventListener('pause',syncMusic);music.addEventListener('error',()=>{syncMusic();loadMusicFallback();});
 for(const id of ['enquiry-dialog','expertise-video-dialog'])$('#'+id)?.addEventListener('close',()=>startMusic());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)music.pause();else startMusic();});startMusic();syncMusic();
}

$('#lead-form')?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);const subject='Project enquiry — '+values.get('service');const message='Hello Arcane team,\n\nI would like to discuss a project.\n\nName: '+values.get('name')+'\nEmail: '+values.get('email')+'\nPhone: '+(values.get('phone')||'Not supplied')+'\nExpertise: '+values.get('service')+'\n\nProject details:\n'+values.get('message');window.location.href='mailto:info@arcane.ae?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);$('#lead-status').textContent='Your email draft is ready. Review the details and select Send in your email app.';});
// Scroll motion never blocks access to the page content.
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
 const revealTargets=$$('.section-heading,.company>div,.service-grid article,.expertise-carousel,.project-tile,.steps article,.contact>div,.lead-section>div,.lead-section>form,.footer-grid>div,.content-block,.reading-heading,.related-links,.page-cta,.faq-section');
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('revealed');revealObserver.unobserve(entry.target);}},{threshold:.08});
 for(const [i,el]of revealTargets.entries()){el.classList.add('reveal');el.style.setProperty('--reveal-delay',(i%4)*90+'ms');revealObserver.observe(el);}document.documentElement.classList.add('motion-ready');
}

const profileDialog=$('#profile-dialog');let profileOpener=null;
$$('[data-profile-open]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();closeMenus();closeNavigation();profileOpener=button;profileDialog.showModal();document.body.classList.add('profile-open');$('#profile-form [name="resource"]').focus();}));
$('#profile-close').addEventListener('click',()=>profileDialog.close());
profileDialog.addEventListener('click',e=>{if(e.target!==profileDialog)return;const r=profileDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)profileDialog.close();});
const profileForm=$('#profile-form');const resourceInputs=$$('#profile-form [name="resource"]');
function selectedResources(){return resourceInputs.filter(input=>input.checked);}
function syncProfileSelection(){const selected=selectedResources();$('.profile-submit-label').textContent=selected.length===1?'Download selected file':selected.length>1?'Download '+selected.length+' selected files':'Choose a download';$('#profile-submit').disabled=selected.length===0;$('#profile-selection-error').textContent='';resourceInputs.forEach(input=>input.closest('.download-option').classList.toggle('is-selected',input.checked));}
resourceInputs.forEach(input=>input.addEventListener('change',syncProfileSelection));syncProfileSelection();
profileDialog.addEventListener('close',()=>{document.body.classList.remove('profile-open');profileOpener?.focus();profileForm.reset();$('#profile-status').textContent='';$('#profile-selection-error').textContent='';const links=$('#profile-download-links');links.replaceChildren();links.hidden=true;syncProfileSelection();});
profileForm.addEventListener('submit',e=>{e.preventDefault();const selected=selectedResources();if(!selected.length){$('#profile-selection-error').textContent='Please select at least one resource.';resourceInputs[0].focus();return;}if(!profileForm.reportValidity())return;const links=$('#profile-download-links');links.replaceChildren();for(const input of selected){const link=document.createElement('a');link.href=input.dataset.downloadUrl;link.download='';link.className='profile-download-link';link.textContent='Download '+input.dataset.downloadName+' ↓';links.append(link);}links.hidden=false;links.querySelector('a').click();$('#profile-status').textContent=selected.length===1?'Your download has started. Use the link below if you need it again.':'Your first download has started. Use the links below to download the remaining selected files.';});
if($('.expertise-carousel')){
const carousel=$('.expertise-carousel');const slides=$$('.expertise-slide');const dots=$$('[data-slide-to]');const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let slideIndex=Math.max(0,['grg','ceilings','partitions'].indexOf(location.hash.slice(1)));let slideTimer;let slidePaused=motionPreference.matches;let slideHover=false;let slideFocused=false;let slideInView=false;
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
function addContactOptions(){const wrap=document.createElement('div');wrap.className='chat-contact-options';for(const [label,href]of [['Email · info@arcane.ae','mailto:info@arcane.ae'],['WhatsApp · +971 52 104 4958','https://wa.me/971521044958'],['Landline · +971 4 570 7248','tel:+97145707248']]){const a=document.createElement('a');a.textContent=label;a.href=href;if(href.startsWith('https:')){a.target='_blank';a.rel='noopener';}wrap.append(a);}$('#assistant-messages').append(wrap);scrollChat();}
let assistantVoiceEnabled=true;let arcaneVoice=null;const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;const assistantRecognition=SpeechRecognition?new SpeechRecognition():null;
function voiceStatus(text){const status=$('#assistant-voice-status');if(status)status.textContent=text;}
function chooseArcaneVoice(){const voices=speechSynthesis.getVoices();arcaneVoice=voices.find(v=>/Google UK English Female|Microsoft Sonia|Samantha|Serena|Ava|Jenny/i.test(v.name))||voices.find(v=>/^en[-_]/i.test(v.lang)&&/female|natural|premium/i.test(v.name))||voices.find(v=>/^en[-_]/i.test(v.lang))||voices[0]||null;}
if('speechSynthesis'in window){chooseArcaneVoice();speechSynthesis.addEventListener?.('voiceschanged',chooseArcaneVoice);}else{assistantVoiceEnabled=false;}
function speakArcane(text){if(!assistantVoiceEnabled||!('speechSynthesis'in window)||!text)return;speechSynthesis.cancel();const clean=text.replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();const utter=new SpeechSynthesisUtterance(clean);if(arcaneVoice)utter.voice=arcaneVoice;utter.lang=arcaneVoice?.lang||'en-GB';utter.rate=.88;utter.pitch=.92;utter.volume=.95;speechSynthesis.speak(utter);}
function syncVoiceButton(){const btn=$('#assistant-voice-toggle');if(!btn)return;btn.setAttribute('aria-pressed',String(assistantVoiceEnabled));btn.textContent=assistantVoiceEnabled?'Voice on':'Voice off';voiceStatus(assistantVoiceEnabled?'Voice replies are enabled.':'Voice replies are muted.');}
$('#assistant-voice-toggle')?.addEventListener('click',()=>{assistantVoiceEnabled=!assistantVoiceEnabled;if(!assistantVoiceEnabled&&'speechSynthesis'in window)speechSynthesis.cancel();syncVoiceButton();});
if(assistantRecognition){assistantRecognition.lang='en-US';assistantRecognition.interimResults=false;assistantRecognition.maxAlternatives=1;assistantRecognition.addEventListener('start',()=>{$('#assistant-mic')?.classList.add('is-listening');$('#assistant-mic')?.setAttribute('aria-pressed','true');voiceStatus('Listening. Speak naturally about your project.');});assistantRecognition.addEventListener('end',()=>{$('#assistant-mic')?.classList.remove('is-listening');$('#assistant-mic')?.setAttribute('aria-pressed','false');});assistantRecognition.addEventListener('result',e=>{const text=e.results?.[0]?.[0]?.transcript?.trim();if(text){$('#assistant-input').value=text;voiceStatus('Question captured. Preparing Arcane’s answer.');sendAssistantMessage(text);}});assistantRecognition.addEventListener('error',()=>voiceStatus('Voice input is not available in this browser. Please type your question.'));}else{$('#assistant-mic')?.setAttribute('disabled','');voiceStatus('Voice input is not available in this browser. You can still receive spoken replies.');}
$('#assistant-mic')?.addEventListener('click',()=>{if(!assistantRecognition){voiceStatus('Voice input is not available in this browser. Please type your question.');return;}if(assistantBusy)return;try{assistantRecognition.start();}catch{}});
assistantToggle.addEventListener('click',()=>{const opening=assistantPanel.hidden;assistantPanel.hidden=!opening;assistantToggle.setAttribute('aria-expanded',String(opening));if(opening)$('#assistant-input').focus();});
$('#assistant-close').addEventListener('click',closeAssistant);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!assistantPanel.hidden&&!profileDialog.open)closeAssistant();});
syncVoiceButton();
async function sendAssistantMessage(text){
 if(assistantBusy)return;text=(text||'').trim();if(!text)return;
 assistantBusy=true;$('#assistant-input').value='';assistantMessage(text,'user');assistantHistory.push({role:'user',content:text});
 const pending=assistantMessage('Reviewing your question','assistant pending');const typing=document.createElement('span');typing.className='typing-dots';typing.setAttribute('aria-hidden','true');typing.innerHTML='<i></i><i></i><i></i>';pending.append(typing);$('#assistant-send').disabled=true;$('#assistant-messages').setAttribute('aria-busy','true');
 const delay=new Promise(resolve=>setTimeout(resolve,2000));
 try{
  const request=(async()=>{try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:assistantHistory.slice(-12),page:assistantPageContext()}),signal:AbortSignal.timeout(20000)});const data=await r.json();if(r.ok&&typeof data.reply==='string')return data;if(r.status===429)return{reply:data.error,mode:'site-guide',contact:true};}catch{}return window.ArcaneGuide.answer(text,assistantPageContext());})();
  const [data]=await Promise.all([request,delay]);pending.textContent=data.reply;pending.classList.remove('pending');$('#assistant-connection').textContent=data.mode==='ai'?'Professional voice assistant · informed by Arcane’s website.':'Voice and text answers from Arcane’s website.';assistantHistory.push({role:'assistant',content:data.reply});speakArcane(data.reply);if(data.contact)addContactOptions();
 }finally{assistantBusy=false;$('#assistant-send').disabled=false;$('#assistant-messages').setAttribute('aria-busy','false');scrollChat();}
}
$('#assistant-form').addEventListener('submit',e=>{e.preventDefault();sendAssistantMessage($('#assistant-input').value);});

function compactContactWidgets(){document.body.classList.toggle('compact-widgets',window.scrollY>160);}
window.addEventListener('scroll',compactContactWidgets,{passive:true});compactContactWidgets();


// Temporary social-media presence in the footer.
const footerSocialSlot=$('.footer-social-slot')||$('.footer-brand');
if(footerSocialSlot&&!$('.footer-socials')){
 const socials=[
  ['Instagram','https://www.instagram.com/arcaneid.ae/','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="social-dot"/>'],
  ['Facebook','https://www.facebook.com/','<path class="social-fill" d="M13.6 21v-7h2.4l.5-3h-2.9V9.1c0-.8.3-1.4 1.5-1.4h1.6V5.1c-.8-.1-1.6-.2-2.4-.2-2.7 0-4.5 1.7-4.5 4.7V11H7.4v3h2.4v7h3.8Z"/>'],
  ['LinkedIn','https://www.linkedin.com/in/arcane-interior-decorations-llc-5740903a6/?isSelfProfile=false','<path class="social-fill" d="M5.2 8.7h3.1V19H5.2V8.7Zm1.6-5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM10.4 8.7h3v1.4c.5-.8 1.6-1.7 3.3-1.7 3 0 3.9 2 3.9 4.8V19h-3.1v-5.2c0-1.4-.4-2.5-1.8-2.5-1.3 0-2.1.9-2.1 2.5V19h-3.2V8.7Z"/>']
 ];
 const group=document.createElement('div');group.className='footer-socials';group.setAttribute('role','list');group.setAttribute('aria-label','Arcane social media');
 socials.forEach(([name,url,icon])=>{const item=document.createElement('a');item.className='footer-social-icon';item.href=url;item.target='_blank';item.rel='noopener';item.setAttribute('role','listitem');item.setAttribute('aria-label','Open Arcane on '+name);item.title=name;item.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icon+'</svg>';group.append(item);});
 footerSocialSlot.append(group);
}

// Keep long project lists compact without hiding links when JavaScript is unavailable.
for(const [id,limit,label] of [['menu-ongoing',4,'ongoing'],['menu-completed',6,'completed']]){
 const list=document.getElementById(id);
 if(!list)continue;
 const links=Array.from(list.querySelectorAll(':scope > .menu-project'));
 if(links.length<=limit)continue;
 const button=document.createElement('button');
 button.type='button';button.className='project-menu-expand';button.setAttribute('aria-controls',id);
 function render(expanded){links.forEach((link,i)=>{link.hidden=!expanded&&i>=limit});button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Show fewer '+label+' projects −':'Show all '+label+' projects +';}
 button.addEventListener('click',()=>render(button.getAttribute('aria-expanded')!=='true'));
 list.insertAdjacentElement('afterend',button);render(false);
}

