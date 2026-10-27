'use strict';

const terms={
 grg:['Sculptural GRG','glass reinforced gypsum','decorative gypsum ceilings','gypsum mouldings','architectural wall panels'],
 ceilings:['gypsum ceilings','suspended ceilings','acoustic ceilings','metal ceilings','cement board ceilings','HPL ceilings','wood ceilings','stretch ceilings'],
 partitions:['gypsum partitions','drywall partitions','wall cladding','cement board partitions','glass partitions','composite partitions']
};
const base='https://www.arcane.ae';
const absolute=src=>new URL(src,base).href;
const escapeXml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

function enrichGraph(page,graph,services){
 const org=graph.find(n=>n['@type']==='HomeAndConstructionBusiness');
 const web=graph.find(n=>n['@id']===base+page.url+'#webpage');
 org.alternateName='Arcane';
 org.foundingDate='2004';
 org.knowsAbout=Object.values(terms).flat();
 org.logo={'@type':'ImageObject',url:base+'/arcane-logo.webp',contentUrl:base+'/arcane-logo.webp',width:1123,height:634};
 const primary={'@type':'ImageObject','@id':base+page.url+'#primaryimage',contentUrl:absolute(page.image),url:absolute(page.image)};
 graph.push(primary);
 web.primaryImageOfPage={'@id':primary['@id']};
 web.image={'@id':primary['@id']};
 if(page.section==='home'||page.section==='company'){
  const catalog={'@type':'OfferCatalog','@id':base+'/#services',name:'Sculptural GRG, ceilings and partitions',itemListElement:services.map(s=>({'@type':'Offer',itemOffered:{'@type':'Service','@id':base+'/expertise/'+s.id+'/#service',name:s.name,serviceType:terms[s.id],description:s.scope,url:base+'/expertise/'+s.id+'/',provider:{'@id':org['@id']},areaServed:{'@type':'Country',name:'United Arab Emirates'}}}))};
  org.hasOfferCatalog={'@id':catalog['@id']};graph.push(catalog);
  web.about={'@id':org['@id']};
 }
 if(page.section==='expertise'){
  const service=graph.find(n=>n['@type']==='Service');
  service.serviceType=terms[page.record.id];
  service.image={'@id':primary['@id']};
  service.category=page.name;
  web.keywords=[...terms[page.record.id],'Dubai','United Arab Emirates'];
 }
 if(page.section==='projects'){
  // Describe the project reference, without claiming Arcane owns the development.
  web.about={'@type':'Thing',name:page.record.name,description:page.record.scope};
  web.mentions=[{'@id':org['@id']}];
 }
 return graph;
}

function imageSources(page){
 // Only index photographs that actually appear in this page's main content.
 return [...new Set([...page.main.matchAll(/<img\b[^>]*\bsrc="([^"#]+)"/g)].map(m=>m[1]).filter(src=>src.startsWith('/')&&!src.startsWith('//')).map(absolute))];
}
function sitemap(pages){
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+pages.map(page=>'  <url><loc>'+escapeXml(base+page.url)+'</loc>'+imageSources(page).map(src=>'<image:image><image:loc>'+escapeXml(src)+'</image:loc></image:image>').join('')+'</url>').join('\n')+'\n</urlset>\n';
}
module.exports={enrichGraph,sitemap};
