/* Arcane GA4 business actions. Send fixed labels only, never form values or compose URLs. */
(function(){
 'use strict';
 const resources={
  '/Arcane_Company_Profile_2026.pdf':'company_profile',
  '/Arcane-Pitch Deck-2026.pdf':'pitch_deck',
  '/Arcane-Full Logo Brand.pdf':'brand_identity'
 };
 const methods={phone:'click_phone',email:'click_email',whatsapp:'click_whatsapp'};
 function track(name,params){
  if(typeof window.gtag!=='function')return;
  window.gtag('event',name,Object.assign({send_to:'G-KXTQ58JKHQ',page_path:location.pathname},params));
 }
 function contentFor(path){
  const match=path.match(/^\/(projects|expertise)\/([a-z0-9-]+)\/$/);
  return match?{content_type:match[1]==='projects'?'project':'expertise',item_id:match[2]}:null;
 }
 document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const button=target.closest('[data-enquiry-open]');
  if(button&&document.getElementById('enquiry-dialog')?.open)track('enquiry_open',{form_name:'project_enquiry'});
  const resourceOpener=target.closest('[data-profile-open]');
  if(resourceOpener&&document.getElementById('profile-dialog')?.open)track('resource_dialog_open',{resource_type:'company_documents'});
  const link=target.closest('a[href]');if(!link)return;
  let url;try{url=new URL(link.href,location.href);}catch{return;}
  // Webmail links contain the visitor's draft; record only the safe contact method.
  const emailApp=link.dataset?.enquiryEmailApp;
  const method=emailApp?'email':url.protocol==='tel:'?'phone':url.protocol==='mailto:'?'email':(['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url.hostname)?'whatsapp':null);
  if(method){track('contact_click',{contact_method:method});track(methods[method],{contact_method:method});}
  if(url.origin===location.origin){
   const content=contentFor(url.pathname);
   if(content&&url.pathname!==location.pathname)track('select_content',content);
   if(link.hasAttribute('download')){
    let path;try{path=decodeURIComponent(url.pathname);}catch{return;}
    const resource=resources[path];if(resource)track('resource_download',{resource_type:resource});
   }
  }
 });
 let enquiryStarted=false;
 document.addEventListener('input',event=>{
  if(enquiryStarted||!(event.target instanceof Element)||!event.target.closest('#enquiry-form'))return;
  if(event.target.name==='website')return;
  enquiryStarted=true;track('enquiry_start',{form_name:'project_enquiry'});
 });
 const content=contentFor(location.pathname);
 if(content)track(content.content_type==='project'?'view_project':'view_expertise',{item_id:content.item_id});
 // Reserve generate_lead for an independently confirmed server submission.
 // Opening an email draft is recorded separately by arcane-enquiry.js.
 document.addEventListener('arcane:enquiry-sent',()=>track('generate_lead',{form_name:'project_enquiry'}));
})();
