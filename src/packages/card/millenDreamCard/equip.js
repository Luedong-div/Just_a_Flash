import extendGet from "../../../components/extendMethod/get.js";

/**************************装备牌**************************/
const millenDreamCard_equip = {
	jaf_stick: {
		subtype: "equip1",
		ai: {
			basic: {
				equipValue: 5.8,
				order(card, player) {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				value(card, player, _, method) {
					if (!game.hasPlayer(i => i.side != player.side && [i.name1, i.name2].filter(Boolean).every(name => !lib.character[name].vegetation))) {
						return 0;
					}
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) {
						return 0.01;
					}
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") {
							return equipValue(card, player);
						}
						if (method == "raw2") {
							return equipValue(card, player) - value;
						}
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") {
						equipValue = 0;
					}
					if (method == "raw") {
						return equipValue;
					}
					if (method == "raw2") {
						return equipValue - value;
					}
					return Math.max(0.1, equipValue - value);
				},
			},
		},
		skills: ["jaf_stick_skill"],
	},
};

for (const equip in millenDreamCard_equip) {
	millenDreamCard_equip[equip].type = "equip";
}

/** @type { importCharacterConfig['skill'] } */
const millenDreamCard_equipSkill = {
	jaf_stick_skill: {
		trigger: {
			source: "damageAfter",
		},
		forced: true,
		filter(event) {
			return [event.player.name1, event.player.name2].filter(Boolean).some(name => lib.character[name].vegetation) && event.player.hp > 1;
		},
		async content(event, trigger, player) {
			await trigger.player.loseHp(trigger.player.hp - 1);
		},
	},
};

const millenDreamCard_equipTranslate = {
	jaf_stick: "木棍",
	jaf_stick_info: `你的攻击将${extendGet.easyPoptip("jaf_grass1", "致残", "造成伤害后，目标体力值流失到一点。", "#FF7F00")}${extendGet.easyPoptip("jaf_grass2", "草木", "特指模式忽然而已中的各种植被。", "#60c70b")}。`,
};

export { millenDreamCard_equip, millenDreamCard_equipSkill, millenDreamCard_equipTranslate };
