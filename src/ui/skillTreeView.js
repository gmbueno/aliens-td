import { canBuySkill, skillRank, skillTree, spentSkillPoints } from "../data/skills.js";

export function renderSkillTree(ui, profile) {
  ui.skillTreeLevel.textContent = profile.level;
  ui.skillTreeSp.textContent = profile.skillPoints;
  ui.skillTreeSpent.textContent = spentSkillPoints(profile);
  ui.skillTreeNodes.innerHTML = skillTree.map((skill) => {
    const rank = skillRank(profile, skill.key);
    const canBuy = canBuySkill(profile, skill);
    return `
      <article class="skill-node ${rank >= skill.maxRank ? "complete" : ""}">
        <div>
          <h3>${skill.name}</h3>
          <p>${skill.description}</p>
        </div>
        <div class="skill-node-meta">
          <strong>${rank} / ${skill.maxRank}</strong>
          <button class="secondary-button" data-skill-key="${skill.key}" type="button" ${canBuy ? "" : "disabled"}>
            ${skill.cost} SP
          </button>
        </div>
      </article>
    `;
  }).join("");
}

export function skillKeyFromEvent(event) {
  return event.target.closest("[data-skill-key]")?.dataset.skillKey || null;
}
