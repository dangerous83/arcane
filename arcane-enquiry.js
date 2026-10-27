/* Homepage project concierge. Details are sent only after explicit submission. */
(function(){
 'use strict';
 const dialog=document.getElementById('enquiry-dialog');if(!dialog)return;
 const form=document.getElementById('enquiry-form'),status=document.getElementById('enquiry-status'),submit=document.getElementById('enquiry-submit'),voiceButton=document.getElementById('enquiry-voice');
 const formView=document.getElementById('enquiry-form-view'),success=document.getElementById('enquiry-success'),music=document.getElementById('background-music');
 const greeting=document.getElementById('enquiry-intro').textContent.trim();
 let opener=null,context='Homepage',destination='#projects',csrf='',requestId='',tokenRequest=null,submitting=false,utterance=null,resumeMusic=false,voiceTimer;
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
 async function prepareToken(){
  if(csrf&&requestId)return;if(tokenRequest)return tokenRequest;
  tokenRequest=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{
   const response=await fetch('/arcane-lead.php',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
   const data=await response.json();if(!response.ok||!data.csrf||!data.request_id)throw new Error('unavailable');csrf=data.csrf;requestId=data.request_id;
  }finally{clearTimeout(timer);}})();try{await tokenRequest;}finally{tokenRequest=null;}
 }
 function openEnquiry(button){
  if(dialog.open)return;opener=button;context=button.dataset.enquiryIntent||'Homepage';destination=button.hash||'#projects';document.getElementById('enquiry-source').value=context;document.getElementById('enquiry-browse').href='/'+destination;
  document.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(button=>button.click());
  formView.hidden=false;success.hidden=true;dialog.setAttribute('aria-labelledby','enquiry-title');setStatus('');
  resumeMusic=!!music&&!music.paused;if(music)music.pause();dialog.showModal();document.body.classList.add('enquiry-modal-open');document.getElementById('enquiry-name').focus();
  if(typeof assistantVoiceEnabled==='undefined'||assistantVoiceEnabled)playWelcome();
  prepareToken().catch(()=>{});
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
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting||!form.reportValidity())return;submitting=true;submit.disabled=true;submit.querySelector('span').textContent='Sending your enquiry…';setStatus('');stopVoice();
  let timer;try{
   await prepareToken();const payload=Object.fromEntries(new FormData(form).entries());payload.csrf=csrf;payload.request_id=requestId;payload.source=context;
   const controller=new AbortController();timer=setTimeout(()=>controller.abort(),20000);
   const response=await fetch('/arcane-lead.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const data=await response.json();if(!response.ok||data.ok!==true){if(response.status===403){csrf='';requestId='';}throw new Error(data.message||'unavailable');}
   document.getElementById('enquiry-reference').textContent='Enquiry reference: '+data.reference;formView.hidden=true;success.hidden=false;dialog.setAttribute('aria-labelledby','enquiry-success-title');document.getElementById('enquiry-success-title').focus();form.reset();csrf='';requestId='';
   document.dispatchEvent(new Event('arcane:enquiry-sent'));
  }catch(error){
   const known=typeof error.message==='string'&&error.message!=='unavailable'&&error.name!=='SyntaxError'&&error.name!=='AbortError'&&error.message.length<220;
   setStatus(known&&/^(Please|Too many|Your enquiry)/.test(error.message)?error.message:'We couldn’t send your enquiry right now. Your details are still here. Please try again, email info@arcane.ae, or call +971 4 570 7248.',true);
  }finally{clearTimeout(timer);submitting=false;submit.disabled=false;submit.querySelector('span').textContent='Send project enquiry';}
 });
})();
