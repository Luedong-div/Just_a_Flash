// import { millenDreamCard_taboo, millenDreamCard_tabooSkill, millenDreamCard_tabooTranslate } from './taboo.js';
// import { millenDreamCard_trick, millenDreamCard_trickSkill, millenDreamCard_trickTranslate } from './trick.js';
import { millenDreamCard_equip, millenDreamCard_equipSkill, millenDreamCard_equipTranslate } from "./equip.js";

export default {
	name: "millenDreamCard",
	connect: true,
	list: [],
	skill: {
		// ...millenDreamCard_tabooSkill,
		// ...millenDreamCard_trickSkill,
		...millenDreamCard_equipSkill,
	},
	card: {
		// ...millenDreamCard_taboo,
		// ...millenDreamCard_trick,
		...millenDreamCard_equip,
	},
	translate: {
		// ...millenDreamCard_tabooTranslate,
		// ...millenDreamCard_trickTranslate,
		...millenDreamCard_equipTranslate,
	},
};
