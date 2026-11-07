import {levels} from '../src/data/levels/index.js';
// Explicit campaign progress for mechanic tests that need advanced weapons.
// Fresh-player and sequential-campaign tests intentionally do not use this.
export const missionRecords = (count=12,start=2) => Object.fromEntries(
  Array.from({length:count},(_,i)=>[`level_${i+start}`,{clears:1,stars:3,bestLives:18}])
);

// A legal ordinary tile for placement tests; never depend on a gameplay bonus.
export function placementTile(levelOrId=levels[0]){
 const level=typeof levelOrId==='string'?levels.find(l=>l.id===levelOrId):levelOrId;
 const candidates=[{row:5,col:3}];
 for(let row=0;row<level.rows;row++)for(let col=0;col<level.cols;col++)candidates.push({row,col});
 return candidates.find(t=>t.row<level.rows&&t.col<level.cols&&![...level.track,...level.blockers,...(level.water||[])].some(p=>p.row===t.row&&p.col===t.col));
}
