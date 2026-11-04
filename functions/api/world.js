// Отраслевые RSS: короткие выдержки из лент со ссылкой на первоисточник.
const API='https://bvlwpfmtcdgfsomvwqrp.supabase.co', KEY='sb_publishable_S7nnUv3hs2bBZDhYhEFYew_j_S6s1sO';
const FEEDS=[['Hotel News Resource · мир','https://www.hotelnewsresource.com/feeds/latest.xml','hotels'],['Hotel News Resource · Европа','https://www.hotelnewsresource.com/feeds/region/europe.xml','hotels'],['Hotel News Resource · Азия','https://www.hotelnewsresource.com/feeds/region/asia.xml','hotels'],['Hotel News Resource · Ближний Восток','https://www.hotelnewsresource.com/feeds/region/middle.xml','hotels'],['Hotel News Resource · Америка','https://www.hotelnewsresource.com/feeds/region/north.xml','hotels'],['Hospitality Net','https://www.hospitalitynet.org/rss/news.xml','hotels'],['Attractions','https://www.amusementsandattractions.com/rss/attractions/news','parks'],['Attractions Magazine','https://attractionsmagazine.com/feed/','parks'],['Disney Parks Blog','https://disneyparksblog.com/feed/','parks'],['blooloop','https://blooloop.com/feed/','entertainment'],['Анимация и досуг · мир','https://news.google.com/rss/search?q=hotel+entertainment+kids+club+family+activities&hl=en-US&gl=US&ceid=US:en','animation']];
const EVENT=/\b(event|festival|festive|celebration|celebrates|concert|show|parade|holiday|halloween|christmas|carnival|performance|theatre|theater|activity|activities|kids club|family program|family experience|workshop)\b/i;
const TRADE_EVENT=/\b(trade show|hospitality show|conference|summit|investor|earnings|revenue|industry event|business event|executive|stock listing)\b/i;
const clean=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const tag=(s,t)=>{const m=s.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+t+'>','i'));return m?clean(m[1]):''};
const imageFrom=item=>{const raw=(item.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl=["']([^"']+)["']/i)||item.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)||[])[1];const url=clean(raw);return /^https:\/\//i.test(url)?url.slice(0,2000):''};
export function parseFeed(xml,source,category='entertainment'){return [...String(xml).matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(m=>{let title=tag(m[1],'title'),url=tag(m[1],'link'),date=tag(m[1],'pubDate');let ts=Date.parse(date);if(!title||!/^https:\/\//i.test(url)||!Number.isFinite(ts)||ts<Date.now()-45*864e5||ts>Date.now()+864e5)return null;let description=(tag(m[1],'description')||tag(m[1],'content:encoded')).slice(0,360).trim();if(description===title)description='';return {title:title.slice(0,260),description,image:imageFrom(m[1]),url,source,category,date:new Date(ts).toISOString(),event:EVENT.test(title)&&!TRADE_EVENT.test(title)}}).filter(Boolean)}
const response=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
let cache={at:0,items:[],failed:[]},cacheReadAt=0;
let refreshing=null;
export async function refreshFeed(env={},options={}){
 const results=await Promise.allSettled(FEEDS.map(async ([name,url,category])=>{let r=await fetch(url,{headers:{accept:'application/rss+xml,application/xml,text/xml'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error(name);return parseFeed(await r.text(),name,category).slice(0,30)}));
 const items=results.flatMap(x=>x.status==='fulfilled'?x.value:[]),failed=results.flatMap((x,i)=>x.status==='rejected'?[FEEDS[i][0]]:[]);
 if(!items.length)throw Error('sources_unavailable');
 const seen=new Set(),counts={},unique=items.sort((a,b)=>b.date.localeCompare(a.date)).filter(x=>{if(seen.has(x.url)||(counts[x.category]||0)>=38)return false;seen.add(x.url);counts[x.category]=(counts[x.category]||0)+1;return true}).slice(0,150);let old=null;try{old=env.WORLD_FEED?await env.WORLD_FEED.get('latest','json'):null}catch(e){}const previous=new Map((old?.items||[]).map(x=>[x.url,x]));for(const item of unique){const match=previous.get(item.url);if(match?.title===item.title)item.title_ru=match.title_ru;if(match?.description===item.description)item.description_ru=match.description_ru}const next={at:Date.now(),items:unique,failed};
 if(options.staged){const run=crypto.randomUUID();await env.WORLD_FEED.put('run:'+run+':0',JSON.stringify(next),{expirationTtl:86400});return {...next,run}}
 if(env.WORLD_FEED)await env.WORLD_FEED.put('latest',JSON.stringify(next));
 cache=next;return next;
}
export async function translateFeed(env,run,offset){
 const feed=await env.WORLD_FEED.get('run:'+run+':'+offset,'json');if(!feed?.items?.length)throw Error('feed_unavailable');
 const indices=feed.items.map((_,i)=>i),batch=indices.slice(offset,offset+15);
 let cursor=0;const worker=async()=>{while(cursor<batch.length){const item=feed.items[batch[cursor++]];for(const [key,target,limit] of [['title','title_ru',400],['description','description_ru',500]]){if(!item[key]||item[target])continue;for(let attempt=0;attempt<3;attempt++){try{const r=await env.AI.run('@cf/meta/m2m100-1.2b',{text:item[key],source_lang:'en',target_lang:'ru'});if(typeof r?.translated_text==='string'&&r.translated_text.trim()){item[target]=r.translated_text.trim().slice(0,limit);break}}catch(e){}if(attempt<2)await new Promise(resolve=>setTimeout(resolve,300*(attempt+1)))}}}};
 await Promise.all(Array.from({length:3},worker));const next=offset+batch.length;if(next>=indices.length){await env.WORLD_FEED.put('latest',JSON.stringify(feed));cache=feed;cacheReadAt=Date.now()}else await env.WORLD_FEED.put('run:'+run+':'+next,JSON.stringify(feed),{expirationTtl:86400});return {next,total:indices.length,translated:feed.items.filter(x=>x.title_ru).length};
}
async function access(request){
 const authorization=request.headers.get('authorization')||'';if(!/^Bearer\s+\S+$/i.test(authorization))return null;
 const headers={apikey:KEY,authorization};let user=await fetch(API+'/auth/v1/user',{headers});if(!user.ok)return null;user=await user.json();if(!user.id)return null;
 let profile=await fetch(API+'/rest/v1/profiles?select=role,status&id=eq.'+encodeURIComponent(user.id),{headers});if(!profile.ok)return null;profile=(await profile.json())[0];
 if(profile?.status==='approved')return {manager:profile.role==='manager'||profile.role==='admin'};
 let member=await fetch(API+'/rest/v1/animation_memberships?select=status&user_id=eq.'+encodeURIComponent(user.id),{headers});if(!member.ok)return null;member=(await member.json())[0];if(member?.status!=='approved')return null;
 const day=new Date().toISOString().slice(0,10),check=await fetch(API+'/rest/v1/rpc/animation_my_schedule',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({p_from:day,p_to:day})});return check.ok?{manager:false}:null;
}
export async function onRequestGet({request,env={}}){
 let viewer;try{viewer=await access(request)}catch(e){return response({error:'auth_unavailable'},503)}if(!viewer)return response({error:'forbidden'},403);
 const now=Date.now();
 if(env.WORLD_FEED&&now-cacheReadAt>60000){try{const v=await env.WORLD_FEED.get('latest','json');if(v?.at&&Array.isArray(v.items)&&v.items.length)cache=v;cacheReadAt=now}catch(e){}}
 if(now-cache.at>3*60*60*1000&&!(env.WORLD_FEED&&cache.items.length)){
  if(!refreshing)refreshing=(async()=>{
  try{await refreshFeed(env)}catch(e){}
  })().finally(()=>{refreshing=null});
  await refreshing;if(!cache.items.length)return response({error:'sources_unavailable',items:[],failed:cache.failed},502);
 }
 const items=viewer.manager?cache.items:cache.items.filter(x=>x.event);
 return response({updated:new Date(cache.at).toISOString(),failed:cache.failed,items:items.slice(0,150),scope:viewer.manager?'manager':'events'});
}
