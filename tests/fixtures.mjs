// Explicit campaign progress for mechanic tests that need advanced weapons.
// Fresh-player and sequential-campaign tests intentionally do not use this.
export const missionRecords = (count=12,start=2) => Object.fromEntries(
  Array.from({length:count},(_,i)=>[`level_${i+start}`,{clears:1,stars:3,bestLives:18}])
);
