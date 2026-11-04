// Объёмные питомцы: единый послойный рендер для профиля, мира, игр и помощника.
// Растровая основа сохраняет объём, а цвет, лицо, причёску и вещи накладываются отдельно.
(function(){
const legacy=petSvg;
const ASSETS=Object.freeze({fox:'fox.webp',bear:'bear.webp',bunny:'bunny.webp',dragon:'dragon.webp',llama:'llama.webp',leopard:'leopard.webp',potato:'potato.webp',unicorn:'unicorn.webp',cat:'cat.webp'});
const COLORS=Object.freeze({fox:'c_or',bear:'c_br',bunny:'c_li',dragon:'c_gr',llama:'c_gi',leopard:'c_leopard',potato:'c_potato',unicorn:'c_unicorn',cat:'c_gy'});
const KEYS=new Set(['sp','bc','ec','ex','gz','mo','hr','hc','pt','ha','gl','nk','ch','bk','hd','cm']);
const configs=new Map();
let serial=0;
const frame='x="-55" y="40" width="430" height="394" preserveAspectRatio="xMidYMid meet" decoding="async"';
const asset=n=>'stickers/pet-art/'+n;
const img=(n,extra='')=>`<image class="pet-plush-img" href="${asset(n)}" ${frame} ${extra} onerror="petPlushError(this)"/>`;
function petPlushCanRender(c){
 if(!c||typeof c!=='object'||!Object.hasOwn(ASSETS,c.sp)||c.ha==='h_shark')return false;
 return !Object.keys(c).some(k=>!KEYS.has(k)&&c[k]);
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
 const bc=PET_BC.find(x=>x[0]===c.bc)||PET_BC[0],bcv=bc[3],solid=/^#/.test(bcv),hex=solid?bcv:PET_GRAD[bcv]?.base||(bcv==='gold'?'#EDBE46':bcv==='night'?'#2F3F9A':'#9A7BFF'),D=pMix(hex,'#1a1030',.45),F=`url(#${id}b)`;
 const hcv=(PET_HC.find(x=>x[0]===c.hc)||PET_HC[0])[3],ecv=(PET_EC.find(x=>x[0]===c.ec)||PET_EC[0])[3];
 const depth=`<filter id="${id}depth" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#291d35" flood-opacity=".22"/></filter>`;
 const blur=`<filter id="${id}blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="11"/></filter>`;
 const tintMask=`<mask id="${id}tintmask" maskUnits="userSpaceOnUse" x="-55" y="40" width="430" height="394" style="mask-type:alpha">${img(ASSETS[c.sp])}</mask>`;
 const paws=`<clipPath id="${id}paws"><path d="M61 225H99V328H61ZM227 225H267V328H227Z"/></clipPath>`;
 const horn=`<clipPath id="${id}horn"><path d="M148 40H176L194 124H126Z"/></clipPath>`;
 const eyesClip=`<clipPath id="${id}eyes"><ellipse cx="118" cy="148" rx="39" ry="43"/><ellipse cx="202" cy="148" rx="39" ry="43"/></clipPath>`,mouthClip=`<clipPath id="${id}mouth"><ellipse cx="160" cy="211" rx="55" ry="31"/></clipPath>`;
 const tint=COLORS[c.sp]===c.bc?'':`<rect x="-55" y="40" width="430" height="394" fill="${F}" mask="url(#${id}tintmask)" style="mix-blend-mode:color"/>`;
 const plushBase=()=>img(ASSETS[c.sp])+tint;
 const customEyes=c.ex!=='x_n'||c.gz!=='c'||!['e_br','e_gr'].includes(c.ec),customMouth=!['m_s','m_g'].includes(c.mo);
 const face=(customEyes?`<g clip-path="url(#${id}eyes)">${img(ASSETS[c.sp],`filter="url(#${id}blur)"`)}</g><g class="pey">${petEye(118,148,c.ex,id,c.gz,0)}${petEye(202,148,c.ex,id,c.gz,1)}</g>`:'')+(customMouth?`<g clip-path="url(#${id}mouth)">${img(ASSETS[c.sp],`filter="url(#${id}blur)"`)}</g>${petMouth(c.mo)}`:'');
 let pat='';if(c.pt==='p_h')pat=petHrt(160,334,2.4,'#FF7BA5');if(c.pt==='p_s')pat=petStar(160,334,1.9,'#FFD54A');
 if(c.pt==='p_d')pat=[[150,80,6],[176,88,8],[128,92,5],[212,94,5],[118,284,9],[204,292,11],[134,372,8],[190,366,6],[222,330,7]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${pMix(hex,'#ffffff',.42)}" opacity=".85"/>`).join('');
 if(c.pt==='p_z')pat=`<path d="M142 68Q140 90 146 104M160 62V98M178 68Q180 90 174 104M98 290Q118 296 124 316M96 330Q116 334 122 352M222 290Q202 296 196 316M224 330Q204 334 198 352" stroke="${D}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>`;
 const gear=petGear(c),hand=petHandFit(c.hd,petHandItem(c.hd).replace('PETP',id+'p'));
 const back=petBack(c.bk,'plush',F,D,pMix(hex,'#ffffff',.3)),vector=content=>content?`<g filter="url(#${id}depth)">${content}</g>`:'';
 let chest=gear.ch,neck=gear.nk,glasses=gear.gl,hat=gear.hat;
 if(c.ch==='c_tee')chest=img('shirt.webp');if(c.nk==='n_scarf')neck=img('scarf.webp');if(c.gl==='g_round')glasses=img('glasses.webp');if(c.ha==='h_beanie')hat=img('beanie.webp');if(c.ha==='h_taxi')hat=img('taxi-cap.webp');if(c.ha==='h_reports')hat=petPlushReports(id);
 const frontPaws=c.ch==='c_tee'?`<g clip-path="url(#${id}paws)">${plushBase()}</g>`:'',frontHorn=c.sp==='unicorn'&&c.ha?`<g clip-path="url(#${id}horn)">${plushBase()}</g>`:'';
 const body=vector(back)+plushBase()+face+vector(pat)+vector(petHair(c.hr,F,pMix(hcv,'#000000',.45),id))+vector(petBadgeName(chest,c,opt))+frontPaws+vector(neck)+vector(hand)+vector(glasses)+vector(hat)+frontHorn+(c.cm?`<g class="cmw"><image href="stickers/mascot-hi.webp" x="188" y="282" width="132" height="132"/></g>`:'');
 return `<svg data-plush="${key}" viewBox="${vb.join(' ')}" width="100%" height="100%" aria-hidden="true"><defs>${petDefs(id,bcv,hcv,ecv)}${depth}${blur}${tintMask}${paws}${horn}${eyesClip}${mouthClip}</defs>${body}</svg>`;
}
window.petPlushCanRender=petPlushCanRender;
window.petPlushRender=petPlushRender;
petSvg=function(c,opt={}){return petPlushRender(c,opt,legacy)};
})();
