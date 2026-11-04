/* Черновик интерфейса. Подключать только после выпуска и проверки серверных функций. */
async function arenaSeaView(){
  const id=S.me.id;
  let current=null,poll=null;
  const rpc=async(name,args={})=>{const r=await sb.rpc(name,args);if(r.error)throw Error(r.error.message);return r.data};
  const button=(label,action,extra='')=>`<button type="button" class="btn ghost" data-action="${action}" ${extra}>${label}</button>`;
  const notify=e=>toast('Не удалось выполнить действие: '+(e.message||'ошибка'));
  async function draw(){
    const [games,top,players]=await Promise.all([rpc('arena_sea_list'),rpc('arena_leaderboard'),rpc('arena_players')]);
    const me=(games||[]).filter(g=>g.challenger===id||g.opponent===id),open=(games||[]).filter(g=>g.status==='pending'&&!g.opponent&&g.challenger!==id);
    const cards=(list,publicList=false)=>list.map(g=>{
      const own=g.challenger===id,other=own?g.opponent_name:g.challenger_name,expired=g.status==='pending'&&new Date(g.expires_at).getTime()<=Date.now();
      const name=esc(other||'Открытый вызов');
      const status=expired?'Срок вызова истёк':g.status==='active'?(g.turn===id?'Твой ход':'Ход соперника'):g.status==='finished'?(g.winner===id?'Победа':'Игра завершена'):g.status==='declined'?'Вызов отклонён':g.status==='cancelled'?'Вызов отменён':'Ожидает ответа';
      return `<div class="card pad" style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><div style="flex:1"><b>${name}</b><div class="muted">${status}</div></div>${g.status==='pending'&&!expired&&!own?button('Принять','accept',`data-id="${esc(g.id)}"`):''}${g.status==='pending'&&!expired&&!own&&!publicList?button('Отказаться','decline',`data-id="${esc(g.id)}"`):''}${g.status==='pending'&&!expired&&own?button('Отменить','cancel',`data-id="${esc(g.id)}"`):''}${['active','finished'].includes(g.status)||(g.status==='pending'&&!expired&&!publicList&&g.opponent)?button('Открыть','open',`data-id="${esc(g.id)}"`):''}</div>`;
    }).join('')||'<div class="card pad muted">Пока ничего нет</div>';
    app.innerHTML=head('Морской бой с питомцами','Дуэли и общий рейтинг')+`<section class="card pad" style="background:linear-gradient(130deg,#133e57,#286a78);color:white"><h2>🌊 Морское приключение</h2><p>Найди корабли соперника. Ходы проходят по очереди, а расположение кораблей скрыто.</p><button class="btn" data-action="create">Открытый вызов</button></section><section class="card pad col"><h3>Пригласить коллегу</h3><label>Сотрудник <select id="arena_player"><option value="">Выбери сотрудника</option>${(players||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.name||'Сотрудник')}</option>`).join('')}</select></label><label>Вид вызова <select id="arena_kind"><option value="colleague">Коллега · 10 очков за победу</option><option value="ranger_guardian">Рейнджер — хранитель · 15 очков</option><option value="leader">Руководитель · 20 очков</option></select></label><p class="muted">Явный отказ от личного вызова уменьшает рейтинг на 5 и списывает билет, если они есть. Пропущенный вызов без штрафа.</p><button class="btn" data-action="invite">Отправить вызов</button></section><h3>Мои игры</h3><div class="col">${cards(me)}</div><h3>Открытые вызовы</h3><div class="col">${cards(open,true)}</div><h3>Рейтинг</h3><div class="card pad col">${(top||[]).map((p,i)=>`<div class="otr"><b>${i+1}. ${esc(p.name||'Сотрудник')}</b><span>${Number(p.score)||0} ⭐</span></div>`).join('')||'<span class="muted">Первые победы ещё впереди</span>'}</div><div id="arena_sea_panel"></div>`;
    bind();
  }
  async function showGame(gameId,scroll=true){
    clearTimeout(poll);current=gameId;const g=await rpc('arena_sea_view',{p_id:gameId}),myTurn=g.status==='active'&&g.turn===id;
    const hits=new Map((g.shots||[]).map(x=>[x.cell,x.hit])),own=new Set(g.own_fleet||[]),incoming=new Set(g.incoming||[]);
    const grid=(type)=>`<div style="display:grid;grid-template-columns:repeat(5,minmax(34px,52px));gap:5px">${Array.from({length:25},(_,cell)=>{
      const enemy=type==='enemy',known=hits.has(cell),hit=enemy?hits.get(cell):incoming.has(cell)&&own.has(cell),miss=enemy?known&&!hit:incoming.has(cell)&&!own.has(cell);
      const icon=hit?'💥':miss?'•':!enemy&&own.has(cell)?'⛵':'🌊';
      return `<button type="button" ${enemy&&myTurn&&!known?'':'disabled'} ${enemy?`data-action="shot" data-cell="${cell}"`:''} aria-label="Клетка ${cell+1}" style="aspect-ratio:1;border:0;border-radius:10px;font-size:20px;background:${hit?'#ffd3bb':miss?'#dce7ef':'#b4e3ec'}">${icon}</button>`;
    }).join('')}</div>`;
    const box=document.getElementById('arena_sea_panel');if(!box)return;
    const planned=g.scheduled_at?`<p>Договорились на ${esc(new Date(g.scheduled_at).toLocaleString('ru-RU'))}</p>`:'';
    const proposal=g.proposal_at?`<p>${g.proposal_by===id?'Ты предложил(а)':'Соперник предлагает'} ${esc(new Date(g.proposal_at).toLocaleString('ru-RU'))}</p>${g.proposal_by!==id?button('Согласовать перенос','accept-time'):''}`:'';
    const schedule=['pending','active'].includes(g.status)&&g.opponent?`<div class="col"><b>Перенести игру</b>${planned}${proposal}<label>Новое время<input id="arena_when" type="datetime-local"></label>${button('Предложить время','propose-time')}</div>`:'';
    box.innerHTML=`<section class="card pad col"><div class="otr"><b>${g.status==='pending'?'⏳ Ожидает ответа':g.status==='finished'?(g.winner===id?'🏆 Победа!':'Партия завершена'):myTurn?'🎯 Твой ход':'⏳ Ход соперника'}</b>${button('Обновить','refresh')}</div><div class="arena-scene">${typeof arenaPetHtml==='function'?arenaPetHtml():''}<span aria-hidden="true">⛵</span></div>${schedule}${g.status==='pending'?'':`<div style="display:flex;flex-wrap:wrap;gap:24px"><div><h3>Твои корабли</h3>${grid('own')}</div><div><h3>Море соперника</h3>${grid('enemy')}</div></div>`}</section>`;
    bind(box);if(scroll)box.scrollIntoView({behavior:'smooth',block:'start'});
    if(['active','pending'].includes(g.status)){
      const refresh=()=>{const panel=document.getElementById('arena_sea_panel');if(!panel||current!==gameId)return;if(panel.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea')){poll=setTimeout(refresh,5000);return}showGame(gameId,false).catch(()=>{})};
      poll=setTimeout(refresh,5000);
    }
  }
  function bind(root=app){root.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{
    if(b.dataset.action==='create'){await rpc('arena_sea_invite',{p_opponent:null});await draw()}
    if(b.dataset.action==='invite'){const target=document.getElementById('arena_player').value,kind=document.getElementById('arena_kind').value;if(!target)throw Error('Выбери сотрудника');await rpc('arena_sea_invite_kind',{p_opponent:target,p_kind:kind});toast('Вызов отправлен');await draw()}
    if(b.dataset.action==='accept'){await rpc('arena_sea_accept',{p_id:b.dataset.id});await draw();await showGame(b.dataset.id)}
    if(b.dataset.action==='cancel'){await rpc('arena_sea_cancel',{p_id:b.dataset.id});await draw()}
    if(b.dataset.action==='decline'){if(!confirm('Отказ от этого вызова уменьшит рейтинг на 5 очков и спишет один билет, если они есть. Отказаться?')){b.disabled=false;return}await rpc('arena_sea_decline',{p_id:b.dataset.id});await draw()}
    if(b.dataset.action==='open')await showGame(b.dataset.id);
    if(b.dataset.action==='refresh')await showGame(current);
    if(b.dataset.action==='propose-time'){const value=document.getElementById('arena_when').value,at=new Date(value);if(!value||Number.isNaN(at.getTime()))throw Error('Выбери дату и время');await rpc('arena_sea_propose_time',{p_id:current,p_at:at.toISOString()});await showGame(current)}
    if(b.dataset.action==='accept-time'){await rpc('arena_sea_accept_time',{p_id:current});await showGame(current)}
    if(b.dataset.action==='shot'){await rpc('arena_sea_fire',{p_id:current,p_cell:Number(b.dataset.cell)});await showGame(current)}
  }catch(e){notify(e);b.disabled=false}})}
  try{await draw()}catch(e){app.innerHTML=head('Морской бой','Дуэли и общий рейтинг')+'<div class="card pad">Игровой раздел сейчас недоступен.</div>';notify(e)}
}
