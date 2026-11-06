import { activeAbilities, activeAbilityStats, activeUnlocked, canBuySkill, prerequisiteMet, skillRank, skillTree, spentSkillPoints } from '../data/skills.js';

const branches={armament:{name:'Training',color:'#ffbb57'},logistics:{name:'Deployment',color:'#49d9ee'},support:{name:'Support',color:'#bca3ff'},artillery:{name:'Artillery',color:'#f2c478'},napalm:{name:'Napalm',color:'#ff9970'}};
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
 chronoBreak:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 4v7l5 3',
 artillery:'M3 19h18M5 16Q7 2 19 6m-3-4 4 4-5 2M4 21v-4m15 4v-4',
 napalm:'M13 2c2 7 8 9 7 14a8 8 0 0 1-16 0c0-4 3-7 4-8 0 4 2 5 3 4s3-5 2-10Z',
};
const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]||paths[key.startsWith('artillery')?'artillery':key.startsWith('napalm')?'napalm':key==='extraDrone'?'drone':key==='weakest'?'range':'supplies']}"/></svg>`;
function preview(skill,profile){
 const rank=skillRank(profile,skill.key),next=Math.min(rank+1,skill.maxRank);
 if(skill.weaponEffect)return `${Math.round(skill.weaponEffect.perRank*rank*100)}% → ${Math.round(skill.weaponEffect.perRank*next*100)}%`;
 if(skill.key==='salvage')return `${rank*15}% → ${next*15}% lower clearance cost`;
 if(skill.key==='supplies')return `+$${rank*25} → +$${next*25} starting funds`;
 if(skill.key==='loadoutSlots')return `+${rank} → +${next} category slots · maximum 6 total`;
 if(skill.key==='duplicates')return '1 → 2 towers per category';
 if(skill.key==='weakest')return 'Unlock Weakest targeting for guns and UAVs';
 if(skill.key==='extraDrone')return '1 → 2 independent patrol drones';
 if(skill.key==='pontoons')return 'Land only → land + water';
 if(skill.key==='mines')return `${rank*2} → ${next*2} mines · 5,500 damage each`;
 if(skill.key==='drone')return rank?`${140+rank*60} → ${140+next*60} base damage / shot`:'No UAV → 1 patrol drone';
 const key=skill.key.startsWith('artillery')?'artillery':skill.key.startsWith('napalm')?'napalm':'chronoBreak';
 const ability=activeAbilities.find(a=>a.key===key),current=activeAbilityStats(ability,profile),future=activeAbilityStats(ability,{...profile,skills:{...profile.skills,[skill.key]:next}});
 if(skill.active&&!activeUnlocked(profile,skill.key))return `Unlock ${skill.name} · ${future.cooldown}s cooldown`;
 if(skill.key.endsWith('Cooldown'))return `${current.cooldown}s → ${future.cooldown}s cooldown`;
 if(skill.key.endsWith('Area'))return `${Math.round(current.area)} → ${Math.round(future.area)} blast radius`;
 if(skill.key.endsWith('Duration'))return `${current.duration}s → ${future.duration}s${key==='artillery'?` · ${current.shots} → ${future.shots} shells`:''}`;
 if(key==='chronoBreak')return `${current.duration}s → ${future.duration}s stasis`;
 return `${current.damage} → ${future.damage} ${key==='artillery'?'damage / shell':'burn damage / second'}`;
}
export function renderSkillTree(ui,profile,selectedKey){
 const selected=skillTree.find(s=>s.key===(selectedKey||ui.skillTreeNodes.dataset.selected))||skillTree.find(s=>s.key==='damage');
 ui.skillTreeNodes.dataset.selected=selected.key;
 ui.skillTreeLevel.textContent=profile.level;ui.skillTreeSp.textContent=profile.skillPoints;
 ui.skillTreeSpent.textContent=spentSkillPoints(profile);ui.resetSkillsButton.disabled=!spentSkillPoints(profile)||ui.allowSkillRefund===false;
 ui.resetSkillsButton.textContent=ui.allowSkillRefund===false?'Between missions':'Refund nodes';
 ui.resetSkillsButton.title=ui.allowSkillRefund===false?'Refund nodes from mission select or the results screen. Your combat records stay saved.':'Refund commander nodes for free. Your combat records stay saved.';
 const rank=skillRank(profile,selected.key),canBuy=canBuySkill(profile,selected),met=prerequisiteMet(profile,selected),unlocked=selected.active&&activeUnlocked(profile,selected.key);
 const parent=skillTree.find(s=>s.key===selected.requires?.key);
 const state=rank>=selected.maxRank?'Mastered':rank?'Trained':unlocked?'Legacy unlock':canBuy?'Ready to unlock':!met?'Prerequisite needed':'Save more SP';
 const branch=selected.branch,visible=skillTree.filter(s=>s.branch===branch);
 const oldScroll=ui.skillTreeNodes.querySelector('.command-board');
 const scroll={left:oldScroll?.scrollLeft||0,top:oldScroll?.scrollTop||0};
 ui.skillTreeNodes.innerHTML=`<div class="command-map"><nav class="doctrine-branches" aria-label="Skill branches">${Object.entries(branches).map(([key,b])=>`<button type="button" data-skill-branch="${key}" class="${key===branch?'selected':''}" aria-pressed="${key===branch}" style="--branch:${b.color}"><i></i>${b.name}<small>${skillTree.filter(s=>s.branch===key&&skillRank(profile,s.key)>0).length} trained</small></button>`).join('')}</nav>
 <div class="command-board" tabindex="0" aria-label="Commander skill graph. Scroll to explore branches."><div class="graph-surface">
 <svg class="graph-connections" viewBox="0 0 620 530" aria-hidden="true">${visible.map(s=>{
 const p=s.requires?skillTree.find(x=>x.key===s.requires.key):{x:310,y:35},owned=skillRank(profile,s.key)>0;
 return `<path d="M${p.x},${p.y+(s.requires?50:20)} C${p.x},${(p.y+s.y)/2} ${s.x},${(p.y+s.y)/2} ${s.x},${s.y-50}" class="${owned?'lit':prerequisiteMet(profile,s)?'reachable':''}" style="--branch:${branches[s.branch].color}"/>`;
 }).join('')}</svg><div class="command-root" style="left:310px;top:35px"><span>◇</span><b>${branches[branch].name.toUpperCase()}</b></div>
 ${[...visible].sort((a,b)=>a.y-b.y||a.x-b.x).map(s=>{const r=skillRank(profile,s.key),available=canBuySkill(profile,s),owned=r>0||s.active&&activeUnlocked(profile,s.key);return `<button type="button" class="graph-node ${owned?'owned':''} ${available&&!owned?'available':''} ${!owned&&!available?(prerequisiteMet(profile,s)?'unfunded':'locked'):''} ${s.key===selected.key?'selected':''}" data-select-skill="${s.key}" aria-pressed="${s.key===selected.key}" aria-label="${s.name}, rank ${r} of ${s.maxRank}, ${owned?'unlocked':prerequisiteMet(profile,s)?`${s.cost} SP`:'prerequisite required'}" style="left:${s.x}px;top:${s.y}px;--branch:${branches[s.branch].color}"><span class="node-emblem">${icon(s.key)}${!owned&&!prerequisiteMet(profile,s)?`<i class="node-lock">${icon('locked')}</i>`:''}</span><strong>${s.name}</strong><small>${r?`✓ TRAINED ${r} / ${s.maxRank}`:owned?'✓ UNLOCKED':!prerequisiteMet(profile,s)?'LOCKED / PREREQUISITE':available?`+ UNLOCK · ${s.cost} SP`:`NEED ${s.cost} SP`}</small><span class="node-pips">${Array.from({length:s.maxRank},(_,i)=>`<i class="${i<r?'on':''}"></i>`).join('')}</span></button>`;}).join('')}</div></div><p class="graph-guide"><span class="legend-trained">✓ Trained</span><span class="legend-ready">+ Can unlock</span><span class="legend-unfunded">SP needed</span><span class="legend-locked">Locked / prereq</span><i>Scroll the map · select a node to inspect</i></p></div>
 <aside class="node-inspector" style="--branch:${branches[selected.branch].color}"><div class="inspector-kicker">${branches[selected.branch].name} / ${selected.type==='active'?'SPECIAL':selected.type==='utility'?'AUTOMATIC UTILITY':'TRAINING'}</div><div class="inspector-icon">${icon(selected.key)}</div><h3>${selected.name}</h3><span class="inspector-state">${state} · ${rank} / ${selected.maxRank}</span><p>${selected.description}</p><div class="skill-preview"><small>NEXT UPGRADE</small><strong>${rank>=selected.maxRank?'Maximum rank reached':preview(selected,profile)}</strong></div>${parent?`<button class="prerequisite-link" type="button" data-select-skill="${parent.key}"><span>${met?'✓':'↳'} Requires ${parent.name} I</span><b>View →</b></button>`:'<p class="skill-entry">Entry node · no prerequisite</p>'}<button class="skill-purchase" data-skill-key="${selected.key}" type="button" ${canBuy?'':'disabled'}>${selected.key==='loadoutSlots'&&!canBuy&&profile.skillPoints>=selected.cost&&rank<selected.maxRank?'Six-slot limit reached':rank>=selected.maxRank?'Fully trained':!met&&!rank?'Complete prerequisite':profile.skillPoints<selected.cost?`Need ${selected.cost-profile.skillPoints} more SP`:`${rank?'Upgrade':unlocked?'Improve':'Unlock'} · ${selected.cost} SP`}</button>${selected.active?`<button class="skill-equip" data-equip-active-key="${selected.key}" type="button" ${!unlocked||profile.equippedActiveKey===selected.key?'disabled':''}>${profile.equippedActiveKey===selected.key?'Equipped for next deployment':unlocked?'Equip special':'Unlock to equip'}</button>`:''}<p class="skill-application">${selected.weaponEffect?'Training strengthens deployed towers immediately.':['salvage','pontoons','duplicates','weakest'].includes(selected.key)?'Research applies immediately to new purchases.':'Support and starting supplies apply on your next deployment.'}</p></aside>`;
 const board=ui.skillTreeNodes.querySelector('.command-board');board.scrollLeft=scroll.left;board.scrollTop=scroll.top;
 const node=ui.skillTreeNodes.querySelector(`[data-select-skill="${selected.key}"]`),rect=board.getBoundingClientRect(),bounds=node.getBoundingClientRect();
 if(bounds.left<rect.left+8||bounds.right>rect.right-8)board.scrollLeft+=bounds.left<rect.left+8?bounds.left-rect.left-8:bounds.right-rect.right+8;
 if(bounds.top<rect.top+8||bounds.bottom>rect.bottom-8)board.scrollTop+=bounds.top<rect.top+8?bounds.top-rect.top-8:bounds.bottom-rect.bottom+8;
}
export function skillKeyFromEvent(event){return event.target.closest('[data-skill-key]')?.dataset.skillKey||null;}
export function equipActiveKeyFromEvent(event){return event.target.closest('[data-equip-active-key]')?.dataset.equipActiveKey||null;}
