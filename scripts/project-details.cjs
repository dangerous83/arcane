'use strict';
const data=require('../content/company-project-details.json');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function workforce(){
 const w=data.workforce;
 const table=(title,subtitle,roles,total)=>`<article class="workforce-panel"><h3>${title}</h3><p>${subtitle}</p><table><thead><tr><th scope="col">Position</th><th scope="col">Manpower</th></tr></thead><tbody>${roles.map(([role,count])=>`<tr><th scope="row">${esc(role)}</th><td>${count}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td>${total}</td></tr></tfoot></table></article>`;
 return `<section class="section workforce-section" aria-labelledby="workforce-title"><div class="workforce-heading"><div><p class="eyebrow">OUR PEOPLE</p><h2 id="workforce-title">Skilled people.<br><em>Strength in every role.</em></h2></div><div><p class="workforce-total"><strong>${w.total}</strong> total employees</p><p>Official labour list issued by the UAE local authority.<br>As of <time datetime="${w.asOf}">1 August 2026</time>.</p></div></div><div class="workforce-grid">${table('Number of operatives','528 skilled workforce',w.operativeRoles,w.operatives)}${table('Technical & support team','32 employees',w.supportRoles,w.support)}</div></section>`;
}
function projectDetails(project){
 const d=data.projects[project.id];
 const rows=d?[["Client",d.client],["Amount",d.amount],["Start date",d.start],["End date",d.end]]:[["Location",project.location],["Client / developer",project.client],["Contractor",project.contractor]];
 return `<section id="project-details" class="section project-summary" aria-labelledby="project-details-title"><div class="project-summary-heading"><p class="eyebrow">PROJECT DETAILS</p><h2 id="project-details-title">${esc(d?d.name:project.name)}</h2></div><dl class="project-summary-facts">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${d?'':`<p class="project-summary-scope">${esc(project.scope)}</p>`}</section>`;
}
module.exports={workforce,projectDetails,data};
