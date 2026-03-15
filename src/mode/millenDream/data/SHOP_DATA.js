import { decryptAndVerifyConfig } from "../../../components/polyfill.js";
const SHOP_TEST_IMAGE = `extension/忽然而已/assets/image/mode/millenDream/test.jpg`;
/** @type {import('../../../../types/SHOP_DATA.js').ShopConfig} */

const SHOP_DATA = {
	gacha: {
		name: "抽卡",
		goods: {
			pool_f: {
				prizePool: { type: "character_rank", poolKey: "f" },
				duplicateJiangFu: 1,
				price: "eyJtZW1vcnlaaHUiOjEwfQ==|1486fa78", // 10
			},
			pool_d: {
				prizePool: { type: "character_rank", poolKey: "d" },
				duplicateJiangFu: 2,
				price: "eyJtZW1vcnlaaHUiOjMwfQ==|148701fa", // 30
			},
			pool_c: {
				prizePool: { type: "character_rank", poolKey: "c" },
				duplicateJiangFu: 5,
				price: "eyJtZW1vcnlaaHUiOjUwfQ==|1487097c", // 50
			},
			pool_b: {
				prizePool: { type: "character_rank", poolKey: "b" },
				duplicateJiangFu: 10,
				price: "eyJtZW1vcnlaaHUiOjE1MH0=|7c57faf9", // 150
			},
			pool_a: {
				prizePool: { type: "character_rank", poolKey: "a" },
				duplicateJiangFu: 15,
				price: "eyJtZW1vcnlaaHUiOjI1MH0=|7c586f58", // 250
			},
			pool_s: {
				prizePool: { type: "character_rank", poolKey: "s" },
				duplicateJiangFu: 20,
				price: "eyJtZW1vcnlaaHUiOjM1MH0=|7c58e3b7", // 350
			},
			pool_ss: {
				prizePool: { type: "character_rank", poolKey: "ss" },
				duplicateJiangFu: 25,
				price: "eyJtZW1vcnlaaHUiOjUwMH0=|7c59b9b0", // 500
			},
			pool_sss: {
				prizePool: { type: "character_rank", poolKey: "sss" },
				duplicateJiangFu: 30,
				price: "eyJtZW1vcnlaaHUiOjEwMDB9|ea4b1f8", // 1000
			},
		},
	},
	boostItem: {
		name: "对局增益",
		usable: true,
		goods: {
			greenTongue: {
				price: "eyJkcmVhbURpYW4iOjF9|293f6803",
				repeatable: true,
				skills: ["greenTongue_effect"],
			},
			driedPersimmon: {
				price: "eyJkcmVhbURpYW4iOjF9|293f6803",
				repeatable: true,
				skills: ["driedPersimmon_effect"],
			},
			jujubeCake: {
				price: "eyJkcmVhbURpYW4iOjF9|293f6803",
				repeatable: true,
				skills: ["jujubeCake_effect"],
			},
			pineNutCandy: {
				price: "eyJkcmVhbURpYW4iOjF9|293f6803",
				repeatable: true,
				skills: ["pineNutCandy_effect"],
			},
			whiteRabbitCandy: {
				price: "eyJkcmVhbURpYW4iOjF9|293f6803",
				repeatable: true,
				skills: ["whiteRabbitCandy_effect"],
			},
			popRocks: {
				price: "eyJkcmVhbURpYW4iOjF9|293f6803",
				repeatable: true,
				skills: ["popRocks_effect"],
			},
			spicyStrips: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["spicyStrips_effect"],
			},
			maltesers: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["maltesers_effect"],
			},
			skittles: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["skittles_effect"],
			},
			marshmallow: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["marshmallow_effect"],
			},
			pudding: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["pudding_effect"],
			},
			hawthornSlice: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["hawthornSlice_effect"],
			},
			whistleCandy: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["whistleCandy_effect"],
			},
			AdCalciumMilk: {
				price: "eyJkcmVhbURpYW4iOjJ9|293f6822",
				repeatable: true,
				skills: ["AdCalciumMilk_effect"],
			},
		},
	},
	permanentBoostItem: {
		name: "持久增益",
		goods: {
			p_armor: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjUwfQ==|-152c4f3", // 50
				skills: ["p_armor_effect"],
			},
			p_hp: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjEwMH0=|-2908173d", // 100
				skills: ["p_hp_effect"],
			},
			p_drawCount: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjIwMH0=|-2907a2de", // 200
				skills: ["p_drawCount_effect"],
			},
			p_distance_subtraction: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjIwMH0=|-2907a2de", // 200
				skills: ["p_distance_subtraction_effect"],
			},
			p_distance_addition: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjMwMH0=|-29072e7f", // 300
				skills: ["p_distance_addition_effect"],
			},
			p_skill: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjUwMH0=|-290645c1", // 500
				skills: ["p_skill_effect"],
			},
			p_damage: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjEwMDB9|804c349", // 1000
				skills: ["p_damage_effect"],
			},
			p_revive: {
				repeatable: true,
				price: "eyJkcmVhbURpYW4iOjIwMDB9|812daca", // 2000
				skills: ["p_revive_effect"],
			},
		},
	},
	skins: {
		name: "外观阁",
		goods: {
			"skin-1": { name: "秋岚·边框", price: "eyJkcmVhbURpYW4iOjF9|293f6803", desc: "测试", image: SHOP_TEST_IMAGE, repeatable: false },
			"skin-2": { name: "墨荷·头像框", price: "eyJkcmVhbURpYW4iOjF9|293f6803", desc: "测试", image: SHOP_TEST_IMAGE, repeatable: false },
			"skin-3": { name: "星河·名片", price: "eyJkcmVhbURpYW4iOjF9|293f6803", desc: "测试", image: SHOP_TEST_IMAGE, repeatable: false },
		},
	},
	giftpack: {
		name: "礼包区",
		goods: {
			"pack-1": { name: "新手礼包", price: "eyJkcmVhbURpYW4iOjF9|293f6803", desc: "测试", image: SHOP_TEST_IMAGE, repeatable: false },
			"pack-2": { name: "进阶礼包", price: "eyJkcmVhbURpYW4iOjF9|293f6803", desc: "测试", image: SHOP_TEST_IMAGE, repeatable: false },
		},
	},
};

for (const category in SHOP_DATA) {
	const goods = SHOP_DATA[category]?.goods;
	if (goods && typeof goods === "object") {
		for (const [itemId, item] of Object.entries(goods)) {
			item.price = decryptAndVerifyConfig(item.price, "shaonian");
			if (!item.image) {
				if (category != "gacha") {
					item.image = `extension/忽然而已/assets/image/mode/millenDream/${itemId}.jpg`;
				} else {
					item.image = `extension/忽然而已/assets/image/mode/millenDream/draw.jpg`;
				}
			}
		}
	}
}

export default SHOP_DATA;
