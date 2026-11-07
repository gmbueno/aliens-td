import { skillRank } from '../data/skills.js';
export const targetModes=[
 {key:'first',name:'First',icon:'↗',hint:'Closest to the exit'},
 {key:'last',name:'Last',icon:'↙',hint:'Closest to the entrance'},
 {key:'strongest',name:'Strongest',icon:'◆',hint:'Most health + shield'},
 {key:'nearest',name:'Nearest',icon:'◎',hint:'Closest to this weapon'},
 {key:'weakest',name:'Weakest',icon:'◇',hint:'Least health + shield'},
];
export const targetingUnlocked=(profile,key)=>targetModes.some(m=>m.key===key)&&(key!=='weakest'||skillRank(profile,'weakest')>0);
export function inWeaponRange(tower,enemy){
 if(!tower.weapon?.directional)return Math.hypot(enemy.x-tower.x,enemy.y-tower.y)<=tower.range;
 const a=tower.angle||0,dx=enemy.x-tower.x,dy=enemy.y-tower.y,along=dx*Math.cos(a)+dy*Math.sin(a),across=-dx*Math.sin(a)+dy*Math.cos(a);
 return along>=0&&along<=tower.range&&Math.abs(across)<=(tower.weapon.laneWidth||77)/2;
}
export function targetForTower(tower,enemies){
 const distance=e=>Math.hypot(e.x-tower.x,e.y-tower.y);
 return enemies.filter(e=>e.life>0&&inWeaponRange(tower,e)).sort((a,b)=>{
  const health=e=>e.life+(e.shield||0);
  if(tower.targeting==='strongest')return health(b)-health(a);
  if(tower.targeting==='weakest')return health(a)-health(b);
  if(tower.targeting==='nearest')return distance(a)-distance(b);
  const delta=(b.segment*1000+b.progress)-(a.segment*1000+a.progress);
  return tower.targeting==='last'?-delta:delta;
 })[0]||null;
}
