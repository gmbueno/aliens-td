import { activeAbilities, activeAbilityStats, activeSkillTree, canBuySkill, passiveSkillTree, skillRank, spentSkillPoints } from "../data/skills.js";

function skillPreview(skill, profile) {
  const rank = skillRank(profile, skill.key);
  if (rank >= skill.maxRank) return "Fully trained";
  if (skill.weaponEffect) {
    const current = Math.round(skill.weaponEffect.perRank * rank * 100);
    const next = Math.round(skill.weaponEffect.perRank * (rank + 1) * 100);
    return `Total bonus: ${current > 0 ? "+" : ""}${current}% → ${next > 0 ? "+" : ""}${next}%`;
  }
  const ability = activeAbilities.find(item => item.key === skill.key);
  const current = activeAbilityStats(ability, profile);
  const next = activeAbilityStats(ability, { ...profile, skills: { ...profile.skills, [skill.key]: rank + 1 } });
  if (skill.key === "chronoBreak") return `${current.duration}s → ${next.duration}s freeze · ${current.cooldown}s → ${next.cooldown}s cooldown`;
  if (skill.key === "rocketLauncher") return `${(current.damage / 1000).toFixed(1)}k → ${(next.damage / 1000).toFixed(1)}k damage · ${current.area} → ${next.area} radius`;
  return `${current.damage} → ${next.damage} DPS · ${current.duration}s → ${next.duration}s burn`;
}

function activeEquipButton(skill, profile) {
  if (skill.type !== "active") return "";
  const isEquipped = profile.equippedActiveKey === skill.active;
  return `
    <button class="secondary-button equip-skill-button" data-equip-active-key="${skill.active}" type="button" ${isEquipped ? "disabled" : ""}>
      ${isEquipped ? "Equipped" : "Equip"}
    </button>
  `;
}

function renderSkillGroup(title, skills, profile) {
  return `
    <section class="skill-tree-group">
      <h3>${title}</h3>
      <div class="skill-tree-nodes">
        ${skills.map((skill) => {
          const rank = skillRank(profile, skill.key);
          const canBuy = canBuySkill(profile, skill);
          return `
            <article class="skill-node ${rank >= skill.maxRank ? "complete" : ""}">
              <div>
                <h4>${skill.name}</h4>
                <p>${skill.description}</p>
                <p class="skill-preview">${skillPreview(skill, profile)}</p>
              </div>
              <div class="skill-node-meta">
                <strong>${rank} / ${skill.maxRank}</strong>
                <div class="skill-node-actions">
                  <button class="secondary-button" data-skill-key="${skill.key}" type="button" ${canBuy ? "" : "disabled"}>
                    ${rank >= skill.maxRank ? "MAX" : `+ Rank · ${skill.cost} SP`}
                  </button>
                  ${activeEquipButton(skill, profile)}
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function renderSkillTree(ui, profile) {
  ui.skillTreeLevel.textContent = profile.level;
  ui.skillTreeSp.textContent = profile.skillPoints;
  ui.skillTreeSpent.textContent = spentSkillPoints(profile);
  ui.resetSkillsButton.disabled = spentSkillPoints(profile) === 0;
  ui.skillTreeNodes.innerHTML = [
    renderSkillGroup("Active Skills", activeSkillTree, profile),
    renderSkillGroup("Passive Skills", passiveSkillTree, profile),
  ].join("");
}

export function skillKeyFromEvent(event) {
  return event.target.closest("[data-skill-key]")?.dataset.skillKey || null;
}

export function equipActiveKeyFromEvent(event) {
  return event.target.closest("[data-equip-active-key]")?.dataset.equipActiveKey || null;
}
