async function animationTeamView(){
 const r=await sb.rpc('animation_colleagues');
 if(!r.error)sb.rpc('animation_mark_activity',{p_kind:'team'}).then(()=>{},()=>{});
 app.innerHTML='<h1>Команда анимации</h1>'+(r.error?'<div class="card pad">Не удалось загрузить список команды.</div>':`<div class="col">${(r.data||[]).map(x=>`<div class="card pad"><b>${esc(x.full_name)}</b><div class="muted">${esc(x.position||'Аниматор')}</div></div>`).join('')||'<div class="card pad muted">Список команды пока пуст.</div>'}</div>`);
 const back=document.createElement('button');back.className='btn ghost';back.textContent='← В анимацию';back.onclick=animationHome;app.appendChild(back);
}
