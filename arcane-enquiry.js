/* Project concierge: prepare an email draft in the visitor's chosen email app. */
(function(){
 'use strict';
 const dialog=document.getElementById('enquiry-dialog');if(!dialog)return;
 const form=document.getElementById('enquiry-form'),status=document.getElementById('enquiry-status'),submit=document.getElementById('enquiry-submit'),voiceButton=document.getElementById('enquiry-voice');
 const formView=document.getElementById('enquiry-form-view'),success=document.getElementById('enquiry-success'),music=document.getElementById('background-music');
 const greeting=document.getElementById('enquiry-intro').textContent.trim();
 let opener=null,context='Homepage',destination='#projects',utterance=null,resumeMusic=false,voiceTimer;
 const setStatus=(message,error=false)=>{status.textContent=message;status.classList.toggle('is-error',error);};
 function voiceStopped(){clearTimeout(voiceTimer);dialog.classList.remove('is-speaking');voiceButton.setAttribute('aria-label','Play welcome message');voiceButton.querySelector('span').textContent='Play welcome';utterance=null;}
 function stopVoice(){if(utterance&&'speechSynthesis'in window)speechSynthesis.cancel();voiceStopped();}
 function playWelcome(){
  if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){voiceButton.hidden=true;return;}
  if(utterance){stopVoice();return;}
  speechSynthesis.cancel();if(typeof chooseArcaneVoice==='function')chooseArcaneVoice();
  utterance=new SpeechSynthesisUtterance(greeting);const chosen=typeof arcaneVoice!=='undefined'?arcaneVoice:null;
  if(chosen)utterance.voice=chosen;utterance.lang=chosen?.lang||'en-GB';utterance.rate=.92;utterance.pitch=.96;utterance.volume=.95;
  utterance.onstart=()=>{dialog.classList.add('is-speaking');voiceButton.setAttribute('aria-label','Mute welcome message');voiceButton.querySelector('span').textContent='Mute welcome';};
  utterance.onend=voiceStopped;utterance.onerror=voiceStopped;speechSynthesis.speak(utterance);voiceTimer=setTimeout(voiceStopped,18000);
 }
 function openEnquiry(button){
  if(dialog.open)return;opener=button;context=button.dataset.enquiryIntent||'Homepage';destination=button.hash||'#projects';document.getElementById('enquiry-source').value=context;document.getElementById('enquiry-browse').href='/'+destination;
  document.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(button=>button.click());
  formView.hidden=false;success.hidden=true;dialog.setAttribute('aria-labelledby','enquiry-title');setStatus('');
  resumeMusic=!!music&&!music.paused;if(music)music.pause();dialog.showModal();document.body.classList.add('enquiry-modal-open');document.getElementById('enquiry-name').focus();
  if(typeof assistantVoiceEnabled==='undefined'||assistantVoiceEnabled)playWelcome();
 }
 document.querySelectorAll('[data-enquiry-open]').forEach(button=>{
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','enquiry-dialog');
  button.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();openEnquiry(button);});
 });
 function close(){dialog.close();}
 function continueBrowsing(){close();location.hash=destination;}
 document.getElementById('enquiry-close').addEventListener('click',close);document.getElementById('enquiry-continue').addEventListener('click',continueBrowsing);document.getElementById('enquiry-browse').addEventListener('click',event=>{event.preventDefault();continueBrowsing();});voiceButton.addEventListener('click',playWelcome);
 if(!('speechSynthesis'in window))voiceButton.hidden=true;
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();});
 dialog.addEventListener('close',()=>{stopVoice();document.body.classList.remove('enquiry-modal-open');opener?.focus();if(resumeMusic&&music&&!document.hidden)music.play().catch(()=>{});});
 function draftUrl(method){
  const data=new FormData(form),value=name=>String(data.get(name)||'').trim();
  const service=value('service'),subject='Arcane project enquiry — '+service;
  const body=['Hello Arcane team,','','I would like to discuss a project with you.','',
   'Full name: '+value('name'),'Email: '+value('email'),'Phone: '+value('phone'),
   'Company: '+(value('company')||'Not supplied'),'Expertise: '+service,'',
   'Project details:',value('message')||'Not supplied','','I agree to be contacted by Arcane about this enquiry.'].join('\r\n');
  if(method==='gmail')return 'https://mail.google.com/mail/?view=cm&fs=1&to=info%40arcane.ae&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  if(method==='outlook')return 'https://outlook.office.com/mail/deeplink/compose?to=info%40arcane.ae&subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  return 'mailto:info@arcane.ae?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 }
 function prepareDraft(method){
  if(!form.reportValidity())return null;
  if(new FormData(form).get('website'))return null;
  stopVoice();setStatus('Review your draft and press Send in your email app. If no draft opens, choose Gmail or Outlook below.');
  if(typeof window.gtag==='function')window.gtag('event','enquiry_email_draft',{send_to:'G-KXTQ58JKHQ',contact_method:method,page_path:location.pathname});
  return draftUrl(method);
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();const url=prepareDraft('email');if(url)window.location.href=url;
 });
 document.querySelectorAll('[data-enquiry-email-app]').forEach(link=>link.addEventListener('click',event=>{
  const url=prepareDraft(link.dataset.enquiryEmailApp);if(!url){event.preventDefault();return;}link.href=url;
 }));
})();

