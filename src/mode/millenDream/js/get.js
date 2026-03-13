import { _status, game, lib } from "noname";

export default {
	rawAttitude(from, to) {
		const num = to.identity == "zhong" ? 5 : 6;
		return from.side === to.side ? num : -num;
	},
	currentLevelDifficulty() {
		return _status.millenDreamStartInfo?.difficulty || null;
	},
};
