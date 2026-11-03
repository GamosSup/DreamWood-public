// Only the scheduled workflow for this repository can refresh the public feed.
import {refreshFeed} from './world.js';
const ISSUER='https://token.actions.githubusercontent.com';
const AUDIENCE='dreamwood-world-refresh';
const REPOSITORY='GamosSup/DreamWood-public';
const b64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
async function verified(request){
 const m=(request.headers.get('authorization')||'').match(/^Bearer ([A-Za-z0-9_.-]{1,12000})$/);if(!m)return false;
 const parts=m[1].split('.');if(parts.length!==3)return false;
 const header=JSON.parse(new TextDecoder().decode(b64(parts[0]))),claims=JSON.parse(new TextDecoder().decode(b64(parts[1]))),now=Math.floor(Date.now()/1000);
 if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==ISSUER||claims.aud!==AUDIENCE||claims.repository!==REPOSITORY||claims.ref!=='refs/heads/main'||claims.workflow!=='Обновление мировой сводки'||!['schedule','workflow_dispatch'].includes(claims.event_name)||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.nbf)||claims.nbf>now+60)return false;
 const r=await fetch(ISSUER+'/.well-known/jwks',{signal:AbortSignal.timeout(5000)});if(!r.ok)return false;const keys=await r.json(),jwk=keys.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.use==='sig');if(!jwk)return false;
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
}
export async function onRequestPost({request,env}){
 try{if(!await verified(request))return new Response('Forbidden',{status:403});if(!env?.AI||!env?.WORLD_FEED)return new Response('Feed bindings unavailable',{status:503});const feed=await refreshFeed(env);return Response.json({updated:new Date(feed.at).toISOString(),count:feed.items.length,failed:feed.failed},{headers:{'cache-control':'no-store'}})}catch(e){return new Response('Refresh unavailable',{status:503,headers:{'cache-control':'no-store'}})}
}
