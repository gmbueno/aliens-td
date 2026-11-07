import { skillRank } from '../data/skills.js';
export const targetModes=[
 {key:'first',name:'First',icon:'↗',hint:'Closest to the exit'},
 {key:'last',name:'Last',icon:'↙',hint:'Closest to the entrance'},
 {key:'strongest',name:'Strongest',icon:'◆',hint:'Most health + shield'},
 {key:'nearest',name:'Nearest',icon:'◎',hint:'Closest to this weapon'},
 {key:'fastest',name:'Fastest',icon:'ϟ',hint:'Highest current movement speed'},
 {key:'weakest',name:'Weakest',icon:'◇',hint:'Least health + shield'},
];
export const targetingUnlocked=(profile,key)=>targetModes.some(m=>m.key===key)&&(key!=='weakest'||skillRank(profile,'weakest')>0)&&(key!=='fastest'||skillRank(profile,'fastest')>0);
export function inWeaponRange(tower,enemy){
 if(tower.weapon?.minelayer){const tile=tower.tile||77,c=Math.round((enemy.x-tower.x)/tile),r=Math.round((enemy.y-tower.y)/tile);return Math.max(Math.abs(r),Math.abs(c))===1;}
 if(!tower.weapon?.directional)return Math.hypot(tower.tile?Math.round((enemy.x-tower.x)/tower.tile)*tower.tile:enemy.x-tower.x,tower.tile?Math.round((enemy.y-tower.y)/tower.tile)*tower.tile:enemy.y-tower.y)<=tower.range;
 const a=tower.angle||0,dx=enemy.x-tower.x,dy=enemy.y-tower.y,along=dx*Math.cos(a)+dy*Math.sin(a),across=-dx*Math.sin(a)+dy*Math.cos(a);
 return along>=0&&along<=tower.range&&Math.abs(across)<=(tower.weapon.laneWidth||77)/2;
}
export const enemySpeed=e=>(e.speed||0)*(e.raged?(e.rageMultiplier||1):1)*(e.onHaste?1.35:1)*(e.onIce&&!e.immuneSlow?.75:1)*(e.stunTimer>0?0:1)*(e.slowTimer>0&&!e.immuneSlow?1-(e.slowStrength||.25):1);
export function targetForTower(tower,enemies,focusId=null){
 const distance=e=>Math.hypot(e.x-tower.x,e.y-tower.y);
 const marked=enemies.find(e=>e.id===focusId&&e.life>0&&inWeaponRange(tower,e));if(marked)return marked;
 return enemies.filter(e=>e.life>0&&inWeaponRange(tower,e)).sort((a,b)=>{
  const health=e=>e.life+(e.shield||0);
  if(tower.targeting==='fastest')return enemySpeed(b)-enemySpeed(a);
  if(tower.targeting==='strongest')return health(b)-health(a);
  if(tower.targeting==='weakest')return health(a)-health(b);
  if(tower.targeting==='nearest')return distance(a)-distance(b);
  const delta=(b.pathOrder??(b.segment*1000+b.progress))-(a.pathOrder??(a.segment*1000+a.progress));
  return tower.targeting==='last'?-delta:delta;
 })[0]||null;
}
