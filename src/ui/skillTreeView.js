import {loadoutCapacity,MAX_LOADOUT_SLOTS} from '../data/arsenal.js';
import { equippedPowerKeys, activeAbilities, activeAbilityStats, activeUnlocked, canBuySkill, prerequisiteMet, skillRank, skillTree, spentSkillPoints } from '../data/skills.js';

const branches={armament:{name:'Training',color:'#ffbb57'},logistics:{name:'Deployment',color:'#49d9ee'},support:{name:'Support',color:'#bca3ff'},artillery:{name:'Artillery',color:'#f2c478'},napalm:{name:'Napalm',color:'#ff9970'},stasis:{name:'Time Stop',color:'#ddbd73'}};
const paths={
 locked:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Zm7 4v3',
 damage:'M5 12h14M12 5v14M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
 fireRate:'m5 20 3-7h4l-3 7m2-9 3-7h4l-3 7m1 9 3-7h4l-3 7',
 reload:'M19 7a8 8 0 1 0 1 8M19 2v6h-6',range:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
 salvage:'m4 20 16-16M4 4l4 1 2 4-3 3-4-2-1-4m13 9 6 6-3 3-6-6',
 supplies:'M3 7h18v14H3ZM7 7V3h10v4M3 12h18m-12 0v4h6v-4',
 pontoons:'M2 18q3-4 6 0t6 0 6 0M4 12h16l-3 5H7ZM7 12V6h10v6',
 mines:'M12 7a6 6 0 1 0 0 12 6 6 0 0 0 0-12M12 2v3m-8 0 3 3m13-3-3 3M2 13h2m16 0h2M5 21l2-3m12 3-2-3',
 drone:'M7 7l10 10M17 7 7 17M5 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6m14 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6m14 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
 powerSlots:'M3 4h7v16H3Zm11 0h7v16h-7M6 8v8m11-8v8',
 chronoBreak:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 4v7l5 3',
 artillery:'M3 19h18M5 16Q7 2 19 6m-3-4 4 4-5 2M4 21v-4m15 4v-4',
 napalm:'M13 2c2 7 8 9 7 14a8 8 0 0 1-16 0c0-4 3-7 4-8 0 4 2 5 3 4s3-5 2-10Z',
};
const icon=key=>`<img class="talent-art" src="assets/${['fastest','focusTarget'].includes(key)?'tactics':'command'}/${key}.png" alt="" draggable="false">`;
function preview(skill,profile){
 const rank=skillRank(profile,skill.key),next=Math.min(rank+1,skill.maxRank);
 if(skill.weaponEffect)return `${Math.round(skill.weaponEffect.perRank*rank*100)}% → ${Math.round(skill.weaponEffect.perRank*next*100)}% ${skill.key==='damage'?'damage':skill.key==='reload'?'reload time':skill.key==='range'?'range':'fire rate'}`;
 if(skill.key==='salvage')return `${rank*15}% → ${next*15}% lower clearance cost`;
 if(skill.key==='supplies')return `+$${rank*25} → +$${next*25} starting funds`;
 if(skill.key==='loadoutSlots')return `${loadoutCapacity(profile)} → ${Math.min(MAX_LOADOUT_SLOTS,loadoutCapacity(profile)+1)} weapon slots`;
 if(skill.key==='chronoCooldown')return `${50-rank*2}s → ${50-next*2}s cooldown`;
 if(skill.key==='powerSlots')return '1 → 2 powers · separate cooldowns';
 if(skill.key==='duplicates')return `${2+rank} → ${2+next} towers per category`;
 if(skill.key==='fastest')return 'Unlock Fastest targeting for guns and UAVs';
 if(skill.key==='focusTarget')return 'Inspect an alien → mark global priority';
 if(skill.key==='weakest')return 'Unlock Weakest targeting for guns and UAVs';
 if(skill.key==='extraDrone')return '1 → 2 independent patrol drones';
 if(skill.key==='pontoons')return 'Land only → land + water';
 if(skill.key==='mines')return `${rank*2} → ${next*2} mines · 5,500 damage each`;
 if(skill.key==='drone')return rank?`${280+rank*120} → ${280+next*120} base damage / shot`:'No UAV → 1 patrol drone';
 const key=skill.key.startsWith('artillery')?'artillery':skill.key.startsWith('napalm')?'napalm':'chronoBreak';
 const ability=activeAbilities.find(a=>a.key===key),current=activeAbilityStats(ability,profile),future=activeAbilityStats(ability,{...profile,skills:{...profile.skills,[skill.key]:next}});
 if(skill.active&&!activeUnlocked(profile,skill.key))return `Unlock ${skill.name} · ${future.cooldown}s cooldown`;
 if(skill.key.endsWith('Cooldown'))return `${current.cooldown}s → ${future.cooldown}s cooldown`;
 if(skill.key.endsWith('Area'))return `${Math.round(current.area)} → ${Math.round(future.area)} blast radius`;
 if(skill.key.endsWith('Duration'))return `${current.duration}s → ${future.duration}s${key==='artillery'?` · ${current.shots} → ${future.shots} shells`:''}`;
 if(key==='chronoBreak')return `${current.duration}s → ${future.duration}s stasis`;
 return `${current.damage} → ${future.damage} ${key==='artillery'?'damage / shell':'burn damage / second'}`;
}
function graphLayout(branch){
 const visible=skillTree.filter(s=>s.branch===branch),roots=visible.filter(s=>!s.requires);
 const positions=new Map();
 if(roots.length===1&&visible.length===2){positions.set(roots[0].key,{col:0,row:0});positions.set(visible.find(s=>s.requires).key,{col:0,row:1});return {positions,columns:1,rows:2};}
 if(roots.length===1){positions.set(roots[0].key,{col:1,row:0});visible.filter(s=>s.requires).forEach((s,i)=>positions.set(s.key,{col:i,row:1}));return {positions,columns:3,rows:2};}
 roots.forEach((root,col)=>{let n=root,row=0;while(n){positions.set(n.key,{col,row:row++});n=visible.find(s=>s.requires?.key===n.key);}});
 return {positions,columns:roots.length,rows:Math.max(...[...positions.values()].map(p=>p.row))+1};
}
export function renderSkillTree(ui,profile,selectedKey){
 const selected=skillTree.find(s=>s.key===(selectedKey||ui.skillTreeNodes.dataset.selected))||skillTree[0];
 ui.skillTreeNodes.dataset.selected=selected.key;
 ui.skillTreeLevel.textContent=profile.level;ui.skillTreeSp.textContent=profile.skillPoints;
 ui.skillTreeSpent.textContent=spentSkillPoints(profile);ui.resetSkillsButton.disabled=!spentSkillPoints(profile)||ui.allowSkillRefund===false;
 ui.resetSkillsButton.textContent='Refund talents';
 ui.resetSkillsButton.title=ui.allowSkillRefund===false?'Available between missions.':'Return all spent SP for free.';
 const rank=skillRank(profile,selected.key),canBuy=canBuySkill(profile,selected),met=prerequisiteMet(profile,selected),maxed=rank>=selected.maxRank;
 const parent=skillTree.find(s=>s.key===selected.requires?.key),branch=selected.branch,visible=skillTree.filter(s=>s.branch===branch);
 const {positions,columns,rows}=graphLayout(branch);
 const state=maxed?'Complete':!met&&!rank?'Locked':canBuy?'Upgrade available':'More SP needed';
 const x=p=>(p.col+.5)/columns*1000,y=p=>50+p.row*146;
 ui.skillTreeNodes.innerHTML=`<div class="talent-workspace"><nav class="doctrine-branches" aria-label="Skill branches">${Object.entries(branches).map(([key,b])=>`<button type="button" data-skill-branch="${key}" class="${key===branch?'selected':''}" aria-pressed="${key===branch}">${icon(key)}<span>${b.name}</span></button>`).join('')}</nav>
 <div class="talent-section"><div class="talent-section-title"><h3>${branches[branch].name}</h3><span>${visible.reduce((n,s)=>n+skillRank(profile,s.key),0)} ranks trained</span></div>
 <div class="command-board" aria-label="${branches[branch].name} talent paths"><div class="talent-graph" style="--columns:${columns};--rows:${rows}">
 <svg class="talent-connections" viewBox="0 0 1000 ${rows*146-18}" preserveAspectRatio="none" aria-hidden="true">${visible.filter(s=>s.requires).map(s=>{const p=positions.get(s.requires.key),n=positions.get(s.key);return `<path d="M${x(p)} ${y(p)+49} V${y(p)+65} H${x(n)} V${y(n)-49}" class="${prerequisiteMet(profile,s)?'open':''}"/>`;}).join('')}</svg>
 ${visible.map(s=>{const r=skillRank(profile,s.key),p=positions.get(s.key),ready=canBuySkill(profile,s),locked=!prerequisiteMet(profile,s)&&!r,complete=r>=s.maxRank;return `<button type="button" class="talent-node graph-node ${complete?'mastered':locked?'locked':ready?'available':'unfunded'} ${r?'owned':''} ${s.key===selected.key?'selected':''}" data-select-skill="${s.key}" style="grid-column:${p.col+1};grid-row:${p.row+1}" aria-pressed="${s.key===selected.key}" aria-label="${s.name}, rank ${r} of ${s.maxRank}, ${locked?'prerequisite required':complete?'complete':`${s.cost} SP per rank`}"><span class="talent-symbol">${icon(s.key)}<i class="talent-status">${locked?'▣':complete?'✓':ready?'+':''}</i></span><strong>${s.name}</strong><span class="talent-rank">${r}<small> / ${s.maxRank}</small></span><span class="talent-cost">${complete?'✓ Complete':`<b>${s.cost}</b> SP <i>${locked?'·':'+'}</i>`}</span><span class="talent-progress" aria-hidden="true">${Array.from({length:s.maxRank},(_,i)=>`<i class="${i<r?'on':''}"></i>`).join('')}</span></button>`;}).join('')}</div></div>
 <div class="talent-legend"><span><i class="ready"></i>Can upgrade</span><span><i class="complete"></i>Complete</span><span><i></i>Unavailable</span></div></div></div>
 <aside class="node-inspector"><div class="inspector-kicker">${branches[branch].name} <span>${rank} / ${selected.maxRank}</span></div><div class="inspector-icon">${icon(selected.key)}</div><h3>${selected.name}</h3><span class="inspector-state">${state}</span><p>${selected.description}</p><div class="skill-preview"><small>${maxed?'MASTERED':'NEXT RANK'}</small><strong>${maxed?'All ranks completed':preview(selected,profile)}</strong></div>${parent?`<button class="prerequisite-link" type="button" data-select-skill="${parent.key}"><span>${met?'✓':'🔒'} ${parent.name} · rank 1</span><b>→</b></button>`:''}
 <div class="talent-checkout"><div class="checkout-total"><span>${maxed?'Total invested':'Cost per rank'}</span><strong>${maxed?rank*selected.cost:selected.cost} <small>SP</small></strong></div><button class="skill-purchase" data-skill-key="${selected.key}" type="button" ${canBuy?'':'disabled'}>${maxed?'Completed':!met&&!rank?'Train prerequisite first':selected.key==='loadoutSlots'&&!canBuy&&profile.skillPoints>=selected.cost?'All ten slots available':profile.skillPoints<selected.cost?`Need ${selected.cost-profile.skillPoints} more SP`:`${rank?'Upgrade to rank '+(rank+1):'Train first rank'} →`}</button><span class="checkout-balance">${canBuy?`${profile.skillPoints} → ${profile.skillPoints-selected.cost} SP remaining`:`${profile.skillPoints} SP available`}</span></div>
 ${selected.active?`<button class="skill-equip" data-equip-active-key="${selected.key}" type="button" ${equippedPowerKeys(profile).includes(selected.key)?'disabled':''}>${equippedPowerKeys(profile).includes(selected.key)?'✓ Equipped power':'Equip this power'}</button>`:''}<p class="skill-application">${selected.weaponEffect||['salvage','pontoons','duplicates','weakest','fastest','focusTarget','loadoutSlots','powerSlots'].includes(selected.key)?'Applies immediately.':'Applies on your next deployment.'}</p></aside>`;
}
export function skillKeyFromEvent(event){return event.target.closest('[data-skill-key]')?.dataset.skillKey||null;}
export function equipActiveKeyFromEvent(event){return event.target.closest('[data-equip-active-key]')?.dataset.equipActiveKey||null;}
