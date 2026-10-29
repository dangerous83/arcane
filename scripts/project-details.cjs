'use strict';
const data=require('../content/company-project-details.json');
const photos=require('../content/project-photos.json');
// These standard ceiling assets were visually reviewed. Folder names alone do
// not distinguish plain ceilings from Sculptural GRG photographs.
const photoPolicy=require('../content/project-photo-policy.json');
const standardCeilings=new Set(photoPolicy.standardCeilingSources);
for(const [id,selected] of Object.entries(photos)){
 if(selected.length!==2) throw new Error(`${id}: project galleries require exactly two images`);
 const exception=photoPolicy.approvedProjectExceptions[id];
 if(exception){
  if(selected.some((photo,i)=>photo.src!==exception[i])) throw new Error(`${id}: preserve the explicitly approved project photographs`);
  continue;
 }
 if(selected[0].category!=='Ceilings'||!standardCeilings.has(selected[0].src)) throw new Error(`${id}: choose a reviewed standard ceiling photograph, not Sculptural GRG`);
 if(selected[1].category!=='Partitions'||!selected[1].src.startsWith('/assets/partitions/')) throw new Error(`${id}: the second photograph must show partitions`);
}
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
 const selected=photos[project.id];
 if(selected && selected.length===2) return `<section id="project-gallery" class="section project-photo-section" aria-labelledby="project-gallery-title"><div class="section-heading"><h2 id="project-gallery-title">Project images.</h2></div><div class="project-photo-grid">${selected.map((p,i)=>`<figure><a href="${p.src}" target="_blank" rel="noopener" aria-label="Open ${esc(project.name)} image ${i+1} in full" style="aspect-ratio:20/13;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${p.src}" alt="${p.reference?esc(p.category)+' · reference image':esc(project.name)+' · site photograph '+(i+1)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;object-position:center"></a><figcaption>${p.reference?esc(p.category)+' · Reference image':esc(project.name)}</figcaption></figure>`).join('')}</div></section>`;
 return `<section id="project-gallery" class="section project-photo-section" aria-labelledby="project-gallery-title"><div class="section-heading"><h2 id="project-gallery-title">Project images.</h2></div><div class="project-photo-grid">${[1,2].map(i=>`<figure class="project-image-placeholder"><svg viewBox="0 0 800 520" role="img" aria-label="Project image placeholder ${i}" style="display:block;width:100%;height:auto;color:var(--muted)"><rect x="1" y="1" width="798" height="518" fill="none" stroke="currentColor" opacity=".16"/><rect x="364" y="205" width="72" height="58" rx="3" fill="none" stroke="currentColor" opacity=".35"/><path d="m365 250 21-21 18 18 12-12 19 20" fill="none" stroke="currentColor" opacity=".35"/><circle cx="418" cy="220" r="5" fill="currentColor" opacity=".35"/><text x="400" y="303" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-size="16">Image placeholder ${i.toString().padStart(2,'0')}</text></svg><figcaption>${p.reference?esc(p.category)+' · Reference image':esc(project.name)}</figcaption></figure>`).join('')}</div></section>`;
}
module.exports={workforce,projectDetails,projectGallery,data};

