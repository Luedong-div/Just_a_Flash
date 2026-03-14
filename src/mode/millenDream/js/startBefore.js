import { _status, game, lib, ui, get } from "noname";
import { MapleFallingEffect } from "../../../components/effects/mapleFalling.js";
import { basic } from "../../../source/basic.js";
import CHAPTERS from "../data/CHAPTERS.js";
import SHOP_DATA from "../data/SHOP_DATA.js";
import treasure from "./treasure.js";
import { encryptConfig, decryptAndVerifyConfig, ensureCheatButtonWatcherInstalled } from "../../../components/polyfill.js";
import { mountMillenDreamEntryVueApp } from "../../../components/vue/apps/index.js";

let startBeforeSessionToken = 0;
let gameData;
let entryDialogApi = null;

/**
 * 创建 DOM 元素的辅助函数，支持设置类名、文本内容、HTML 内容和属性
 * @param {string} tagName - 要创建的元素标签名
 * @param {Object} param1 - 元素属性对象
 * @param {string} param1.className - 元素的 CSS 类名
 * @param {string} param1.text - 元素的文本内容
 * @param {string} param1.html - 元素的 HTML 内容（优先于 text）
 * @param {Object} param1.attrs - 元素的属性对象
 * @returns {HTMLElement} 创建的 DOM 元素
 */
function createElement(tagName, { className, text, html, attrs } = {}) {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (typeof html === "string") {
		element.innerHTML = html;
	} else if (typeof text === "string") {
		element.textContent = text;
	}
	if (attrs) {
		Object.entries(attrs).forEach(([key, value]) => {
			if (value !== undefined && value !== null) element.setAttribute(key, value);
		});
	}
	return element;
}

/**
 * 解析关卡进度 ID（如 c2l3）
 * @param {string} progressId
 * @returns {{chapter: number, level: number} | null}
 */
function parseProgressId(progressId) {
	if (typeof progressId !== "string") return null;
	const match = /^c(\d+)l(\d+)$/i.exec(progressId.trim());
	if (!match) return null;
	const chapter = Number(match[1]);
	const level = Number(match[2]);
	if (!Number.isInteger(chapter) || !Number.isInteger(level) || chapter < 1 || level < 1) {
		return null;
	}
	return { chapter, level };
}
/**
 * 规范化进度 ID，非法值回退到默认进度
 * @param {string} progressId
 * @returns {string}
 */
function normalizeProgressId(progressId) {
	const parsed = parseProgressId(progressId);
	if (!parsed) return "c1l1";
	return `c${parsed.chapter}l${parsed.level}`;
}
/**
 * 关卡是否已解锁（按“章节优先、章内按关卡”比较）
 * @param {string} levelId
 * @param {string} progressId
 * @returns {boolean}
 */
function isLevelUnlockedByProgress(levelId, progressId) {
	const levelParsed = parseProgressId(levelId);
	// 对非标准 ID（如占位关卡）保持兼容，不强制锁定
	if (!levelParsed) return true;

	const progressParsed = parseProgressId(progressId) || parseProgressId("c1l1");
	if (!progressParsed) return true;

	if (levelParsed.chapter < progressParsed.chapter) return true;
	if (levelParsed.chapter > progressParsed.chapter) return false;
	return levelParsed.level <= progressParsed.level;
}
/**
 * 根据当前进度 ID 获取下一个关卡的 ID，按章节和关卡顺序查找，兼容非标准 ID
 * @param {string} currentProgressId
 * @returns {string|null}
 */
function getNextProgressId(currentProgressId) {
	if (!CHAPTERS || typeof CHAPTERS !== "object") return null;

	// 遍历所有章节查找当前关卡
	const chapterIds = Object.keys(CHAPTERS).sort();
	for (let ci = 0; ci < chapterIds.length; ci++) {
		const chapterId = chapterIds[ci];
		const chapter = CHAPTERS[chapterId];
		if (!chapter || !chapter.levels) continue;

		const levelIds = Object.keys(chapter.levels).sort();
		for (let li = 0; li < levelIds.length; li++) {
			const levelId = levelIds[li];
			if (String(levelId) === String(currentProgressId)) {
				// 找到当前关卡，返回下一关
				if (li + 1 < levelIds.length) return levelIds[li + 1];

				// 当前章节没有下一关，找下一章的第一关
				for (let nc = ci + 1; nc < chapterIds.length; nc++) {
					const nextChapter = CHAPTERS[chapterIds[nc]];
					if (!nextChapter || !nextChapter.levels) continue;
					const nextLevelIds = Object.keys(nextChapter.levels).sort();
					if (nextLevelIds.length > 0) return nextLevelIds[0];
				}
				return null;
			}
		}
	}

	// 如果没找到，尝试通过解析ID查找
	const parsed = parseProgressId(currentProgressId);
	if (!parsed) return null;
	const { chapter: ch, level: lv } = parsed;
	const chapterId = `c${ch}`;
	const chapter = CHAPTERS[chapterId];
	if (!chapter || !chapter.levels) return null;

	const levelIds = Object.keys(chapter.levels).sort();
	const nextLevelId = `c${ch}l${lv + 1}`;
	if (levelIds.includes(nextLevelId)) return nextLevelId;

	// 找下一章的第一关
	const nextChapterId = `c${ch + 1}`;
	const nextChapter = CHAPTERS[nextChapterId];
	if (nextChapter && nextChapter.levels) {
		const nextLevelIds = Object.keys(nextChapter.levels).sort();
		if (nextLevelIds.length > 0) return nextLevelIds[0];
	}
	return null;
}

const assetHelpers = {
	/**
	 * 存档函数
	 */
	async saveGameData(newData) {
		if (!newData) {
			newData = gameData;
		}
		const data = encryptConfig(newData, "shaonian");
		game.saveExtensionConfig("忽然而已", "gameData", data);
		ensureGameData();
	},

	/**
	 * 安全地销毁入口根元素相关资源（事件监听、特效实例等）
	 * @param {HTMLElement | null} root - 入口根元素 DOM 对象
	 * @returns {void}
	 */
	disposeEntryRootResources: root => {
		if (!root) return;
		entryDialogApi = null;
		if (typeof root._disposeVueApp === "function") {
			try {
				root._disposeVueApp();
			} catch {}
		}
		if (typeof root._disposeKeydown === "function") {
			try {
				root._disposeKeydown();
			} catch {}
		}
		if (typeof root._disposeAlbumPackWheel === "function") {
			try {
				root._disposeAlbumPackWheel();
			} catch {}
		}
		if (root._mapleEffect && typeof root._mapleEffect.destroy === "function") {
			try {
				root._mapleEffect.destroy();
			} catch {}
		}
	},
	/**
	 * 安全地移除入口根元素，触发离场动画并在动画结束后销毁 DOM，确保资源清理和用户体验
	 * @param {HTMLElement | null} root - 入口根元素 DOM 对象
	 * @returns {void}
	 */
	removeEntryRoot(root) {
		if (!root || !root.isConnected) return;
		assetHelpers.disposeEntryRootResources(root);
		root.classList.add("is-leaving");
		window.setTimeout(() => root.remove(), 260);
	},
	/**
	 *  创建并显示关卡介绍蒙层，支持标题和 HTML 内容，提供无障碍属性，并返回蒙层元素以便后续操作
	 * @param {Object} param0 - 参数对象
	 * @param {string} param0.title - 蒙层标题
	 * @param {string} param0.contentHtml - 蒙层 HTML 内容
	 * @returns {HTMLElement} 创建的蒙层元素
	 */
	addIntroOverlay: ({ title, contentHtml, showFooter = true, showBadge = true }) => {
		if (entryDialogApi && typeof entryDialogApi.showIntroDialog === "function") {
			assetHelpers.removeIntroOverlay();
			const controller = entryDialogApi.showIntroDialog({
				title,
				contentHtml,
				showFooter,
				showBadge,
				ariaLabel: title || "关卡介绍",
			});
			return {
				_disposeDialog: () => controller?.close?.(),
				remove: () => controller?.close?.(),
				get isConnected() {
					return Boolean(controller?.isOpen?.());
				},
			};
		}

		assetHelpers.removeIntroOverlay();

		const overlay = createElement("div", {
			className: "jaf-intro-dialog-overlay",
			attrs: {
				id: "jaf-level-intro-overlay",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": title || "关卡介绍",
			},
		});

		const panel = createElement("div", { className: "jaf-intro-dialog" });
		const corner = createElement("div", { className: "jaf-intro-corner", attrs: { "aria-hidden": "true" } });
		const header = createElement("div", { className: "jaf-intro-header" });
		const titleEl = createElement("h3", { className: "jaf-intro-title", text: title || "关卡介绍" });
		const content = createElement("div", { className: "jaf-intro-content" });

		header.appendChild(titleEl);

		// 根据 showBadge 参数决定是否显示徽章
		if (showBadge) {
			const badge = createElement("span", { className: "jaf-intro-badge", text: "提示" });
			header.appendChild(badge);
		}

		content.innerHTML = contentHtml;

		const elements = [corner, header, content];

		// 根据 showFooter 参数决定是否显示页脚
		if (showFooter) {
			const footer = createElement("div", { className: "jaf-intro-footer" });
			const confirmBtn = createElement("button", { className: "jaf-intro-btn", text: "知道啦" });
			confirmBtn.type = "button";

			footer.appendChild(confirmBtn);
			elements.push(footer);

			confirmBtn.addEventListener("click", () => close());
		}

		panel.append(...elements);
		overlay.appendChild(panel);

		const close = () => {
			document.removeEventListener("keydown", onKeyDown, { capture: true });
			overlay._disposeDialog = null;
			overlay.remove();
		};
		overlay._disposeDialog = close;

		const onKeyDown = event => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopImmediatePropagation();
				close();
			}
		};

		overlay.addEventListener("click", event => {
			if (event.target === overlay) close();
		});
		document.addEventListener("keydown", onKeyDown, { capture: true });

		document.body.appendChild(overlay);
		window.requestAnimationFrame(() => overlay.classList.add("is-open"));

		return overlay;
	},
	/**
	 * 安全地移除介绍蒙层（如果存在），兼容普通 DOM 和可能的第三方弹窗库实例
	 * @returns {void}
	 */
	removeIntroOverlay: () => {
		if (entryDialogApi && typeof entryDialogApi.removeIntroDialog === "function") {
			entryDialogApi.removeIntroDialog();
			return;
		}
		const overlay = document.getElementById("jaf-level-intro-overlay");
		if (!overlay) return;
		if (typeof overlay._disposeDialog === "function") {
			overlay._disposeDialog();
			return;
		}
		overlay.remove();
	},
	/**
	 * 显示关卡介绍对话框，支持换行和基本 HTML 标签
	 * @param {Object} level - 关卡对象，包含 title 和 hint 属性
	 * @returns {void}
	 */
	showLevelIntroDialog(level) {
		const safeHint = level?.hint || "暂无提示信息";
		const html = `
		<p class="jaf-intro-paragraph">${safeHint.replace(/\n/g, "<br>")}</p>
	`;
		assetHelpers.addIntroOverlay({
			title: level?.title,
			contentHtml: html,
		});
	},
	/**
	 * 显示通用提示对话框（复用介绍弹层）
	 * @param {Object} param0
	 * @param {string} param0.title 标题
	 * @param {string} param0.message 内容
	 * @returns {void}
	 */
	showShopNoticeDialog({ title = "提示", message = "操作完成" } = {}) {
		assetHelpers.addIntroOverlay({
			title,
			contentHtml: `<p class="jaf-intro-paragraph">${message}</p>`,
		});
	},

	/**
	 * 通用浮动提示（使用 CSS 管理样式与动效），支持可选位置与自动时长计算
	 * @param {string} message 提示文案
	 * @param {string} where 可选位置，格式为 "top|left"，例如 "0.3|0.5"（相对百分比）
	 * @returns {Promise<void>}
	 */
	async showToast(message, where) {
		document.querySelectorAll(".jaf-showToast").forEach(n => n.remove());

		const div = document.createElement("div");
		div.className = "jaf-showToast";
		div.setAttribute("role", "status");
		div.setAttribute("aria-live", "polite");
		div.textContent = String(message ?? "");

		let top = "30%",
			left = "50%";
		if (where) {
			const parts = String(where).split("|");
			if (parts[0]) top = `${parseFloat(parts[0]) * 100}%`;
			if (parts[1]) left = `${parseFloat(parts[1]) * 100}%`;
		}

		div.style.setProperty("--toast-top", top);
		div.style.setProperty("--toast-left", left);
		div.style.zIndex = 1000001;

		document.body.appendChild(div);

		await new Promise(resolve => setTimeout(resolve, 30));
		div.style.transform = "translate(-50%, -50%) scale(1)";

		// 显示时长 = 基础时长 + 字符数 × 单字符耗时，且限制在 1500ms ~ 4000ms 之间
		const displayTime = Math.min(Math.max(1500 + String(message).length * 50, 1500), 4000);
		await new Promise(resolve => setTimeout(resolve, displayTime));
		div.style.opacity = "0";
		await new Promise(resolve => setTimeout(resolve, 1000));
		if (div.parentNode) div.parentNode.removeChild(div);
	},
	/**
	 * 构建介绍弹窗统一详情布局（图片 + 文本 + 可选操作区）
	 * @param {Object} options
	 * @param {string} options.imageSrc 图片地址
	 * @param {string} options.imageAlt 图片描述
	 * @param {string} options.imageFallbackText 图片兜底文案
	 * @param {string} options.metaHtml 详情区 HTML
	 * @param {boolean} options.withActions 是否包含操作区容器
	 * @returns {string}
	 */
	buildIntroDialogDetailHtml({ imageSrc = "", imageAlt = "详情图片", imageFallbackText = "图片预留", metaHtml = "", withActions = false } = {}) {
		const mediaHtml = imageSrc ? `<img class="jaf-intro-media-image" src="${imageSrc}" alt="${imageAlt}" draggable="false">` : `<div class="jaf-intro-media-fallback">${imageFallbackText}</div>`;

		return `
		<div class="jaf-intro-detail">
			<div class="jaf-intro-media">
				${mediaHtml}
			</div>
			<div class="jaf-intro-meta">
				${metaHtml}
			</div>
			${withActions ? '<div class="jaf-intro-actions" data-role="intro-actions"></div>' : ""}
		</div>
		`;
	},
	/**
	 * 显示商品购买页（点击商品格后打开）
	 * @param {Object} param0
	 * @param {Object} param0.item 商品对象
	 * @param {Object} param0.category 分类对象
	 * @param {boolean} param0.isOwned 是否已拥有
	 * @param {boolean} param0.isRepeatable 是否可重复购买
	 * @param {Function} param0.onPurchase 点击购买回调，返回 Promise<boolean>
	 * @param {{label: string, onClick: Function, className?: string}[]} param0.actionButtons 自定义操作按钮（如单抽/十连）
	 * @returns {HTMLElement | null}
	 */
	showShopPurchaseDialog({ item, isOwned = false, showEffect = true, isRepeatable = false, onPurchase, actionButtons = [], purchase = true } = {}) {
		const safeName = get.translation(item.id);
		const safeDesc = item.desc ? item.desc : get.translation(item.id + "_info").replace(/\n/g, "<br>");
		const safeEffect = item.skills ? item.skills.map(s => s + "_info").map(get.translation) : "该道具无特殊效果";
		const safeImage = item?.image || "";

		const contentHtml = assetHelpers.buildIntroDialogDetailHtml({
			imageSrc: safeImage,
			imageAlt: `${safeName} 图片`,
			imageFallbackText: "图片预留",
			metaHtml: showEffect
				? `
				<p class="jaf-intro-paragraph"><strong>描述：</strong>${safeDesc}</p>
				<p class="jaf-intro-paragraph"><strong>效果：</strong>${safeEffect}</p>
			`
				: `
                <p class="jaf-intro-paragraph"><strong>描述：</strong>${safeDesc}</p>
            `,
			withActions: true,
		});

		if (entryDialogApi && typeof entryDialogApi.showIntroDialog === "function") {
			const customActions = Array.isArray(actionButtons) ? actionButtons.filter(action => action && typeof action.label === "string" && typeof action.onClick === "function") : [];
			const finalActions = customActions.length
				? customActions
				: [
						{
							label: isOwned ? "已拥有" : "立刻购买",
							className: "jaf-intro-action-btn",
							onClick: async () => {
								if (isOwned && !isRepeatable) return false;
								const success = await onPurchase?.();
								return Boolean(success);
							},
							disabled: Boolean(isOwned && !isRepeatable),
						},
					];

			if (finalActions[0]?.disabled) {
				finalActions[0].onClick = async () => false;
			}

			const controller = entryDialogApi.showIntroDialog({
				title: purchase ? `${safeName} · 购买页面` : safeName,
				contentHtml,
				showFooter: false,
				showBadge: false,
				showCloseButton: true,
				closeAriaLabel: "关闭购买页面",
				actionButtons: finalActions.map(action => ({
					label: action.label,
					className: action.className,
					disabled: Boolean(action.disabled),
					onClick: action.onClick,
				})),
			});

			return {
				_disposeDialog: () => controller?.close?.(),
				remove: () => controller?.close?.(),
				get isConnected() {
					return Boolean(controller?.isOpen?.());
				},
			};
		}

		const overlay = assetHelpers.addIntroOverlay({
			title: purchase ? `${safeName} · 购买页面` : safeName,
			contentHtml,
			showFooter: false,
			showBadge: false,
		});

		const close = () => {
			if (typeof overlay?._disposeDialog === "function") {
				overlay._disposeDialog();
				return;
			}
			overlay?.remove?.();
		};

		const introDialog = overlay?.querySelector?.(".jaf-intro-dialog");
		if (introDialog) {
			const closeBtn = createElement("button", {
				className: "jaf-game-close",
				text: "×",
				attrs: {
					type: "button",
					"aria-label": "关闭购买页面",
				},
			});
			closeBtn.addEventListener("click", close);
			introDialog.appendChild(closeBtn);
		}

		const actionsWrap = overlay?.querySelector?.('[data-role="intro-actions"]');
		if (!actionsWrap) return overlay;

		const customActions = Array.isArray(actionButtons) ? actionButtons.filter(action => action && typeof action.label === "string" && typeof action.onClick === "function") : [];

		if (customActions.length) {
			const buttons = customActions.map(action => {
				const btn = createElement("button", {
					className: `jaf-intro-btn jaf-intro-action-btn ${action.className || ""}`.trim(),
					text: action.label,
					attrs: { type: "button" },
				});
				btn.addEventListener("click", async () => {
					if (btn.disabled) return;
					buttons.forEach(node => (node.disabled = true));
					const success = await action.onClick?.();
					if (success) {
						close();
						return;
					}
					if (overlay?.isConnected) {
						buttons.forEach(node => (node.disabled = false));
					}
				});
				actionsWrap.appendChild(btn);
				return btn;
			});
			return overlay;
		}

		const buyBtn = createElement("button", {
			className: "jaf-intro-btn jaf-intro-action-btn",
			text: isOwned ? "已拥有" : "立刻购买",
			attrs: { type: "button" },
		});
		actionsWrap.appendChild(buyBtn);

		if (isOwned && !isRepeatable) {
			buyBtn.disabled = true;
			buyBtn.classList.add("is-disabled");
			return overlay;
		}

		buyBtn.addEventListener("click", async () => {
			if (buyBtn.disabled) return;
			buyBtn.disabled = true;
			const success = await onPurchase?.();
			if (success) {
				close();
				return;
			}
			if (!success && overlay?.isConnected) {
				buyBtn.disabled = false;
			}
		});

		return overlay;
	},
	/**
	 * 安全地关闭启动前 UI（章节选择等），通过 session token 避免过时调用，并提供选项控制是否立即移除 DOM 或增加 token
	 * @param {Object} param0
	 * @param {boolean} param0.immediate - 是否立即移除 DOM 元素
	 * @param {boolean} param0.increaseToken - 是否增加 session token 以避免过时调用
	 * @returns {void}
	 */
	closeStartBeforeUIInternal: ({ immediate = true, increaseToken = true } = {}) => {
		if (increaseToken) startBeforeSessionToken += 1;

		assetHelpers.removeIntroOverlay();

		const root = document.getElementById("jaf-entry-root");
		if (!root) return;

		if (immediate) {
			assetHelpers.disposeEntryRootResources(root);
			root.remove();
			return;
		}
		assetHelpers.removeEntryRoot(root);
	},
	/**
	 * 角色信息
	 * @param {string} characterId - 武将 ID
	 * @returns {void}
	 */
	showCharacterInfoDialog: characterId => {
		if (!characterId || !lib.character?.[characterId]) {
			showShopNoticeDialog({ title: "提示", message: "暂无该武将信息。" });
			return;
		}

		const info = lib.character[characterId];
		const sex = info.sex ? info.sex : "-";
		const group = info.group ? info.group : "-";
		const hp = `${info.hp}/${info.maxHp}` + (info.hujia ? `/${info.hujia}` : "");
		const skills = info.skills;
		const derivations = skills
			.reduce((acc, skillId) => {
				const skillInfo = lib.skill?.[skillId];
				if (skillInfo?.derivation) {
					acc.push(...skillInfo.derivation);
				}
				return acc;
			}, [])
			.filter(i => lib.translate[i + "_info"]);

		const sexText = get.translation(sex);
		const groupText = get.translation(group);

		const skillsHtml = skills.length
			? skills
					.map(skillId => {
						const skillName = get.translation(skillId);
						const skillInfo = get.translation(`${skillId}_info`) || "暂无描述";
						return `<li><strong>${skillName}</strong><br>${skillInfo}</li>`;
					})
					.join("")
			: "<li>暂无技能信息</li>";
		const derivationsHtml = derivations.length
			? derivations
					.map(skillId => {
						const skillName = get.translation(skillId);
						const skillInfo = get.translation(`${skillId}_info`) || "暂无描述";
						return `<li><strong>${skillName}</strong><br>${skillInfo}</li>`;
					})
					.join("")
			: "";
		const derivationsHtml2 = derivations.length
			? `<p class="jaf-intro-paragraph"><strong>衍生技能：</strong></p>
                <ul class="jaf-intro-char-derivation-list">${derivationsHtml}</ul>`
			: "";

		assetHelpers.addIntroOverlay({
			title: `${get.translation(characterId)} · 武将信息`,
			contentHtml: `
			<div>
				<p class="jaf-intro-paragraph"><strong>ID：</strong>${characterId}</p>
				<p class="jaf-intro-paragraph"><strong>性别：</strong>${sexText}　<strong>势力：</strong>${groupText}　<strong>体力：</strong>${hp}</p>
				<p class="jaf-intro-paragraph"><strong>技能：</strong></p>
				<ul class="jaf-intro-char-skill-list">${skillsHtml}</ul>
				${derivationsHtml2}
			</div>
		`,
		});
	},
	/**
	 * 宝物信息弹窗
	 * @param {Object} treasureItem - 宝物对象，包含 id、name、desc、image、skills 等属性
	 * @returns {void}
	 */
	showTreasureInfoDialog: treasureItem => {
		if (!treasureItem || !treasureItem.name) {
			showShopNoticeDialog({ title: "提示", message: "暂无该宝物信息。" });
			return;
		}

		const safeId = treasureItem.id || "unknown";
		const safeName = treasureItem.name || "未命名宝物";
		const safeDesc = (treasureItem.desc || "暂无描述").replace(/\n/g, "<br>");
		const safeImage = treasureItem.image || "";
		const skillsList = Array.isArray(treasureItem.skills) ? treasureItem.skills : [];

		const skillsHtml = skillsList.length
			? skillsList
					.map(skillId => {
						const skillName = get.translation?.(skillId) || skillId;
						const skillInfo = get.translation?.(`${skillId}_info`) || "暂无技能描述";
						return `<li><strong>${skillName}</strong><br>${skillInfo}</li>`;
					})
					.join("")
			: "<li>暂无技能信息</li>";

		assetHelpers.addIntroOverlay({
			title: `${safeName} · 宝物信息`,
			contentHtml: assetHelpers.buildIntroDialogDetailHtml({
				imageSrc: safeImage,
				imageAlt: `${safeName} 图片`,
				imageFallbackText: "宝物预留",
				metaHtml: `
					<p class="jaf-intro-paragraph"><strong>描述：</strong>${safeDesc}</p>
					<p class="jaf-intro-paragraph"><strong>效果：</strong></p>
					<ul class="jaf-intro-char-skill-list">${skillsHtml}</ul>
				`,
			}),

			// 		<div>
			// 	<p class="jaf-intro-paragraph"><strong>ID：</strong>${characterId}</p>
			// 	<p class="jaf-intro-paragraph"><strong>性别：</strong>${sexText}　<strong>势力：</strong>${groupText}　<strong>体力：</strong>${hp}</p>
			// 	<p class="jaf-intro-paragraph"><strong>技能：</strong></p>
			// 	<ul class="jaf-intro-char-skill-list">${skillsHtml}</ul>
			// </div>
		});
	},
	/**
	 * 显示抽卡结果，支持单抽和十连两种展示方式，提供无障碍属性，并允许通过右键查看角色信息
	 * @param {Object} param0
	 * @param {string} param0.poolName 抽卡池名称，用于标题显示
	 * @param {Array} param0.results 抽卡结果数组，每项包含 characterId、isNew、gainJiangFu 等属性
	 * @param {boolean} param0.isTen 是否为十连抽结果，影响布局和标题显示
	 * @param {{label: string, onClick: Function, className?: string}[]} param0.actionButtons 可选的自定义操作按钮（例如：再来一抽/再来十抽）
	 * @returns {void}
	 */
	showGachaResultOverlay: ({ poolName = "抽卡结果", results = [], isTen = false, actionButtons = [] }) => {
		if (entryDialogApi && typeof entryDialogApi.showGachaResultDialog === "function") {
			entryDialogApi.showGachaResultDialog({
				poolName,
				results,
				isTen,
				actionButtons,
			});
			return;
		}

		const oldOverlay = document.getElementById("jaf-gacha-result-overlay");
		oldOverlay?.remove?.();

		const overlay = createElement("div", {
			className: "jaf-gacha-result-overlay",
			attrs: {
				id: "jaf-gacha-result-overlay",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": `${poolName} 抽卡结果`,
			},
		});
		const panel = createElement("div", { className: "jaf-gacha-result-panel" });
		const title = createElement("h3", { className: "jaf-gacha-result-title", text: `${poolName} · ${isTen ? "十连结果" : "单抽结果"}` });
		const grid = createElement("div", { className: `jaf-gacha-result-grid${isTen ? " is-ten" : " is-single"}` });
		const footer = createElement("div", { className: "jaf-gacha-result-footer" });
		const closeBtn = createElement("button", { className: "jaf-intro-btn", text: "确定" });
		closeBtn.type = "button";

		results.forEach((item, index) => {
			const card = createElement("article", { className: "jaf-gacha-card is-flip" });
			card.style.animationDelay = `${Math.min(index, 9) * 60}ms`;
			card.addEventListener("contextmenu", event => {
				event.preventDefault();
				assetHelpers.showCharacterInfoDialog(item.characterId);
			});
			const imgWrap = createElement("div", { className: "jaf-gacha-card-image-wrap" });
			const avatar = createElement("div", {
				className: "jaf-gacha-card-image",
				attrs: {
					"aria-label": `${get.translation(item.characterId)} 立绘`,
				},
			});
			let renderSucceed = false;
			if (typeof avatar.setBackground === "function") {
				try {
					avatar.setBackground(item.characterId, "character");
					renderSucceed = true;
				} catch {
					renderSucceed = false;
				}
			}
			if (!renderSucceed) {
				avatar.appendChild(createElement("div", { className: "jaf-gacha-card-image-fallback", text: get.translation(item.characterId) }));
			}
			const name = createElement("div", { className: "jaf-gacha-card-name", text: get.translation(item.characterId) });
			const tag = createElement("div", {
				className: `jaf-gacha-card-tag${item.isNew ? " is-new" : " is-dup"}`,
				text: item.isNew ? "新武将" : `重复 +${item.gainJiangFu}将符`,
			});
			imgWrap.appendChild(avatar);
			card.append(imgWrap, name, tag);
			grid.appendChild(card);
		});

		const close = () => {
			document.removeEventListener("keydown", onKeyDown);
			overlay.remove();
		};
		const onKeyDown = event => {
			if (event.key === "Escape") close();
		};

		overlay.addEventListener("click", event => {
			if (event.target === overlay) close();
		});
		closeBtn.addEventListener("click", close);
		document.addEventListener("keydown", onKeyDown);

		const customActions = Array.isArray(actionButtons) ? actionButtons.filter(action => action && typeof action.label === "string" && typeof action.onClick === "function") : [];
		if (customActions.length) {
			const buttons = customActions.map(action => {
				const btn = createElement("button", {
					className: `jaf-intro-btn ${action.className || ""}`.trim(),
					text: action.label,
					attrs: { type: "button" },
				});
				btn.addEventListener("click", async () => {
					if (btn.disabled) return;
					buttons.forEach(node => (node.disabled = true));
					try {
						const success = await action.onClick?.();
						if (success) {
							close();
							return;
						}
					} finally {
						if (overlay?.isConnected) buttons.forEach(node => (node.disabled = false));
					}
				});
				footer.appendChild(btn);
				return btn;
			});
		}
		// 始终保留一个确认按钮
		footer.appendChild(closeBtn);
		panel.append(title, grid, footer);
		overlay.appendChild(panel);
		document.body.appendChild(overlay);
		window.requestAnimationFrame(() => overlay.classList.add("is-open"));
	},
};

const { closeStartBeforeUIInternal, removeEntryRoot, showLevelIntroDialog, showShopNoticeDialog, showShopPurchaseDialog, showToast, showGachaResultOverlay, showTreasureInfoDialog } = assetHelpers;

function ensureGameData() {
	let data = game.getExtensionConfig("忽然而已", "gameData");
	if (data) {
		data = decryptAndVerifyConfig(data, "shaonian");
	}
	if (!data) {
		data = {
			// 拥有的物品
			ownedItemIds: {},
			// 关卡进度
			progress: "c1l1",
			// 货币
			currency: {
				memoryZhu: 0,
				dreamDian: 0,
				jiangFu: 0,
			},
			// 拥有的宝物
			treasure: [],
			// 选择的宝物
			selectedTreasures: [],
			// 拥有的角色列表
			characterlist: ["jaf_youth"],
		};
		game.saveExtensionConfig("忽然而已", "gameData", encryptConfig(data, "shaonian"));
	}
	gameData = data;
	// 历史道具选择
	_status.selectedTreasures = gameData.selectedTreasures || [];
	// 拥有的武将
	_status.characterlist = Array.isArray(gameData.characterlist) ? [...new Set(gameData.characterlist.filter(id => typeof id === "string" && id.length))] : [];
	// 使用道具后的效果
	_status.additionalEffect = [];
	// 永久增益的道具效果
	const targetIds = Object.keys(SHOP_DATA.permanentBoostItem);
	_status.permanentBoostItem = Object.fromEntries(
		Object.entries(gameData.ownedItemIds || {}).filter(([id, count]) => targetIds.includes(id) && Number(count) > 0) // 同时筛选键和值
	);
}

ensureGameData();

/**
 * 构建并挂载启动界面 DOM，核心函数
 * @param {Function} onStartGame - 启动游戏时的回调函数
 * @returns {void}
 */
function mountEntry(onStartGame) {
	ensureCheatButtonWatcherInstalled();
	if (typeof _status.jafCheatUsed !== "boolean") {
		_status.jafCheatUsed = false;
	}

	// 清理旧实例
	const oldRoot = document.getElementById("jaf-entry-root");
	if (oldRoot) removeEntryRoot(oldRoot);

	// 根节点
	const root = createElement("div", { className: "jaf-entry-root", attrs: { id: "jaf-entry-root" } });
	const vueHost = root;

	let currentChallengeMeta = {
		chapter: null,
		level: null,
		difficulty: 1,
	};

	root._disposeVueApp = mountMillenDreamEntryVueApp(vueHost, {
		onDialogApiReady: api => {
			entryDialogApi = api;
		},
		ctx: {
			chapters: CHAPTERS,
			shopData: SHOP_DATA,
			treasureData: treasure,
			entryKiteImage: `${basic.extensionDirectoryPath}/assets/image/mode/millenDream/kite.jpg`,
			getGameData: () => gameData,
			saveGameData: payload => assetHelpers.saveGameData(payload),
			showLevelIntroDialog,
			showShopNoticeDialog,
			showShopPurchaseDialog,
			showToast,
			showGachaResultOverlay,
			showTreasureInfoDialog,
			showCharacterInfoDialog: assetHelpers.showCharacterInfoDialog,
		},
		onStartGame: startInfo => {
			currentChallengeMeta = {
				chapter: {
					id: startInfo?.chapterId ?? null,
					title: startInfo?.chapterTitle ?? null,
				},
				level: {
					id: startInfo?.levelId ?? null,
					title: startInfo?.levelTitle ?? null,
					reward: (CHAPTERS?.[startInfo?.chapterId]?.levels || {})[startInfo?.levelId]?.reward || null,
				},
				difficulty: Number(startInfo?.difficulty) || 1,
			};
			onStartGame?.(startInfo);
			closeStartBeforeUIInternal({ immediate: true, increaseToken: true });
		},
	});

	let flag = false;
	/**
	 * 挑战成功后执行的函数
	 * @returns {Promise<void>}
	 */
	_status.jafOnWin = async function () {
		if (flag) return;
		flag = true;
		try {
			const cheated = Boolean(_status.jafCheatUsed);
			const difficulty = Number(currentChallengeMeta?.difficulty) || 1;
			if (!cheated) {
				const rewardCurrency = currentChallengeMeta?.level?.reward?.currency || {};
				const awarded = {};
				Object.entries(rewardCurrency).forEach(([key, val]) => {
					let base = 0;
					if (Array.isArray(val)) {
						if (val.length >= 2) {
							const min = Math.floor(Number(val[0]) || 0);
							const max = Math.floor(Number(val[1]) || min);
							base = Math.floor(Math.random() * (max - min + 1)) + min;
						} else if (val.length === 1) {
							base = Math.floor(Number(val[0]) || 0);
						}
					} else {
						base = Math.floor(Number(val) || 0);
					}
					const amount = Math.max(0, Math.floor(base * difficulty));
					if (amount > 0) awarded[key] = amount;
				});

				Object.entries(awarded).forEach(([k, v]) => {
					gameData.currency[k] = (Number(gameData.currency[k]) || 0) + v;
				});

				await assetHelpers.saveGameData();
				const msgs = Object.entries(awarded).map(([k, v]) => `${v}${get.translation ? get.translation(k) : k}`);
				if (msgs.length) {
					assetHelpers.showToast(`获得：${msgs.join("，")}`);
					await new Promise(resolve => setTimeout(resolve, 1500));
				}
			}

			const next = getNextProgressId(currentChallengeMeta?.level?.id);
			if (next) {
				// 只有在下一关进度大于当前进度时才更新，防止打低级关卡导致进度降级
				const currentProgress = gameData.progress || "c1l1";
				if (!isLevelUnlockedByProgress(next, currentProgress)) {
					gameData.progress = normalizeProgressId(next);
				}
			}
			await assetHelpers.saveGameData();

			if (cheated) {
				await assetHelpers.showToast("检测到使用作弊器，本局不发放奖励");
			}
		} catch (e) {
			console.error(e);
		}
	};

	// 挂载并触发入场动画
	document.body.appendChild(root);

	// 添加枫叶飘落特效（绑定到根节点，销毁逻辑在 removeEntryRoot 里）
	const maple = new MapleFallingEffect(root, { particleCount: 30 });
	maple.start();
	// 允许点击穿透特效层，避免遮挡下面的交互按钮
	if (maple.layer) maple.layer.style.pointerEvents = "none";
	if (maple.canvas) maple.canvas.style.pointerEvents = "none";
	root._mapleEffect = maple;
	window.requestAnimationFrame(() => {
		root.classList.add("is-mounted");
	});
}

async function startBefore() {
	const currentSessionToken = ++startBeforeSessionToken;
	closeStartBeforeUIInternal({ immediate: true, increaseToken: false });

	// 尝试加载自定义字体（无阻塞，仅尝试）
	document.fonts.load("1px huangcao");
	document.fonts.load("1px xinwei");

	if (currentSessionToken !== startBeforeSessionToken) {
		return { started: false, reason: "session-changed" };
	}

	return new Promise(resolve => {
		let isResolved = false;
		const resolveOnce = payload => {
			if (isResolved) return;
			isResolved = true;
			resolve(payload);
		};

		mountEntry(resolveOnce);
	});
}

export default startBefore;
