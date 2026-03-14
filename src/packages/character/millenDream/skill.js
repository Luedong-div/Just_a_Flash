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
};

export default skills;
