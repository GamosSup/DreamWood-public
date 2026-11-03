// Подсказка руководителю: результаты не являются назначением на смену.
async function replacementView(){
 if(!isManager()){app.innerHTML=head('Доступ закрыт');return}
 const day=typeof dqMoscowDay==='function'?dqMoscowDay():iso(new Date());
 const [people,personnel,marks,checkins,awards,details,types]=await Promise.all([
  sb.from('profiles').select('id,full_name,position,team').eq('status','approved').order('full_name'),
  sb.from('personnel_private').select('user_id,city,skills'),sb.from('marks').select('user_id').eq('day',day),
  sb.from('checkins').select('user_id').eq('day',day),sb.from('user_ach').select('user_id,code').like('code','adm:%'),
  sb.from('admission_details').select('user_id,code,enabled,valid_until'),sb.from('admission_types').select('code,name').order('name')]);
 const failed=[people,personnel,marks,checkins,awards,details,types].find(x=>x.error);
 if(failed){app.innerHTML=head('Помощь с заменой')+`<div class="card pad">Не удалось загрузить все сведения для поиска: ${esc(failed.error.message)}. Попробуй обновить страницу.</div>`;return}
 if([people,personnel,marks,checkins,awards,details,types].some(x=>(x.data||[]).length>=1000)){app.innerHTML=head('Помощь с заменой')+'<div class="card pad">Сведений слишком много для полного поиска. Обратись к администратору приложения.</div>';return}
 const priv=new Map((personnel.data||[]).map(x=>[x.user_id,x])),off=new Set((marks.data||[]).map(x=>x.user_id)),present=new Set((checkins.data||[]).map(x=>x.user_id));
 const grants=new Map();(awards.data||[]).forEach(x=>{if(!grants.has(x.user_id))grants.set(x.user_id,new Set());grants.get(x.user_id).add(x.code)});
 const states=new Map((details.data||[]).map(x=>[x.user_id+'|'+x.code,x]));
 const valid=(user,code)=>{if(!grants.get(user)?.has(code))return false;const d=states.get(user+'|'+code);return !d||(d.enabled&&(!d.valid_until||d.valid_until>=day))};
 const norm=x=>String(x||'').toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
 app.innerHTML=head('Помощь с заменой','Поиск на '+dayLabel(day))+`<div class="card pad col"><b>🔎 Кого можно рассмотреть</b><div class="muted">Показаны сотрудники без отметки выходного. Навыки указаны в анкетах, отметка выхода не означает, что человек свободен. Перед заменой сверь график, перерывы и допуск; приложение никого не назначает.</div><label>Имя или город<input id="rep-q" type="search" placeholder="Любое имя или город"></label><label>Навык<input id="rep-skill" type="search" placeholder="Например, первая помощь"></label><label>Действующий допуск<select id="rep-adm"><option value="">Любой</option>${(types.data||[]).map(x=>`<option value="${esc(x.code)}">${esc(x.name)}</option>`).join('')}</select></label><label class="pers-check"><input id="rep-confirmed" type="checkbox"> Только подтвердившие выход</label><div id="rep-count" class="muted"></div></div><div id="rep-list" class="col"></div>`;
 const draw=()=>{const q=norm(app.querySelector('#rep-q').value),skill=norm(app.querySelector('#rep-skill').value),admission=app.querySelector('#rep-adm').value,confirmed=app.querySelector('#rep-confirmed').checked;
  const matches=(people.data||[]).filter(x=>{const p=priv.get(x.id)||{};return !off.has(x.id)&&(!confirmed||present.has(x.id))&&norm([x.full_name,p.city].join(' ')).includes(q)&&(!skill||(p.skills||[]).some(s=>norm(s).includes(skill)))&&(!admission||valid(x.id,admission))});
  app.querySelector('#rep-count').textContent='Найдено: '+matches.length;
  app.querySelector('#rep-list').innerHTML=matches.map(x=>{const p=priv.get(x.id),d=admission?states.get(x.id+'|'+admission):null;return `<div class="card pad col"><b>${esc(x.full_name||'Сотрудник')}</b><div class="muted">${esc(x.position||'Должность не указана')}${p?.city?' · '+esc(p.city):''}</div><div>${present.has(x.id)?'✅ Выход подтверждён':'◌ Выход не подтверждён'}</div>${admission?`<div class="muted">Допуск: ${d?.valid_until?'до '+esc(dayLabel(d.valid_until)):'срок не указан'}</div>`:''}${p?.skills?.length?`<div class="muted">Навыки: ${p.skills.map(esc).join(' · ')}</div>`:'<div class="muted">Навыки не указаны</div>'}</div>`}).join('')||'<div class="card pad muted">Подходящих записей не найдено. Попробуй изменить условия.</div>';
 };
 ['#rep-q','#rep-skill','#rep-adm','#rep-confirmed'].forEach(id=>app.querySelector(id).oninput=draw);draw();
}
VIEWS.replacement=replacementView;

