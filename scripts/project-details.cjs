'use strict';
const data=require('../content/company-project-details.json');
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
function projectGallery(project){
 return `<section id="project-gallery" class="section project-photo-section" aria-labelledby="project-gallery-title"><div class="section-heading"><h2 id="project-gallery-title">Project images.</h2></div><div class="project-photo-grid">${[1,2].map(i=>`<figure class="project-image-placeholder"><svg viewBox="0 0 800 520" role="img" aria-label="Project image placeholder ${i}" style="display:block;width:100%;height:auto;color:var(--muted)"><rect x="1" y="1" width="798" height="518" fill="none" stroke="currentColor" opacity=".16"/><rect x="364" y="205" width="72" height="58" rx="3" fill="none" stroke="currentColor" opacity=".35"/><path d="m365 250 21-21 18 18 12-12 19 20" fill="none" stroke="currentColor" opacity=".35"/><circle cx="418" cy="220" r="5" fill="currentColor" opacity=".35"/><text x="400" y="303" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-size="16">Image placeholder ${i.toString().padStart(2,'0')}</text></svg><figcaption>${esc(project.name)}</figcaption></figure>`).join('')}</div></section>`;
}
module.exports={workforce,projectDetails,projectGallery,data};

