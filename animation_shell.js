(() => {
 const managerItems=[['home','🏠','Сегодня'],['schedule','📅','График'],['requests','📨','Заявки'],['posts','📰','Новости'],['more','☰','Ещё'],['admissions','🎟️','Допуски'],['personnel','🔒','Анкеты и навыки'],['knowledge','📚','База знаний'],['photos','📷','Фото выходного'],['applications','👥','Регистрация'],['world','🌍','Мировая сводка']];
 const staffItems=[['home','🏠','Сегодня'],['team','👥','Команда'],['requests','📨','Заявки'],['posts','📰','Новости'],['more','☰','Ещё'],['pet','🐾','Питомец'],['gacha','🎁','Автомат'],['notebook','📝','Блокнот'],['profile','🪪','Моя анкета'],['admissions','🎟️','Мои допуски'],['knowledge','📚','База знаний'],['world','🌍','Мировая сводка']];
 let bar;
 function items(){return isAdmin()?managerItems:staffItems}
 function draw(active){
  if(!bar){bar=document.createElement('nav');bar.id='animation-nav';bar.setAttribute('aria-label','Разделы анимации');document.body.appendChild(bar)}
  bar.innerHTML=items().map(([id,icon,label],i)=>`<button type="button" data-animation-page="${id}" class="${i>4?'animation-desktop ':''}${id===active?'on':''}" ${id===active?'aria-current="page"':''}>${icon}<span>${label}</span></button>`).join('');
  bar.hidden=false;nav.hidden=true;document.body.classList.add('animation-mode');
 }
 function remove(){if(bar)bar.hidden=true;document.body.classList.remove('animation-mode');if(S.me&&S.me.status!=='pending')nav.hidden=false}
 function sync(tab){if(S.department!=='animation'){remove();return}draw(({animation_admin:'home',animation_schedule:'schedule',animation_personnel_admin:'personnel',animation_knowledge_admin:'knowledge',animation_posts_admin:'posts',animation_requests_admin:'requests',animation_photos_admin:'photos',world:'world',staff:'applications'})[tab]||'home')}
 async function open(id){
  S.department='animation';draw(id);app.scrollTop=0;
  const admin=isAdmin();
  if(id==='more'){
   app.innerHTML=head('Все разделы','Команда анимации')+`<div class="anim-menu">${items().filter(x=>x[0]!=='more').map(([key,icon,label])=>`<button class="card anim-menu-item" data-animation-link="${key}"><span>${icon}</span><b>${label}</b><span>›</span></button>`).join('')}</div>`;
   return;
  }
  if(admin){const routes={home:'animation_admin',schedule:'animation_schedule',requests:'animation_requests_admin',posts:'animation_posts_admin',personnel:'animation_personnel_admin',knowledge:'animation_knowledge_admin',photos:'animation_photos_admin',applications:'staff',world:'world'};if(id==='admissions')return animationAdmissionsView(true);if(routes[id])return go(routes[id]);return}
  const routes={home:()=>animationHome(),team:()=>animationTeamView(),requests:()=>animationRequestsView(false),posts:()=>animationPostsView(false),pet:()=>animationPetView(),gacha:()=>animationGachaView(),profile:()=>animationProfileView(false),admissions:()=>animationAdmissionsView(false),knowledge:()=>animationKnowledgeView(false),world:()=>worldView(),notebook:()=>{sb.rpc('animation_mark_activity',{p_kind:'notebook'}).then(()=>{},()=>{});return noteView()}};
  if(routes[id])await routes[id]();
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-animation-page],[data-animation-link]');if(b){e.preventDefault();open(b.dataset.animationPage||b.dataset.animationLink)}});
 window.animationShellOpen=open;window.animationShellSync=sync;window.animationShellDraw=draw;window.animationShellHide=remove;
 const style=document.createElement('style');style.textContent=`
 #animation-nav[hidden]{display:none!important}body.animation-mode #nav{display:none!important}
 #animation-nav{padding:6px 6px max(6px,env(safe-area-inset-bottom));gap:2px;box-shadow:0 -4px 24px #182d2108}#animation-nav button{min-width:0;min-height:60px;border-radius:14px;padding:6px 2px;gap:4px}#animation-nav button.on{margin:0;box-shadow:inset 0 -3px #aa5698}#animation-nav span{font-size:10px;line-height:1.25;overflow-wrap:anywhere}#animation-nav .animation-desktop{display:none}
 .anim-menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}.anim-menu-item{display:flex;align-items:center;gap:12px;width:100%;padding:17px;text-align:left;color:var(--ink);font:inherit;cursor:pointer}.anim-menu-item span:first-child{font-size:25px}.anim-menu-item b{flex:1}.anim-menu-item span:last-child{font-size:24px;color:var(--muted)}
 @media(min-width:900px){#animation-nav{padding:24px 14px;gap:5px;box-shadow:none}#animation-nav:before{content:'🎭 Анимация'}#animation-nav button,#animation-nav button.on{min-height:48px;padding:10px 14px;gap:12px}#animation-nav button.on{box-shadow:inset 3px 0 #aa5698}#animation-nav span{font-size:13px}#animation-nav .animation-desktop{display:flex}#animation-nav [data-animation-page=more]{display:none}}
 `;document.head.appendChild(style);
})();
