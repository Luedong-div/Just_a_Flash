import { game as e, lib as m } from "noname";
import a from "./js/config.js";
import r from "./js/start.js";
import s from "./js/translate.js";
import t from "./js/game.js";
import n from "./js/get.js";
import o from "./js/element.js";
const i = m.assetURL + "extension/忽然而已/assets/image/mode/millenDream/millenDream.png",
	l = { name: "millenDream", game: t, get: n, splash: i, start: r, translate: s, element: o, skill: { m: { charlotte: !0, ruleSkill: !0, ai: { viewHandcard: !0, skillTagFilter: (e, m, a) => e.side == a.side } } } };
export default async () => {
	const r = "忽然而已";
	(m.config.all.mode.push("millenDream"),
		(m.translate.millenDream = "千禧梦"),
		(m.mode.millenDream = { name: "千禧梦", config: a, splash: i, fromextension: !0 }),
		(m.init.setMode_millenDream = async () => {
			await e.import("mode", (e, m, a, r, s, t) => l);
		}),
		(m.config.extensionInfo[r] ??= {}),
		(m.config.extensionInfo[r].mode ??= ["millenDream"]),
		e.saveConfig("extensionMode", m.config.extensionInfo));
};
