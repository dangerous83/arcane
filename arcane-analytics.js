/* Arcane GA4 actions. Only fixed labels are sent; no form values or message text. */
(function(){
 'use strict';
 const resources={
  '/Arcane_Company_Profile_2026.pdf':'company_profile',
  '/Arcane-Pitch Deck-2026.pdf':'pitch_deck',
  '/Arcane-Full Logo Brand.pdf':'brand_identity'
 };
 function track(name,params){
  if(typeof window.gtag!=='function')return;
  window.gtag('event',name,Object.assign({send_to:'G-KXTQ58JKHQ',page_path:location.pathname},params));
 }
 document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const button=target.closest('[data-enquiry-open]');
  if(button&&document.getElementById('enquiry-dialog')?.open)track('enquiry_open',{form_name:'project_enquiry'});
  const resourceOpener=target.closest('[data-profile-open]');
  if(resourceOpener&&document.getElementById('profile-dialog')?.open)track('resource_dialog_open',{resource_type:'company_documents'});
  const link=target.closest('a[href]');if(!link)return;
  let url;try{url=new URL(link.href,location.href);}catch{return;}
  const method=url.protocol==='tel:'?'phone':url.protocol==='mailto:'?'email':(['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url.hostname)?'whatsapp':null);
  if(method)track('contact_click',{contact_method:method});
  if(url.origin===location.origin&&link.hasAttribute('download')){
   const resource=resources[decodeURIComponent(url.pathname)];
   if(resource)track('resource_download',{resource_type:resource});
  }
 });
 // A confirmed lead is recorded only after the server accepts the enquiry.
 document.addEventListener('arcane:enquiry-sent',()=>track('generate_lead',{form_name:'project_enquiry'}));
})();
