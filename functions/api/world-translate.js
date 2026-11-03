import {verified} from './world-refresh.js';
import {translateFeed} from './world.js';
export async function onRequestPost({request,env}){
 try{
  if(!await verified(request))return new Response('Forbidden',{status:403});
  if(!env?.AI||!env?.WORLD_FEED)return new Response('Feed bindings unavailable',{status:503});
  const body=await request.json(),offset=body?.offset,run=body?.run;if(!Number.isInteger(offset)||offset<0||offset>150||offset%15!==0||typeof run!=='string'||! /^[0-9a-f-]{36}$/i.test(run))return new Response('Invalid batch',{status:400});
  const result=await translateFeed(env,run,offset);return Response.json(result,{headers:{'cache-control':'no-store'}});
 }catch(e){return new Response('Translation unavailable',{status:503,headers:{'cache-control':'no-store'}})}
}
