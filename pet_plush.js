// Объёмные питомцы: единый послойный рендер для профиля, мира, игр и помощника.
// Настройки не изменяются. Особые цвета и выражения, для которых ещё нет объёмной основы,
// продолжают рисоваться исходным SVG вместе со всеми выданными вещами.
(function(){
const legacy=petSvg;
const ASSETS=Object.freeze({fox:'fox.webp',bear:'bear.webp',bunny:'bunny.webp',dragon:'dragon.webp',llama:'llama.webp',leopard:'leopard.webp',potato:'potato.webp',unicorn:'unicorn.webp',cat:'cat.webp'});
const COLORS=Object.freeze({fox:'c_or',bear:'c_br',bunny:'c_li',dragon:'c_gr',llama:'c_gi',leopard:'c_leopard',potato:'c_potato',unicorn:'c_unicorn',cat:'c_gy'});
const DEFAULTS=Object.freeze({ex:'x_n',gz:'c',hr:'r_0',pt:'p_0'});
const KEYS=new Set(['sp','bc','ec','ex','gz','mo','hr','hc','pt','ha','gl','nk','ch','bk','hd','cm']);
const configs=new Map();
let serial=0;
const frame='x="-55" y="40" width="430" height="394" preserveAspectRatio="xMidYMid meet" decoding="async"';
const asset=n=>'stickers/pet-art/'+n;
const img=(n,extra='')=>`<image class="pet-plush-img" href="${asset(n)}" ${frame} ${extra} onerror="petPlushError(this)"/>`;
function petPlushCanRender(c){
 if(!c||typeof c!=='object'||!Object.hasOwn(ASSETS,c.sp)||COLORS[c.sp]!==c.bc)return false;
 if(Object.keys(c).some(k=>!KEYS.has(k)&&c[k]))return false;
 if(!['e_br','e_gr'].includes(c.ec||'e_gr')||!['m_s','m_g'].includes(c.mo||'m_s'))return false;
 return Object.entries(DEFAULTS).every(([k,v])=>(c[k]??v)===v);
}
function petPlushReports(id){
 const states=[[0,'-85 0'],[3,'0 -22'],[6,'85 0']];
 return `<g class="plush-reports" aria-hidden="true">${states.map(([delay,pos],i)=>{
  const body=`<g transform="translate(104 145) scale(.35)">${img('burning-report.webp')}</g>`;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){const [x,y]=pos.split(' ').map(Number);return `<g transform="translate(${x} ${y-145})">${body}</g>`;}
  return `<g transform="translate(0 -145)"><g><animateMotion dur="9s" begin="-${delay}s" repeatCount="indefinite" path="M-85 0A85 24 0 1 1 85 0A85 24 0 1 1 -85 0"/>${body}</g></g>`;
 }).join('')}</g>`;
}
function petPlushError(el){
 const svg=el&&el.closest&&el.closest('svg[data-plush]');if(!svg)return;
 const saved=configs.get(svg.dataset.plush);if(!saved)return;
 configs.delete(svg.dataset.plush);svg.outerHTML=legacy(saved.c,saved.opt);
}
window.petPlushError=petPlushError;
function petPlushRender(c,opt={},fallback=legacy){
 if(!petPlushCanRender(c))return typeof fallback==='function'?fallback(c,opt):null;
 const vb=Array.isArray(opt.vb)&&opt.vb.length===4&&opt.vb.every(Number.isFinite)?opt.vb:PET_VB;
 const key='plush'+(++serial),id=key+'_';configs.set(key,{c:{...c},opt:{...opt}});if(configs.size>250)configs.delete(configs.keys().next().value);
 const bc=PET_BC.find(x=>x[0]===c.bc)||PET_BC[0],hex=/^#/.test(bc[3])?bc[3]:'#A8744A',D=pMix(hex,'#1a1030',.45),F=hex;
 const depth=`<filter id="${id}depth" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#291d35" flood-opacity=".22"/></filter>`;
 const paws=`<clipPath id="${id}paws"><path d="M61 225H99V328H61ZM227 225H267V328H227Z"/></clipPath>`;
 const horn=`<clipPath id="${id}horn"><path d="M148 40H176L194 124H126Z"/></clipPath>`;
 const gear=petGear(c),hand=petHandFit(c.hd,petHandItem(c.hd).replace('PETP',id+'p'));
 const back=petBack(c.bk,'plush',F,D,pMix(hex,'#ffffff',.3));
 const vector=(content)=>content?`<g filter="url(#${id}depth)">${content}</g>`:'';
 let chest=gear.ch,neck=gear.nk,glasses=gear.gl,hat=gear.hat;
 if(c.ch==='c_tee')chest=img('shirt.webp');
 if(c.nk==='n_scarf')neck=img('scarf.webp');
 if(c.gl==='g_round')glasses=img('glasses.webp');
 if(c.ha==='h_beanie')hat=img('beanie.webp');
 if(c.ha==='h_taxi')hat=img('taxi-cap.webp');
 if(c.ha==='h_reports')hat=petPlushReports(id);
 const frontPaws=c.ch==='c_tee'?img(ASSETS[c.sp],`clip-path="url(#${id}paws)"`):'';
 const frontHorn=c.sp==='unicorn'&&c.ha?img(ASSETS[c.sp],`clip-path="url(#${id}horn)"`):'';
 const body=vector(back)+img(ASSETS[c.sp])+vector(petBadgeName(chest,c,opt))+frontPaws+vector(neck)+vector(hand)+vector(glasses)+vector(hat)+frontHorn+(c.cm?`<g class="cmw"><image href="stickers/mascot-hi.webp" x="188" y="282" width="132" height="132"/></g>`:'');
 return `<svg data-plush="${key}" viewBox="${vb.join(' ')}" width="100%" height="100%" aria-hidden="true"><defs>${petDefs(id,hex,'#5A3A22','#8B5A2B')}${depth}${paws}${horn}</defs>${body}</svg>`;
}
window.petPlushCanRender=petPlushCanRender;
window.petPlushRender=petPlushRender;
petSvg=function(c,opt={}){return petPlushRender(c,opt,legacy)};
})();
