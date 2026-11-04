const C='dw-v177';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','styles.css?v=177','app.js?v=177','dgx.js?v=177','attract.js?v=177','ext1.js?v=177','ext2.js?v=177','ext3.js?v=177','ext4.js?v=177','myfiles.js?v=177','today.js?v=177','roted.js?v=177','xlsx.js?v=177','stickers/logo.webp','stickers/acorn.svg','stickers/balloon.svg','stickers/butterfly.svg','stickers/cherry.svg','stickers/cupcake.svg','stickers/drum.svg','stickers/flower.svg','stickers/leaf.svg','stickers/moon.svg','stickers/mushroom.svg','stickers/paw.svg','stickers/pumpkin.svg','stickers/rainbow.svg','stickers/snow.svg','stickers/star.svg','stickers/sun.svg','stickers/umbrella.svg','stickers/drop.svg','stickers/mountain.svg','stickers/wind.svg','stickers/city.svg','stickers/dome.svg','stickers/mascot-hi.webp','stickers/mascot-balloon.webp','stickers/pushok.webp','stickers/sunglasses.webp','stickers/cloud.webp','stickers/tree.webp','stickers/smile.webp','stickers/sparkle.webp','stickers/burst.webp','stickers/bird.webp','stickers/heart.webp','stickers/thumb.webp','stickers/gold/mentor.webp','stickers/gold/gem-1.svg','stickers/gold/gem-2.svg','stickers/gold/gem-3.svg','stickers/gold/gem-4.svg','stickers/gold/gem-5.svg','stickers/gold/gem-6.svg','stickers/gold/gem-7.svg','stickers/gold/gem-8.svg','stickers/gold/gem-9.svg','rep.js?v=177','plan.js?v=177','grow.js?v=177','pet.js?v=177','game.js?v=177','gacha.js?v=177','gacha2.js?v=177','gacha3.js?v=177','gacha4.js?v=177','companion.js?v=177','prof.js?v=177','pet25d.js?v=177','gold.js?v=177','brief.js?v=177','fx.js?v=177','qc.js?v=177','push.js?v=177','tour.js?v=177','personnel.js?v=177','admissions.js?v=177','daily_manager.js?v=177','handover.js?v=177','animation_staging.js?v=177','animation_home.js?v=177','animation_shell.js?v=177','animation_requests.js?v=177','animation_posts.js?v=177','animation_team.js?v=177','animation_personnel.js?v=177','animation_pet.js?v=177','animation_gacha.js?v=177','animation_knowledge.js?v=177','animation_photo.js?v=177','world.js?v=177','pet_world.js?v=177','replacement.js?v=177','config.js?v=177','logo.js?v=177','manifest.webmanifest','icons/icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(async ks=>{const old=ks.filter(k=>k!==C);await Promise.all(old.map(k=>caches.delete(k)));await self.clients.claim();
  // обновление: открытые окна со старой версией перезагружаем сами, чтобы никто не сидел на старом коде
  if(old.length){const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>{try{c.navigate(c.url)}catch(_){}})}})));
// Сеть с таймаутом: если сайт не ответил за 1,2 секунды, сразу отдаём сохранённую копию (при слабой связи или блокировках приложение всё равно открывается), а обновление докачивается в фоне
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);
if(q.method!=='GET'||u.origin!==location.origin||/^\/(api|sb)\//.test(u.pathname))return;
e.respondWith((async()=>{
  const c=await caches.open(C),hit=await c.match(q,{ignoreSearch:q.mode==='navigate'});
  if(hit&&/[?&]v=\d+/.test(u.search))return hit; // версионные файлы не меняются: отдаём сразу из памяти, без ожидания сети
  const net=fetch(q).then(r=>{if(r&&r.ok){c.put(q,r.clone())}return r});
  if(!hit)return net.catch(()=>caches.match('index.html'));
  const slow=new Promise(res=>setTimeout(()=>res(hit),1220));
  e.waitUntil(net.catch(()=>{}));
  return Promise.race([net.catch(()=>hit),slow]);
})())});

self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'Дримвуд',body:e.data?e.data.text():''}}
const u=!!d.urgent;
e.waitUntil(self.registration.showNotification(d.title||'Дримвуд',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||undefined,renotify:true,silent:false,requireInteraction:u,vibrate:u?[600,200,600,200,600,200,600,200,600]:[200,100,200],timestamp:Date.now(),data:{link:d.link||null}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const link=e.notification.data&&e.notification.data.link;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs[0];if(c){c.focus();if(link)c.postMessage({go:link});return}return self.clients.openWindow('./'+(link?'?go='+encodeURIComponent(link):''))}))});
















