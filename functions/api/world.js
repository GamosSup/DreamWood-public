// Отраслевые RSS: только ссылки и заголовки, без публикации полных материалов.
const API='https://bvlwpfmtcdgfsomvwqrp.supabase.co', KEY='sb_publishable_S7nnUv3hs2bBZDhYhEFYew_j_S6s1sO';
const FEEDS=[['Hotel News Resource · мир','https://www.hotelnewsresource.com/feeds/latest.xml'],['Hotel News Resource · Европа','https://www.hotelnewsresource.com/feeds/region/europe.xml'],['Hotel News Resource · Азия','https://www.hotelnewsresource.com/feeds/region/asia.xml'],['Hotel News Resource · Ближний Восток','https://www.hotelnewsresource.com/feeds/region/middle.xml'],['Hotel News Resource · Америка','https://www.hotelnewsresource.com/feeds/region/north.xml'],['Hospitality Net','https://www.hospitalitynet.org/rss/news.xml'],['Attractions','https://www.amusementsandattractions.com/rss/attractions/news']];
const EVENT=/\b(event|festival|festive|celebration|celebrates|concert|show|parade|holiday|halloween|christmas|carnival|performance|theatre|theater|activity|activities|kids club|family program|family experience|workshop)\b/i;
const clean=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const tag=(s,t)=>{const m=s.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+t+'>','i'));return m?clean(m[1]):''};
export function parseFeed(xml,source){return [...String(xml).matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(m=>{let title=tag(m[1],'title'),url=tag(m[1],'link'),date=tag(m[1],'pubDate');let ts=Date.parse(date);if(!title||!/^https:\/\//i.test(url)||!Number.isFinite(ts))return null;return {title:title.slice(0,260),url,source,date:new Date(ts).toISOString(),event:EVENT.test(title)}}).filter(Boolean)}
const response=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
let cache={at:0,items:[],failed:[]};
let refreshing=null;
async function translateHeadlines(items,ai){
 if(!ai)return items;
 let cursor=0;const out=items.map(x=>({...x}));
 const worker=async()=>{while(cursor<Math.min(out.length,60)){const i=cursor++;try{const r=await ai.run('@cf/meta/m2m100-1.2b',{text:out[i].title,source_lang:'en',target_lang:'ru'});if(typeof r?.translated_text==='string'&&r.translated_text.trim())out[i].title_ru=r.translated_text.trim().slice(0,400)}catch(e){}}};
 await Promise.all(Array.from({length:4},worker));return out;
}
export async function refreshFeed(env={}){
 const results=await Promise.allSettled(FEEDS.map(async ([name,url])=>{let r=await fetch(url,{headers:{accept:'application/rss+xml,application/xml,text/xml'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error(name);return parseFeed(await r.text(),name)}));
 const items=results.flatMap(x=>x.status==='fulfilled'?x.value:[]),failed=results.flatMap((x,i)=>x.status==='rejected'?[FEEDS[i][0]]:[]);
 if(!items.length)throw Error('sources_unavailable');
 const seen=new Set(),unique=items.sort((a,b)=>b.date.localeCompare(a.date)).filter(x=>!seen.has(x.url)&&seen.add(x.url)).slice(0,150),next={at:Date.now(),items:await translateHeadlines(unique,env.AI),failed};
 if(env.WORLD_FEED)await env.WORLD_FEED.put('latest',JSON.stringify(next));
 cache=next;return next;
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
 if(now-cache.at>3*60*60*1000&&env.WORLD_FEED){try{const v=await env.WORLD_FEED.get('latest','json');if(v?.at&&Array.isArray(v.items)&&v.items.length)cache=v}catch(e){}}
 if(now-cache.at>3*60*60*1000){
  if(!refreshing)refreshing=(async()=>{
  try{await refreshFeed(env)}catch(e){}
  })().finally(()=>{refreshing=null});
  await refreshing;if(!cache.items.length)return response({error:'sources_unavailable',items:[],failed:cache.failed},502);
 }
 const items=viewer.manager?cache.items:cache.items.filter(x=>x.event);
 return response({updated:new Date(cache.at).toISOString(),failed:cache.failed,items:items.slice(0,60),scope:viewer.manager?'manager':'events'});
}
