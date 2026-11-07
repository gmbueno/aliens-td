export const MAX_LOADOUT_SLOTS=10;
export const STARTING_SLOTS=3;
export const SLOT_REWARD_LEVELS=['level_4','level_10'];
export const bonusSlotRules=[{kind:'level',value:8},{kind:'stars',value:12},{kind:'stars',value:30}];
export const campaignStars=profile=>Object.values(profile.missions||{}).reduce((n,m)=>n+(m.stars||0),0);
export const campaignClears=profile=>Object.values(profile.missions||{}).filter(m=>m.clears>0).length;
export const missionLabelFromId=id=>{const n=Number(id.split('_')[1])-1;return `${Math.floor(n/6)+1}-${n%6+1}`;};
export function ruleMet(profile,rule){
 if(rule.kind==='starter')return true;
 if(rule.kind==='level')return profile.level>=rule.value;
 if(rule.kind==='stars')return campaignStars(profile)>=rule.value;
 if(rule.kind==='clears')return campaignClears(profile)>=rule.value;
 return Boolean(profile.missions?.[rule.value]?.clears);
}
export const bonusSlots=profile=>bonusSlotRules.filter(r=>ruleMet(profile,r)).length;
export function ruleLabel(rule){
 if(rule.kind==='starter')return 'Starter weapon';
 if(rule.kind==='level')return `Commander level ${rule.value}`;
 if(rule.kind==='stars')return `Earn ${rule.value} campaign stars`;
 if(rule.kind==='clears')return 'Complete your first mission';
 return `Complete mission ${missionLabelFromId(rule.value)}`;
}
// One clear requirement per category keeps the unlock route easy to understand.
export const classUnlockRules={
 handgun:{kind:'starter'},assault_rifle:{kind:'starter'},machine_pistol:{kind:'starter'},
 shotgun:{kind:'clears',value:1},beacon:{kind:'mission',value:'level_2'},
 magnum:{kind:'stars',value:6},sniper:{kind:'mission',value:'level_4'},
 rocket_launcher:{kind:'mission',value:'level_6'},flamethrower:{kind:'stars',value:12},
 laser:{kind:'level',value:9},factory:{kind:'level',value:4},
 missile:{kind:'mission',value:'level_9'},minelayer:{kind:'level',value:6},gas:{kind:'stars',value:18},
};
