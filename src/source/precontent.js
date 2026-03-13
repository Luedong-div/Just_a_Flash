import { game, lib, get } from "noname";
import millenDreamMain from "../mode/millenDream/main.js";
import { basic } from "./basic.js";
import millenDreamCharacters from "../packages/character/millenDream/index.js";
import millenDreamCards from "../packages/card/millenDreamCard/index.js";

import extendGet from "../components/extendMethod/get.js";

export async function precontent() {
	lib.init.css(lib.assetURL + "extension/忽然而已/assets/css", "main");
	Object.assign(get, extendGet);

	await millenDreamMain();
	await game.addGroup("jaf_dream", "梦", "梦", {
		color: [
			[255, 50, 50, 1],
			[255, 100, 80, 1],
			[255, 180, 160, 1],
			[255, 180, 160, 0.5],
		],
		image: `${basic.extensionDirectoryPath}/assets/image/others/jaf_dream.png`,
	});
	lib.translate.jaf_dream = "梦";
	lib.groupnature.jaf_dream = "soil";
	await game.import("character", () => {
		lib.translate["millenDream_character_config"] = "忽然而已";
		return millenDreamCharacters;
	});
	await game.import("card", () => {
		for (const i in millenDreamCards.card) {
			millenDreamCards.card[i].image = `${basic.extensionDirectoryPath}/assets/image/card/${i}.jpg`;
		}

		lib.config.all.cards.push("millenDreamCard");
		lib.translate["millenDreamCard_card_config"] = "忽然而已";

		return millenDreamCards;
	});
}
