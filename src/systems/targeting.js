import { skillRank } from '../data/skills.js';
export const targetModes=[
 {key:'first',name:'First',icon:'↗',hint:'Closest to the exit'},
 {key:'last',name:'Last',icon:'↙',hint:'Closest to the entrance'},
 {key:'strongest',name:'Strongest',icon:'◆',hint:'Most health + shield'},
 {key:'nearest',name:'Nearest',icon:'◎',hint:'Closest to this weapon'},
 {key:'weakest',name:'Weakest',icon:'◇',hint:'Least health + shield'},
];
export const targetingUnlocked=(profile,key)=>targetModes.some(m=>m.key===key)&&(key!=='weakest'||skillRank(profile,'weakest')>0);
export function targetForTower(tower,enemies){
 const distance=e=>Math.hypot(e.x-tower.x,e.y-tower.y);
 return enemies.filter(e=>e.life>0&&distance(e)<=tower.range).sort((a,b)=>{
  const health=e=>e.life+(e.shield||0);
  if(tower.targeting==='strongest')return health(b)-health(a);
  if(tower.targeting==='weakest')return health(a)-health(b);
  if(tower.targeting==='nearest')return distance(a)-distance(b);
  const delta=(b.segment*1000+b.progress)-(a.segment*1000+a.progress);
  return tower.targeting==='last'?-delta:delta;
 })[0]||null;
}
