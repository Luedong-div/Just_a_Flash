import { decryptAndVerifyConfig } from "../../../components/polyfill.js";

/** @type {import('../../../../types/CHAPTERS.js').ChaptersConfig} */
const CHAPTERS = {
	c1: {
		title: "第一章·村间小道",
		levels: {
			c1l1: {
				title: "剑客",
				hint: "小草怕火，推荐能够造成火焰伤害的角色参战！",
				intro: "少年持棍作剑客，剑气回荡花叶落。如今杂草铺满地，村中再也无剑客。儿时的我手握一根木棍，便以为是握住了一把宝剑，而剑指的方向，就成为了王的故乡。少年意气谈笑间，一念挥剑镜方圆。自己已然是那江湖剑客，方圆十里再无完整的杂草。一剑破天是少年心中最美的幻想，然而真正的剑客却早已不在了。如今的我只能在这村间小道上，继续着儿时的幻想，等待着那个真正的剑客再次出现。",
				convo: {
					playConvoBefore: [["少年持棍作剑客，剑气回荡花叶落。如今杂草铺满地，村中再也无剑客。儿时的我手握一根木棍，便以为是握住了一把宝剑，而剑指的方向，就成为了王的故乡。少年意气谈笑间，一念挥剑镜方圆。自己已然是那江湖剑客，方圆十里再无完整的杂草。一剑破天是少年心中最美的幻想，然而真正的剑客却早已不在了。如今的我只能在这村间小道上，继续着儿时的幻想，等待着那个真正的剑客再次出现。"]],
					playConvoAfter: [["村径晚风轻扬，漫草依旧疯长，却再无年少棍影锋芒。当年仗剑天涯的痴梦，终随岁月缓缓归航。原来真正的剑客从未消散，那根木棍、那片草地、那场独属于自己的江湖，早已刻进骨血。一剑破天的轻狂，酿成温柔的过往；儿时眼底的光，从未被时光掩藏。草木枯荣又一载，此间童年未凉，心中剑客如常。你走过的每一步，都是儿时江湖的续章——此程落幕，童心永不散场。"]],
				},
				gameData: {
					difficulty: {
						1: {
							bossInfo: {
								id: "jaf_grass",
							},
							meInfo: {
								cards: {
									e: [["jaf_stick", "heart", "6"]],
								},
							},
							global: {
								loopFirst: 0,
							},
						},
						2: {
							bossInfo: {
								id: "jaf_grass",
								minions: [
									{
										seat: 2,
										name: "jaf_grass",
									},
									{
										seat: 6,
										name: "jaf_grass",
									},
								],
							},
							meInfo: {
								cards: {
									e: [["jaf_stick", "heart", "6"]],
								},
							},
							global: {
								loopFirst: 0,
							},
						},
						3: {
							bossInfo: {
								id: "jaf_grass",
								minions: [
									{
										seat: 2,
										name: "jaf_grass",
									},
									{
										seat: 6,
										name: "jaf_grass",
									},
								],
							},
							global: {
								loopFirst: 4,
								gameDraw(player) {
									return player == game.boss ? 8 : 4;
								},
							},
						},
					},
				},
				reward: {
					currency: "eyJtZW1vcnlaaHUiOlsxLDEwXSwiZHJlYW1EaWFuIjoxLCJqaWFuZ0Z1IjpbMSw1XX0=|3cb366db",
				},
			},
			c1l2: {
				title: "古树回响",
				intro: "古树会回应你的行动，节奏是通关的关键。",
				hint: "先手别急着爆发，等回响触发后再打连段。",
				convo: {
					playConvoBefore: [],
					playConvoAfter: [],
				},
			},
			c1l3: {
				title: "鹿鸣溪谷",
				intro: "溪谷地形曲折，合理分配行动顺序可大幅降低难度。",
				hint: "中路桥口是关键点位，守住后压力会骤降。",
				convo: {
					playConvoBefore: [],
					playConvoAfter: [],
				},
			},
			c1l4: {
				title: "月影营地",
				intro: "夜色会遮蔽部分信息，请观察敌方行动轨迹。",
				hint: "夜幕阶段敌方偏向突进，留一张防御牌更稳。",
				convo: {
					playConvoBefore: [],
					playConvoAfter: [],
				},
			},
			c1l5: {
				title: "森王庭院",
				intro: "最终试炼，建议先清理外围再处理核心单位。",
				hint: "优先处理召唤单位，避免被拖入消耗战。",
				convo: {
					playConvoBefore: [],
					playConvoAfter: [],
				},
			},
		},
	},
	c2: {
		title: "第二章·旧城迷雾",
		levels: {
			c2l1: {
				title: "林间小径",
				intro: "沿着林间小径深入，留心雾气中的脚步声。",
				hint: "薄雾会在第三回合加重，优先占位视野点。",
				convo: {
					playConvoBefore: [],
					playConvoAfter: [],
				},
			},
			c2l2: {
				title: "古树回响",
				intro: "古树会回应你的行动，节奏是通关的关键。",
				hint: "先手别急着爆发，等回响触发后再打连段。",
				convo: {
					playConvoBefore: [],
					playConvoAfter: [],
				},
			},
		},
	},
	c3: {
		title: "第三章·山海残卷",
		levels: {},
	},
	c4: {
		title: "第四章·长夜灯火",
		levels: {},
	},
	c5: {
		title: "第五章·雪落回廊",
		levels: {},
	},
	c6: { title: "第六章·海风来信", levels: {} },
	c7: { title: "第七章·星桥旧梦", levels: {} },
	c8: { title: "第八章·时隙旅人", levels: {} },
	c9: { title: "第九章·流光终局", levels: {} },
};

// 解码奖励数据
for (const chapterId in CHAPTERS) {
	const chapter = CHAPTERS[chapterId];
	if (!chapter || !chapter.levels) continue;

	for (const levelId in chapter.levels) {
		const level = chapter.levels[levelId];
		if (!level) continue;

		if (level?.reward?.currency) {
			try {
				level.reward.currency = decryptAndVerifyConfig(level.reward.currency, "shaonian");
			} catch (error) {
				console.error(`解密失败: ${chapterId} ${levelId}`, error);
				level.reward.currency = {};
			}
		}
	}
}

export default CHAPTERS;
