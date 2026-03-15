import { decryptAndVerifyConfig } from "../../../components/polyfill.js";

/** @type {import('../../../../types/CHAPTERS.js').ChaptersConfig} */
const CHAPTERS = {
	c1: {
		title: "第一章·村间小道",
		levels: {
			c1l1: {
				title: "剑客",
				hint: "①小草怕火，推荐能够造成火焰伤害的角色参战！\n②小草恢复力强，建议出战多刀角色。",
				intro: "少年持棍作剑客，剑气回荡花叶落。如今杂草铺满地，村中再也无剑客。儿时的我手握一根木棍，便以为是握住了一把宝剑，而剑指的方向，就成为了王的故乡。少年意气谈笑间，一念挥剑镜方圆。自己已然是那江湖剑客，方圆十里再无完整的杂草。一剑破天是少年心中最美的幻想，然而真正的剑客却早已不在了。如今的我只能在这村间小道上，继续着儿时的幻想，等待着那个真正的剑客再次出现。",
				gameData: {
					convo: {
						playConvoBefore: [["少年持棍作剑客，剑气回荡花叶落。如今杂草铺满地，村中再也无剑客。儿时的我手握一根木棍，便以为是握住了一把宝剑，而剑指的方向，就成为了王的故乡。少年意气谈笑间，一念挥剑镜方圆。自己已然是那江湖剑客，方圆十里再无完整的杂草。一剑破天是少年心中最美的幻想，然而真正的剑客却早已不在了。如今的我只能在这村间小道上，继续着儿时的幻想，等待着那个真正的剑客再次出现。"]],
						playConvoAfter: [["村径晚风轻扬，漫草依旧疯长，却再无年少棍影锋芒。当年仗剑天涯的痴梦，终随岁月缓缓归航。原来真正的剑客从未消散，那根木棍、那片草地、那场独属于自己的江湖，早已刻进骨血。一剑破天的轻狂，酿成温柔的过往；儿时眼底的光，从未被时光掩藏。草木枯荣又一载，此间童年未凉，心中剑客如常。你走过的每一步，都是儿时江湖的续章——此程落幕，童心永不散场。"]],
					},
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
				title: "溪石",
				intro: "村径尽头藏清涧，溪中鱼虾戏浅滩。曾蹲溪畔忙摸鱼，指尖沾湿意未闲。儿时的小道走到尽头，便是一汪清澈的溪流，溪底铺着光滑的鹅卵石，鱼虾在石缝间穿梭，藏着童年最鲜活的欢喜。我总爱挽起裤脚，赤脚踏入溪水，弯腰在石缝间摸索，追逐着灵动的鱼虾，哪怕浑身湿透、满身泥泞，也藏不住眉眼间的雀跃。溪水流淌，带走了夏日的燥热，也带走了年少的时光，只留溪畔欢声，静候故人归来。",
				hint: "敌人具有卡牌免疫，建议上场直伤角色。",
				gameData: {
					convo: {
						playConvoBefore: [["村径尽头藏清涧，溪中鱼虾戏浅滩。曾蹲溪畔忙摸鱼，指尖沾湿意未闲。儿时的小道走到尽头，便是一汪清澈的溪流，溪底铺着光滑的鹅卵石，鱼虾在石缝间穿梭，藏着童年最鲜活的欢喜。我总爱挽起裤脚，赤脚踏入溪水，弯腰在石缝间摸索，追逐着灵动的鱼虾，哪怕浑身湿透、满身泥泞，也藏不住眉眼间的雀跃。溪水流淌，带走了夏日的燥热，也带走了年少的时光，只留溪畔欢声，静候故人归来。"]],
						playConvoAfter: [["溪风携着水汽，漫过掌心的微凉，一如儿时触碰溪水的模样。那些蹲在溪畔摸鱼的午后，那些赤脚踏水追逐鱼虾的时光，从未被溪流带走，都藏在每一缕溪风、每一滴水珠里。所谓欢喜，从不是满载而归的鱼虾，而是年少时无所顾忌的雀跃，是指尖沾湿的清凉，是溪水流淌间，藏不住的温柔过往。"]],
					},
					difficulty: {
						1: {
							bossInfo: {
								id: "jaf_smallFish",
							},
							global: {
								loopFirst: 0,
							},
						},
						2: {
							bossInfo: {
								id: "jaf_smallFish",
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
								loopFirst: 0,
							},
						},
						3: {
							bossInfo: {
								id: "jaf_grass",
								minions: [
									{
										seat: 2,
										name: "jaf_smallFish",
									},
									{
										seat: 6,
										name: "jaf_smallFish",
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
					currency: "eyJtZW1vcnlaaHUiOlszLDEzXSwiZHJlYW1EaWFuIjoxLCJqaWFuZ0Z1IjpbMiw3XX0=|492a2779",
				},
			},
			c1l3: {
				title: "田野",
				intro: "溪畔行尽入平野，稻浪翻风覆陇黄。曾逐蜻蜓穿稻海，满身稻香带斜阳。溪涧旁，便是一望无际的田野，稻穗在风里摇摇晃晃，翻出金色的浪涛。我总爱追着蜻蜓跑过田埂，踩碎一路的日光，累了就躺在田垄上，闻着稻香看云卷云舒。稻草人立在田中央，戴着破旧的草帽，像个沉默的卫士，守护着这片田野，也守护着我儿时的梦。晚风掠过稻浪，带走了蝉鸣，也带走了年少的喧嚣，只留稻香悠悠，漫过岁月长廊。",
				hint: "敌人具有卡牌反弹，建议上场直伤角色。",
				gameData: {
					convo: {
						playConvoBefore: [["溪畔行尽入平野，稻浪翻风覆陇黄。曾逐蜻蜓穿稻海，满身稻香带斜阳。溪涧旁，便是一望无际的田野，稻穗在风里摇摇晃晃，翻出金色的浪涛。我总爱追着蜻蜓跑过田埂，踩碎一路的日光，累了就躺在田垄上，闻着稻香看云卷云舒。稻草人立在田中央，戴着破旧的草帽，像个沉默的卫士，守护着这片田野，也守护着我儿时的梦。晚风掠过稻浪，带走了蝉鸣，也带走了年少的喧嚣，只留稻香悠悠，漫过岁月长廊。"]],
						playConvoAfter: [["晚风裹着稻香，拂过发梢的温柔，一如儿时躺在田垄上的模样。那些追着蜻蜓跑过的田埂，那些伴着蝉鸣入睡的午后，从未被岁月吹散，都藏在每一株稻穗的纹路里。所谓归处，从不是远方的繁华，而是田野里的稻香阵阵，是稻草人沉默的守护，是年少时无忧无虑的时光。"]],
					},
					difficulty: {
						1: {
							bossInfo: {
								id: "jaf_scarecrow",
							},
							global: {
								loopFirst: 0,
							},
						},
						2: {
							bossInfo: {
								id: "jaf_scarecrow",
								minions: [
									{
										seat: 2,
										name: "jaf_dragonfly",
									},
									{
										seat: 6,
										name: "jaf_dragonfly",
									},
								],
							},
							global: {
								loopFirst: 0,
							},
						},
						3: {
							bossInfo: {
								id: "jaf_scarecrow",
								expand: {
									maxHp: 4,
									hujia: 2,
								},
								minions: [
									{
										seat: 2,
										name: "jaf_dragonfly",
									},
									{
										seat: 3,
										name: "jaf_smallFish",
									},
									{
										seat: 5,
										name: "jaf_smallFish",
									},
									{
										seat: 6,
										name: "jaf_dragonfly",
									},
								],
							},
							global: {
								loopFirst: 0,
							},
						},
					},
				},
				reward: {
					currency: "eyJtZW1vcnlaaHUiOls1LDIwXSwiZHJlYW1EaWFuIjpbMSwyXSwiamlhbmdGdSI6WzcsMTJdfQ==|-1dc2972a",
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
