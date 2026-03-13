import { game, lib } from "noname";
import config from "./js/config.js";
import start from "./js/start.js";
import translate from "./js/translate.js";
import expandGame from "./js/game.js";
import expandGet from "./js/get.js";
import element from "./js/element.js";
import skill from "./js/skill.js";

const splash = lib.assetURL + "extension/忽然而已/assets/image/mode/millenDream/millenDream.png";

/** @type { importModeConfig }*/
const main = {
	name: "millenDream",
	game: expandGame,
	get: expandGet,
	splash,
	start,
	translate,
	element,
	skill,
};

export default async () => {
	const extname = "忽然而已";
	lib.config.all.mode.push("millenDream");
	lib.translate.millenDream = "千禧梦";
	lib.mode.millenDream = {
		name: "千禧梦",
		config,
		splash,
		fromextension: true,
	};
	lib.init["setMode_millenDream"] = async () => {
		await game.import("mode", (lib2, game2, ui2, get2, ai2, _status2) => {
			return main;
		});
	};
	lib.config.extensionInfo[extname] ??= {};
	lib.config.extensionInfo[extname].mode ??= ["millenDream"];
	game.saveConfig("extensionMode", lib.config.extensionInfo);
};
