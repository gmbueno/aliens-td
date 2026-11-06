import { classUnlocked, classRequirement, nextClassUnlock, campaignClears, weaponArt, loadoutKeys, loadoutCapacity, cacheSlots, placementLimit } from '../data/arsenal.js';
export function nextArsenalUnlock(profile){
 const next=nextClassUnlock(profile);
 return `${loadoutCapacity(profile)} / 6 loadout slots · ${next?`${next[0].replaceAll('_',' ')} at ${next[1]} mission clears`:'All categories discovered'}`;
}
export function renderArsenal(container,profile,weapons,key){
 const keys=loadoutKeys(profile),capacity=loadoutCapacity(profile),slot=Math.min(Number(container.dataset.slot)||0,capacity-1);
 container.dataset.slot=slot;
 container.innerHTML=`<div class="loadout-summary"><span><b>${capacity}</b> / 6 SLOTS</span><p>3 starting · ${profile.skills.loadoutSlots||0} from research · ${cacheSlots(profile)} from caches<br>Deploy up to <strong>${placementLimit(profile)} of each category</strong>. Each category has one weapon.</p></div>
 <div class="loadout-slots" role="group" aria-label="Loadout slots">${Array.from({length:6},(_,i)=>{
 const w=weapons.find(w=>w.key===keys[i]),open=i<capacity;
 return `<button type="button" data-loadout-slot="${i}" class="${i===slot?'selected':''} ${open?'':'slot-locked'}" ${open?'':'disabled'} aria-pressed="${i===slot}"><small>SLOT 0${i+1}</small>${w?`<img src="${weaponArt(w.key)}" alt=""><strong>${w.name}</strong>`:`<span>${open?'+':'▣'}</span><strong>${open?'Discover a category':'Unlock a slot'}</strong>`}</button>`;
 }).join('')}</div>
 <div class="category-pick-heading"><p class="eyebrow">CHOOSE CATEGORY / SLOT 0${slot+1}</p><p>Unlocked by different mission clears. Select a category to equip it.</p></div>
 <div class="category-grid">${weapons.map(w=>{
 const unlocked=classUnlocked(profile,w.key),index=keys.indexOf(w.key),active=index===slot;
 return `<button type="button" data-equip-category="${w.key}" class="category-card ${active?'selected':''} ${unlocked?'':'locked'}" ${!unlocked||active||(index>=0&&!keys[slot])?'disabled':''} aria-pressed="${active}"><img src="${weaponArt(w.key)}" alt=""><div><h3>${w.name}</h3><p>${w.role}</p><small>${active?'✓ EQUIPPED':index>=0?`${keys[slot]?'SWAP WITH':'IN'} SLOT ${index+1}`:unlocked?'EQUIP CATEGORY':classRequirement(w.key)}</small></div></button>`;
 }).join('')}</div><p class="loadout-note">Extra slots: Commander → Deployment, or midpoint caches in missions <strong>1-4 and 2-4</strong>. Maximum six. Weapon damage, reload and other upgrades are bought during the mission.</p>`;
}
