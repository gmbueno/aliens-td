import {loadoutKeys} from '../data/arsenal.js';
// Seeded per mission/wave: finite work and memory, with no last round.
export function endlessWave(level,round){
 let seed=(Number(level.id.split('_')[1])*65537+round*7919)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const roster=[...new Set(level.waves.flatMap(w=>w.spawns.map(s=>s.enemy)))];
 if(round>=3)roster.push('alien_tank');if(round>=6)roster.push('alien_steadfast','alien_rager');if(round>=9)roster.push('alien_broodmother','alien_medic');
 const count=Math.min(180,18+round*4),gap=Math.max(.16,.7-round*.012),last=level.waves.at(-1);
 return {id:level.waves.length+round,name:`Free play ${round}`,healthScale:(last.healthScale||1)*Math.pow(1.13,Math.min(round,160))*(1+Math.max(0,round-160)*.2),reward:Math.round(100+round*18),spawns:Array.from({length:count},(_,i)=>({enemy:round%5===0&&i===count-1?'alien_boss':roster[Math.floor(random()*roster.length)],at:.5+i*gap}))};
}
export function currentWave(state){return state.freeplay?state.endlessWave:state.level.waves[state.waveIndex];}
export function beginFreeplay(state){
 if(state.result!=='victory'||state.freeplay)return false;
 state.arsenalProfile.missions=JSON.parse(JSON.stringify(state.profile.missions));
 state.arsenalProfile.slotRewards={...state.profile.slotRewards};
 state.arsenalProfile.arsenal={loadout:loadoutKeys(state.arsenalProfile)};
 state.freeplay=true;state.endlessRound=1;state.endlessWave=endlessWave(state.level,1);state.totalEnemies+=state.endlessWave.spawns.length;
 state.reward=null;state.result=null;state.resultShown=false;state.isPaused=false;state.phase='prepare';state.waveDelay=8;state.waveTime=0;state.spawnedInWave=new Set();return true;
}
