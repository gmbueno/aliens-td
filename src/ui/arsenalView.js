import { attachments, blueprintsFor, arsenalChoice, applyArsenal, classUnlocked } from '../data/arsenal.js';
import { towerUpgradePathsFor } from '../systems/weaponStats.js';

const trait = {
 common: 'Reliable service model. No attachment slots.',
 rare: '+16% fire rate · 8% faster reload · −6% damage · 1 slot',
 epic: '+22% damage · −6% fire rate · 1 slot',
 legendary: '+10% damage & range · 8% faster reload · 2 slots',
};
export function nextArsenalUnlock(level) {
 const goals=[{level:3,text:'Rare models + incendiary rounds'},{level:4,text:'RPG heavy weapon + cryo rounds'},{level:6,text:'Epic models + concussive rounds'},{level:8,text:'Blast rounds'},{level:10,text:'Legendary models + 2 attachment slots'}];
 const next=goals.find(g=>g.level>level);
 return next?`Next: Lv ${next.level} · ${next.text}`:'All models unlocked · experiment with your loadout';
}
export function renderArsenal(container,profile,weapons,key) {
 const weapon=weapons.find(w=>w.key===key)||weapons[0], choice=arsenalChoice(profile,weapon.key);
 const unlocked=classUnlocked(profile,weapon.key), effective=applyArsenal(weapon,profile);
 const isHeavy=['sniper','rocket_launcher'].includes(key), selected=profile.arsenal.heavy===key;
 container.innerHTML=`
 <nav class="arsenal-classes" aria-label="Weapon class">${weapons.map((w,i)=>`<button type="button" data-arsenal-class="${w.key}" class="${key===w.key?'selected':''}" aria-pressed="${key===w.key}"><span>${i>4?'HEAVY':`0${i+1}`}</span><img src="${w.hudAsset}" alt=""><strong>${w.nickname}</strong>${classUnlocked(profile,w.key)?'':`<small>Lv 4</small>`}</button>`).join('')}</nav><p class="arsenal-browse-hint">Swipe to browse all weapon classes →</p>
 <section class="arsenal-detail">
 <div class="arsenal-title"><div><p>${isHeavy?'SLOT 06 / HEAVY':'FIELD LOADOUT'}</p><h3>${weapon.name}</h3><span>${weapon.role}</span></div>${isHeavy?`<button type="button" class="${selected?'secondary':'primary'}-button" data-equip-heavy="${key}" ${!unlocked||selected?'disabled':''}>${!unlocked?'Unlocks at Lv 4':selected?'Equipped in slot 6':'Equip in slot 6'}</button>`:''}</div>
 <p class="arsenal-guide">${weapon.description}</p>
 <div class="blueprint-grid">${blueprintsFor(key).map(t=>{
 const locked=!unlocked||profile.level<t.level,active=choice.blueprint.key===t.key;
 return `<button class="blueprint ${active?'selected':''}" style="--rarity:${t.color}" type="button" data-blueprint="${t.key}" aria-pressed="${active}" ${locked?'disabled':''}><span>${t.name===t.key?t.key:t.name}</span><strong>${t.key.toUpperCase()}</strong><p>${trait[t.key]}</p><small>${locked?`Unlock at Lv ${Math.max(t.level,key==='rocket_launcher'?4:1)}`:active?'Equipped ✓':'Equip model'}</small></button>`;
 }).join('')}</div>
 <div class="arsenal-statline"><span>Damage <b>${effective.directDamage.toLocaleString('en-US')}</b></span><span>Rate <b>${effective.atkSpeed}/s</b></span><span>Range <b>${effective.range}</b></span><span>Reload <b>${effective.reloadSpeed}s</b></span></div>
 <div class="attachment-heading"><h4>Attachments <span>${choice.attachments.length} / ${choice.blueprint.sockets}</span></h4><p>${choice.blueprint.sockets?'Free swaps. Remove one to free a full slot.':'Unlock a Rare model at Lv 3 to add an attachment.'}</p></div>
 <div class="attachment-grid">${attachments.map(a=>{
 const active=choice.attachments.includes(a.key), locked=!unlocked||profile.level<a.level||!choice.blueprint.sockets;
 const full=!active&&choice.attachments.length>=choice.blueprint.sockets;
 return `<button class="attachment ${active?'selected':''}" type="button" data-attachment="${a.key}" aria-pressed="${active}" ${locked||full?'disabled':''}><i>${a.icon}</i><strong>${a.name}</strong><p>${a.description}</p><small>${profile.level<a.level?`Lv ${a.level}`:!choice.blueprint.sockets?'Needs Rare+ model':active?'Equipped · click to remove':full?'Slots full':'Add attachment'}</small></button>`;
 }).join('')}</div>
 <p class="arsenal-paths">Battlefield upgrades: ${towerUpgradePathsFor(key).map(p=>`<strong>${p.name}</strong> — ${p.detail}`).join(' · ')}</p>
 </section>`;
}
