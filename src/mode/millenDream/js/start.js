import startBefore from "./startBefore.js";
import { _status, game, lib, ui, get } from "noname";
import SHOP_DATA from "../data/SHOP_DATA.js";

async function handleInfo(target, info) {
	const expand = info.expand || {};
	if (expand.hp) {
		target.hp = expand.hp;
	}
	if (expand.maxHp) {
		target.maxHp = expand.maxHp;
	}
	if (expand.hujia) {
		target.hujia = expand.hujia;
	}
	const skills = info.skills || [];
	if (skills.length > 0) {
		await target.addSkills(skills, false);
	}
	const cardsMap = info.cards || {};

	for (const key in cardsMap) {
		const cards = cardsMap[key].map(ls => {
			const card = Array.isArray(ls) ? game.createCard2(ls[0], ls[1], ls[2], ls[3]) : game.createCard2(ls);
			if (Array.isArray(ls) && ls[4]) {
				card.storage = ls[4];
			}
			return card;
		});

		if (key === "h") {
			target.directgain(cards);
		} else if (key === "e") {
			for (const equip of cards) {
				await target.equip(equip);
			}
		} else if (key === "j") {
			for (const judge of cards) {
				await target.addJudge(judge, [judge]);
			}
		}
	}
}

async function addSideFellow(info, side = true) {
	let text = side ? "zhong" : "cai";
	const fellow = game.addFellow(info.seat, info.name, "zoominanim");
	fellow.side = side;
	fellow.identity = text;
	fellow.setIdentity(text);
	await handleInfo(fellow, info);
	game.addVideo("setIdentity", fellow, text);
}

async function handleExpandInfo() {
	const player = game.me;
	const items = _status.permanentBoostItem;
	const skills = Object.keys(_status.permanentBoostItem || {}).reduce((arr, key) => {
		if (items[key] > 0 && SHOP_DATA[key]?.skills) {
			if (Array.isArray(SHOP_DATA[key].skills)) {
				arr.push(...SHOP_DATA[key].skills);
			} else {
				arr.push(SHOP_DATA[key].skills);
			}
		}
		return arr;
	}, []);
	if (skills.length) {
		await player.addSkills(skills);
	}
	if (_status.additionalEffect?.length || skills.length) {
		await player.addSkills(_status.additionalEffect);
		lib.setPopped(
			(ui.system = ui.create.system("道具", null, true, true)),
			() => {
				const uiIntro = ui.create.dialog("hidden");
				uiIntro.addText("增益效果").style.margin = "0";
				if (_status.additionalEffect?.length) {
					const effectList = ui.create.div(".text", _status.additionalEffect.map(s => `【${get.translation(s)}】${get.translation(s + "_info") || ""}`).join("</br></br>"));
					effectList.style.textAlign = "left";
					uiIntro._place_text = uiIntro.add(effectList);
				}
				if (skills.length) {
					const skillList = ui.create.div(".text", skills.map(s => `【${get.translation(s)}】${get.translation(s + "_info") || ""}`).join("</br></br>"));
					skillList.style.textAlign = "left";
					uiIntro._place_text = uiIntro.add(skillList);
				}

				uiIntro.add(ui.create.div(".placeholder.slim"));
				return uiIntro;
			},
			400
		);
	}
}

export default async function (event, trigger, player) {
	const playback = localStorage.getItem(lib.configprefix + "playback");
	if (playback) {
		ui.create.me();
		ui.arena.style.display = "none";
		ui.system.style.display = "none";
		_status.playback = playback;
		localStorage.removeItem(lib.configprefix + "playback");
		const store = lib.db.transaction(["video"], "readwrite").objectStore("video");
		store.get(parseInt(playback)).onsuccess = function (e) {
			if (e.target.result) {
				game.playVideoContent(e.target.result.video);
			} else {
				alert("播放失败：找不到录像");
				game.reload();
			}
		};
		return;
	}
	const startInfo = await startBefore();
	if (!startInfo?.started) return;
	_status.millenDreamStartInfo = startInfo;
	const difficulty = startInfo.difficulty;
	const levelInfo = startInfo.gameData.difficulty[difficulty];
	// 正常开始游戏相关舞台准备

	// 剔除所有座位相关技能
	for (const i in lib.skill) {
		if (lib.skill[i].seatRelated === true) {
			lib.skill[i] = {};
			lib.translate[i + "_info"] = "此模式下不可用";
		}
	}

	// 舞台准备
	_status.prepareArena = true;
	ui.arena.setNumber(8);
	ui.create.cardsAsync();
	game.finishCards();
	_status.mode = "millenDream";
	game.players = [];
	await game.chooseCharacter();

	// boss信息
	const boss = ui.create.player();
	game.boss = boss;
	boss.init(levelInfo.bossInfo.id);
	boss.side = true;
	boss.addTempClass("start");
	boss.setIdentity("zhu");
	boss.identity = "zhu";
	ui.arena.appendChild(boss);
	boss.dataset.position = 4;
	game.players.add(boss);

	// 开始游戏
	game.arrangePlayers();
	if (levelInfo.global?.init && typeof levelInfo.global.init === "function") {
		levelInfo.global.init();
	}
	for (const target of game.players) {
		target.getId();
		target.init(target.name);
	}
	if (levelInfo.bossInfo) await handleInfo(boss, levelInfo.bossInfo);
	if (levelInfo.meInfo) await handleInfo(game.me, levelInfo.meInfo);
	for (const minion of levelInfo.bossInfo?.minions || []) {
		await addSideFellow(minion, true);
	}
	for (const minion of levelInfo.meInfo?.minions || []) {
		await addSideFellow(minion, false);
	}
	await game.gameDraw(game.boss, levelInfo.global?.gameDraw || 4);
	for (const target of game.players) {
		target._start_cards = target.getCards("h");
	}

	async function replaceHandCards(event, handCards) {
		const cards = [];
		const pile = event.otherPile?.[game.me.playerid];
		const otherGetCards = pile?.getCards;
		const otherDiscard = pile?.discard;
		game.addVideo("lose", game.me, [get.cardsInfo(handCards), [], [], []]);
		for (const card of handCards) {
			card.removeGaintag(true);
			if (otherDiscard) {
				otherDiscard(card);
			} else {
				card.discard(false);
			}
		}
		if (otherGetCards) {
			cards.addArray(otherGetCards(handCards.length));
		} else {
			cards.addArray(get.cards(handCards.length));
		}
		const gaintag = event.gaintag?.[game.me.playerid];
		if (gaintag) {
			const list = typeof gaintag == "function" ? gaintag(handCards.length, cards) : [[cards, gaintag]];
			for (let i = list.length - 1; i >= 0; i--) {
				game.me.directgain(list[i][0], null, list[i][1]);
			}
		} else {
			game.me.directgain(cards);
		}
		game.me._start_cards = game.me.getCards("h");
	}
	let remainingChanges = Number(get.config("change_card"));
	while (remainingChanges > 0) {
		const next = await game.me
			.chooseBool(`是否更换手牌？（剩余${get.cnNumber(remainingChanges)}次）`)
			.set("ai", () => false)
			.forResult();
		if (!next.bool) {
			break;
		}
		remainingChanges--;
		await replaceHandCards(event, game.me.getCards("h"));
	}
	let firstPlayer;
	if (typeof levelInfo?.global?.loopFirst === "number") {
		firstPlayer = game.findPlayer(i => Number(i.dataset.position) == levelInfo.global.loopFirst) || i == game.boss;
	} else {
		firstPlayer = game.boss;
	}
	await event.trigger("gameStart");
	await handleExpandInfo();
	setTimeout(function () {
		ui.updatehl();
	}, 200);

	const convo = typeof startInfo.gameData.convo?.playConvoBefore === "function" ? startInfo.gameData.convo.playConvoBefore() : startInfo.gameData.convo?.playConvoBefore || [];
	if (convo.length) {
		await game.playConvo(convo);
	}

	await game.phaseLoop(firstPlayer);
}
