import { classUnlocked, classRequirement, nextClassUnlock, weaponArt, loadoutKeys, loadoutCapacity, missionSlots, placementLimit, MAX_LOADOUT_SLOTS, STARTING_SLOTS } from '../data/arsenal.js';
import {bonusSlots,bonusSlotRules,campaignStars,classUnlockRules,ruleMet,missionLabelFromId} from '../data/progression.js';
export function nextArsenalUnlock(profile){
 const next=nextClassUnlock(profile);
 return `${loadoutCapacity(profile)} / ${MAX_LOADOUT_SLOTS} loadout slots · ${next?`${next.key.replaceAll('_',' ')}: ${next.requirement}`:'All categories discovered'}`;
}
export function renderProgressionGoals(profile,weapons){
 const rewards=Object.entries(classUnlockRules).filter(([key])=>!classUnlocked(profile,key)).map(([key,rule])=>({...rule,name:weapons.find(w=>w.key===key)?.name||key}));
 for(const rule of bonusSlotRules)if(!ruleMet(profile,rule))rewards.push({...rule,name:'+1 weapon slot'});
 for(const id of ['level_4','level_10'])if(!profile.slotRewards?.[id]&&!profile.missions?.[id]?.clears)rewards.push({kind:'mission',value:id,name:'+1 weapon slot'});
 return `<div class="progression-goals" aria-label="Progression rewards">${['level','mission','stars'].map(kind=>{
  const list=rewards.filter(r=>r.kind===kind||(kind==='mission'&&r.kind==='clears')).sort((a,b)=>Number(String(a.value).replace('level_',''))-Number(String(b.value).replace('level_','')));
  const next=list[0],names=next?[...new Set(list.filter(r=>r.kind===next.kind&&r.value===next.value).map(r=>r.name))].join(' · '):'All rewards earned';
  const title=kind==='level'?`COMMANDER · LV ${profile.level}`:kind==='stars'?`CAMPAIGN · ${campaignStars(profile)} ★`:'MISSION REWARDS';
  const goal=!next?'Complete':kind==='level'?`Level ${next.value}`:kind==='stars'?`${next.value} stars`:next.kind==='clears'?'First victory':`Mission ${missionLabelFromId(next.value)}`;
  return `<div class="progression-goal" data-progression="${kind}"><span>${title}</span><strong>${goal}</strong><small>${names}</small></div>`;
 }).join('')}</div>`;
}
export function renderArsenal(container,profile,weapons,key){
 const keys=loadoutKeys(profile),capacity=loadoutCapacity(profile),slot=Math.min(Number(container.dataset.slot)||0,capacity-1);
 container.dataset.slot=slot;
 container.innerHTML=`<div class="loadout-summary"><span><b>${capacity}</b> / ${MAX_LOADOUT_SLOTS} SLOTS</span><p>${STARTING_SLOTS} starting · ${profile.skills.loadoutSlots||0} training · ${missionSlots(profile)} missions · ${bonusSlots(profile)} level / stars<br>Up to <strong>${placementLimit(profile)} of each category</strong></p></div>
 <div class="loadout-slots" role="group" aria-label="Loadout slots">${Array.from({length:MAX_LOADOUT_SLOTS},(_,i)=>{
 const w=weapons.find(w=>w.key===keys[i]),open=i<capacity;
 return `<button type="button" data-loadout-slot="${i}" class="${i===slot?'selected':''} ${open?'':'slot-locked'}" ${open?'':'disabled'} aria-pressed="${i===slot}"><small>SLOT ${String(i+1).padStart(2,'0')}</small>${w?`<img src="${weaponArt(w.key)}" alt=""><strong>${w.name}</strong>`:`<span>${open?'+':'▣'}</span><strong>${open?'Discover a category':'Unlock a slot'}</strong>`}</button>`;
 }).join('')}</div>${renderProgressionGoals(profile,weapons)}
 <div class="category-pick-heading"><p class="eyebrow">CHOOSE CATEGORY / SLOT ${String(slot+1).padStart(2,'0')}</p><p>Each locked category shows its unlock requirement.</p></div>
 <div class="category-grid">${weapons.map(w=>{
 const unlocked=classUnlocked(profile,w.key),index=keys.indexOf(w.key),active=index===slot;
 return `<button type="button" data-equip-category="${w.key}" class="category-card ${active?'selected':''} ${unlocked?'':'locked'}" ${!unlocked||active||(index>=0&&!keys[slot])?'disabled':''} aria-pressed="${active}"><img src="${weaponArt(w.key)}" alt=""><div><h3>${w.name}</h3><p>${w.role}</p><small>${active?'✓ EQUIPPED':index>=0?`${keys[slot]?'SWAP WITH':'IN'} SLOT ${index+1}`:unlocked?'EQUIP CATEGORY':classRequirement(w.key)}</small></div></button>`;
 }).join('')}</div><p class="loadout-note">Reach 10 slots: 3 starting + 2 talents + missions 1-4 and 2-4 + Commander level 8 + 12 and 30 campaign stars. Stars count your best result on each mission.</p>`;
}
