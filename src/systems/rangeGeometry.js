import {inWeaponRange} from './targeting.js';
export function weaponRangeCells(tower){
 const tile=tower.tile||77,n=tower.weapon?.minelayer?1:Math.ceil(tower.range/tile),cells=[];
 for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++)if(inWeaponRange(tower,{x:tower.x+col*tile,y:tower.y+row*tile}))cells.push({row,col});
 return cells;
}
// Only edges with no covered neighbor belong to the perimeter; no internal grid.
export function rangePerimeter(cells){
 const covered=new Set(cells.map(c=>`${c.row},${c.col}`)),edges=[];
 for(const {row,col} of cells){
  if(!covered.has(`${row-1},${col}`))edges.push([col-.5,row-.5,col+.5,row-.5]);
  if(!covered.has(`${row+1},${col}`))edges.push([col+.5,row+.5,col-.5,row+.5]);
  if(!covered.has(`${row},${col-1}`))edges.push([col-.5,row+.5,col-.5,row-.5]);
  if(!covered.has(`${row},${col+1}`))edges.push([col+.5,row-.5,col+.5,row+.5]);
 }
 return edges;
}
