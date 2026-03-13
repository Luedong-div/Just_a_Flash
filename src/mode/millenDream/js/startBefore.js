import { _status, game, lib, ui, get } from "noname";
import { MapleFallingEffect } from "../../../components/effects/mapleFalling.js";
import { basic } from "../../../source/basic.js";
import CHAPTERS from "../data/CHAPTERS.js";
import SHOP_DATA from "../data/SHOP_DATA.js";
import treasure from "./treasure.js";
import { encryptConfig, decryptAndVerifyConfig, ensureCheatButtonWatcherInstalled } from "../../../components/polyfill.js";

/**
 * 当前版本货币类型稀有度：dreamDian>memoryZhu>jiangFu
 */
const SHOP_CURRENCY = ["memoryZhu", "dreamDian", "jiangFu"];

let startBeforeSessionToken = 0;
let gameData;

const uiHelpers = {
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
	createElement: (tagName, { className, text, html, attrs } = {}) => {
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
	},
	/**
	 * 安全地关闭弹窗，移除 is-open 类以触发离场动画
	 * @param {HTMLElement} modal - 要关闭的弹窗 DOM 元素
	 * @returns
	 */
	closeModal: modal => {
		if (!modal) return;
		modal.classList.remove("is-open");
	},
	/**
	 * 安全地打开弹窗，添加 is-open 类以触发入场动画
	 * @param {HTMLElement} modal - 要打开的弹窗 DOM 元素
	 * @returns {void}
	 */
	openModal: modal => {
		if (!modal) return;
		modal.classList.add("is-open");
	},
	/**
	 * 绑定点击蒙层关闭弹窗的事件，确保只有点击蒙层时才触发关闭逻辑
	 * @param {HTMLElement} modal - 弹窗 DOM 元素，点击其蒙层时触发关闭
	 * @param {Function} onMaskClose - 点击蒙层时的回调函数
	 * @returns {void}
	 */
	bindModalMaskClose: (modal, onMaskClose) => {
		modal.addEventListener("click", event => {
			if (event.target === modal) {
				onMaskClose?.();
			}
		});
	},
	/**
	 * 绑定横向滚动容器的鼠标滚轮支持：将 wheel 的纵向滚动转换为横向滚动
	 * @param {HTMLElement} element - 需要横向滚动的容器
	 * @returns {Function} 解绑函数
	 */
	bindHorizontalWheelScroll: element => {
		if (!element || typeof element.addEventListener !== "function") {
			return () => {};
		}

		const normalizeDelta = event => {
			const baseDelta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
			if (!baseDelta) return 0;

			// deltaMode: 0=像素, 1=行, 2=页
			if (event.deltaMode === 1) return baseDelta * 16;
			if (event.deltaMode === 2) return baseDelta * element.clientWidth;
			return baseDelta;
		};

		const onWheel = event => {
			const canScrollHorizontally = element.scrollWidth - element.clientWidth > 1;
			if (!canScrollHorizontally) return;

			const delta = normalizeDelta(event);
			if (!delta) return;

			const previous = element.scrollLeft;
			element.scrollLeft += delta;
			const didScroll = element.scrollLeft !== previous;

			if (didScroll) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		const wheelOptions = { passive: false, capture: true };
		element.addEventListener("wheel", onWheel, wheelOptions);
		return () => {
			element.removeEventListener("wheel", onWheel, wheelOptions);
		};
	},
	/**
	 * 等待样式表加载完成的辅助函数，监听 link 元素的 load 和 error 事件，返回 Promise 以便异步处理
	 * @param {HTMLLinkElement} link - 要等待加载的 link 元素
	 * @returns {Promise<boolean>} 加载成功返回 true，加载失败返回 false
	 */
	waitForCssLoaded: link => {
		if (!link) return Promise.resolve(false);
		if (link.sheet) return Promise.resolve(true);
		return new Promise(resolve => {
			link.addEventListener("load", () => resolve(true), { once: true });
			link.addEventListener("error", () => resolve(false), { once: true });
		});
	},
};

const progressHelpers = {
	/**
	 * 解析关卡进度 ID（如 c2l3）
	 * @param {string} progressId
	 * @returns {{chapter: number, level: number} | null}
	 */
	parseProgressId: progressId => {
		if (typeof progressId !== "string") return null;
		const match = /^c(\d+)l(\d+)$/i.exec(progressId.trim());
		if (!match) return null;
		const chapter = Number(match[1]);
		const level = Number(match[2]);
		if (!Number.isInteger(chapter) || !Number.isInteger(level) || chapter < 1 || level < 1) {
			return null;
		}
		return { chapter, level };
	},
	/**
	 * 规范化进度 ID，非法值回退到默认进度
	 * @param {string} progressId
	 * @returns {string}
	 */
	normalizeProgressId: progressId => {
		const parsed = progressHelpers.parseProgressId(progressId);
		if (!parsed) return "c1l1";
		return `c${parsed.chapter}l${parsed.level}`;
	},
	/**
	 * 关卡是否已解锁（按“章节优先、章内按关卡”比较）
	 * @param {string} levelId
	 * @param {string} progressId
	 * @returns {boolean}
	 */
	isLevelUnlockedByProgress: (levelId, progressId) => {
		const levelParsed = progressHelpers.parseProgressId(levelId);
		// 对非标准 ID（如占位关卡）保持兼容，不强制锁定
		if (!levelParsed) return true;

		const progressParsed = progressHelpers.parseProgressId(progressId) || progressHelpers.parseProgressId("c1l1");
		if (!progressParsed) return true;

		if (levelParsed.chapter < progressParsed.chapter) return true;
		if (levelParsed.chapter > progressParsed.chapter) return false;
		return levelParsed.level <= progressParsed.level;
	},
	/**
	 * 将进度 ID 格式化为可读文本
	 * @param {string} progressId
	 * @returns {string}
	 */
	formatProgressText: progressId => {
		const parsed = progressHelpers.parseProgressId(progressId);
		if (!parsed) return "第1章第1关";
		return `第${parsed.chapter}章第${parsed.level}关`;
	},
	/**
	 * 根据当前进度 ID 获取下一个关卡的 ID，按章节和关卡顺序查找，兼容非标准 ID
	 * @param {string} currentProgressId
	 * @returns {string|null}
	 */
	getNextProgressId: currentProgressId => {
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
		const parsed = progressHelpers.parseProgressId(currentProgressId);
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
	},
};

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
	 * 角色分类
	 * @returns {Object} 包含不同稀有度角色 ID 的对象，未分类角色会被归入 a 类
	 */
	getRankCharacterObject() {
		if (_status.rankCharacterObject) {
			return _status.rankCharacterObject;
		}
		const bans = Object.keys(lib.characterPack.millenDream);
		const validKeys = Object.keys(lib.character).filter(charId => {
			if (bans.includes(charId)) return false;
			const charInfo = lib.character[charId];
			return charInfo && !(charInfo.isUnseen || charInfo.isBoss || charInfo.isHiddenBoss || charInfo.isChessBoss || charInfo.isJiangeBoss);
		});
		const rankOrder = ["sss", "ss", "s", "a", "b", "c", "d", "f"];

		const rankSources = {
			f: lib.rank.d,
			d: lib.rank.c,
			c: lib.rank.bm,
			b: lib.rank.b,
			a: lib.rank.am,
			s: lib.rank.a.concat(lib.rank.rare).concat(lib.rank.bp),
			ss: lib.rank.ap.concat(lib.rank.rarity.epic),
			sss: lib.rank.s.concat(lib.rank.rarity.legend),
		};
		const allClassifiedElements = new Set();
		Object.values(rankSources).forEach(sourceArr => {
			sourceArr.forEach(item => allClassifiedElements.add(item));
		});
		const unclassifiedChars = validKeys.filter(charId => !allClassifiedElements.has(charId));
		const usedElements = new Set();
		const rarityMap = {};

		rankOrder.forEach(rankKey => {
			const originalElements = [...new Set(rankSources[rankKey])];
			const uniqueElements = originalElements.filter(item => !usedElements.has(item));
			if (rankKey === "a") {
				const usableUnclassified = unclassifiedChars.filter(charId => !usedElements.has(charId));
				const finalAElements = [...new Set([...uniqueElements, ...usableUnclassified])];
				rarityMap[rankKey] = finalAElements;
				finalAElements.forEach(item => usedElements.add(item));
			} else {
				rarityMap[rankKey] = uniqueElements;
				uniqueElements.forEach(item => usedElements.add(item));
			}
		});
		_status.rankCharacterObject = rarityMap;
		return rarityMap;
	},
	/**
	 * 获取关卡图片 URL 的辅助函数
	 * @param {Object} level - 关卡对象，可能包含 image 或 id 属性
	 * @returns {string|null} 关卡图片 URL 或 null
	 */
	getLevelImage(level) {
		if (level.image) return level.image;
		if (level.id) return `${basic.extensionDirectoryPath}/assets/image/mode/millenDream/${level.id}.jpg`;
		return null;
	},
	/**
	 * 获取当前可用武将包列表，不含全部，防止卡顿
	 * @returns {string[]}
	 */
	getAlbumPackList: () => {
		const opened = Array.isArray(lib.config?.characters) ? lib.config.characters : [];
		const all = Array.isArray(lib.config?.all?.characters) ? lib.config.all.characters : [];
		const extra = Object.keys(lib.characterPack || {}).filter(pack => !all.includes(pack) && Object.keys(lib.characterPack[pack] || {}).length > 0);
		const enabled = all.filter(pack => opened.includes(pack));
		return ["all-pack", ...enabled, ...extra];
	},
	/**
	 * 获取指定武将包下可用副包列表，包含“全部武将”选项
	 * @param {string} packId 武将包ID
	 * @returns {string[]}
	 */
	getAlbumSubPackList: packId => {
		if (packId === "all-pack") {
			return ["all-characters"];
		}
		const sortMap = lib.characterSort?.[packId] || {};
		const subPacks = Object.keys(sortMap);
		return ["all-characters", ...subPacks];
	},
	/**
	 * 获取武将列表并按“已拥有优先”排序
	 * @param {string} packId 武将包ID
	 * @param {string} subPackId 副包ID
	 * @returns {string[]}
	 */
	getAlbumCharacters: (packId, subPackId) => {
		let characters = [];
		const ownSet = new Set(_status.characterlist);
		const normalizeCharacters = list => [...new Set(list)].filter(id => id && lib.character[id]);

		if (packId === "all-pack") {
			const allPackIds = getAlbumPackList().filter(id => id && id !== "all-pack");
			const allCharacters = normalizeCharacters(allPackIds.flatMap(id => Object.keys(lib.characterPack?.[id] || {})));

			characters = allCharacters;
		} else {
			const packChars = Object.keys(lib.characterPack?.[packId] || {});
			if (subPackId === "all-characters") {
				characters = packChars;
			} else {
				const fromSort = lib.characterSort?.[packId]?.[subPackId] || [];
				characters = fromSort.filter(id => packChars.includes(id));
			}
		}

		const uniqueChars = normalizeCharacters(characters);
		return uniqueChars.sort((a, b) => {
			const ownDiff = Number(ownSet.has(b)) - Number(ownSet.has(a));
			if (ownDiff) return ownDiff;
			const aName = get.translation(a);
			const bName = get.translation(b);
			return aName.localeCompare(bName, "zh-Hans-CN");
		});
	},
	/**
	 * 安全地销毁入口根元素相关资源（事件监听、特效实例等）
	 * @param {HTMLElement | null} root - 入口根元素 DOM 对象
	 * @returns {void}
	 */
	disposeEntryRootResources: root => {
		if (!root) return;
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

const shopHelpers = {
	/**
	 * 规范化拥有的物品数量数据，确保 ID 是字符串且数量是非负整数，过滤掉无效数据并返回清洗后的对象
	 * @param {Object} raw - 原始拥有的物品数量数据，键为物品 ID，值为数量
	 * @returns {Object} 规范化后的拥有的物品数量对象，键为有效的物品 ID，值为规范化后的数量
	 */
	normalizeOwnedItemCounts(raw) {
		if (!raw || typeof raw !== "object") return {};
		return Object.entries(raw).reduce((acc, [id, count]) => {
			if (typeof id !== "string" || !id.length) return acc;
			const normalized = Math.max(0, Math.floor(Number(count) || 0));
			if (normalized > 0) {
				acc[id] = normalized;
			}
			return acc;
		}, {});
	},
	/**
	 * 规范化商店价格数据，确保价格对象只包含有效的货币类型和非负整数金额，过滤掉无效数据并返回清洗后的价格对象
	 * @param {Object} priceInput - 原始价格对象，键为货币类型，值为金额
	 * @returns {Object} 规范化后的价格对象，键为有效的货币类型，值为非负整数金额
	 */
	normalizeShopPrice(priceInput) {
		if (!priceInput || typeof priceInput !== "object") return {};
		return SHOP_CURRENCY.reduce((acc, key) => {
			const amount = Number(priceInput[key]) || 0;
			if (amount > 0) acc[key] = amount;
			return acc;
		}, {});
	},
	/**
	 * 规范化商店货币数据，确保只包含预定义的货币类型且金额为非负整数，过滤掉无效数据并返回清洗后的货币对象
	 * @param {Object} raw - 原始货币对象，键为货币类型，值为金额
	 * @returns {Object} 规范化后的货币对象，键为有效的货币类型，值为非负整数金额
	 */
	normalizeShopCurrency(raw = {}) {
		return SHOP_CURRENCY.reduce((acc, key) => {
			const value = Number(raw?.[key]);
			acc[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
			return acc;
		}, {});
	},
	/**
	 * 格式化商品价格字符串
	 * @param {Object} priceInput - 价格输入对象，键为货币类型，值为金额
	 * @returns {string} 格式化后的价格字符串
	 */
	formatShopPrice(priceInput) {
		const price = shopHelpers.normalizeShopPrice(priceInput);
		const entries = SHOP_CURRENCY.filter(key => Number(price[key]) > 0).map(key => `${price[key]}${get.translation(key)}`);
		return entries.length ? entries.join(" + ") : "免费";
	},
	/**
	 * 判断钱包余额是否足够支付给定的价格，价格和钱包都经过规范化处理，确保比较的准确性和健壮性
	 * @param {Object} wallet - 钱包对象，键为货币类型，值为金额
	 * @param {Object} priceInput - 价格输入对象，键为货币类型，值为金额
	 * @returns {boolean} - 如果钱包余额足够支付价格则返回 true，否则返回 false
	 */
	canAffordShopPrice(wallet, priceInput) {
		const price = this.normalizeShopPrice(priceInput);
		return SHOP_CURRENCY.every(key => (Number(wallet?.[key]) || 0) >= (Number(price[key]) || 0));
	},
	/**
	 * 支付函数
	 * @param {Object} wallet - 钱包对象，键为货币类型，值为金额
	 * @param {*} priceInput - 价格输入对象，键为货币类型，值为金额
	 * @param {number} direction - 支付方向，-1 表示支付（减少钱包余额），1 表示退款（增加钱包余额）
	 * @returns {void}
	 */
	applyShopPrice: (wallet, priceInput, direction = -1) => {
		const price = shopHelpers.normalizeShopPrice(priceInput);
		SHOP_CURRENCY.forEach(key => {
			const current = Number(wallet?.[key]) || 0;
			const delta = (Number(price[key]) || 0) * direction;
			wallet[key] = Math.max(0, current + delta);
		});
	},
	/**
	 * 将解析后的商店数据应用到游戏状态中，更新拥有的物品 ID 列表和货币余额，确保状态的一致性和正确性
	 * @param {Object} shopState - 商店状态对象
	 * @param {Object} parsed - 解析后的商店数据对象
	 * @returns {void}
	 */
	applyParsedShopDataToState(shopState, parsed) {
		if (!parsed || typeof parsed !== "object") return;
		shopState.ownedItemIds = shopHelpers.normalizeOwnedItemCounts(parsed.ownedItemIds);
		const normalizedCurrency = shopHelpers.normalizeShopCurrency(parsed.currency);
		SHOP_CURRENCY.forEach(key => {
			shopState[key] = normalizedCurrency[key];
		});
	},
	/**
	 * 奖池获取
	 * @param {Object} prizePool - 奖池对象，包含 type 和 poolKey 属性
	 * @returns {string[]} 符合条件的角色 ID 数组
	 */
	getGachaPoolCharacters: prizePool => {
		if (!prizePool || typeof prizePool !== "object") return [];
		if (Array.isArray(prizePool)) return prizePool;

		if (prizePool.type === "character_rank") {
			const rankObject = assetHelpers.getRankCharacterObject?.() || {};
			const poolKey = String(prizePool.poolKey || "");
			if (rankObject[poolKey] && poolKey !== "random") {
				const candidates = Array.isArray(rankObject?.[poolKey]) ? rankObject[poolKey] : [];
				return candidates;
			} else {
				return Object.values(rankObject).flat();
			}
		} else {
			// TODO
		}
		return [];
	},
	/**
	 * 抽卡费用计算
	 * @param {Object} param0 - 包含抽卡参数的对象
	 * @param {number} param0.singleCostMemoryZhu - 单抽的忆铢基础费用
	 * @param {number} param0.drawCount - 抽卡次数，通常为 1 或 10
	 * @param {number} param0.jiangFuOwned - 玩家当前拥有的将符数量
	 * @returns {Object} 包含折扣后忆铢费用、使用的将符数量和最终忆铢费用的对象
	 */
	getGachaCostDetail: ({ singleCostMemoryZhu, drawCount, jiangFuOwned }) => {
		const isTen = drawCount === 10;
		const discountedMemory = isTen ? Math.floor(singleCostMemoryZhu * drawCount * 0.9) : singleCostMemoryZhu;
		const usedJiangFu = Math.min(Math.max(0, Number(jiangFuOwned) || 0), discountedMemory);
		const finalMemoryCost = discountedMemory - usedJiangFu;
		return {
			discountedMemory,
			usedJiangFu,
			finalMemoryCost,
		};
	},
	/**
	 * 抽卡逻辑
	 * @param {Object} param0 - 包含抽卡参数的对象
	 * @param {Object} param0.shopState - 商店状态对象
	 * @param {Object} param0.poolConfig - 抽卡池配置对象
	 * @param {number} param0.drawCount - 抽卡次数，通常为 1 或 10
	 * @returns {Promise<Object>} 包含抽卡结果和费用信息的对象
	 */
	runGachaDraw: async ({ shopState, poolConfig, drawCount }) => {
		function randomPick(list) {
			if (!Array.isArray(list) || !list.length) return null;
			const index = Math.floor(Math.random() * list.length);
			return list[index];
		}

		if (!poolConfig || !shopState) {
			return { ok: false, message: "抽卡参数错误。" };
		}
		if (shopState.isSaving) {
			return { ok: false, message: "操作过快，请稍后再试。" };
		}

		const poolCharacters = shopHelpers.getGachaPoolCharacters(poolConfig.prizePool);
		if (!poolCharacters.length) {
			return { ok: false, message: `${poolConfig.name} 暂无可抽取武将。` };
		}

		const ownSet = new Set(Array.isArray(_status.characterlist) ? _status.characterlist : []);
		const singleCostMemoryZhu = poolConfig.price.memoryZhu;
		const cost = shopHelpers.getGachaCostDetail({
			singleCostMemoryZhu,
			drawCount,
			jiangFuOwned: shopState.jiangFu,
		});

		if ((Number(shopState.memoryZhu) || 0) < cost.finalMemoryCost) {
			return {
				ok: false,
				message: `忆铢不足：本次需 ${cost.discountedMemory} 忆铢，已用将符抵扣 ${cost.usedJiangFu}，仍需 ${cost.finalMemoryCost} 忆铢。`,
			};
		}

		const prevState = {
			memoryZhu: Number(shopState.memoryZhu) || 0,
			jiangFu: Number(shopState.jiangFu) || 0,
			ownedCharacters: [...ownSet],
		};

		shopState.memoryZhu = prevState.memoryZhu - cost.finalMemoryCost;
		shopState.jiangFu = Math.max(0, prevState.jiangFu - cost.usedJiangFu);
		shopState.isSaving = true;

		const results = [];
		let hasNew = false;
		for (let i = 0; i < drawCount; i++) {
			const unowned = poolCharacters.filter(id => !ownSet.has(id));
			const forceNew = drawCount === 10 && i === drawCount - 1 && !hasNew && unowned.length > 0;
			const characterId = forceNew ? randomPick(unowned) : randomPick(poolCharacters);
			if (!characterId) continue;

			const isNew = !ownSet.has(characterId);
			let gainJiangFu = 0;
			if (isNew) {
				ownSet.add(characterId);
				hasNew = true;
			} else {
				gainJiangFu = Number(poolConfig.duplicateJiangFu) || 0;
				shopState.jiangFu = (Number(shopState.jiangFu) || 0) + gainJiangFu;
			}

			results.push({ characterId, isNew, gainJiangFu });
		}

		_status.characterlist = [...ownSet];

		gameData.currency = shopHelpers.normalizeShopCurrency(shopState);
		gameData.characterlist = Array.isArray(_status.characterlist) ? _status.characterlist : [];
		await assetHelpers.saveGameData();
		shopState.isSaving = false;
		return { ok: true, results, cost };
	},
};

const { createElement, closeModal, openModal, bindModalMaskClose, bindHorizontalWheelScroll, waitForCssLoaded } = uiHelpers;
const { getLevelImage, getAlbumPackList, getAlbumSubPackList, getAlbumCharacters, closeStartBeforeUIInternal, removeEntryRoot, showLevelIntroDialog, showShopNoticeDialog, showShopPurchaseDialog, showToast, showGachaResultOverlay, showTreasureInfoDialog } = assetHelpers;
const { normalizeProgressId, isLevelUnlockedByProgress, formatProgressText, getNextProgressId } = progressHelpers;
const { applyShopPrice, applyParsedShopDataToState, getGachaPoolCharacters, getGachaCostDetail } = shopHelpers;

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
 * 创建章节
 * @param {Function} onSelectChapter - 章节选择回调函数，参数为被选择的章节对象
 * @returns {Object} DOM
 */
function createChapterModal(onSelectChapter) {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-chapter-modal" } });
	const modalContent = createElement("div", { className: "jaf-modal-content jaf-chapter-modal-content" });
	const modalTitle = createElement("h2", { className: "jaf-modal-title", text: "入梦 · 章节选择" });
	const chapterList = createElement("div", { className: "jaf-chapter-list" });
	const closeBtn = createElement("button", { className: "jaf-close-btn", text: "关闭" });

	Object.entries(CHAPTERS).forEach(([chapterId, chapter]) => {
		if (!chapter || !chapter.title) return;
		const chapterBtn = createElement("button", { className: "jaf-chapter-item", text: chapter.title });
		chapterBtn.addEventListener("click", () => {
			onSelectChapter?.({ id: chapterId, ...chapter });
		});
		chapterList.appendChild(chapterBtn);
	});

	modalContent.append(modalTitle, chapterList, closeBtn);
	modal.appendChild(modalContent);
	return { modal, closeBtn };
}

/**
 * 创建关卡
 * @returns {Object} DOM
 */
function createLevelSelectModal() {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-level-modal" } });
	const content = createElement("div", { className: "jaf-modal-content jaf-level-modal-content" });

	const header = createElement("div", { className: "jaf-level-header" });
	const title = createElement("h2", { className: "jaf-modal-title jaf-level-title", text: "关卡选择" });
	header.append(title);

	const viewport = createElement("div", { className: "jaf-level-viewport" });
	const cardsContainer = createElement("div", { className: "jaf-level-cards" });
	viewport.appendChild(cardsContainer);

	const wrapper = createElement("div", { className: "jaf-level-wrapper" });
	const closeBtn = createElement("button", { className: "jaf-close-btn", text: "返回章节" });
	const prepare = createElement("button", { className: "jaf-close-btn", text: "备战" });
	wrapper.appendChild(closeBtn);
	wrapper.appendChild(prepare);

	content.append(header, viewport, wrapper);
	modal.appendChild(content);

	return { modal, title, closeBtn, prepare, viewport, cardsContainer };
}

/**
 * 创建挑战设置弹窗
 * @returns {Object} DOM
 */
function createChallengeModal() {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-challenge-modal" } });
	const content = createElement("div", { className: "jaf-modal-content jaf-challenge-modal-content" });

	const closeBtn = createElement("button", { className: "jaf-game-close", text: "×" });
	closeBtn.type = "button";
	const layout = createElement("div", { className: "jaf-challenge-layout" });

	const image = createElement("img", {
		className: "jaf-challenge-image",
		attrs: {
			src: "",
			alt: "关卡预览图",
			draggable: "false",
		},
	});
	image.draggable = false;
	image.addEventListener("dragstart", event => event.preventDefault());

	const panel = createElement("div", { className: "jaf-challenge-panel" });
	const title = createElement("h2", { className: "jaf-challenge-title", text: "标题" });
	const desc = createElement("p", { className: "jaf-challenge-desc", text: "介绍" });
	const difficultyLabel = createElement("div", { className: "jaf-challenge-difficulty-label", text: "难度" });
	const difficulty = createElement("div", {
		className: "jaf-challenge-difficulty",
		attrs: {
			role: "radiogroup",
			"aria-label": "难度",
		},
	});
	const starButtons = [1, 2, 3].map(value => {
		const btn = createElement("button", {
			className: "jaf-difficulty-star",
			text: "☆",
			attrs: {
				type: "button",
				"data-value": String(value),
				role: "radio",
				"aria-label": `难度${value}星`,
			},
		});
		difficulty.appendChild(btn);
		return btn;
	});
	const startBtn = createElement("button", { className: "jaf-challenge-start", text: "开始挑战" });
	startBtn.type = "button";

	let currentDifficulty = 1;
	const renderDifficulty = () => {
		starButtons.forEach((btn, index) => {
			const value = index + 1;
			const filled = value <= currentDifficulty;
			btn.textContent = filled ? "★" : "☆";
			btn.classList.toggle("is-filled", filled);
			btn.setAttribute("aria-checked", filled ? "true" : "false");
		});
		difficulty.setAttribute("aria-valuenow", String(currentDifficulty));
	};

	starButtons.forEach((btn, index) => {
		btn.addEventListener("click", () => {
			const clickedValue = index + 1;
			// 点击第几颗星就设置为几星
			currentDifficulty = clickedValue;
			renderDifficulty();
		});
	});
	renderDifficulty();

	panel.append(title, desc, difficultyLabel, difficulty, startBtn);
	layout.append(image, panel);
	content.append(closeBtn, layout);
	modal.appendChild(content);

	return {
		modal,
		title,
		desc,
		image,
		closeBtn,
		startBtn,
		setDifficulty(value) {
			currentDifficulty = Math.max(1, Math.min(3, Number(value) || 1));
			renderDifficulty();
		},
		getDifficulty() {
			return currentDifficulty;
		},
	};
}

/**
 * 创建备战弹窗（携带宝物）
 * @returns {{ modal: HTMLDivElement, closeBtn: HTMLButtonElement, treasureGrid: HTMLDivElement, selectedCount: HTMLDivElement, confirmBtn: HTMLButtonElement, state: {selectedTreasures: string[]} }}
 */
function createPrepareModal() {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-prepare-modal" } });
	const content = createElement("div", { className: "jaf-modal-content jaf-prepare-modal-content" });

	const header = createElement("div", { className: "jaf-prepare-header" });
	const title = createElement("h2", { className: "jaf-modal-title jaf-prepare-title", text: "备战 · 携带宝物（最多4个）" });
	const selectedCount = createElement("div", { className: "jaf-prepare-count", text: "已选择：0/4" });
	header.append(title, selectedCount);

	const treasureGrid = createElement("div", { className: "jaf-prepare-treasure-grid" });

	const closeBtn = createElement("button", {
		className: "jaf-game-close",
		text: "×",
		attrs: { type: "button", "aria-label": "关闭备战" },
	});

	const footer = createElement("div", { className: "jaf-prepare-footer" });
	const confirmBtn = createElement("button", { className: "jaf-game-btn", text: "确定" });
	footer.appendChild(confirmBtn);

	content.append(header, closeBtn, treasureGrid, footer);
	modal.appendChild(content);

	return {
		modal,
		title,
		selectedCount,
		treasureGrid,
		closeBtn,
		confirmBtn,
		state: {
			selectedTreasures: [],
		},
	};
}

/**
 * 渲染备战弹窗内容（宝物列表）
 * @param {ReturnType<typeof createPrepareModal>} prepareData
 */
function renderPrepare(prepareData) {
	if (!prepareData || !prepareData.treasureGrid) return;

	const grid = prepareData.treasureGrid;
	grid.innerHTML = "";

	// 1. 只显示用户拥有的宝物（gameData.treasure 中的）
	const ownedTreasureIds = gameData?.treasure || [];
	const allTreasures = ownedTreasureIds
		.map(id => {
			const data = treasure[id];
			return data ? { id, ...data } : null;
		})
		.filter(t => t !== null);

	// 2. 从 selectedTreasures 获取已选择的宝物
	const selectedSet = new Set(gameData?.selectedTreasures || []);
	const MAX_TREASURES = 4;

	allTreasures.forEach(treasureItem => {
		const isSelected = selectedSet.has(treasureItem.id);
		const isFull = selectedSet.size >= MAX_TREASURES;
		const canSelect = isSelected || !isFull;

		const card = createElement("div", {
			className: `jaf-prepare-treasure-card ${isSelected ? "is-selected" : ""} ${!canSelect ? "is-disabled" : ""}`,
		});

		const imageWrap = createElement("div", { className: "jaf-prepare-treasure-image-wrap" });
		const image = createElement("img", {
			className: "jaf-prepare-treasure-image",
			attrs: {
				src: treasureItem.image || "",
				alt: treasureItem.name,
				draggable: "false",
			},
		});
		image.draggable = false;
		image.addEventListener("dragstart", event => event.preventDefault());

		// 图片加载失败时的替代方案
		image.addEventListener("error", () => {
			image.style.display = "none";
			imagePlaceholder.style.display = "flex";
		});

		// 图片加载成功则隐藏占位符
		image.addEventListener("load", () => {
			image.style.display = "block";
			imagePlaceholder.style.display = "none";
		});

		const imagePlaceholder = createElement("div", {
			className: "jaf-prepare-treasure-image-placeholder",
			text: "宝物",
			attrs: { style: "display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(0,0,0,0.1);" },
		});

		imageWrap.append(image, imagePlaceholder);

		const name = createElement("div", { className: "jaf-prepare-treasure-name", text: treasureItem.name });

		const checkbox = createElement("div", { className: "jaf-prepare-treasure-checkbox" });
		const checkmark = createElement("div", { className: "jaf-prepare-treasure-checkmark", text: "✓" });
		checkbox.appendChild(checkmark);

		card.append(imageWrap, name, checkbox);

		// 右键显示宝物信息
		card.addEventListener("contextmenu", event => {
			event.preventDefault();
			showTreasureInfoDialog(treasureItem);
		});

		if (canSelect) {
			card.addEventListener("click", () => {
				if (isSelected) {
					selectedSet.delete(treasureItem.id);
				} else if (selectedSet.size < MAX_TREASURES) {
					selectedSet.add(treasureItem.id);
				}
				gameData.selectedTreasures = Array.from(selectedSet);
				prepareData.state.selectedTreasures = Array.from(selectedSet);
				renderPrepare(prepareData);
			});
		}

		grid.appendChild(card);
	});

	// 更新选择计数
	prepareData.selectedCount.textContent = `已选择：${selectedSet.size}/${MAX_TREASURES}`;
}

/**
 * 创建背包弹窗
 * @returns {{ modal: HTMLDivElement, closeBtn: HTMLButtonElement, categoryList: HTMLDivElement, itemsGrid: HTMLDivElement, stats: HTMLDivElement, state: {categoryId: string} }}
 */
function createInventoryModal() {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-inventory-modal" } });
	const content = createElement("div", { className: "jaf-modal-content jaf-inventory-modal-content" });
	const header = createElement("div", { className: "jaf-inventory-header" });
	const title = createElement("h2", { className: "jaf-modal-title jaf-inventory-title", text: "背包 · 物品管理" });
	const stats = createElement("div", { className: "jaf-inventory-stats", text: "已拥有 0 件物品" });
	const searchInput = createElement("input", {
		className: "jaf-inventory-search",
		attrs: { type: "search", placeholder: "搜索物品", "aria-label": "搜索背包", autocomplete: "off", spellcheck: "false" },
	});

	searchInput.addEventListener("keydown", event => {
		event.stopPropagation();
		if (event.key === "Escape") {
			event.preventDefault();
			searchInput.blur();
			return;
		}
		if (event.ctrlKey || event.metaKey || event.altKey) {
			const allowed = ["a", "c", "v", "x", "z", "y"];
			if (!allowed.includes(String(event.key).toLowerCase())) {
				event.preventDefault();
			}
		}
	});
	["keyup", "keypress", "input"].forEach(name => searchInput.addEventListener(name, e => e.stopPropagation()));

	header.append(title, searchInput, stats);
	const closeBtn = createElement("button", {
		className: "jaf-game-close",
		text: "×",
		attrs: {
			type: "button",
			"aria-label": "关闭背包",
		},
	});

	const body = createElement("div", { className: "jaf-inventory-body" });
	const categoryList = createElement("div", { className: "jaf-inventory-category-list" });
	const itemsPanel = createElement("div", { className: "jaf-inventory-items-panel" });
	const itemsGrid = createElement("div", { className: "jaf-inventory-items-grid" });

	itemsPanel.appendChild(itemsGrid);
	body.append(categoryList, itemsPanel);
	content.append(header, closeBtn, body);
	modal.appendChild(content);

	return {
		modal,
		closeBtn,
		categoryList,
		itemsGrid,
		stats,
		searchInput,
		state: {
			categoryId: "all",
			loaded: false,
		},
	};
}

/**
 * 创建千禧册图鉴弹窗
 * @returns {{ modal: HTMLDivElement, closeBtn: HTMLButtonElement, packList: HTMLDivElement, subPackList: HTMLDivElement, cards: HTMLDivElement, stats: HTMLDivElement, state: {packId: string, subPackId: string} }}
 */
function createAlbumModal() {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-album-modal" } });
	const content = createElement("div", { className: "jaf-modal-content jaf-album-modal-content" });
	const header = createElement("div", { className: "jaf-album-header" });
	const title = createElement("h2", { className: "jaf-modal-title jaf-album-title", text: "千禧册 · 武将图鉴" });
	const stats = createElement("div", { className: "jaf-album-stats", text: "已拥有 0 / 0" });
	const searchInput = createElement("input", {
		className: "jaf-album-search",
		attrs: { type: "search", placeholder: "搜索武将", "aria-label": "搜索图鉴", autocomplete: "off", spellcheck: "false" },
	});

	searchInput.addEventListener("keydown", event => {
		event.stopPropagation();
		if (event.key === "Escape") {
			event.preventDefault();
			searchInput.blur();
			return;
		}
		if (event.ctrlKey || event.metaKey || event.altKey) {
			const allowed = ["a", "c", "v", "x", "z", "y"];
			if (!allowed.includes(String(event.key).toLowerCase())) {
				event.preventDefault();
			}
		}
	});
	["keyup", "keypress", "input"].forEach(name => searchInput.addEventListener(name, e => e.stopPropagation()));

	header.append(title, searchInput, stats);
	const closeBtn = createElement("button", {
		className: "jaf-game-close",
		text: "×",
		attrs: {
			type: "button",
			"aria-label": "关闭图鉴",
		},
	});

	const packList = createElement("div", { className: "jaf-album-pack-list" });
	const subPackList = createElement("div", { className: "jaf-album-subpack-list" });
	const viewport = createElement("div", { className: "jaf-album-viewport" });
	content.append(header, closeBtn, packList, subPackList, viewport);
	modal.appendChild(content);

	return {
		modal,
		closeBtn,
		packList,
		subPackList,
		viewport,
		stats,
		searchInput,
		state: {
			packId: getAlbumPackList()[1] || "", // 默认第二项防止卡顿
			subPackId: "all-characters",
		},
	};
}

/**
 * 创建小卖铺弹窗（左侧分类、右侧商品）
 * @returns {{ modal: HTMLDivElement, closeBtn: HTMLButtonElement, categoryList: HTMLDivElement, goodsTitle: HTMLHeadingElement, goodsList: HTMLDivElement, state: {categoryId: string} }}
 */
function createShopModal() {
	const modal = createElement("div", { className: "jaf-modal", attrs: { id: "jaf-shop-modal" } });
	const content = createElement("div", { className: "jaf-modal-content jaf-shop-modal-content" });

	const header = createElement("div", { className: "jaf-shop-header" });
	const title = createElement("h2", { className: "jaf-modal-title jaf-shop-title", text: "小卖铺" });
	const wallet = createElement("div", { className: "jaf-shop-wallet" });
	const memoryCurrency = createElement("div", { className: "jaf-shop-currency" });
	const dreamCurrency = createElement("div", { className: "jaf-shop-currency" });
	const jiangFuCurrency = createElement("div", { className: "jaf-shop-currency" });
	const closeBtn = createElement("button", {
		className: "jaf-game-close",
		text: "×",
		attrs: { type: "button", "aria-label": "关闭小卖铺" },
	});

	wallet.append(memoryCurrency, dreamCurrency, jiangFuCurrency);
	header.append(title, wallet);

	const body = createElement("div", { className: "jaf-shop-body" });
	const categoryList = createElement("div", { className: "jaf-shop-category-list" });
	const goodsPanel = createElement("div", { className: "jaf-shop-goods-panel" });
	const goodsTitle = createElement("h3", { className: "jaf-shop-goods-title", text: "商品列表" });
	const goodsList = createElement("div", { className: "jaf-shop-goods-list" });

	goodsPanel.append(goodsTitle, goodsList);
	body.append(categoryList, goodsPanel);
	content.append(header, closeBtn, body);
	modal.appendChild(content);

	return {
		modal,
		closeBtn,
		categoryList,
		goodsTitle,
		goodsList,
		memoryCurrency,
		dreamCurrency,
		jiangFuCurrency,
		state: {
			categoryId: Object.keys(SHOP_DATA)[0] || "gacha",
			loaded: false,
			ownedItemIds: {},
			...shopHelpers.normalizeShopCurrency(),
			isSaving: false,
		},
	};
}

/**
 * 渲染小卖铺弹窗内容
 * @param {ReturnType<typeof createShopModal>} shopData
 */
function renderShop(shopData) {
	const categories = Object.entries(SHOP_DATA).map(([id, data]) => ({ id, ...data }));
	if (shopData.memoryCurrency) {
		shopData.memoryCurrency.textContent = `忆铢：${shopData.state.memoryZhu}`;
	}
	if (shopData.dreamCurrency) {
		shopData.dreamCurrency.textContent = `梦钿：${shopData.state.dreamDian}`;
	}
	if (shopData.jiangFuCurrency) {
		shopData.jiangFuCurrency.textContent = `将符：${shopData.state.jiangFu}`;
	}

	if (!categories.length) {
		shopData.categoryList.replaceChildren();
		shopData.goodsList.replaceChildren(createElement("div", { className: "jaf-shop-empty", text: "暂无可用商品" }));
		shopData.goodsTitle.textContent = "商品列表";
		return;
	}

	if (!categories.some(item => item.id === shopData.state.categoryId)) {
		shopData.state.categoryId = categories[0].id;
	}

	shopData.categoryList.replaceChildren();
	categories.forEach(category => {
		const isActive = category.id === shopData.state.categoryId;
		const btn = createElement("button", {
			className: `jaf-shop-category-tab${isActive ? " active" : ""}`,
			text: category.name,
			attrs: { type: "button", "data-id": category.id },
		});
		btn.addEventListener("click", () => {
			shopData.state.categoryId = category.id;
			renderShop(shopData);
		});
		shopData.categoryList.appendChild(btn);
	});

	const currentCategory = categories.find(item => item.id === shopData.state.categoryId) || categories[0];
	if (currentCategory?.id === "gacha") {
		const gachaGoods = SHOP_DATA.gacha?.goods || {};
		const poolIds = Object.keys(gachaGoods);

		shopData.goodsTitle.textContent = `抽卡卡池（${poolIds.length}）`;
		shopData.goodsList.replaceChildren();

		poolIds.forEach(poolId => {
			const pool = gachaGoods[poolId];
			const poolName = get.translation(poolId) || poolId;
			const currentOwned = new Set(Array.isArray(_status.characterlist) ? _status.characterlist : []);
			const poolCharacters = getGachaPoolCharacters(pool.prizePool);
			const unownedCount = poolCharacters.filter(id => !currentOwned.has(id)).length;
			const poolSingleCostMemoryZhu = pool.price.memoryZhu;
			const singleCost = getGachaCostDetail({
				singleCostMemoryZhu: poolSingleCostMemoryZhu,
				drawCount: 1,
				jiangFuOwned: shopData.state.jiangFu,
			});
			const tenCost = getGachaCostDetail({
				singleCostMemoryZhu: poolSingleCostMemoryZhu,
				drawCount: 10,
				jiangFuOwned: shopData.state.jiangFu,
			});

			const poolCard = createElement("article", { className: "jaf-shop-item jaf-shop-item-gacha" });
			poolCard.setAttribute("role", "button");
			poolCard.setAttribute("tabindex", "0");
			poolCard.setAttribute("aria-label", `查看卡池 ${poolName}`);
			const itemLink = createElement("div", { className: "jaf-shop-item-link" });
			const imageWrap = createElement("div", { className: "jaf-shop-img-wrapper" });
			const poolImage = createElement("img", {
				className: "jaf-shop-item-image-inner",
				attrs: {
					src: pool.image,
					alt: `${poolName} 图片`,
					draggable: "false",
				},
			});
			poolImage.draggable = false;
			poolImage.addEventListener("dragstart", event => event.preventDefault());
			poolImage.addEventListener("error", () => {
				poolImage.remove();
				imageWrap.appendChild(createElement("span", { className: "jaf-shop-item-image-placeholder", text: "卡池" }));
			});
			imageWrap.appendChild(poolImage);
			const nameTag = createElement("h4", { className: "jaf-shop-item-name", text: poolName });
			const priceTag = createElement("span", {
				className: "jaf-shop-item-price-currency",
				text: `单抽${singleCost.discountedMemory}忆铢\n十连${tenCost.discountedMemory}忆铢`,
			});
			const typeTag = createElement("span", {
				className: "jaf-shop-item-status is-single",
				text: "卡池",
			});
			itemLink.append(imageWrap, nameTag, priceTag);
			poolCard.append(itemLink, typeTag);

			const doDraw = async drawCount => {
				const result = await shopHelpers.runGachaDraw({
					shopState: shopData.state,
					poolConfig: pool,
					drawCount,
				});
				if (!result.ok) {
					showShopNoticeDialog({ title: "抽卡失败", message: result.message || "抽卡失败，请稍后重试。" });
					renderShop(shopData);
					return;
				}
				renderShop(shopData);
				showGachaResultOverlay({
					poolName: poolName,
					results: result.results,
					isTen: drawCount === 10,
					actionButtons: drawCount === 10 ? [{ label: "再来十抽", onClick: () => doDraw(10), className: "is-primary" }] : [{ label: "再来一抽", onClick: () => doDraw(1), className: "is-primary" }],
				});
				return true;
			};

			const openPoolPurchasePage = () => {
				const liveSingle = getGachaCostDetail({
					singleCostMemoryZhu: poolSingleCostMemoryZhu,
					drawCount: 1,
					jiangFuOwned: shopData.state.jiangFu,
				});
				const liveTen = getGachaCostDetail({
					singleCostMemoryZhu: poolSingleCostMemoryZhu,
					drawCount: 10,
					jiangFuOwned: shopData.state.jiangFu,
				});
				showShopPurchaseDialog({
					showEffect: false,
					item: {
						id: poolId,
						price: `单抽${liveSingle.discountedMemory}忆铢 / 十连${liveTen.discountedMemory}忆铢（9折）`,
						desc: `${get.translation(`${poolId}_info`)}（1 将符可以折扣 1 忆铢）\n卡池数量：${poolCharacters.length}，未拥有：${unownedCount}，重复返还：+${pool.duplicateJiangFu}将符。`,
						image: pool.image,
					},
					actionButtons: [
						{
							label: `单抽（实付 ${liveSingle.finalMemoryCost} 忆铢）`,
							onClick: () => doDraw(1),
						},
						{
							label: `十连（实付 ${liveTen.finalMemoryCost} 忆铢）`,
							onClick: () => doDraw(10),
						},
					],
				});
			};

			poolCard.addEventListener("click", openPoolPurchasePage);
			poolCard.addEventListener("keydown", event => {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				openPoolPurchasePage();
			});
			shopData.goodsList.appendChild(poolCard);
		});
		return;
	}

	const goods = currentCategory?.goods || {};
	const goodsEntries = Object.entries(goods);
	shopData.goodsTitle.textContent = `${currentCategory?.name || "商品"}（${goodsEntries.length}）`;

	shopData.goodsList.replaceChildren();
	if (!goodsEntries.length) {
		shopData.goodsList.appendChild(createElement("div", { className: "jaf-shop-empty", text: "该分类暂无商品" }));
		return;
	}

	goodsEntries.forEach(([itemId, item]) => {
		const card = createElement("article", { className: "jaf-shop-item" });
		card.setAttribute("role", "button");
		card.setAttribute("tabindex", "0");
		card.setAttribute("aria-label", `查看商品 ${get.translation(itemId) || item.name || "未命名商品"}`);
		const itemLink = createElement("div", { className: "jaf-shop-item-link" });
		const imageWrap = createElement("div", { className: "jaf-shop-img-wrapper" });

		const normalizedPrice = shopHelpers.normalizeShopPrice(item.price);

		const currency = createElement("span", {
			className: "jaf-shop-item-price-currency",
			text: shopHelpers.formatShopPrice(normalizedPrice),
		});
		const nameTag = createElement("h4", { className: "jaf-shop-item-name", text: get.translation(itemId) || item.name || "未命名商品" });

		if (item.image) {
			const image = createElement("img", {
				className: "jaf-shop-item-image-inner",
				attrs: {
					src: item.image,
					alt: `${get.translation(itemId) || item.name} 图片`,
					draggable: "false",
				},
			});
			image.draggable = false;
			image.addEventListener("dragstart", event => event.preventDefault());
			imageWrap.appendChild(image);
		} else {
			imageWrap.appendChild(createElement("span", { className: "jaf-shop-item-image-placeholder", text: "图片预留" }));
		}

		const isRepeatable = Boolean(item?.repeatable);
		const ownedCount = Number(shopData.state.ownedItemIds?.[itemId]) || 0;

		itemLink.append(imageWrap, nameTag, currency);
		const typeTag = !isRepeatable
			? createElement("span", {
					className: "jaf-shop-item-status is-single",
					text: "唯一",
				})
			: null;

		const isOwned = !isRepeatable && ownedCount > 0;
		if (isRepeatable) {
			card.classList.add("is-repeatable");
		}
		if (isOwned) {
			card.classList.add("is-owned");
		}

		const purchaseItem = async () => {
			if (shopData.state.isSaving || (!isRepeatable && (Number(shopData.state.ownedItemIds?.[itemId]) || 0) > 0)) return;

			if (!shopHelpers.canAffordShopPrice(shopData.state, normalizedPrice)) {
				showShopNoticeDialog({
					title: "余额不足",
					message: `${item.name} 需要 ${shopHelpers.formatShopPrice(normalizedPrice)}，当前余额：${SHOP_CURRENCY.map(key => `${get.translation(key)}：${Number(shopData.state?.[key]) || 0}`).join("，")}。`,
				});
				return false;
			}

			applyShopPrice(shopData.state, normalizedPrice, -1);
			shopData.state.isSaving = true;
			const prevOwnedCount = Number(shopData.state.ownedItemIds?.[itemId]) || 0;
			const nextOwnedCount = isRepeatable ? prevOwnedCount + 1 : Math.max(prevOwnedCount, 1);
			shopData.state.ownedItemIds[itemId] = nextOwnedCount;

			if (!isRepeatable && prevOwnedCount > 0) {
				shopData.state.ownedItemIds[itemId] = prevOwnedCount;
			}

			gameData.currency = shopHelpers.normalizeShopCurrency(shopData.state);
			gameData.ownedItemIds = shopHelpers.normalizeOwnedItemCounts(shopData.state.ownedItemIds);
			// 仅当购买不可重复物品时立刻关闭引导遮罩
			if (!isRepeatable && prevOwnedCount === 0) {
				assetHelpers.removeIntroOverlay();
			}

			assetHelpers.showToast("购买成功");
			await assetHelpers.saveGameData();
			shopData.state.isSaving = false;
			renderShop(shopData);
		};

		const openPurchasePage = () => {
			showShopPurchaseDialog({
				item: { ...item, id: itemId },
				isOwned: !isRepeatable && (Number(shopData.state.ownedItemIds?.[itemId]) || 0) > 0,
				isRepeatable,
				onPurchase: purchaseItem,
			});
		};

		card.addEventListener("click", openPurchasePage);
		card.addEventListener("keydown", event => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			openPurchasePage();
		});

		card.append(itemLink);
		if (typeTag) card.appendChild(typeTag);
		shopData.goodsList.appendChild(card);
	});
}

/**
 * 渲染背包内容
 * @param {ReturnType<typeof createInventoryModal>} inventoryData - 背包数据对象
 */
function renderInventory(inventoryData) {
	const categories = Object.entries(SHOP_DATA)
		.filter(([id]) => id !== "gacha")
		.map(([id, data]) => ({ id, ...data }));
	const ownedItemIds = gameData?.ownedItemIds || {};

	if (!categories.length) {
		inventoryData.categoryList.replaceChildren();
		inventoryData.itemsGrid.replaceChildren();
		inventoryData.stats.textContent = `已拥有 0 件物品`;
		return;
	}

	if (!categories.some(item => item.id === inventoryData.state.categoryId)) {
		inventoryData.state.categoryId = categories[0].id;
	}

	// 渲染分类按钮
	inventoryData.categoryList.replaceChildren();
	categories.forEach(category => {
		const isActive = category.id === inventoryData.state.categoryId;
		const btn = createElement("button", {
			className: `jaf-inventory-category-tab${isActive ? " active" : ""}`,
			text: category.name,
			attrs: { type: "button", "data-id": category.id },
		});
		btn.addEventListener("click", () => {
			inventoryData.state.categoryId = category.id;
			renderInventory(inventoryData);
		});
		inventoryData.categoryList.appendChild(btn);
	});

	const currentCategory = categories.find(item => item.id === inventoryData.state.categoryId) || categories[0];
	const goods = currentCategory?.goods || {};

	// 筛选拥有的物品列表
	const inventoryItems = Object.entries(goods)
		.filter(([itemId]) => {
			const ownedCount = Number(ownedItemIds?.[itemId]) || 0;
			return ownedCount > 0;
		})
		.map(([itemId, item]) => ({
			id: itemId,
			name: get.translation(itemId) || item.name || "未知物品",
			desc: get.translation(itemId + "_info") || item.desc || "暂无描述",
			image: item.image || "",
			price: item.price || {},
			skills: item.skills || [],
			count: Math.max(0, Math.floor(Number(ownedItemIds[itemId]) || 0)),
		}));

	// 搜索过滤
	let filteredItems = inventoryItems;
	const rawSearch = String(inventoryData.searchInput?.value || "")
		.trim()
		.toLowerCase();
	if (rawSearch) {
		filteredItems = filteredItems.filter(item => {
			const name = String(item.name || "").toLowerCase();
			const desc = String(get.translation(item.id + "_info") || item.desc || "").toLowerCase();
			return name.includes(rawSearch) || desc.includes(rawSearch) || item.id.toLowerCase().includes(rawSearch);
		});
	}

	// 更新统计信息
	const totalCount = inventoryItems.reduce((sum, item) => sum + (item.count || 0), 0);
	inventoryData.stats.textContent = `已拥有 ${totalCount} 件物品`;

	// 渲染物品网格
	inventoryData.itemsGrid.replaceChildren();

	if (!filteredItems.length) {
		const emptyTip = createElement("div", {
			className: "jaf-inventory-empty",
			text: rawSearch ? "未找到匹配的物品" : "背包空空如也",
		});
		inventoryData.itemsGrid.appendChild(emptyTip);
		return;
	}

	filteredItems.forEach(item => {
		const itemCard = createElement("article", {
			className: "jaf-shop-item jaf-inventory-item",
			attrs: {
				role: "button",
				tabindex: "0",
				"data-id": item.id,
				"aria-label": `查看物品 ${get.translation(item.id) || item.name}`,
			},
		});

		const itemLink = createElement("div", { className: "jaf-shop-item-link" });
		const imageWrap = createElement("div", { className: "jaf-shop-img-wrapper" });
		const nameTag = createElement("h4", { className: "jaf-shop-item-name", text: get.translation(item.id) || item.name });

		// 显示图片或占位符
		if (item.image) {
			const itemImage = createElement("img", {
				className: "jaf-shop-item-image-inner",
				attrs: {
					src: item.image,
					alt: get.translation(item.id) || item.name,
					draggable: "false",
				},
			});
			itemImage.draggable = false;
			itemImage.addEventListener("dragstart", event => event.preventDefault());
			itemImage.addEventListener("error", () => {
				itemImage.remove();
				imageWrap.appendChild(
					createElement("span", {
						className: "jaf-shop-item-image-placeholder",
						text: get.translation(item.id) || item.name,
					})
				);
			});
			imageWrap.appendChild(itemImage);
		} else {
			imageWrap.appendChild(
				createElement("span", {
					className: "jaf-shop-item-image-placeholder",
					text: get.translation(item.id) || item.name,
				})
			);
		}

		// 在图片右下角显示数量
		const countBadge = createElement("span", {
			className: "jaf-inventory-count-badge",
			text: `×${item.count}`,
		});
		imageWrap.appendChild(countBadge);

		itemLink.append(imageWrap, nameTag);
		itemCard.appendChild(itemLink);

		// 点击显示详情和操作
		const openDetail = () => {
			showItemDetailDialog(item, inventoryData);
		};
		itemCard.addEventListener("click", openDetail);
		itemCard.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openDetail();
			}
		});

		inventoryData.itemsGrid.appendChild(itemCard);
	});
}

/**
 * 显示物品详情对话框
 * @param {Object} item - 物品对象（来自 renderInventory）
 * @param {ReturnType<typeof createInventoryModal>} inventoryData - 背包数据对象
 */
function showItemDetailDialog(item, inventoryData) {
	// 从 SHOP_DATA 查找完整的物品定义
	let fullItem = null;
	let categoryId = null;
	for (const [id, category] of Object.entries(SHOP_DATA)) {
		if (id === "gacha") continue;
		const found = category.goods?.[item.id];
		if (found) {
			fullItem = found;
			categoryId = id;
			break;
		}
	}

	const actionButtons = [];

	if (categoryId === "props") {
		// 装备
		actionButtons.push({
			label: "装备",
			className: "jaf-intro-btn-primary",
			onClick: async () => {
				assetHelpers.removeIntroOverlay();
				showToast(`装备了 ${get.translation(item.id) || item.name}`);
				// TODO: 实际装备逻辑
				return true;
			},
		});
	} else if (SHOP_DATA[categoryId].usable) {
		actionButtons.push({
			label: "使用",
			className: "jaf-intro-btn-primary",
			onClick: async () => {
				if (item.count <= 0) {
					showToast("该物品数量不足");
					return false;
				}
				assetHelpers.removeIntroOverlay();
				const ownedItemIds = gameData?.ownedItemIds || {};
				ownedItemIds[item.id] = Math.max(0, (ownedItemIds[item.id] || 0) - 1);
				gameData.ownedItemIds = shopHelpers.normalizeOwnedItemCounts(ownedItemIds);
				await assetHelpers.saveGameData();
				renderInventory(inventoryData);
				await assetHelpers.showToast(`使用了 ${get.translation(item.id) || item.name}`);
				const skills = Array.isArray(fullItem?.skills) ? fullItem.skills : [];
				if (skills.length > 0) {
					_status.additionalEffect = Array.isArray(_status.additionalEffect) ? _status.additionalEffect : [];
					_status.additionalEffect.push(...skills);
				}
				return true;
			},
		});
	}

	// 丢弃按钮
	actionButtons.push({
		label: "丢弃",
		className: "jaf-intro-btn-danger",
		onClick: async () => {
			assetHelpers.removeIntroOverlay();
			const ownedItemIds = gameData?.ownedItemIds || {};
			ownedItemIds[item.id] = Math.max(0, (ownedItemIds[item.id] || 0) - 1);
			gameData.ownedItemIds = shopHelpers.normalizeOwnedItemCounts(ownedItemIds);
			await assetHelpers.saveGameData();
			renderInventory(inventoryData);
			await showToast(`丢弃了 ${get.translation(item.id) || item.name}`);
			return true;
		},
	});

	showShopPurchaseDialog({
		item,
		isOwned: true,
		isRepeatable: false,
		actionButtons: actionButtons,
		onPurchase: async () => false,
		purchase: false,
	});
}

/**
 * 渲染千禧册图鉴
 */
function renderAlbum(albumData) {
	if (typeof albumData.state.disposeLazyLoad === "function") {
		albumData.state.disposeLazyLoad();
		albumData.state.disposeLazyLoad = null;
	}

	const ownSet = new Set(_status.characterlist);
	const packIds = getAlbumPackList();
	if (!packIds.length) {
		albumData.packList.replaceChildren();
		albumData.subPackList.replaceChildren();
		albumData.viewport.replaceChildren();
		albumData.stats.textContent = "已拥有 0 / 0";
		return;
	}

	if (!packIds.includes(albumData.state.packId)) {
		albumData.state.packId = packIds[0];
	}
	const { packId, subPackId } = albumData.state;

	albumData.packList.replaceChildren();
	const packTextMap = {
		"all-pack": "所有卡包",
	};
	packIds.forEach(id => {
		const btn = createElement("button", {
			className: `jaf-album-tab${id === packId ? " active" : ""}`,
			html: packTextMap[id] || lib.translate[`${id}_character_config`] || lib.translate[id] || id,
			attrs: { type: "button", "data-id": id },
		});
		btn.addEventListener("click", () => {
			albumData.state.packId = id;
			albumData.state.subPackId = "all-characters";
			renderAlbum(albumData);
		});
		albumData.packList.appendChild(btn);
	});

	const subPacks = getAlbumSubPackList(packId);
	if (!subPacks.includes(subPackId)) {
		albumData.state.subPackId = "all-characters";
	}

	albumData.subPackList.replaceChildren();
	subPacks.forEach(id => {
		const subPackTextMap = {
			"all-characters": "所有武将",
		};
		const btn = createElement("button", {
			className: `jaf-album-subtab${id === albumData.state.subPackId ? " active" : ""}`,
			html: subPackTextMap[id] || lib.translate[id] || id,
			attrs: { type: "button", "data-id": id },
		});
		btn.addEventListener("click", () => {
			albumData.state.subPackId = id;
			renderAlbum(albumData);
		});
		albumData.subPackList.appendChild(btn);
	});

	let characters = getAlbumCharacters(albumData.state.packId, albumData.state.subPackId);

	const rawSearch = String(albumData.searchInput?.value || "")
		.trim()
		.toLowerCase();
	if (rawSearch) {
		characters = characters.filter(id => {
			const name = String(lib.translate[id] || id).toLowerCase();
			return name.includes(rawSearch) || id.toLowerCase().includes(rawSearch);
		});
	}

	const ownedCount = characters.reduce((acc, id) => acc + (ownSet.has(id) ? 1 : 0), 0);
	albumData.stats.textContent = `已拥有 ${ownedCount} / ${characters.length}`;

	albumData.viewport.replaceChildren();
	const ownedCharacters = characters.filter(id => ownSet.has(id));
	const unownedCharacters = characters.filter(id => !ownSet.has(id));

	const createCharacterGroup = ({ title, isUnowned = false }) => {
		const group = createElement("section", {
			className: `jaf-album-group${isUnowned ? " is-unowned" : ""}`,
			attrs: { "data-group": isUnowned ? "unowned" : "owned" },
		});
		const heading = createElement("h3", { className: "jaf-album-group-title", text: title });
		const grid = createElement("div", { className: "jaf-album-character-grid" });
		group.append(heading, grid);
		return { group, grid };
	};

	const ownedGroup = createCharacterGroup({ title: `已拥有（${ownedCharacters.length}）` });
	const unownedGroup = createCharacterGroup({ title: `未拥有（${unownedCharacters.length}）`, isUnowned: true });
	albumData.viewport.append(ownedGroup.group, unownedGroup.group);

	if (!ownedCharacters.length) {
		ownedGroup.grid.appendChild(
			createElement("div", {
				className: "jaf-album-empty-tip",
				text: "暂无已拥有武将",
			})
		);
	}
	if (!unownedCharacters.length) {
		unownedGroup.grid.appendChild(
			createElement("div", {
				className: "jaf-album-empty-tip",
				text: "暂无未拥有武将",
			})
		);
	}

	const renderQueue = [...ownedCharacters.map(id => ({ id, isUnowned: false, grid: ownedGroup.grid })), ...unownedCharacters.map(id => ({ id, isUnowned: true, grid: unownedGroup.grid }))];

	const appendCharacterButton = ({ id, isUnowned, grid }) => {
		const tempWrapper = createElement("div");
		const [button] = ui.create.buttons([id], "character", tempWrapper);
		if (!button) return;

		ui.create.rarity(button);
		button.classList.add("jaf-album-char-button");
		if (isUnowned) {
			button.classList.add("is-unowned");
		}
		button.addEventListener("click", () => {
			ui.click.charactercard(button.link, button);
		});
		grid.appendChild(button);
	};

	let renderedCount = 0;
	const renderNext = step => {
		const count = Math.max(1, Number(step) || 1);
		for (let i = 0; i < count && renderedCount < renderQueue.length; i++) {
			appendCharacterButton(renderQueue[renderedCount]);
			renderedCount += 1;
		}
	};

	renderNext(70);

	if (renderedCount >= renderQueue.length) {
		return;
	}

	let rafId = 0;
	const viewport = albumData.viewport;
	const disposeLazyLoad = () => {
		if (rafId) {
			window.cancelAnimationFrame(rafId);
			rafId = 0;
		}
		viewport.removeEventListener("scroll", onViewportScroll);
		if (albumData.state.disposeLazyLoad === disposeLazyLoad) {
			albumData.state.disposeLazyLoad = null;
		}
	};

	const tryLoadOne = () => {
		rafId = 0;
		if (!viewport.isConnected) {
			disposeLazyLoad();
			return;
		}
		const nearBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 120;
		if (!nearBottom) return;

		renderNext(1);
		if (renderedCount >= renderQueue.length) {
			disposeLazyLoad();
		}
	};

	const onViewportScroll = () => {
		if (rafId) return;
		rafId = window.requestAnimationFrame(tryLoadOne);
	};

	viewport.addEventListener("scroll", onViewportScroll, { passive: true });
	albumData.state.disposeLazyLoad = disposeLazyLoad;
}

/**
 * 渲染关卡选择卡片，根据章节数据生成关卡项，支持点击关卡项触发回调和右键查看关卡介绍
 * @param {Object} levelModalData - 关卡选择弹窗数据对象
 * @param {Object} chapter - 章节数据
 * @param {Function} onSelectLevel - 选择关卡时的回调函数
 * @returns {void}
 */
function renderLevelCards(levelModalData, chapter, onSelectLevel, { progressId = "c1l1" } = {}) {
	levelModalData.title.textContent = chapter?.title || "关卡选择";
	const levelsObj = chapter?.levels || {};
	const levels = Object.keys(levelsObj).length > 0 ? Object.entries(levelsObj).map(([id, level]) => ({ id, ...level })) : [{ id: `${chapter?.id || "chapter"}-coming-soon`, title: "敬请期待", intro: "该章节关卡正在制作中。", hint: "目前暂无额外提示，请耐心等待更新。", image: null }];
	const normalizedProgressId = normalizeProgressId(progressId);

	levelModalData.cardsContainer.replaceChildren();
	levels.forEach(level => {
		const isUnlocked = isLevelUnlockedByProgress(level?.id, normalizedProgressId);
		const card = createElement("div", { className: "jaf-level-card" });
		if (!isUnlocked) {
			card.classList.add("is-locked");
			card.setAttribute("aria-disabled", "true");
		}
		const levelImage = getLevelImage(level);
		const img = createElement("img", {
			className: "jaf-level-card-image",
			attrs: {
				src: levelImage,
				alt: `${level.title} 预览图`,
				draggable: "false",
			},
		});
		img.draggable = false;
		img.addEventListener("dragstart", event => event.preventDefault());
		const cardTitle = createElement("div", { className: "jaf-level-card-title", text: level.title });
		const lockText = `（未解锁，当前进度：${formatProgressText(normalizedProgressId)}）`;
		const hint = createElement("div", { className: "jaf-level-card-intro", text: `${level.intro || ""}${isUnlocked ? "" : lockText}` });

		card.addEventListener("click", () => {
			if (!isUnlocked) {
				showShopNoticeDialog({
					title: "关卡未解锁",
					message: `该关卡尚未解锁，当前最多可挑战到 ${formatProgressText(normalizedProgressId)}。`,
				});
				return;
			}
			onSelectLevel?.(level);
		});
		card.addEventListener("contextmenu", event => {
			event.preventDefault();
			showLevelIntroDialog(level);
		});

		card.append(img, cardTitle, hint);
		levelModalData.cardsContainer.appendChild(card);
	});
}

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

	// 根节点（聚焦以便监听键盘）
	const root = createElement("div", { className: "jaf-entry-root", attrs: { id: "jaf-entry-root" } });
	root.tabIndex = -1;

	// 背景噪点层
	const noise = createElement("div", { className: "jaf-noise", attrs: { "aria-hidden": "true" } });

	// 主容器（标题 / 副标题 / 按钮）
	const container = createElement("div", {
		className: "jaf-game-container",
		attrs: {
			role: "dialog",
			"aria-label": "忽然而已 · 千禧梦入口",
		},
	});

	const title = createElement("h1", { className: "jaf-game-title", text: "忽然而已" });
	const subtitle = createElement("p", { className: "jaf-game-subtitle", text: "—— 流年拾梦 · 光景藏情 ——" });

	const btnContainer = createElement("div", { className: "jaf-btn-container" });
	const enterBtn = createElement("button", { className: "jaf-game-btn", text: "入梦" });
	const albumBtn = createElement("button", { className: "jaf-game-btn", text: "千禧册" });
	const inventoryBtn = createElement("button", { className: "jaf-game-btn", text: "背包" });
	const shopBtn = createElement("button", { className: "jaf-game-btn", text: "小卖铺" });
	btnContainer.append(enterBtn, albumBtn, inventoryBtn, shopBtn);

	container.append(title, subtitle, btnContainer);

	const levelModalData = createLevelSelectModal();
	const challengeModalData = createChallengeModal();
	const prepareModalData = createPrepareModal();
	const albumModalData = createAlbumModal();
	const inventoryModalData = createInventoryModal();
	const shopModalData = createShopModal();
	root._disposeAlbumPackWheel = bindHorizontalWheelScroll(albumModalData.packList);
	if (albumModalData.searchInput) {
		albumModalData.searchInput.addEventListener("input", () => renderAlbum(albumModalData));
	}
	if (inventoryModalData.searchInput) {
		inventoryModalData.searchInput.addEventListener("input", () => renderInventory(inventoryModalData));
	}
	let currentChapter = null;
	let currentLevel = null;
	const currentProgressId = normalizeProgressId(gameData?.progress);

	function openChallengeModal(level, chapter) {
		if (!isLevelUnlockedByProgress(level?.id, currentProgressId)) {
			showShopNoticeDialog({
				title: "关卡未解锁",
				message: `该关卡尚未解锁，当前最多可挑战到 ${formatProgressText(currentProgressId)}。`,
			});
			return;
		}
		currentLevel = level || null;
		currentChapter = chapter || null;
		challengeModalData.title.textContent = `${level?.title || "未知关卡"}`;
		challengeModalData.desc.textContent = level?.hint || level?.intro || "该关卡暂无额外描述。";
		challengeModalData.image.src = getLevelImage(level);
		challengeModalData.image.alt = `${level?.title || "未知关卡"} 预览图`;
		challengeModalData.setDifficulty(1);
		openModal(challengeModalData.modal);
	}

	const chapterModalData = createChapterModal(chapter => {
		currentChapter = chapter;
		renderLevelCards(levelModalData, chapter, level => openChallengeModal(level, chapter), {
			progressId: currentProgressId,
		});
		closeModal(chapterModalData.modal);
		openModal(levelModalData.modal);
	});

	/**
	 * ESC 键返回上一级菜单的函数
	 * @returns {void}
	 */
	function goBackOneLevel() {
		if (document.getElementById("jaf-level-intro-overlay")) return;

		if (prepareModalData.modal.classList.contains("is-open")) {
			closeModal(prepareModalData.modal);
			return;
		}

		if (challengeModalData.modal.classList.contains("is-open")) {
			closeModal(challengeModalData.modal);
			return;
		}

		if (levelModalData.modal.classList.contains("is-open")) {
			closeModal(levelModalData.modal);
			openModal(chapterModalData.modal);
			return;
		}

		if (chapterModalData.modal.classList.contains("is-open")) {
			closeModal(chapterModalData.modal);
			return;
		}

		if (albumModalData.modal.classList.contains("is-open")) {
			closeModal(albumModalData.modal);
			return;
		}

		if (inventoryModalData.modal.classList.contains("is-open")) {
			closeModal(inventoryModalData.modal);
			return;
		}

		if (shopModalData.modal.classList.contains("is-open")) {
			closeModal(shopModalData.modal);
		}
	}

	root.append(noise, container, chapterModalData.modal, levelModalData.modal, challengeModalData.modal, prepareModalData.modal, albumModalData.modal, inventoryModalData.modal, shopModalData.modal);

	// 行为绑定：入梦打开章节弹窗；千禧册打开图鉴；背包打开物品管理；小卖铺打开商店
	enterBtn.addEventListener("click", () => openModal(chapterModalData.modal));
	albumBtn.addEventListener("click", () => {
		renderAlbum(albumModalData);
		openModal(albumModalData.modal);
	});
	inventoryBtn.addEventListener("click", () => {
		renderInventory(inventoryModalData);
		openModal(inventoryModalData.modal);
	});
	shopBtn.addEventListener("click", async () => {
		try {
			applyParsedShopDataToState(shopModalData.state, gameData);
			shopModalData.state.loaded = true;
		} catch (error) {
			console.error(error);
		}
		renderShop(shopModalData);
		openModal(shopModalData.modal);
	});

	// 关闭按钮
	chapterModalData.closeBtn.addEventListener("click", () => closeModal(chapterModalData.modal));
	levelModalData.closeBtn.addEventListener("click", () => {
		closeModal(levelModalData.modal);
		openModal(chapterModalData.modal);
	});
	challengeModalData.closeBtn.addEventListener("click", () => closeModal(challengeModalData.modal));
	albumModalData.closeBtn.addEventListener("click", () => closeModal(albumModalData.modal));
	inventoryModalData.closeBtn.addEventListener("click", () => closeModal(inventoryModalData.modal));
	shopModalData.closeBtn.addEventListener("click", () => closeModal(shopModalData.modal));

	// 备战按钮
	levelModalData.prepare.addEventListener("click", () => {
		renderPrepare(prepareModalData);
		closeModal(levelModalData.modal);
		openModal(prepareModalData.modal);
	});

	// 备战关闭按钮
	prepareModalData.closeBtn.addEventListener("click", () => {
		closeModal(prepareModalData.modal);
		openModal(levelModalData.modal);
	});

	// 备战确定按钮
	prepareModalData.confirmBtn.addEventListener("click", () => {
		const selectedCount = gameData?.treasure?.length || 0;
		closeModal(prepareModalData.modal);
		openModal(levelModalData.modal);
		showToast(`已携带 ${selectedCount} 个宝物`);
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
			const difficulty = typeof challengeModalData?.getDifficulty === "function" ? Number(challengeModalData.getDifficulty()) || 1 : 1;
			if (!cheated) {
				const rewardCurrency = currentLevel?.reward?.currency || {};
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

			const next = getNextProgressId(currentLevel?.id);
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

	challengeModalData.startBtn.addEventListener("click", () => {
		_status.jafCheatUsed = false;

		const startInfo = {
			started: true,
			difficulty: challengeModalData.getDifficulty(),
			chapterId: currentChapter?.id ?? null,
			chapterTitle: currentChapter?.title ?? null,
			levelId: currentLevel?.id ?? null,
			levelTitle: currentLevel?.title ?? null,
			gameData: currentLevel?.gameData ?? null,
			nextProgressId: getNextProgressId(currentLevel?.id) || null,
		};
		onStartGame?.(startInfo);
		closeStartBeforeUIInternal({ immediate: true, increaseToken: true });
	});

	// 点击蒙层关闭（按层级返回）
	bindModalMaskClose(chapterModalData.modal, () => closeModal(chapterModalData.modal));
	bindModalMaskClose(levelModalData.modal, () => {
		closeModal(levelModalData.modal);
		openModal(chapterModalData.modal);
	});
	bindModalMaskClose(challengeModalData.modal, () => closeModal(challengeModalData.modal));
	bindModalMaskClose(prepareModalData.modal, () => {
		closeModal(prepareModalData.modal);
		openModal(levelModalData.modal);
	});
	bindModalMaskClose(albumModalData.modal, () => closeModal(albumModalData.modal));
	bindModalMaskClose(inventoryModalData.modal, () => closeModal(inventoryModalData.modal));
	bindModalMaskClose(shopModalData.modal, () => closeModal(shopModalData.modal));

	// 仅保留一个 ESC 监听：每次只返回上一级（绑定在 document，避免焦点不在 root 时失效）
	const onGlobalKeyDown = event => {
		if (event.key !== "Escape") return;
		if (!root.isConnected) return;
		event.preventDefault();
		goBackOneLevel();
	};
	document.addEventListener("keydown", onGlobalKeyDown);
	root._disposeKeydown = () => {
		document.removeEventListener("keydown", onGlobalKeyDown);
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
		root.focus();
	});
}

async function startBefore() {
	const currentSessionToken = ++startBeforeSessionToken;
	closeStartBeforeUIInternal({ immediate: true, increaseToken: false });

	// 尝试加载自定义字体（无阻塞，仅尝试）
	document.fonts.load("1px huangcao");
	document.fonts.load("1px xinwei");

	// 使用主程序提供的样式加载方法（同步返回 link-like 对象）
	const styleLink = lib.init.css(lib.assetURL + "extension/忽然而已/assets/css/mode", "style");
	const isLoaded = await waitForCssLoaded(styleLink);
	if (!isLoaded) {
		return { started: false, reason: "style-load-failed" };
	}
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
