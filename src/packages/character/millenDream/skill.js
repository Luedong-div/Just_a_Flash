import { _status, game, lib, get } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	jaf_pyrophobia: {
		forced: true,
		filter(event) {
			return event.hasNature("fire");
		},
		trigger: {
			player: "damageBegin2",
		},
		async content(event, trigger) {
			trigger.num++;
		},
	},
	jaf_vitality: {
		forced: true,
		trigger: {
			global: "phaseEnd",
		},
		filter(event, player) {
			return player.isDamaged();
		},
		async content(event, trigger, player) {
			player.recover();
		},
	},
	jaf_realMe: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		skillAnimation: true,
		async content(event, trigger, player) {
			player.awakenSkill("jaf_realMe");
			player.addSkills(get.gainableSkills().randomGets(2));
		},
	},
	jaf_slippery: {
		trigger: {
			target: "useCardToTargeted",
		},
		filter(event, player) {
			return get.effect(player, event.card, event.player, player) < 0 && Math.random() < 0.3;
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.getParent().excluded.add(player);
		},
	},
	jaf_tricky: {
		trigger: {
			global: "useCardAfter",
		},
		filter(event, player) {
			return event.player != player && event.targets?.includes(player);
		},
		forced: true,
		async content(event, trigger, player) {
			await player.useCard({ name: trigger.card.name, nature: trigger.card.nature }, trigger.player, false);
		},
	},
	jaf_fly: {
		forced: true,
		mod: {
			targetInRange(card, player, target) {
				if (player.isPhaseUsing()) return true;
			},
		},
		trigger: {
			target: "useCardToTargeted",
		},
		async content(event, trigger, player) {
			player.addMark("jaf_fly_count", 1, false);
			player.addTempSkill("jaf_fly_count");
		},
		subSkill: {
			count: {
				intro: {
					content: "本回合你计算与其他角色的距离+#",
				},
				onremove: true,
				charlotte: true,
				mod: {
					globalTo(target, player, num) {
						return num + player.countMark("jaf_fly_count");
					},
				},
			},
		},
	},
	jaf_ruminate: {
		trigger: {
			player: "phaseUseBegin",
		},
		forced: true,
		async content(event, trigger, player) {
			await player.loseHp(1);
			await player.changeHujia(1);
			const cards = ["lebu", "tao"].map(name => get.cardPile(name)).filter(Boolean);
			if (cards.length) {
				await player.gain(cards, "draw");
			}
		},
	},
};

export default skills;
