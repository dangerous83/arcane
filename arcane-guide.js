/* A transparent website guide remains available when the AI connection is unavailable. */
(function(){
const knowledge=typeof module!=='undefined'&&module.exports?require('./arcane-knowledge.js'):window.ArcaneKnowledge;
const normalize=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const contactText='Email info@arcane.ae, WhatsApp +971 58 892 3604, or call +971 4 570 7248.';
function answer(message,page=''){
 let q=normalize(message);
 if(/\b(this|it|tell me more|more details)\b/.test(q)){const [kind,id]=page.replace(/^#/,'').split('/');const item=(kind==='project'?knowledge.projects:kind==='expertise'?knowledge.services:[]).find(p=>p.id===id);if(item)q+=' '+normalize(item.name);}
const result=(reply,contact=false)=>({reply,contact,mode:'site-guide'});
 const refer=reason=>result(reason+'\n\nOur team can help with the details. '+contactText,true);
 if(/\b(price|pricing|cost|quote|quotation|budget|schedule|availability|available|guarantee|warranty|certification|certifications|certified|iso|accreditation|vacancy|vacancies|job|jobs|salary|book|booking|discount|payment|owner|ceo|insurance)\b/.test(q)||/how (much|long)|when.*(finish|complete|start)|completed|completion|timeline/.test(q))return refer('That detail needs confirmation from the Arcane team. The website does not verify that detail.');
 const project=knowledge.projects.find(p=>q.includes(normalize(p.name))||q.includes(p.id.replaceAll('-',' ')))||knowledge.projects.find(p=>{const distinctive=normalize(p.name).split(' ').filter(w=>w.length>4&&!['tower','towers','residences','headquarters','showroom','heights'].includes(w));return distinctive.length&&distinctive.every(w=>q.includes(w));});
 if(project)return result(project.name+' — '+project.location+'.\n'+project.scope+'\nClient / developer: '+project.client+'.\nContractor: '+project.contractor+'.\nThe project hero is an illustrative interior concept. Ask our team for the latest project status.',true);
 const serviceIds=[];
 if(/\b(grg|gypsum reinforced|sculptural|mould|moulding|mouldings|casting|plaster)\b/.test(q))serviceIds.push('grg');
 if(/\b(ceiling|ceilings|partition|partitions|acoustic|acoustics|metal|cement board|glass)\b/.test(q))serviceIds.push('ceilings');
 if(/\b(fit out|fitout|joinery|wood|floor|floors|flooring|carpet|carpets|wall covering|wall coverings|finishing|cladding)\b/.test(q))serviceIds.push('fitout');
 if(serviceIds.length)return result(knowledge.services.filter(s=>serviceIds.includes(s.id)).map(s=>s.name+'\n'+s.scope+'\n'+s.facts.map(([label,value])=>label+': '+value+'.').join('\n')).join('\n\n')+'\n\nWhat type of space are you planning?');
 if(/\b(contact|email|whatsapp|landline|telephone|phone|call|speak|human|person|help team)\b/.test(q))return result(contactText+'\nOur office is at '+knowledge.contact.address+'.',true);
 if(/\b(address|location|located|office|visit|where|dubai)\b/.test(q))return result('Visit Arcane at '+knowledge.contact.address+'.\n'+contactText,true);
 if(/\b(profile|brochure|download|pdf)\b/.test(q))return result('You can download the '+knowledge.profile.title+' using the pulsing circular download button beside Discuss your project in the navigation. Enter your email in the dialog to start the PDF download. It covers the company, capabilities and project portfolio.');
 if(/\b(approach|process|steps|coordinate|coordination|inspection|quality|execute|execution)\b/.test(q))return result('Arcane’s approach has four stages:\n'+knowledge.approach.map(([name,detail],i)=>(i+1)+'. '+name+' — '+detail).join('\n'));
 if(/\b(projects|portfolio|landmark|landmarks|residential|hospitality|commercial|workplace)\b/.test(q)){
  const group=/landmark|hospitality/.test(q)?'landmark':/residential/.test(q)?'residential':/workplace|commercial/.test(q)?'workplace':null;
  return result('The website portfolio includes '+knowledge.projects.filter(p=>!group||p.group===group).map(p=>p.name).join(', ')+'.\n\nSelect a project on the website to see its specialist scope. Hero images are illustrative interior concepts. Which project would you like to explore?');
 }
 if(/\b(enquiry|inquiry|form|start a project|discuss a project|submit)\b/.test(q))return result(knowledge.enquiry+'\n'+contactText,true);
 if(/\b(services|service|expertise|capabilities|do you do|offer|what do you|specialist)\b/.test(q))return result('Arcane’s expertise covers Sculptural GRG, Ceilings & partitions, and Interior fit-out. From mould development and casting to coordinated systems, joinery and final finishing, the team supports the complete interior. Which specialist package interests you?');
 if(/\b(established|history|experience|who are|who is)\b/.test(q)||/^(tell me )?(about|what is|what s|what does|describe|introduce|overview of|information about) (your company|the company|arcane)/.test(q)||/^(company|arcane|about|uae)$/.test(q))return result('Arcane Interior Decorations was established in 2004 and works across the UAE. '+knowledge.company.summary+'\nIts three specialist areas are Sculptural GRG, Ceilings & partitions, and Interior fit-out.');
 if(/^(hi|hello|hey|good morning|good afternoon|good evening|thank you|thanks)[ !?.]*$/.test(message.trim().toLowerCase()))return result('Welcome to Arcane. I can help you explore our company, three specialist capabilities, approach and project portfolio. What would you like to know?');
 return refer('I couldn’t find a verified answer to that question in Arcane’s website information.');
}
const guide={answer};if(typeof module!=='undefined'&&module.exports)module.exports=guide;else window.ArcaneGuide=guide;
})();
