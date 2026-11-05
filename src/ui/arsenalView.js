import { attachments, blueprintsFor, blueprintOwned, arsenalChoice, applyArsenal, classUnlocked } from '../data/arsenal.js';
import { towerUpgradePathsFor } from '../systems/weaponStats.js';
export function nextArsenalUnlock(profile){
 if(typeof profile==='number')return 'Rare licenses: 8 SP · Epic plans: midpoint caches · Legendary plans: elite drops';
 const caches=Object.keys(profile.caches||{}).length;
 return `${profile.salvage||0} Salvage · ${profile.skillPoints} SP · ${caches}/18 caches recovered`;
}
export function renderArsenal(container,profile,weapons,key){
 const weapon=weapons.find(w=>w.key===key)||weapons[0],choice=arsenalChoice(profile,weapon.key),effective=applyArsenal(weapon,profile);
 const unlocked=classUnlocked(profile,key),heavy=['sniper','rocket_launcher'].includes(key),selected=profile.arsenal.heavy===key;
 container.innerHTML=`<div class="arsenal-wallet"><span><b>${profile.skillPoints}</b> SP <small>Research & Rare licenses</small></span><span><b>${profile.salvage}</b> SALVAGE <small>Persistent · buys attachments</small></span><p>Epic: midpoint caches · Legendary: elite drops or sector caches.<br>Juggernaut / Broodmother: 4%; bosses: 18%. Guaranteed within 20 eligible kills.</p></div>
 <nav class="arsenal-classes" aria-label="Weapon class">${weapons.map((w,i)=>`<button type="button" data-arsenal-class="${w.key}" class="${key===w.key?'selected':''}" aria-pressed="${key===w.key}"><span>${i>4?'HEAVY':`0${i+1}`}</span><img src="${arsenalChoice(profile,w.key).blueprint.art}" alt=""><strong>${w.nickname}</strong>${classUnlocked(profile,w.key)?'':'<small>Lv 4</small>'}</button>`).join('')}</nav><p class="arsenal-browse-hint">Swipe to browse weapon classes →</p>
 <section class="arsenal-detail"><div class="arsenal-title"><div><p>${heavy?'SLOT 06 / HEAVY':'FIELD LOADOUT'}</p><h3>${weapon.name}</h3><span>${weapon.role} · ${choice.blueprint.sockets} attachment slots</span></div>${heavy?`<button type="button" class="${selected?'secondary':'primary'}-button" data-equip-heavy="${key}" ${!unlocked||selected?'disabled':''}>${!unlocked?'Unlocks at Lv 4':selected?'Equipped in slot 6':'Equip in slot 6'}</button>`:''}</div>
 <p class="arsenal-guide">All towers aim and fire automatically. Models change the firing pattern, damage, range and magazine.</p>
 <div class="blueprint-grid">${blueprintsFor(key).map(t=>{
 const owned=blueprintOwned(profile,key,t.key),active=choice.blueprint.key===t.key,buy=!owned&&t.key==='rare';
 const action=owned?`data-blueprint="${t.key}"`:buy?`data-buy-blueprint="${t.key}"`:'';
 const disabled=!unlocked||(!owned&&(!buy||profile.skillPoints<8));
 return `<button class="blueprint ${active?'selected':''}" style="--rarity:${t.color}" type="button" ${action} aria-pressed="${active}" ${disabled?'disabled':''}><img src="${t.art}" alt=""><span>${t.name}</span><strong>${t.key.toUpperCase()} / ${t.mode.toUpperCase()}</strong><p>${t.description}</p><small>${!unlocked?'RPG class unlocks at Lv 4':active?'Equipped ✓':owned?'Equip model':buy?'Buy license · 8 SP':t.key==='epic'?'Find in a midpoint cache':'Elite drop / sector cache'}</small></button>`;
 }).join('')}</div>
 <div class="arsenal-statline"><span>Model <b>${effective.blueprint}</b></span><span>Mode <b>${effective.fireMode}</b></span><span>Damage <b>${effective.directDamage.toLocaleString('en-US')}${effective.pelletCount?' × '+effective.pelletCount+' pellets':''}</b></span><span>Rate <b>${effective.atkSpeed}/s${effective.burstCount?' × '+effective.burstCount:''}</b></span><span>Range <b>${effective.range}</b></span><span>Reload <b>${effective.reloadSpeed}s</b></span></div>
 <div class="attachment-heading"><h4>Attachments <span>${choice.attachments.length} / ${choice.blueprint.sockets}</span></h4><p>Buy once with Salvage. Swapping owned attachments is free.</p></div>
 <div class="attachment-grid">${attachments.map(a=>{
 const owned=profile.arsenal.unlockedAttachments.includes(a.key),active=choice.attachments.includes(a.key),full=!active&&choice.attachments.length>=choice.blueprint.sockets;
 return `<button class="attachment ${active?'selected':''}" type="button" ${owned?`data-attachment="${a.key}"`:`data-buy-attachment="${a.key}"`} aria-pressed="${active}" ${!unlocked||(owned?full||!choice.blueprint.sockets:profile.salvage<a.cost)?'disabled':''}><i>${a.icon}</i><strong>${a.name}</strong><p>${a.description}</p><small>${!owned?`Buy · ${a.cost} Salvage`:!choice.blueprint.sockets?'Needs Rare+ model':active?'Equipped · remove':full?'Slots full':'Add attachment'}</small></button>`;
 }).join('')}</div><p class="arsenal-paths">Battlefield upgrades: ${towerUpgradePathsFor(key).map(p=>`<strong>${p.name}</strong> — ${p.detail}`).join(' · ')}</p></section>`;
}
