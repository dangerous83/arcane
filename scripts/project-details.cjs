'use strict';
const data=require('../content/company-project-details.json');
const photos=require('../content/project-photos.json');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function workforce(){
 const w=data.workforce;
 return `<section class="section workforce-section" aria-labelledby="workforce-title"><div class="workforce-heading"><h2 id="workforce-title">People behind<br><em>the work.</em></h2></div><div class="workforce-grid"><article class="workforce-panel"><p class="workforce-total"><strong>${esc(w.operatives)}</strong></p><h3>Skilled workforce</h3><p>Experienced supervision, specialist installation and finishing teams.</p></article><article class="workforce-panel"><p class="workforce-total"><strong>${esc(w.support)}</strong></p><h3>Technical &amp; support team</h3><p>Engineering, coordination and office support across our projects.</p></article></div></section>`;
}
function projectDetails(project){
 const d=data.projects[project.id];
 const rows=(d?[["Main Contractor",d.mainContractor],["Amount",d.amount],["Start date",d.start],["End date",d.end]]:[["Location",project.location],["Main Contractor",project.contractor]]).filter(([,value])=>value&&!/^Contact Arcane/.test(value));
 return `<section id="project-details" class="section project-summary" aria-labelledby="project-details-title"><div class="project-summary-heading"><p class="eyebrow">PROJECT DETAILS</p><h2 id="project-details-title">${esc(d?d.name:project.name)}</h2></div><dl class="project-summary-facts">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${d?'':`<p class="project-summary-scope">${esc(project.scope)}</p>`}</section>`;
}
function projectGallery(project,hero){
 const list=photos[project.id]||[{src:hero,width:1672,height:941,kind:'visual'}];
 return `<section id="project-gallery" class="section project-photo-section" aria-labelledby="project-gallery-title"><div class="section-heading"><h2 id="project-gallery-title">${list.every(p=>p.kind==='visual')?'Project views.':'Project photographs.'}</h2></div><div class="project-photo-grid${list.length===1?' project-photo-grid--single':''}">${list.map((p,i)=>`<figure><a href="${p.src}" target="_blank" rel="noopener" aria-label="Open ${esc(project.name)} image ${i+1} in full"><img src="${p.src}" alt="${esc(project.name)} · ${p.kind==='visual'?'project visual':'site photograph'} ${i+1}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async"></a><figcaption>${esc(project.name)}${p.kind==='visual'?' · Project visual':''}</figcaption></figure>`).join('')}</div></section>`;
}
module.exports={workforce,projectDetails,projectGallery,data};

