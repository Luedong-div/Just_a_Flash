import extendGet from "../../../components/extendMethod/get.js";

export default {
	jaf_grass: "小草",
	jaf_pyrophobia: "惧火",
	jaf_pyrophobia_info: "锁定技，你受到的火焰伤害+1。",
	jaf_vitality: "生机",
	jaf_vitality_info: "锁定技，每回合结束，你回复一点体力。",
	jaf_youth: "少年",
	jaf_realMe: "真我",
	jaf_realMe_info: "锁定技，游戏开始时，你获得两个随机技能。",
	jaf_smallFish: "小鱼",
	jaf_slippery: "滑溜",
	jaf_slippery_info: `锁定技，当你成为${extendGet.easyPoptip("jaf_slippery2", "减益牌", "根据具体游戏进程判断，如：正常下【过河拆桥】认为是减益效果，但是如果是队友对你使用，且恰好你判定区内有牌，此时此牌会被判定为非减益牌。", "#2573c1")}的目标时，有30%概率${extendGet.easyPoptip("jaf_slippery3", "规避", "取消此目标。", "#2573c1")}。`,
	jaf_scarecrow: "稻草人",
	jaf_tricky: "诡谲",
	jaf_tricky_info: "锁定技，当其他角色对你使用牌结束后，你对其使用一张同名虚拟牌。",
	jaf_dragonfly: "蜻蜓",
	jaf_fly: "飞行",
	jaf_fly_info: "锁定技，回合内，你使用牌无距离限制；回合外，当你成为一张牌的目标后，本回合其他角色计算与你距离+1。",
	jaf_blackGoat: "黑山羊",
	jaf_ruminate: "反刍",
	jaf_ruminate_info: "锁定技，出牌阶段，你失去一点体力，然后获得一张【乐不思蜀】和【桃】。",
};
