import { _status, game, lib } from "noname";
/** @type { importCharacterConfig['skill'] } */
export default {
	_viewSideHandCards: {
		charlotte: true,
		ruleSkill: true,
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				return player.side == arg.side;
			},
		},
	},

	jujubeCake_effect: {
		trigger: {
			global: "phaseBegin",
		},
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			await player.draw();
		},
	},
	pineNutCandy_effect: {
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			await player.draw();
		},
	},
	spicyStrips_effect: {
		trigger: {
			global: "phaseEnd",
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			const target = game.filterPlayer(p => p.side != player.side).randomGet();
			if (target) {
				await target.damage(1, "fire", player);
			}
		},
	},
	driedPersimmon_effect: {
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			await player.recover(1);
		},
	},
	greenTongue_effect: {
		trigger: {
			global: "phaseBegin",
		},
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			await player.recover(1);
		},
	},
	whiteRabbitCandy_effect: {
		trigger: {
			player: "recoverAfter",
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			await player.draw(2);
		},
	},
	popRocks_effect: {
		charlotte: true,
		mod: {
			globalFrom(from, to, distance) {
				return distance - 2;
			},
		},
	},
	maltesers_effect: {
		trigger: {
			player: "damageBegin",
		},
		usable: 1,
		forced: true,
		charlotte: true,
		async content(event, trigger, player) {
			trigger.num--;
		},
	},
	skittles_effect: {
		trigger: {
			global: "phaseEnd",
		},
		charlotte: true,
		async cost(event, trigger, player) {
			const list = [
				["heart", "红桃"],
				["diamond", "方片"],
				["club", "梅花"],
				["spade", "黑桃"],
			];
			const result = await player
				.chooseButton(["彩虹糖：请选择两种花色，随机获得对应的牌", [list.slice(0, 2), "tdnodes"], [list.slice(2, 4), "tdnodes"]])
				.set("selectButton", 2)
				.set("ai", () => Math.random())
				.forResult();
			event.result = {
				bool: result.bool,
				cost_data: result.links,
			};
		},
		async content(event, trigger, player) {
			const suits = event.cost_data;
			const cards = suits.map(i => get.cardPile(j => j.suit == i)).filter(Boolean);
			if (cards.length) {
				await player.gain(cards);
			}
		},
	},
	marshmallow_effect: {
		trigger: {
			global: "phaseBegin",
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			await player.changeHujia(1);
		},
	},
	pudding_effect: {
		trigger: {
			player: "phaseBegin",
		},
		charlotte: true,
		forced: true,
		filter(event, player) {
			return game.hasPlayer(i => i.side != player.side);
		},
		logTarget(event, player) {
			return game.filterPlayer(i => i.side != player.side);
		},
		async content(event, trigger, player) {
			const targets = game.filterPlayer(i => i.side != player.side);
			for (const target of targets) {
				await target.damage(1, "ice", player);
			}
		},
	},
	hawthornSlice_effect: {
		trigger: {
			global: "phaseEnd",
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			await player.chooseDrawRecover(2);
		},
	},
	whistleCandy_effect: {
		trigger: {
			source: "damageBegin2",
		},
		filter(event, player) {
			return ![player.getNext(), player.getPrevious()].includes(event.player);
		},
		forced: true,
		charlotte: true,
		logTarget: "player",
		async content(event, trigger, player) {
			trigger.num *= 3;
		},
	},
	AdCalciumMilk_effect: {
		trigger: {
			global: "phaseEnd",
		},
		charlotte: true,
		forced: true,
		async content(event, trigger, player) {
			await player.draw(2);
		},
	},

	p_drawCount_effect: {
		trigger: {
			player: "phaseDrawBegin2",
		},
		filter(event, player) {
			return !event.numFixed && _status.permanentBoostItem?.p_drawCount > 0;
		},
		forced: true,
		async content(event, trigger, player) {
			trigger.num += _status.permanentBoostItem.p_drawCount;
		},
	},
	p_armor_effect: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && _status.permanentBoostItem?.p_armor > 0;
		},
		forced: true,
		async content(event, trigger, player) {
			await player.changeHujia(_status.permanentBoostItem.p_armor);
		},
	},
	p_hp_effect: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && _status.permanentBoostItem?.p_hp > 0;
		},
		forced: true,
		async content(event, trigger, player) {
			await player.gainMaxHp(_status.permanentBoostItem.p_hp);
		},
	},
	p_distance_subtraction_effect: {
		forced: true,
		mod: {
			globalFrom(from, to, distance) {
				return distance - (_status.permanentBoostItem?.p_distance_subtraction || 0);
			},
		},
	},
	p_damage_effect: {
		forced: true,
		trigger: {
			source: "damageBegin1",
		},
		filter(event, player) {
			return _status.permanentBoostItem?.p_damage > 0;
		},
		priority: 2,
		async content(event, trigger, player) {
			trigger.num += _status.permanentBoostItem.p_damage;
		},
	},
	p_skill_effect: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0) && _status.permanentBoostItem?.p_skill > 0;
		},
		forced: true,
		async content(event, trigger, player) {
			await player.addSkills(get.gainableSkills().randomGets(_status.permanentBoostItem.p_skill));
		},
	},
	p_revive_effect: {
		trigger: {
			player: "dieBefore",
		},
		forced: true,
		filter(event, player) {
			return player.countMark("p_revive") < (_status.permanentBoostItem?.p_revive || 0);
		},
		intro: {
			content(s, player) {
				return `本局游戏你已经累计触发复活${s}次，总共可以触发${_status.permanentBoostItem?.p_revive || 0}次`;
			},
		},
		async content(event, trigger, player) {
			player.addMark("p_revive_effect", 1, false);
			trigger.cancel();
			await player.recover(3);
		},
	},
};
