const e = "extension/忽然而已/assets/image/mode/millenDream/test.jpg",
	a = [
		{
			id: "gacha",
			name: "抽卡",
			goods: [
				{ id: "pool-f", name: "武将卡池一", prizePool: { type: "character_rank", poolKey: "f" }, duplicateJiangFu: 1, singleCostMemoryZhu: 10, desc: "抽取 f 阶武将，十连必出新武将" },
				{ id: "pool-d", name: "武将卡池二", prizePool: { type: "character_rank", poolKey: "d" }, duplicateJiangFu: 2, singleCostMemoryZhu: 30, desc: "抽取 d 阶武将，十连必出新武将" },
				{ id: "pool-c", name: "武将卡池三", prizePool: { type: "character_rank", poolKey: "c" }, duplicateJiangFu: 5, singleCostMemoryZhu: 50, desc: "抽取 c 阶武将，十连必出新武将" },
				{ id: "pool-b", name: "武将卡池四", prizePool: { type: "character_rank", poolKey: "b" }, duplicateJiangFu: 10, singleCostMemoryZhu: 150, desc: "抽取 b 阶武将，十连必出新武将" },
				{ id: "pool-a", name: "武将卡池五", prizePool: { type: "character_rank", poolKey: "a" }, duplicateJiangFu: 15, singleCostMemoryZhu: 250, desc: "抽取 a 阶武将，十连必出新武将" },
				{ id: "pool-s", name: "武将卡池六", prizePool: { type: "character_rank", poolKey: "s" }, duplicateJiangFu: 20, singleCostMemoryZhu: 350, desc: "抽取 s 阶武将，十连必出新武将" },
				{ id: "pool-ss", name: "武将卡池七", prizePool: { type: "character_rank", poolKey: "ss" }, duplicateJiangFu: 25, singleCostMemoryZhu: 500, desc: "抽取 ss 阶武将，十连必出新武将" },
				{ id: "pool-sss", name: "武将卡池八", prizePool: { type: "character_rank", poolKey: "sss" }, duplicateJiangFu: 30, singleCostMemoryZhu: 1e3, desc: "抽取 sss 阶武将，十连必出新武将" },
			],
		},
		{
			id: "snacks",
			name: "零食铺",
			goods: [
				{ id: "snack-1", name: "测试", price: { memoryZhu: 120 }, desc: "甜而不腻，开局补一口。", image: e, repeatable: !1 },
				{ id: "snack-2", name: "松子糖", price: { memoryZhu: 120 }, desc: "甜而不腻，开局补一口。", image: e, repeatable: !0 },
				{ id: "snack-3", name: "桂花酥", price: { memoryZhu: 180 }, desc: "酥香四溢，适合长局作战。", image: e, repeatable: !0 },
				{ id: "snack-4", name: "杏仁饼", price: { memoryZhu: 150 }, desc: "便携点心，战前补给首选。", image: e, repeatable: !0 },
				{ id: "snack-5", name: "芝麻饼", price: { memoryZhu: 180 }, desc: "香脆可口，适合午后小憩。", image: e, repeatable: !0 },
				{ id: "snack-6", name: "蜜饯果干", price: { memoryZhu: 200 }, desc: "酸甜适中，补充体力。", image: e, repeatable: !0 },
				{ id: "snack-7", name: "蜜饯果干", price: { memoryZhu: 200 }, desc: "酸甜适中，补充体力。", image: e, repeatable: !0 },
				{ id: "snack-8", name: "蜜饯果干", price: { memoryZhu: 200 }, desc: "酸甜适中，补充体力。", image: e, repeatable: !0 },
				{ id: "snack-9", name: "坚果拼盘", price: { memoryZhu: 250 }, desc: "营养丰富，适合战后恢复。", image: e, repeatable: !0 },
				{ id: "snack-10", name: "桂花糕", price: { memoryZhu: 180, dreamDian: 5 }, desc: "软糯香甜，适合午后小憩。", image: e, repeatable: !0 },
				{ id: "snack-11", name: "测试", price: {}, desc: "软糯香甜，适合午后小憩。", image: e, repeatable: !0 },
			],
		},
		{
			id: "props",
			name: "道具坊",
			goods: [
				{ id: "prop-1", name: "旧罗盘", price: { memoryZhu: 260 }, desc: "据说能指向好运的方向。", image: e, repeatable: !1 },
				{ id: "prop-2", name: "萤石灯", price: { memoryZhu: 320 }, desc: "夜战照明，观感+1。", image: e, repeatable: !1 },
				{ id: "prop-3", name: "风纹护符", price: { memoryZhu: 500, jiangFu: 3 }, desc: "护身用，心理安慰拉满。", image: e, repeatable: !1 },
			],
		},
		{
			id: "skins",
			name: "外观阁",
			goods: [
				{ id: "skin-1", name: "秋岚·边框", price: { dreamDian: 28 }, desc: "淡金色主题边框。", image: e, repeatable: !1 },
				{ id: "skin-2", name: "墨荷·头像框", price: { dreamDian: 24 }, desc: "水墨风头像框。", image: e, repeatable: !1 },
				{ id: "skin-3", name: "星河·名片", price: { dreamDian: 32, jiangFu: 1 }, desc: "闪烁粒子名片样式。", image: e, repeatable: !1 },
			],
		},
		{
			id: "giftpack",
			name: "礼包区",
			goods: [
				{ id: "pack-1", name: "新手礼包", price: { memoryZhu: 300 }, desc: "基础资源组合包。", image: e, repeatable: !1 },
				{ id: "pack-2", name: "进阶礼包", price: { memoryZhu: 900, dreamDian: 5 }, desc: "适合已熟悉玩法的玩家。", image: e, repeatable: !1 },
			],
		},
	];
export default a;
