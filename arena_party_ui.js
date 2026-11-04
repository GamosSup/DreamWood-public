/* Черновик интерфейса командных игр; используется только с тестовой базой. */
async function arenaPartyView(){
 const self=S.me.id;
 const titles={courier:'Волшебный курьер',cake:'Кто подменил торт?',park:'Парк после закрытия'};
 const icons={courier:'📦',cake:'🎂',park:'🌙'};
 const choices=['Лисёнок · лес · красная лента','Енот · лес · синяя лента','Сова · река · красная лента','Кролик · река · синяя лента'];
 const tasks=['Зажечь фонари','Проверить дорожки','Открыть ворота','Вернуть музыку','Проверить аттракционы','Включить огни парка'];
 let selected=null, people=[],poll=null;
 const rpc=async(name,args={})=>{const r=await sb.rpc(name,args);if(r.error)throw Error(r.error.message);return r.data};
 const nameOfId=id=>id===self?'Ты':(people.find(p=>p.id===id)?.name||'Участник');
 const safe=e=>toast('Не получилось: '+(e.message||'ошибка'));
 function btn(label,action,attrs=''){return `<button type="button" class="btn ghost" data-action="${action}" ${attrs}>${label}</button>`}
 async function draw(){
  const [rows,users,leaders]=await Promise.all([rpc('arena_party_list'),rpc('arena_players'),rpc('arena_leaderboard')]);people=users||[];
  const mine=(rows||[]).filter(g=>(g.members||[]).includes(self)),invites=(rows||[]).filter(g=>g.status==='lobby'&&!(g.members||[]).includes(self));
  function cards(list){return list.map(g=>`<div class="card pad" style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><span style="font-size:30px">${icons[g.mode]}</span><div style="flex:1"><b>${esc(titles[g.mode]||'Игра')}</b><div class="muted">${esc(g.host_name||'Сотрудник')} · ${(g.members||[]).length}/${g.seats} · ${{lobby:'сбор команды',active:'игра идёт',finished:'завершена',cancelled:'отменена'}[g.status]||''}</div></div>${g.host===self&&g.status==='lobby'?btn('Отменить','cancel',`data-id="${esc(g.id)}"`):''}${(g.members||[]).includes(self)?btn('Открыть','open',`data-id="${esc(g.id)}"`):btn('Присоединиться','join',`data-id="${esc(g.id)}"`)}</div>`).join('')||'<div class="card pad muted">Здесь пока пусто</div>'}
  app.innerHTML=head('Игры команды','Игра начинается сейчас')+`<section class="card pad" style="background:linear-gradient(130deg,#183d55,#376d74);color:#fff"><div style="font-size:12px;letter-spacing:.15em">DREAMWOOD · ИГРА НАЧИНАЕТСЯ СЕЙЧАС</div><h2>Собирайте команду ✨</h2><p>Выбери приключение, пригласи коллег и двигайтесь к победе вместе.</p></section><section class="card pad col"><h3>Создать игру</h3><label>Приключение<select id="party_mode"><option value="courier">📦 Волшебный курьер · 2 на 2 или 3 на 3</option><option value="cake">🎂 Кто подменил торт? · 2–6 игроков</option><option value="park">🌙 Парк после закрытия · 2–6 игроков</option></select></label><label>Количество игроков<select id="party_seats"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option></select></label><label>Пригласить конкретных сотрудников <small class="muted">Можно выбрать нескольких; пустой список откроет набор всем.</small><select id="party_people" multiple size="5">${people.map(p=>`<option value="${esc(p.id)}">${esc(p.name||'Сотрудник')}</option>`).join('')}</select></label><button class="btn" data-action="create">Создать приключение</button></section><h3>Мои игры</h3><div class="col">${cards(mine)}</div><h3>Приглашения</h3><div class="col">${cards(invites)}</div><h3>Общий рейтинг</h3><div class="card pad col">${(leaders||[]).map((p,i)=>`<div class="otr"><b>${i+1}. ${esc(p.name||'Сотрудник')}</b><span>${Number(p.score)||0} ⭐</span></div>`).join('')||'<span class="muted">Здесь появятся первые победители</span>'}</div><div id="party_panel"></div>`;
  const mode=document.getElementById('party_mode'),seats=document.getElementById('party_seats');
  const sync=()=>{Array.from(seats.options).forEach(o=>{o.disabled=mode.value==='courier'&&!['4','6'].includes(o.value)});if(seats.selectedOptions[0]?.disabled)seats.value='4'};mode.onchange=sync;sync();bind();
 }
 async function show(id,scroll=true){
  clearTimeout(poll);selected=id;const g=await rpc('arena_party_view',{p_id:id}),data=g.data||{},idx=(g.members||[]).indexOf(self),myTurn=g.turn===idx+1;
  let body='';
  if(g.status==='lobby')body='<p>Ждём остальных участников. Обнови экран, чтобы увидеть команду.</p>';
  else if(g.mode==='park'){
   const done=new Set(data.done||[]);
   body=`<p>${g.status==='finished'?'Парк снова сияет!':myTurn?'Твой ход — выбери дело.':'Сейчас ходит '+esc(nameOfId(g.members[g.turn-1]))}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:8px">${tasks.map((t,i)=>btn((done.has(i)?'✨ ':'🌙 ')+esc(t),'task',`data-n="${i}" ${!myTurn||done.has(i)||g.status!=='active'?'disabled':''}`)).join('')}</div>`;
  }else if(g.mode==='courier'){
   const steps=data.steps||[0,0];
   body=`<p>Команда солнца: ${steps[0]}/5 ☀️ · Команда луны: ${steps[1]}/5 🌙</p>${data.last?`<p>${esc(nameOfId(data.last.player))}: ${data.last.success?'посылка продвинулась вперёд! ✨':'маршрут оказался закрыт — попробуем дальше.'}</p>`:''}<p>${g.status==='finished'?(steps[0]===steps[1]?'Дружеская ничья!':`Победила команда ${steps[0]>steps[1]?'солнца ☀️':'луны 🌙'}!`):myTurn?'Выбери волшебный маршрут.':'Сейчас ходит '+esc(nameOfId(g.members[g.turn-1]))}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${['🌿 Лес','🌟 Звёзды','🌊 Река'].map((x,i)=>btn(x,'path',`data-n="${i}" ${!myTurn||g.status!=='active'?'disabled':''}`)).join('')}</div>`;
  }else{
   const clueMap=new Map((data.clues||[]).map(x=>[x.index,x.text])),voted=(data.voted||[]).includes(self);
   body=g.status==='finished'?`<p>Загадка раскрыта! Торт подменил: <b>${esc(choices[data.secret]||'неизвестно')}</b>.</p>`:`<p>Собери улики, сопоставь их с приметами гостей и выбери, кто подменил торт. Голос изменить нельзя.</p><div class="card pad col"><b>🔎 Улики</b>${Array.from({length:4},(_,i)=>clueMap.has(i)?`<div>✨ ${esc(clueMap.get(i))}</div>`:btn('Открыть улику '+(i+1),'clue',`data-n="${i}"`)).join('')}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">${choices.map((x,i)=>`<div class="card pad"><b>${esc(x)}</b>${btn('Выбрать','vote',`data-n="${i}" ${voted||clueMap.size<2?'disabled':''}`)}</div>`).join('')}</div>${voted?'<p>Твой голос записан. Ждём остальных.</p>':''}`;
  }
  const panel=document.getElementById('party_panel');if(!panel)return;
  panel.innerHTML=`<section class="card pad col"><div class="otr"><h2>${icons[g.mode]} ${esc(titles[g.mode])}</h2>${btn('Обновить','refresh')}</div><div class="muted">${(g.members||[]).map(id=>esc(nameOfId(id))).join(' · ')}</div><div class="arena-scene">${typeof arenaPetHtml==='function'?arenaPetHtml():''}<span aria-hidden="true">${icons[g.mode]}</span></div>${body}</section>`;bind(panel);if(scroll)panel.scrollIntoView({behavior:'smooth',block:'start'});
  if(['active','lobby'].includes(g.status))poll=setTimeout(()=>{if(document.getElementById('party_panel')&&selected===id)show(id,false).catch(()=>{})},5000);
 }
 function bind(root=app){root.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{
  if(b.dataset.action==='create'){const mode=document.getElementById('party_mode').value,seats=Number(document.getElementById('party_seats').value),ids=Array.from(document.getElementById('party_people').selectedOptions,x=>x.value);if(ids.length&&ids.length!==seats-1)throw Error('Пригласи всю команду или открой набор всем');const id=await rpc('arena_party_create',{p_mode:mode,p_seats:seats,p_invitees:ids});await draw();await show(id)}
  if(b.dataset.action==='join'){await rpc('arena_party_join',{p_id:b.dataset.id});await draw();await show(b.dataset.id)}
  if(b.dataset.action==='cancel'){await rpc('arena_party_cancel',{p_id:b.dataset.id});await draw()}
  if(b.dataset.action==='open')await show(b.dataset.id);
  if(b.dataset.action==='refresh')await show(selected);
  if(['task','path','clue','vote'].includes(b.dataset.action)){const n=Number(b.dataset.n),action=b.dataset.action==='task'?{task:n}:b.dataset.action==='path'?{path:n}:b.dataset.action==='clue'?{type:'clue',index:n}:{type:'vote',suspect:n};await rpc('arena_party_action',{p_id:selected,p_action:action});await show(selected)}
 }catch(e){safe(e);b.disabled=false}})}
 try{await draw()}catch(e){app.innerHTML=head('Игры команды','Игра начинается сейчас')+'<div class="card pad">Игровой раздел сейчас недоступен.</div>';safe(e)}
}
