import { _status, game, lib } from "noname";

export default {
	player: {
		async dieAfter() {
			const sides = [...new Set(game.filterPlayer().map(p => p.side))];
			if (sides.length == 1) {
				if (sides[0] == false) {
					const convo = _status.millenDreamStartInfo.gameData.convo?.playConvoAfter || [];
					if (convo?.length) {
						await game.playConvo(convo);
					}
					await game.checkResult();
					game.over(true);
				} else {
					game.over(false);
				}
			}
		},
	},
};
