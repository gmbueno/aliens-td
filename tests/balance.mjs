import { pathToFileURL } from 'node:url';
import { createInitialState, stepState, placeTower, launchWave, upgradeTower } from '../src/game.js';
import { levels } from '../src/data/levels/index.js';
import { equippedWeapons, classUnlocked } from '../src/data/arsenal.js';
import { weapons } from '../src/data/weapons.js';
import { normalizeProfile } from '../src/systems/profile.js';
import { applySkillBonuses, towerUpgradeCost } from '../src/systems/weaponStats.js';

globalThis.localStorage = { setItem() {}, getItem() { return null; } };

export function makeProfile(ranks = 0) {
  return normalizeProfile({ level: 1 + ranks * 2, skills: { damage: ranks, range: ranks, fireRate: ranks, reload: ranks }, settings: { muted: true } });
}

// A repeatable, modest strategy: build at covered bends; reinvest between waves.
// No active abilities and no purchases during a wave. Not a claim of optimal play.
export function invest(state) {
  let attempts = 0;
  while (state.gold >= 45 && attempts++ < 60) {
    let best = null;
    const path = state.path;
    const coverage = point => state.towers.reduce((sum, t) => sum + (Math.hypot(t.x-point.x,t.y-point.y) <= t.range ? t.weapon.directDamage * t.weapon.atkSpeed * (t.weapon.pelletCount || 1) / (1+t.weapon.atkSpeed*t.weapon.reloadSpeed/t.weapon.capacity) : 0), 0);
    const importance = path.map(point => 1 / (1 + coverage(point) / 1600));
    for (const weapon of equippedWeapons(weapons,state.arsenalProfile)) {
      if (!classUnlocked(state.arsenalProfile,weapon.key) || weapon.price > state.gold) continue;
      const effective = applySkillBonuses(weapon, state.profile);
      for(let row=0;row<state.level.rows;row++) for(let col=0;col<state.level.cols;col++) {
        const key=`${row}:${col}`;
        if(state.tileSets.path.has(key)||state.tileSets.blockers.has(key)||state.towers.some(t=>t.row===row&&t.col===col)||state.tileSets.water.has(key)||(!state.cache.opened&&state.cache.row===row&&state.cache.col===col)||(state.drone?.base.row===row&&state.drone.base.col===col))continue;
        const point={x:state.board.x+(col+.5)*state.board.tile,y:state.board.y+(row+.5)*state.board.tile};
        const pad=state.level.pads.find(p=>p.row===row&&p.col===col);
        const range=effective.range*(pad?.type==='range'?1.18:1);
        const covered=path.reduce((sum,p,i)=>sum+(Math.hypot(point.x-p.x,point.y-p.y)<range?importance[i]:0),0);
        const dps=effective.directDamage*effective.atkSpeed*(effective.pelletCount||1)/(1+effective.atkSpeed*effective.reloadSpeed/effective.capacity);
        const score=covered*dps/weapon.price*(pad?.type==='power'?1.15:1)*(weapon.armorPierce?1.12:1);
        if(!best||score>best.score) best={score,weapon,row,col};
      }
    }
    for(const tower of state.towers) for(const key of ['power','tactical']) {
      const cost=towerUpgradeCost(tower,key);
      if(cost>state.gold||tower.upgrades[key]>=3||tower.upgrades.power+tower.upgrades.tactical>=4)continue;
      const covered=path.reduce((sum,p,i)=>sum+(Math.hypot(tower.x-p.x,tower.y-p.y)<tower.range?importance[i]:0),0);
      const dps=tower.weapon.directDamage*tower.weapon.atkSpeed*(tower.weapon.pelletCount||1)/(1+tower.weapon.atkSpeed*tower.weapon.reloadSpeed/tower.weapon.capacity);
      const gain=key==='power'?.4/(1+tower.upgrades.power*.4):.24;
      const score=covered*dps*gain/cost;
      if(!best||score>best.score) best={score,tower,key};
    }
    if(!best)break;
    if(best.tower)upgradeTower(state,best.tower,best.key);
    else { const tower=placeTower(state,best.weapon.key,best.row,best.col); if(!tower)throw Error('Invalid policy placement'); if(tower.weapon.key==='sniper'||tower.weapon.key==='magnum')tower.targeting='strongest'; }
  }
}

export function simulate(level, ranks, investDuringCombat = false) {
  const profile=makeProfile(ranks);
  profile.missions=Object.fromEntries(levels.slice(0,levels.indexOf(level)).map(l=>[l.id,{clears:1,stars:3,bestLives:l.lives}]));
  const state=createInitialState(level,profile,{width:1280,height:720});
  let frames=0;
  while(!state.result && frames<60*1200) {
    if(state.phase==='prepare') {
      invest(state);
      const bossWave = state.level.waves[state.waveIndex].spawns.some(spawn => ['alien_boss', 'alien_saucer'].includes(spawn.enemy));
      state.towers.forEach(tower => { tower.targeting = bossWave && ['sniper', 'magnum'].includes(tower.weapon.key) ? 'strongest' : 'first'; });
      launchWave(state);
    }
    if(investDuringCombat && frames % 180 === 0 && state.gold >= 70) invest(state);
    stepState(state,1/60); frames++;
  }
  return {mission:`${level.sector}-${level.stage}`,ranks,result:state.result,lives:state.lives,wave:state.waveIndex+1,gold:state.gold,towers:state.towers.length,time:Math.round(frames/60),xp:state.runXp};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results=[];
  for(const level of levels) {
    results.push(simulate(level,0));
    results.push(simulate(level,Math.min(5,Math.max(1,Math.ceil((level.sector*6+level.stage-6)/4)))));
  }
  console.table(results);
}
