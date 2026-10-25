/* Filter the photo collection and preview the original photograph. */
(()=>{
 'use strict';
 const grid=document.querySelector('#gallery-collection');
 if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-gallery-category]')];
 const groups=[...grid.querySelectorAll('[data-gallery-group]')];
 const filters=[...document.querySelectorAll('[data-gallery-filter]')];
 const count=document.getElementById('gallery-count');
 const dialog=document.getElementById('gallery-dialog');
 const preview=document.getElementById('gallery-preview');
 let visible=cards.map(card=>card.querySelector('[data-gallery-photo]'));
 let position=0,opener=null;
 document.querySelector('.collection-filters').hidden=false;
 function selectCategory(button){
  const category=button.dataset.galleryFilter;
  filters.forEach(filter=>filter.setAttribute('aria-pressed',String(filter===button)));
  groups.forEach(group=>{group.hidden=group.dataset.galleryGroup!==category;});
  visible=cards.filter(card=>card.dataset.galleryCategory===category).map(card=>card.querySelector('[data-gallery-photo]'));
  count.textContent=`${visible.length} photographs · ${button.textContent.trim()}`;
 }
 filters.forEach(button=>button.addEventListener('click',()=>selectCategory(button)));
 selectCategory(filters[0]);
 function show(index){
  position=(index+visible.length)%visible.length;
  const link=visible[position];
  preview.src=link.href;
  preview.alt=link.dataset.description;
  document.getElementById('gallery-preview-title').textContent=link.dataset.title;
  document.getElementById('gallery-position').textContent=`${position+1} / ${visible.length}`;
 }
 grid.addEventListener('click',event=>{
  const link=event.target.closest('[data-gallery-photo]');
  if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0||typeof dialog.showModal!=='function')return;
  event.preventDefault();opener=link;show(visible.indexOf(link));
  dialog.showModal();document.body.classList.add('gallery-preview-open');
 });
 document.getElementById('gallery-previous').addEventListener('click',()=>show(position-1));
 document.getElementById('gallery-next').addEventListener('click',()=>show(position+1));
 document.getElementById('gallery-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'){event.preventDefault();show(position+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();show(position-1);}
 });
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{
  document.body.classList.remove('gallery-preview-open');
  preview.removeAttribute('src');
  if(opener)opener.focus({preventScroll:true});
 });
})();
