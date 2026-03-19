import { _status, game, lib } from "noname";
export default {
	/**
	 * 章节对话播放（支持旁白与角色台词）
	 * lines 结构：
	 * - ["旁白文本"]
	 * - ["characterId", "角色台词"]
	 * @param {Array<Array<string>>} lines
	 * @returns {Promise<void>}
	 */
	async playConvo(lines = []) {
		const normalizedLines = (Array.isArray(lines) ? lines : [])
			.map(entry => {
				if (Array.isArray(entry)) {
					const cleaned = entry.map(item => String(item ?? "").trim()).filter(Boolean);
					return cleaned;
				}
				const text = String(entry ?? "").trim();
				return text ? [text] : [];
			})
			.filter(entry => entry.length > 0);

		if (!normalizedLines.length) return;

		return new Promise(resolve => {
			let index = 0;
			let finished = false;
			let currentDialog = null;
			let resizeListener = null;
			let keydownListener = null;

			const cleanupCurrentDialog = () => {
				if (resizeListener) {
					window.removeEventListener("resize", resizeListener);
					resizeListener = null;
				}

				try {
					if (currentDialog && typeof currentDialog.close === "function") {
						currentDialog.close();
					}
				} catch {}

				if (currentDialog?.remove && currentDialog.isConnected) {
					currentDialog.remove();
				}
				currentDialog = null;

				while (ui.controls?.length) {
					try {
						ui.controls[0].close();
					} catch {
						break;
					}
				}
			};

			const finish = () => {
				if (finished) return;
				finished = true;

				if (keydownListener) {
					document.removeEventListener("keydown", keydownListener, true);
					keydownListener = null;
				}

				cleanupCurrentDialog();

				try {
					ui.auto?.show?.();
				} catch {}
				try {
					game.resume?.();
				} catch {}
				resolve();
			};

			const playNext = () => {
				if (finished) return;
				cleanupCurrentDialog();

				if (index >= normalizedLines.length) {
					finish();
					return;
				}

				const entry = normalizedLines[index];
				const isNarration = entry.length <= 1;
				const speakerId = isNarration ? "" : String(entry[0]);
				const dialogText = entry[entry.length - 1] || "";
				const speakerName = !isNarration ? get.translation(speakerId) || speakerId : "";

				const dialog = ui.create.dialog();
				currentDialog = dialog;
				dialog.classList.add("jaf-convo-dialog", "scroll");
				dialog.style.width = "70%";
				dialog.style.margin = "auto";
				dialog.style.left = "0";
				dialog.style.right = "0";
				if (isNarration) dialog.classList.add("is-narration");

				if (!isNarration) {
					const avatarWrap = ui.create.div(".jaf-convo-avatar-wrap", dialog);
					const avatar = ui.create.div(".avatar.jaf-convo-avatar", avatarWrap);
					avatar.setBackground(speakerId, "character");
				}

				const next = dialog.addText(`<div class="jaf-convo-content">${isNarration ? "" : `<div class="jaf-convo-speaker">${speakerName}</div>`}<div class="jaf-convo-text">${dialogText}</div></div>`, false);

				next.style.height = "25%";
				next.content.style.height = "100%";
				next.content.firstChild.style.height = "100%";

				dialog.open();
				ui.auto?.hide?.();

				window.addEventListener("resize", resizeListener);

				const goNext = () => {
					if (finished) return;
					index += 1;
					playNext();
				};

				ui.create.control("继续", goNext);
				ui.create.control("跳过", finish);
			};

			keydownListener = event => {
				if (finished) return;
				const target = event.target;
				const tagName = String(target?.tagName || "").toLowerCase();
				if (target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select") return;

				if (event.key === "Escape") {
					event.preventDefault();
					event.stopImmediatePropagation();
					finish();
					return;
				}

				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					event.stopImmediatePropagation();
					index += 1;
					playNext();
				}
			};

			document.addEventListener("keydown", keydownListener, true);
			try {
				game.pause?.();
			} catch {}
			playNext();
		});
	},
	/**
	 * 检查游戏结束条件
	 */
	async checkResult() {
		if (_status.jafOnWin && typeof _status.jafOnWin === "function") {
			await _status.jafOnWin();
		}
		game.reload();
	},
	/**
	 * 角色选择界面
	 */
	async chooseCharacter() {
		ui.arena.classList.add("choose-character");
		const dialog = ui.create.characterDialog("请选择参战角色", "heightset", function (name) {
			return !_status.characterlist.includes(name);
		});
		const player = ui.create.player();
		game.me = player;
		const result = await game.me
			.chooseButton(true, dialog)
			.set("ai", () => Math.random())
			.forResult();
		player.init(result.links[0]).addTempClass("start");
		player.setIdentity("cai");
		player.identity = "cai";
		ui.arena.appendChild(player);
		player.side = false;
		game.players.add(player);
		player.dataset.position = 0;

		ui.create.me();
		ui.fakeme = ui.create.div(".fakeme.avatar", ui.me);
		ui.fakeme.style.display = "none";

		setTimeout(function () {
			ui.arena.classList.remove("choose-character");
		}, 500);
	},
};
