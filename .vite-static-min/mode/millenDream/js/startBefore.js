import { _status as t, game as a, lib as e, ui as s, get as n } from "noname";
import { MapleFallingEffect as o } from "../../../components/effects/mapleFalling.js";
import { basic as r } from "../../../source/basic.js";
import c from "./CHAPTERS.js";
import l from "./SHOP_DATA.js";
let i,
	m = 0;
try {
	i = await e.init.promises.json(`${r.extensionDirectoryPath}/gameData/save.json`);
} catch {
	i = null;
}
((i && "object" == typeof i) || (i = { ownedItemIds: {}, progress: "c1l1", currency: { memoryZhu: 0, dreamDian: 0, jiangFu: 0 }, characterlist: [] }), Array.isArray(i.characterlist) && (t.characterlist = [...new Set(i.characterlist.filter(t => "string" == typeof t && t.length))]));
const u = { ENTRY_ROOT_ID: "jaf-entry-root", INTRO_OVERLAY_ID: "jaf-level-intro-overlay", SHOP_GACHA_IMAGE: `${r.extensionDirectoryPath}/assets/image/mode/millenDream/draw.jpg`, SHOP_CURRENCY: ["memoryZhu", "dreamDian", "jiangFu"] },
	d = {
		createElement: (t, { className: a, text: e, html: s, attrs: n } = {}) => {
			const o = document.createElement(t);
			return (
				a && (o.className = a),
				"string" == typeof s ? (o.innerHTML = s) : "string" == typeof e && (o.textContent = e),
				n &&
					Object.entries(n).forEach(([t, a]) => {
						null != a && o.setAttribute(t, a);
					}),
				o
			);
		},
		closeModal: t => {
			t && t.classList.remove("is-open");
		},
		openModal: t => {
			t && t.classList.add("is-open");
		},
		bindModalMaskClose: (t, a) => {
			t.addEventListener("click", e => {
				e.target === t && a?.();
			});
		},
		bindHorizontalWheelScroll: t => {
			if (!t || "function" != typeof t.addEventListener) return () => {};
			const a = a => {
					if (!(t.scrollWidth - t.clientWidth > 1)) return;
					const e = (a => {
						const e = Math.abs(a.deltaX) > 0 ? a.deltaX : a.deltaY;
						return e ? (1 === a.deltaMode ? 16 * e : 2 === a.deltaMode ? e * t.clientWidth : e) : 0;
					})(a);
					if (!e) return;
					const s = t.scrollLeft;
					t.scrollLeft += e;
					t.scrollLeft !== s && (a.preventDefault(), a.stopPropagation());
				},
				e = { passive: !1, capture: !0 };
			return (
				t.addEventListener("wheel", a, e),
				() => {
					t.removeEventListener("wheel", a, e);
				}
			);
		},
		waitForCssLoaded: t =>
			t
				? t.sheet
					? Promise.resolve(!0)
					: new Promise(a => {
							(t.addEventListener("load", () => a(!0), { once: !0 }), t.addEventListener("error", () => a(!1), { once: !0 }));
						})
				: Promise.resolve(!1),
	},
	f = {
		DEFAULT_PROGRESS: "c1l1",
		parseProgressId: t => {
			if ("string" != typeof t) return null;
			const a = /^c(\d+)l(\d+)$/i.exec(t.trim());
			if (!a) return null;
			const e = Number(a[1]),
				s = Number(a[2]);
			return !Number.isInteger(e) || !Number.isInteger(s) || e < 1 || s < 1 ? null : { chapter: e, level: s };
		},
		normalizeProgressId: t => {
			const a = f.parseProgressId(t);
			return a ? `c${a.chapter}l${a.level}` : f.DEFAULT_PROGRESS;
		},
		isLevelUnlockedByProgress: (t, a) => {
			const e = f.parseProgressId(t);
			if (!e) return !0;
			const s = f.parseProgressId(a) || f.parseProgressId(f.DEFAULT_PROGRESS);
			return !s || e.chapter < s.chapter || (!(e.chapter > s.chapter) && e.level <= s.level);
		},
		formatProgressText: t => {
			const a = f.parseProgressId(t);
			return a ? `第${a.chapter}章第${a.level}关` : "第1章第1关";
		},
		getNextProgressId: t => {
			if (!Array.isArray(c) || !c.length) return null;
			for (let a = 0; a < c.length; a++) {
				const e = c[a],
					s = Array.isArray(e.levels) ? e.levels : [];
				for (let e = 0; e < s.length; e++) {
					const n = s[e];
					if (n && String(n.id) === String(t)) {
						if (e + 1 < s.length && s[e + 1] && s[e + 1].id) return s[e + 1].id;
						for (let t = a + 1; t < c.length; t++) {
							const a = Array.isArray(c[t].levels) ? c[t].levels : [];
							if (a.length && a[0] && a[0].id) return a[0].id;
						}
						return null;
					}
				}
			}
			const a = f.parseProgressId(t);
			if (!a) return null;
			const { chapter: e, level: s } = a,
				n = e - 1;
			if (n < 0 || n >= c.length) return null;
			const o = c[n],
				r = Array.isArray(o.levels) ? o.levels : [];
			if (s < r.length && r[s] && r[s].id) return r[s].id;
			for (let t = n + 1; t < c.length; t++) {
				const a = Array.isArray(c[t].levels) ? c[t].levels : [];
				if (a.length && a[0] && a[0].id) return a[0].id;
			}
			return null;
		},
	},
	p = {
		getRankCharacterObject: () => {
			if (t.rankCharacterObject) return t.rankCharacterObject;
			const a = Object.keys(e.characterPack.millenDream),
				s = Object.keys(e.character).filter(t => {
					if (a.includes(t)) return !1;
					const s = e.character[t];
					return s && !(s.isUnseen || s.isBoss || s.isHiddenBoss || s.isChessBoss || s.isJiangeBoss);
				}),
				n = { f: e.rank.d, d: e.rank.c, c: e.rank.bm, b: e.rank.b, a: e.rank.am, s: e.rank.a.concat(e.rank.rare).concat(e.rank.bp), ss: e.rank.ap.concat(e.rank.rarity.epic), sss: e.rank.s.concat(e.rank.rarity.legend) },
				o = new Set();
			Object.values(n).forEach(t => {
				t.forEach(t => o.add(t));
			});
			const r = s.filter(t => !o.has(t)),
				c = new Set(),
				l = {};
			return (
				["sss", "ss", "s", "a", "b", "c", "d", "f"].forEach(t => {
					const a = [...new Set(n[t])].filter(t => !c.has(t));
					if ("a" === t) {
						const e = r.filter(t => !c.has(t)),
							s = [...new Set([...a, ...e])];
						((l[t] = s), s.forEach(t => c.add(t)));
					} else ((l[t] = a), a.forEach(t => c.add(t)));
				}),
				(t.rankCharacterObject = l),
				l
			);
		},
		getLevelImage: t => (t.image ? t.image : t.id ? `${r.extensionDirectoryPath}/assets/image/mode/millenDream/${t.id}.jpg` : null),
		getAlbumPackList: () => {
			const t = Array.isArray(e.config?.characters) ? e.config.characters : [],
				a = Array.isArray(e.config?.all?.characters) ? e.config.all.characters : [],
				s = Object.keys(e.characterPack || {}).filter(t => !a.includes(t) && Object.keys(e.characterPack[t] || {}).length > 0);
			return [...a.filter(a => t.includes(a)), ...s];
		},
		getAlbumSubPackList: t => {
			if ("all-pack" === t) return ["all-characters"];
			const a = e.characterSort?.[t] || {};
			return ["all-characters", ...Object.keys(a)];
		},
		getAlbumCharacters: (a, s) => {
			let o = [];
			const r = Object.keys(e.characterPack?.[a] || {});
			if ("all-characters" === s) o = r;
			else {
				o = (e.characterSort?.[a]?.[s] || []).filter(t => r.includes(t));
			}
			const c = new Set(t.characterlist);
			return [...new Set(o)]
				.filter(t => t && e.character[t])
				.sort((t, a) => {
					const e = Number(c.has(a)) - Number(c.has(t));
					if (e) return e;
					const s = n.translation(t),
						o = n.translation(a);
					return s.localeCompare(o, "zh-Hans-CN");
				});
		},
		disposeEntryRootResources: t => {
			if (t) {
				if ("function" == typeof t.t)
					try {
						t.t();
					} catch {}
				if ("function" == typeof t.o)
					try {
						t.o();
					} catch {}
				if (t.l && "function" == typeof t.l.destroy)
					try {
						t.l.destroy();
					} catch {}
			}
		},
		removeEntryRoot(t) {
			t && t.isConnected && (p.disposeEntryRootResources(t), t.classList.add("is-leaving"), window.setTimeout(() => t.remove(), 260));
		},
		addIntroOverlay: ({ title: t, contentHtml: a }) => {
			p.removeIntroOverlay();
			const e = y("div", { className: "jaf-intro-dialog-overlay", attrs: { id: j, role: "dialog", "aria-modal": "true", "aria-label": t || "关卡介绍" } }),
				s = y("div", { className: "jaf-intro-dialog" }),
				n = y("div", { className: "jaf-intro-corner", attrs: { "aria-hidden": "true" } }),
				o = y("div", { className: "jaf-intro-header" }),
				r = y("h3", { className: "jaf-intro-title", text: t || "关卡介绍" }),
				c = y("span", { className: "jaf-intro-badge", text: "提示" }),
				l = y("div", { className: "jaf-intro-content" }),
				i = y("div", { className: "jaf-intro-footer" }),
				m = y("button", { className: "jaf-intro-btn", text: "知道啦" });
			((m.type = "button"), o.append(r, c), (l.innerHTML = a), i.appendChild(m), s.append(n, o, l, i), e.appendChild(s));
			const u = () => {
				(document.removeEventListener("keydown", d, { capture: !0 }), (e.i = null), e.remove());
			};
			e.i = u;
			const d = t => {
				"Escape" === t.key && (t.preventDefault(), t.stopImmediatePropagation(), u());
			};
			return (
				e.addEventListener("click", t => {
					t.target === e && u();
				}),
				m.addEventListener("click", u),
				document.addEventListener("keydown", d, { capture: !0 }),
				document.body.appendChild(e),
				window.requestAnimationFrame(() => e.classList.add("is-open")),
				e
			);
		},
		removeIntroOverlay: () => {
			const t = document.getElementById(j);
			t && ("function" != typeof t.i ? t.remove() : t.i());
		},
		showLevelIntroDialog(t) {
			const a = `\n\t\t<p class="jaf-intro-paragraph">${(t?.hint || "暂无提示信息").replace(/\n/g, "<br>")}</p>\n\t`;
			p.addIntroOverlay({ title: t?.title, contentHtml: a });
		},
		showShopNoticeDialog({ title: t = "提示", message: a = "操作完成" } = {}) {
			p.addIntroOverlay({ title: t, contentHtml: `<p class="jaf-intro-paragraph">${a}</p>` });
		},
		showToast(t = "购买成功") {
			document.querySelectorAll(".jaf-shop-floating-toast").forEach(t => t.remove());
			const a = y("div", { className: "jaf-shop-floating-toast", text: t, attrs: { role: "status", "aria-live": "polite" } });
			(document.body.appendChild(a), window.requestAnimationFrame(() => a.classList.add("is-show")), window.setTimeout(() => a.remove(), 980));
		},
		showShopPurchaseDialog({ item: t, category: a, isOwned: e = !1, isRepeatable: s = !1, onPurchase: n, actionButtons: o = [] } = {}) {
			const r = t?.name || "未命名商品",
				c = (t?.desc || "暂无描述").replace(/\n/g, "<br>"),
				l = a?.name || "未分类",
				i = t?.image || "",
				m = `\n        <div class="jaf-shop-purchase-card">\n            <div class="jaf-shop-purchase-image-wrap">\n                ${i ? `<img class="jaf-shop-purchase-image" src="${i}" alt="${r} 图片" draggable="false">` : '<div class="jaf-shop-purchase-image-placeholder">图片预留</div>'}\n            </div>\n            <div class="jaf-shop-purchase-meta">\n                <p class="jaf-intro-paragraph"><strong>分类：</strong>${l}</p>\n                <p class="jaf-intro-paragraph"><strong>描述：</strong>${c}</p>\n            </div>\n\t\t\t<div class="jaf-shop-purchase-actions" data-role="shop-purchase-actions"></div>\n        </div>\n        `,
				u = p.addIntroOverlay({ title: `${r} · 购买页面`, contentHtml: m }),
				d = () => {
					"function" != typeof u?.i ? u?.remove?.() : u.i();
				},
				f = u?.querySelector?.(".jaf-intro-dialog"),
				h = u?.querySelector?.(".jaf-intro-footer"),
				g = u?.querySelector?.(".jaf-intro-badge");
			if ((h && h.remove(), g && g.remove(), f)) {
				const t = y("button", { className: "jaf-shop-close", text: "×", attrs: { type: "button", "aria-label": "关闭购买页面" } });
				(t.addEventListener("click", d), f.appendChild(t));
			}
			const j = u?.querySelector?.('[data-role="shop-purchase-actions"]');
			if (!j) return u;
			const b = Array.isArray(o) ? o.filter(t => t && "string" == typeof t.label && "function" == typeof t.onClick) : [];
			if (b.length) {
				const t = b.map(a => {
					const e = y("button", { className: `jaf-intro-btn jaf-shop-purchase-btn ${a.className || ""}`.trim(), text: a.label, attrs: { type: "button" } });
					return (
						e.addEventListener("click", async () => {
							if (e.disabled) return;
							t.forEach(t => (t.disabled = !0));
							(await a.onClick?.()) ? d() : u?.isConnected && t.forEach(t => (t.disabled = !1));
						}),
						j.appendChild(e),
						e
					);
				});
				return u;
			}
			const N = y("button", { className: "jaf-intro-btn jaf-shop-purchase-btn", text: e ? "已拥有" : "立刻购买", attrs: { type: "button" } });
			return (
				j.appendChild(N),
				e && !s
					? ((N.disabled = !0), N.classList.add("is-disabled"), u)
					: (N.addEventListener("click", async () => {
							if (N.disabled) return;
							N.disabled = !0;
							const t = await n?.();
							t ? d() : !t && u?.isConnected && (N.disabled = !1);
						}),
						u)
			);
		},
		closeStartBeforeUIInternal: ({ immediate: t = !0, increaseToken: a = !0 } = {}) => {
			(a && (m += 1), p.removeIntroOverlay());
			const e = document.getElementById(g);
			if (e) return t ? (p.disposeEntryRootResources(e), void e.remove()) : void p.removeEntryRoot(e);
		},
		showCharacterInfoDialog: t => {
			if (!t || !e.character?.[t]) return void D({ title: "提示", message: "暂无该武将信息。" });
			const a = e.character[t],
				s = a.sex ? a.sex : "-",
				o = a.group ? a.group : "-",
				r = `${a.hp}/${a.maxHp}` + (a.hujia ? `/${a.hujia}` : ""),
				c = a.skills,
				l = n.translation(s),
				i = n.translation(o),
				m = c.length ? c.map(t => `<li><strong>${n.translation(t)}</strong><br>${n.translation(`${t}_info`) || "暂无描述"}</li>`).join("") : "<li>暂无技能信息</li>";
			p.addIntroOverlay({ title: `${n.translation(t)} · 武将信息`, contentHtml: `\n\t\t\t<div class="jaf-gacha-char-info">\n\t\t\t\t<p class="jaf-intro-paragraph"><strong>ID：</strong>${t}</p>\n\t\t\t\t<p class="jaf-intro-paragraph"><strong>性别：</strong>${l}　<strong>势力：</strong>${i}　<strong>体力：</strong>${r}</p>\n\t\t\t\t<p class="jaf-intro-paragraph"><strong>技能：</strong></p>\n\t\t\t\t<ul class="jaf-gacha-char-skill-list">${m}</ul>\n\t\t\t</div>\n\t\t` });
		},
		showGachaResultOverlay: ({ poolName: t = "抽卡结果", results: a = [], isTen: e = !1, actionButtons: s = [] }) => {
			const o = document.getElementById("jaf-gacha-result-overlay");
			o?.remove?.();
			const r = y("div", { className: "jaf-gacha-result-overlay", attrs: { id: "jaf-gacha-result-overlay", role: "dialog", "aria-modal": "true", "aria-label": `${t} 抽卡结果` } }),
				c = y("div", { className: "jaf-gacha-result-panel" }),
				l = y("h3", { className: "jaf-gacha-result-title", text: `${t} · ${e ? "十连结果" : "单抽结果"}` }),
				i = y("div", { className: "jaf-gacha-result-grid" + (e ? " is-ten" : " is-single") }),
				m = y("div", { className: "jaf-gacha-result-footer" }),
				u = y("button", { className: "jaf-intro-btn", text: "确定" });
			((u.type = "button"),
				a.forEach((t, a) => {
					const e = y("article", { className: "jaf-gacha-card is-flip" });
					((e.style.animationDelay = 60 * Math.min(a, 9) + "ms"),
						e.addEventListener("contextmenu", a => {
							(a.preventDefault(), p.showCharacterInfoDialog(t.characterId));
						}));
					const s = y("div", { className: "jaf-gacha-card-image-wrap" }),
						o = y("div", { className: "jaf-gacha-card-image", attrs: { "aria-label": `${n.translation(t.characterId)} 立绘` } });
					let r = !1;
					if ("function" == typeof o.setBackground)
						try {
							(o.setBackground(t.characterId, "character"), (r = !0));
						} catch {
							r = !1;
						}
					r || o.appendChild(y("div", { className: "jaf-gacha-card-image-fallback", text: n.translation(t.characterId) }));
					const c = y("div", { className: "jaf-gacha-card-name", text: n.translation(t.characterId) }),
						l = y("div", { className: "jaf-gacha-card-tag" + (t.isNew ? " is-new" : " is-dup"), text: t.isNew ? "新武将" : `重复 +${t.gainJiangFu}将符` });
					(s.appendChild(o), e.append(s, c, l), i.appendChild(e));
				}));
			const d = () => {
					(document.removeEventListener("keydown", f), r.remove());
				},
				f = t => {
					"Escape" === t.key && d();
				};
			(r.addEventListener("click", t => {
				t.target === r && d();
			}),
				u.addEventListener("click", d),
				document.addEventListener("keydown", f));
			const h = Array.isArray(s) ? s.filter(t => t && "string" == typeof t.label && "function" == typeof t.onClick) : [];
			if (h.length) {
				const t = h.map(a => {
					const e = y("button", { className: `jaf-intro-btn ${a.className || ""}`.trim(), text: a.label, attrs: { type: "button" } });
					return (
						e.addEventListener("click", async () => {
							if (!e.disabled) {
								t.forEach(t => (t.disabled = !0));
								try {
									if (await a.onClick?.()) return void d();
								} finally {
									r?.isConnected && t.forEach(t => (t.disabled = !1));
								}
							}
						}),
						m.appendChild(e),
						e
					);
				});
			}
			(m.appendChild(u), c.append(l, i, m), r.appendChild(c), document.body.appendChild(r), window.requestAnimationFrame(() => r.classList.add("is-open")));
		},
	},
	h = {
		normalizeOwnedItemCounts: t =>
			t && "object" == typeof t
				? Object.entries(t).reduce((t, [a, e]) => {
						if ("string" != typeof a || !a.length) return t;
						const s = Math.max(0, Math.floor(Number(e) || 0));
						return (s > 0 && (t[a] = s), t);
					}, {})
				: {},
		normalizeShopPrice: t =>
			t && "object" == typeof t
				? N.reduce((a, e) => {
						const s = Number(t[e]) || 0;
						return (s > 0 && (a[e] = s), a);
					}, {})
				: {},
		normalizeShopCurrency: (t = {}) =>
			N.reduce((a, e) => {
				const s = Number(t?.[e]);
				return ((a[e] = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0), a);
			}, {}),
		formatShopPrice: t => {
			const a = h.normalizeShopPrice(t),
				e = N.filter(t => Number(a[t]) > 0).map(t => `${a[t]}${n.translation(t)}`);
			return e.length ? e.join(" + ") : "免费";
		},
		canAffordShopPrice: (t, a) => {
			const e = h.normalizeShopPrice(a);
			return N.every(a => (Number(t?.[a]) || 0) >= (Number(e[a]) || 0));
		},
		applyShopPrice: (t, a, e = -1) => {
			const s = h.normalizeShopPrice(a);
			N.forEach(a => {
				const n = Number(t?.[a]) || 0,
					o = (Number(s[a]) || 0) * e;
				t[a] = Math.max(0, n + o);
			});
		},
		applyParsedShopDataToState(t, a) {
			if (!a || "object" != typeof a) return;
			t.ownedItemIds = h.normalizeOwnedItemCounts(a.ownedItemIds);
			const e = h.normalizeShopCurrency(a.currency);
			N.forEach(a => {
				t[a] = e[a];
			});
		},
		getGachaPoolCharacters: t => {
			if (!t || "object" != typeof t) return [];
			if (Array.isArray(t)) return t;
			if ("character_rank" === t.type) {
				const a = p.getRankCharacterObject?.() || {},
					e = String(t.poolKey || "");
				if (a[e] && "random" !== e) {
					return Array.isArray(a?.[e]) ? a[e] : [];
				}
				return Object.values(a).flat();
			}
			return [];
		},
		getGachaCostDetail: ({ singleCostMemoryZhu: t, drawCount: a, jiangFuOwned: e }) => {
			const s = 10 === a ? Math.floor(t * a * 0.9) : t,
				n = Math.min(Math.max(0, Number(e) || 0), s);
			return { discountedMemory: s, usedJiangFu: n, finalMemoryCost: s - n };
		},
		saveOwnedItems: async (e, s = {}) => {
			const n = h.normalizeShopCurrency(s),
				o = h.normalizeOwnedItemCounts(e);
			((i = { updatedAt: new Date().toISOString(), progress: f.normalizeProgressId(i?.progress), ownedItemIds: o, currency: n, characterlist: Array.isArray(t.characterlist) ? t.characterlist : [] }), await a.promises.writeFile(JSON.stringify(i, null, 2), `${r.extensionDirectoryPath}/gameData`, "save.json"));
		},
		runGachaDraw: async ({ shopState: a, poolConfig: e, drawCount: s }) => {
			function n(t) {
				if (!Array.isArray(t) || !t.length) return null;
				return t[Math.floor(Math.random() * t.length)];
			}
			if (!e || !a) return { ok: !1, message: "抽卡参数错误。" };
			if (a.isSaving) return { ok: !1, message: "操作过快，请稍后再试。" };
			const o = h.getGachaPoolCharacters(e.prizePool);
			if (!o.length) return { ok: !1, message: `${e.name} 暂无可抽取武将。` };
			const r = new Set(Array.isArray(t.characterlist) ? t.characterlist : []),
				c = h.getGachaCostDetail({ singleCostMemoryZhu: e.singleCostMemoryZhu, drawCount: s, jiangFuOwned: a.jiangFu });
			if ((Number(a.memoryZhu) || 0) < c.finalMemoryCost) return { ok: !1, message: `忆铢不足：本次需 ${c.discountedMemory} 忆铢，已用将符抵扣 ${c.usedJiangFu}，仍需 ${c.finalMemoryCost} 忆铢。` };
			const l = { memoryZhu: Number(a.memoryZhu) || 0, jiangFu: Number(a.jiangFu) || 0, ownedCharacters: [...r] };
			((a.memoryZhu = l.memoryZhu - c.finalMemoryCost), (a.jiangFu = Math.max(0, l.jiangFu - c.usedJiangFu)), (a.isSaving = !0));
			const i = [];
			let m = !1;
			for (let t = 0; t < s; t++) {
				const c = o.filter(t => !r.has(t)),
					l = n(10 === s && t === s - 1 && !m && c.length > 0 ? c : o);
				if (!l) continue;
				const u = !r.has(l);
				let d = 0;
				(u ? (r.add(l), (m = !0)) : ((d = Number(e.duplicateJiangFu) || 0), (a.jiangFu = (Number(a.jiangFu) || 0) + d)), i.push({ characterId: l, isNew: u, gainJiangFu: d }));
			}
			t.characterlist = [...r];
			try {
				return (await h.saveOwnedItems(a.ownedItemIds, a), { ok: !0, results: i, cost: c });
			} catch (e) {
				return ((a.memoryZhu = l.memoryZhu), (a.jiangFu = l.jiangFu), (t.characterlist = l.ownedCharacters), { ok: !1, message: "抽卡写入失败，请稍后重试。" });
			} finally {
				a.isSaving = !1;
			}
		},
	},
	{ ENTRY_ROOT_ID: g, INTRO_OVERLAY_ID: j, SHOP_GACHA_IMAGE: b, SHOP_CURRENCY: N } = u,
	{ createElement: y, closeModal: v, openModal: w, bindModalMaskClose: $, bindHorizontalWheelScroll: k, waitForCssLoaded: x } = d,
	{ getLevelImage: S, getAlbumPackList: C, getAlbumSubPackList: I, getAlbumCharacters: O, closeStartBeforeUIInternal: P, removeEntryRoot: M, showLevelIntroDialog: A, showShopNoticeDialog: D, showShopPurchaseDialog: T, showToast: R, showGachaResultOverlay: E } = p,
	{ normalizeProgressId: _, isLevelUnlockedByProgress: L, formatProgressText: F, getNextProgressId: H } = f,
	{ normalizeShopPrice: B, normalizeShopCurrency: G, formatShopPrice: z, canAffordShopPrice: Z, applyShopPrice: U, applyParsedShopDataToState: Y, getGachaPoolCharacters: J, getGachaCostDetail: V, saveOwnedItems: W, runGachaDraw: q } = h;
function K(a) {
	const e = l;
	if ((a.memoryCurrency && (a.memoryCurrency.textContent = `忆铢：${a.state.memoryZhu}`), a.dreamCurrency && (a.dreamCurrency.textContent = `梦钿：${a.state.dreamDian}`), a.jiangFuCurrency && (a.jiangFuCurrency.textContent = `将符：${a.state.jiangFu}`), !e.length)) return (a.categoryList.replaceChildren(), a.goodsList.replaceChildren(y("div", { className: "jaf-shop-empty", text: "暂无可用商品" })), void (a.goodsTitle.textContent = "商品列表"));
	(e.some(t => t.id === a.state.categoryId) || (a.state.categoryId = e[0].id),
		a.categoryList.replaceChildren(),
		e.forEach(t => {
			const e = t.id === a.state.categoryId,
				s = y("button", { className: "jaf-shop-category-tab" + (e ? " active" : ""), text: t.name, attrs: { type: "button", "data-id": t.id } });
			(s.addEventListener("click", () => {
				((a.state.categoryId = t.id), K(a));
			}),
				a.categoryList.appendChild(s));
		}));
	const s = e.find(t => t.id === a.state.categoryId) || e[0];
	if ("gacha" === s?.id) {
		const e = l[0]?.goods || [];
		return (
			(a.goodsTitle.textContent = `抽卡卡池（${e.length}）`),
			a.goodsList.replaceChildren(),
			void e.forEach(e => {
				const n = new Set(Array.isArray(t.characterlist) ? t.characterlist : []),
					o = J(e.prizePool),
					r = o.filter(t => !n.has(t)).length,
					c = V({ singleCostMemoryZhu: e.singleCostMemoryZhu, drawCount: 1, jiangFuOwned: a.state.jiangFu }),
					l = V({ singleCostMemoryZhu: e.singleCostMemoryZhu, drawCount: 10, jiangFuOwned: a.state.jiangFu }),
					i = y("article", { className: "jaf-shop-item jaf-shop-item-gacha" });
				(i.setAttribute("role", "button"), i.setAttribute("tabindex", "0"), i.setAttribute("aria-label", `查看卡池 ${e.name}`));
				const m = y("div", { className: "jaf-shop-item-link" }),
					u = y("div", { className: "jaf-shop-img-wrapper" }),
					d = y("img", { className: "jaf-shop-item-image-inner", attrs: { src: b, alt: `${e.name} 图片`, draggable: "false" } });
				((d.draggable = !1),
					d.addEventListener("dragstart", t => t.preventDefault()),
					d.addEventListener("error", () => {
						(d.remove(), u.appendChild(y("span", { className: "jaf-shop-item-image-placeholder", text: "卡池" })));
					}),
					u.appendChild(d));
				const f = y("h4", { className: "jaf-shop-item-name", text: e.name }),
					p = y("span", { className: "jaf-shop-item-price-currency", text: `单抽${c.discountedMemory}忆铢\n十连${l.discountedMemory}忆铢` }),
					h = y("span", { className: "jaf-shop-item-status is-single", text: "卡池" });
				(m.append(u, f, p), i.append(m, h));
				const g = async t => {
						const s = await q({ shopState: a.state, poolConfig: e, drawCount: t });
						return s.ok ? (K(a), E({ poolName: e.name, results: s.results, isTen: 10 === t, actionButtons: 10 === t ? [{ label: "再来十抽", onClick: () => g(10), className: "is-primary" }] : [{ label: "再来一抽", onClick: () => g(1), className: "is-primary" }] }), !0) : (D({ title: "抽卡失败", message: s.message || "抽卡失败，请稍后重试。" }), void K(a));
					},
					j = () => {
						const t = V({ singleCostMemoryZhu: e.singleCostMemoryZhu, drawCount: 1, jiangFuOwned: a.state.jiangFu }),
							n = V({ singleCostMemoryZhu: e.singleCostMemoryZhu, drawCount: 10, jiangFuOwned: a.state.jiangFu });
						T({
							item: { name: e.name, price: `单抽${t.discountedMemory}忆铢 / 十连${n.discountedMemory}忆铢（9折）`, desc: `${e.desc}（1 将符可以折扣 1 忆铢）\n卡池数量：${o.length}，未拥有：${r}，重复返还：+${e.duplicateJiangFu}将符。`, image: b },
							category: s,
							actionButtons: [
								{ label: `单抽（实付 ${t.finalMemoryCost} 忆铢）`, onClick: () => g(1) },
								{ label: `十连（实付 ${n.finalMemoryCost} 忆铢）`, onClick: () => g(10) },
							],
						});
					};
				(i.addEventListener("click", j),
					i.addEventListener("keydown", t => {
						("Enter" !== t.key && " " !== t.key) || (t.preventDefault(), j());
					}),
					a.goodsList.appendChild(i));
			})
		);
	}
	const o = Array.isArray(s?.goods) ? s.goods : [];
	((a.goodsTitle.textContent = `${s?.name || "商品"}（${o.length}）`),
		a.goodsList.replaceChildren(),
		o.length
			? o.forEach(t => {
					const e = y("article", { className: "jaf-shop-item" });
					(e.setAttribute("role", "button"), e.setAttribute("tabindex", "0"), e.setAttribute("aria-label", `查看商品 ${t.name || "未命名商品"}`));
					const o = y("div", { className: "jaf-shop-item-link" }),
						r = y("div", { className: "jaf-shop-img-wrapper" }),
						c = B(t.price),
						l = y("span", { className: "jaf-shop-item-price-currency", text: z(c) }),
						i = y("h4", { className: "jaf-shop-item-name", text: t.name || "未命名商品" });
					if (t.image) {
						const a = y("img", { className: "jaf-shop-item-image-inner", attrs: { src: t.image, alt: `${t.name} 图片`, draggable: "false" } });
						((a.draggable = !1), a.addEventListener("dragstart", t => t.preventDefault()), r.appendChild(a));
					} else r.appendChild(y("span", { className: "jaf-shop-item-image-placeholder", text: "图片预留" }));
					const m = Boolean(t?.repeatable),
						u = Number(a.state.ownedItemIds?.[t.id]) || 0;
					o.append(r, i, l);
					const d = m ? null : y("span", { className: "jaf-shop-item-status is-single", text: "唯一" }),
						f = !m && u > 0;
					(m && e.classList.add("is-repeatable"), f && e.classList.add("is-owned"));
					const p = async () => {
							if (a.state.isSaving || (!m && (Number(a.state.ownedItemIds?.[t.id]) || 0) > 0)) return;
							if (!Z(a.state, c)) return (D({ title: "余额不足", message: `${t.name} 需要 ${z(c)}，当前余额：${N.map(t => `${n.translation(t)}：${Number(a.state?.[t]) || 0}`).join("，")}。` }), !1);
							(U(a.state, c, -1), (a.state.isSaving = !0));
							const e = Number(a.state.ownedItemIds?.[t.id]) || 0,
								s = m ? e + 1 : Math.max(e, 1);
							((a.state.ownedItemIds[t.id] = s), !m && e > 0 && (a.state.ownedItemIds[t.id] = e));
							try {
								return (await W(a.state.ownedItemIds, a.state), R("购买成功"), !0);
							} catch (s) {
								return (e > 0 ? (a.state.ownedItemIds[t.id] = e) : delete a.state.ownedItemIds[t.id], U(a.state, c, 1), D({ title: "购买失败", message: "数据写入失败，请稍后重试。" }), !1);
							} finally {
								((a.state.isSaving = !1), K(a));
							}
						},
						h = () => {
							T({ item: t, category: s, isOwned: !m && (Number(a.state.ownedItemIds?.[t.id]) || 0) > 0, isRepeatable: m, onPurchase: p });
						};
					(e.addEventListener("click", h),
						e.addEventListener("keydown", t => {
							("Enter" !== t.key && " " !== t.key) || (t.preventDefault(), h());
						}),
						e.append(o),
						d && e.appendChild(d),
						a.goodsList.appendChild(e));
				})
			: a.goodsList.appendChild(y("div", { className: "jaf-shop-empty", text: "该分类暂无商品" })));
}
function Q(a) {
	const n = new Set(t.characterlist),
		o = C();
	if (!o.length) return (a.packList.replaceChildren(), a.subPackList.replaceChildren(), a.viewport.replaceChildren(), void (a.stats.textContent = "已拥有 0 / 0"));
	o.includes(a.state.packId) || (a.state.packId = o[0]);
	const { packId: r, subPackId: c } = a.state;
	(a.packList.replaceChildren(),
		o.forEach(t => {
			const s = y("button", { className: "jaf-album-tab" + (t === r ? " active" : ""), html: e.translate[`${t}_character_config`] || e.translate[t] || t, attrs: { type: "button", "data-id": t } });
			(s.addEventListener("click", () => {
				((a.state.packId = t), (a.state.subPackId = "all-characters"), Q(a));
			}),
				a.packList.appendChild(s));
		}));
	const l = I(r);
	(l.includes(c) || (a.state.subPackId = "all-characters"),
		a.subPackList.replaceChildren(),
		l.forEach(t => {
			const s = y("button", { className: "jaf-album-subtab" + (t === a.state.subPackId ? " active" : ""), html: "all-characters" === t ? "所有武将" : e.translate[t] || t, attrs: { type: "button", "data-id": t } });
			(s.addEventListener("click", () => {
				((a.state.subPackId = t), Q(a));
			}),
				a.subPackList.appendChild(s));
		}));
	let i = O(a.state.packId, a.state.subPackId);
	const m = String(a.searchInput?.value || "")
		.trim()
		.toLowerCase();
	m &&
		(i = i.filter(
			t =>
				String(e.translate[t] || t)
					.toLowerCase()
					.includes(m) || t.toLowerCase().includes(m)
		));
	const u = i.reduce((t, a) => t + (n.has(a) ? 1 : 0), 0);
	((a.stats.textContent = `已拥有 ${u} / ${i.length}`), a.viewport.replaceChildren());
	const d = i.filter(t => n.has(t)),
		f = i.filter(t => !n.has(t)),
		p = ({ title: t, list: a, isUnowned: e = !1 }) => {
			const n = y("section", { className: "jaf-album-group" + (e ? " is-unowned" : ""), attrs: { "data-group": e ? "unowned" : "owned" } }),
				o = y("h3", { className: "jaf-album-group-title", text: t }),
				r = y("div", { className: "jaf-album-character-grid" });
			if (a.length) {
				(s.create.buttons(a, "character", r).forEach(t => {
					(s.create.rarity(t),
						t.addEventListener("click", () => {
							s.click.charactercard(t.link, t);
						}));
				}),
					Array.from(r.children).forEach(t => {
						(t.classList.add("jaf-album-char-button"), e && t.classList.add("is-unowned"));
					}));
			} else {
				const t = y("div", { className: "jaf-album-empty-tip", text: e ? "暂无未拥有武将" : "暂无已拥有武将" });
				r.appendChild(t);
			}
			return (n.append(o, r), n);
		};
	a.viewport.append(p({ title: `已拥有（${d.length}）`, list: d }), p({ title: `未拥有（${f.length}）`, list: f, isUnowned: !0 }));
}
function X(a) {
	const e = document.getElementById(g);
	e && M(e);
	const s = y("div", { className: "jaf-entry-root", attrs: { id: g } });
	s.tabIndex = -1;
	const r = y("div", { className: "jaf-noise", attrs: { "aria-hidden": "true" } }),
		m = y("div", { className: "jaf-game-container", attrs: { role: "dialog", "aria-label": "忽然而已 · 千禧梦入口" } }),
		u = y("h1", { className: "jaf-game-title", text: "忽然而已" }),
		d = y("p", { className: "jaf-game-subtitle", text: "—— 流年拾梦 · 光景藏情 ——" }),
		p = y("div", { className: "jaf-btn-container" }),
		h = y("button", { className: "jaf-game-btn", text: "入梦" }),
		b = y("button", { className: "jaf-game-btn", text: "千禧册" }),
		N = y("button", { className: "jaf-game-btn", text: "小卖铺" });
	(p.append(h, b, N), m.append(u, d, p));
	const x = (function () {
			const t = y("div", { className: "jaf-modal", attrs: { id: "jaf-level-modal" } }),
				a = y("div", { className: "jaf-modal-content jaf-level-modal-content" }),
				e = y("div", { className: "jaf-level-header" }),
				s = y("h2", { className: "jaf-modal-title jaf-level-title", text: "关卡选择" });
			e.append(s);
			const n = y("div", { className: "jaf-level-viewport" }),
				o = y("div", { className: "jaf-level-cards" });
			n.appendChild(o);
			const r = y("button", { className: "jaf-close-btn", text: "返回章节" });
			return (a.append(e, n, r), t.appendChild(a), { modal: t, title: s, closeBtn: r, viewport: n, cardsContainer: o });
		})(),
		I = (function () {
			const t = y("div", { className: "jaf-modal", attrs: { id: "jaf-challenge-modal" } }),
				a = y("div", { className: "jaf-modal-content jaf-challenge-modal-content" }),
				e = y("button", { className: "jaf-challenge-close", text: "×" });
			e.type = "button";
			const s = y("div", { className: "jaf-challenge-layout" }),
				n = y("img", { className: "jaf-challenge-image", attrs: { src: "", alt: "关卡预览图", draggable: "false" } });
			((n.draggable = !1), n.addEventListener("dragstart", t => t.preventDefault()));
			const o = y("div", { className: "jaf-challenge-panel" }),
				r = y("h2", { className: "jaf-challenge-title", text: "森林探险" }),
				c = y("p", { className: "jaf-challenge-desc", text: "选择合适难度后开始挑战吧。" }),
				l = y("div", { className: "jaf-challenge-difficulty-label", text: "挑战难度" }),
				i = y("div", { className: "jaf-challenge-difficulty", attrs: { role: "radiogroup", "aria-label": "挑战难度" } }),
				m = [1, 2, 3].map(t => {
					const a = y("button", { className: "jaf-difficulty-star", text: "☆", attrs: { type: "button", "data-value": String(t), role: "radio", "aria-label": `难度${t}星` } });
					return (i.appendChild(a), a);
				}),
				u = y("button", { className: "jaf-challenge-start", text: "开始挑战" });
			u.type = "button";
			let d = 1;
			const f = () => {
				(m.forEach((t, a) => {
					const e = a + 1 <= d;
					((t.textContent = e ? "★" : "☆"), t.classList.toggle("is-filled", e), t.setAttribute("aria-checked", e ? "true" : "false"));
				}),
					i.setAttribute("aria-valuenow", String(d)));
			};
			return (
				m.forEach((t, a) => {
					t.addEventListener("click", () => {
						((d = a + 1), f());
					});
				}),
				f(),
				o.append(r, c, l, i, u),
				s.append(n, o),
				a.append(e, s),
				t.appendChild(a),
				{
					modal: t,
					title: r,
					desc: c,
					image: n,
					closeBtn: e,
					startBtn: u,
					setDifficulty(t) {
						((d = Math.max(1, Math.min(3, Number(t) || 1))), f());
					},
					getDifficulty: () => d,
				}
			);
		})(),
		O = (function () {
			const t = y("div", { className: "jaf-modal", attrs: { id: "jaf-album-modal" } }),
				a = y("div", { className: "jaf-modal-content jaf-album-modal-content" }),
				e = y("div", { className: "jaf-album-header" }),
				s = y("h2", { className: "jaf-modal-title jaf-album-title", text: "千禧册 · 武将图鉴" }),
				n = y("div", { className: "jaf-album-stats", text: "已拥有 0 / 0" }),
				o = y("input", { className: "jaf-album-search", attrs: { type: "search", placeholder: "搜索武将", "aria-label": "搜索图鉴", autocomplete: "off", spellcheck: "false" } });
			(o.addEventListener("keydown", t => {
				if ((t.stopPropagation(), "Escape" === t.key)) return (t.preventDefault(), void o.blur());
				(t.ctrlKey || t.metaKey || t.altKey) && (["a", "c", "v", "x", "z", "y"].includes(String(t.key).toLowerCase()) || t.preventDefault());
			}),
				["keyup", "keypress", "input"].forEach(t => o.addEventListener(t, t => t.stopPropagation())),
				e.append(s, o, n));
			const r = y("button", { className: "jaf-album-close", text: "×", attrs: { type: "button", "aria-label": "关闭图鉴" } }),
				c = y("div", { className: "jaf-album-pack-list" }),
				l = y("div", { className: "jaf-album-subpack-list" }),
				i = y("div", { className: "jaf-album-viewport" });
			return (a.append(e, r, c, l, i), t.appendChild(a), { modal: t, closeBtn: r, packList: c, subPackList: l, viewport: i, stats: n, searchInput: o, state: { packId: C()[0] || "", subPackId: "all-characters" } });
		})(),
		T = (function () {
			const t = y("div", { className: "jaf-modal", attrs: { id: "jaf-shop-modal" } }),
				a = y("div", { className: "jaf-modal-content jaf-shop-modal-content" }),
				e = y("div", { className: "jaf-shop-header" }),
				s = y("h2", { className: "jaf-modal-title jaf-shop-title", text: "小卖铺" }),
				n = y("div", { className: "jaf-shop-wallet" }),
				o = y("div", { className: "jaf-shop-currency" }),
				r = y("div", { className: "jaf-shop-currency" }),
				c = y("div", { className: "jaf-shop-currency" }),
				i = y("button", { className: "jaf-shop-close", text: "×", attrs: { type: "button", "aria-label": "关闭小卖铺" } });
			(n.append(o, r, c), e.append(s, n));
			const m = y("div", { className: "jaf-shop-body" }),
				u = y("div", { className: "jaf-shop-category-list" }),
				d = y("div", { className: "jaf-shop-goods-panel" }),
				f = y("h3", { className: "jaf-shop-goods-title", text: "商品列表" }),
				p = y("div", { className: "jaf-shop-goods-list" });
			return (d.append(f, p), m.append(u, d), a.append(e, i, m), t.appendChild(a), { modal: t, closeBtn: i, categoryList: u, goodsTitle: f, goodsList: p, memoryCurrency: o, dreamCurrency: r, jiangFuCurrency: c, state: { categoryId: l[0]?.id || "", loaded: !1, ownedItemIds: {}, ...G(), isSaving: !1 } });
		})();
	((s.o = k(O.packList)), O.searchInput && O.searchInput.addEventListener("input", () => Q(O)));
	let E = null,
		B = null;
	const z = _(i?.progress);
	const Z = (function (t) {
		const a = y("div", { className: "jaf-modal", attrs: { id: "jaf-chapter-modal" } }),
			e = y("div", { className: "jaf-modal-content jaf-chapter-modal-content" }),
			s = y("h2", { className: "jaf-modal-title", text: "入梦 · 章节选择" }),
			n = y("div", { className: "jaf-chapter-list" }),
			o = y("button", { className: "jaf-close-btn", text: "关闭" });
		return (
			c.forEach(a => {
				const e = y("button", { className: "jaf-chapter-item", text: a.title });
				(e.addEventListener("click", () => {
					t?.(a);
				}),
					n.appendChild(e));
			}),
			e.append(s, n, o),
			a.appendChild(e),
			{ modal: a, closeBtn: o }
		);
	})(t => {
		((E = t),
			(function (t, a, e, { progressId: s = f.DEFAULT_PROGRESS } = {}) {
				t.title.textContent = a?.title || "关卡选择";
				const n = a?.levels?.length ? a.levels : [{ id: `${a?.id || "chapter"}-coming-soon`, title: "敬请期待", intro: "该章节关卡正在制作中。", hint: "目前暂无额外提示，请耐心等待更新。", image: null }],
					o = _(s);
				(t.cardsContainer.replaceChildren(),
					n.forEach(a => {
						const s = L(a?.id, o),
							n = y("div", { className: "jaf-level-card" });
						s || (n.classList.add("is-locked"), n.setAttribute("aria-disabled", "true"));
						const r = S(a),
							c = y("img", { className: "jaf-level-card-image", attrs: { src: r, alt: `${a.title} 预览图`, draggable: "false" } });
						((c.draggable = !1), c.addEventListener("dragstart", t => t.preventDefault()));
						const l = y("div", { className: "jaf-level-card-title", text: a.title }),
							i = `（未解锁，当前进度：${F(o)}）`,
							m = y("div", { className: "jaf-level-card-intro", text: `${a.intro || ""}${s ? "" : i}` });
						(n.addEventListener("click", () => {
							s ? e?.(a) : D({ title: "关卡未解锁", message: `该关卡尚未解锁，当前最多可挑战到 ${F(o)}。` });
						}),
							n.addEventListener("contextmenu", t => {
								(t.preventDefault(), A(a));
							}),
							n.append(c, l, m),
							t.cardsContainer.appendChild(n));
					}));
			})(
				x,
				t,
				a =>
					(function (t, a) {
						L(t?.id, z) ? ((B = t || null), (E = a || null), (I.title.textContent = `${t?.title || "未知关卡"}`), (I.desc.textContent = t?.hint || t?.intro || "该关卡暂无额外描述。"), (I.image.src = S(t)), (I.image.alt = `${t?.title || "未知关卡"} 预览图`), I.setDifficulty(1), w(I.modal)) : D({ title: "关卡未解锁", message: `该关卡尚未解锁，当前最多可挑战到 ${F(z)}。` });
					})(a, t),
				{ progressId: z }
			),
			v(Z.modal),
			w(x.modal));
	});
	(s.append(r, m, Z.modal, x.modal, I.modal, O.modal, T.modal),
		h.addEventListener("click", () => w(Z.modal)),
		b.addEventListener("click", () => {
			(Q(O), w(O.modal));
		}),
		N.addEventListener("click", async () => {
			try {
				(Y(T.state, i), (T.state.loaded = !0));
			} catch (t) {}
			(K(T), w(T.modal));
		}),
		Z.closeBtn.addEventListener("click", () => v(Z.modal)),
		x.closeBtn.addEventListener("click", () => {
			(v(x.modal), w(Z.modal));
		}),
		I.closeBtn.addEventListener("click", () => v(I.modal)),
		O.closeBtn.addEventListener("click", () => v(O.modal)),
		T.closeBtn.addEventListener("click", () => v(T.modal)));
	let U = !1;
	((t.jafOnWin = async function () {
		if (!U) {
			U = !0;
			try {
				const t = ("function" == typeof I?.getDifficulty && Number(I.getDifficulty())) || 1,
					a = B?.reward?.currency || {},
					e = {};
				(Object.entries(a).forEach(([a, s]) => {
					let n = 0;
					if (Array.isArray(s))
						if (s.length >= 2) {
							const t = Math.floor(Number(s[0]) || 0),
								a = Math.floor(Number(s[1]) || t);
							n = Math.floor(Math.random() * (a - t + 1)) + t;
						} else 1 === s.length && (n = Math.floor(Number(s[0]) || 0));
					else n = Math.floor(Number(s) || 0);
					const o = Math.max(0, Math.floor(n * t));
					o > 0 && (e[a] = o);
				}),
					(i.currency = i.currency || { memoryZhu: 0, dreamDian: 0, jiangFu: 0 }),
					Object.entries(e).forEach(([t, a]) => {
						i.currency[t] = (Number(i.currency[t]) || 0) + a;
					}));
				const s = H(B?.id);
				s && (i.progress = _(s));
				try {
					await W(i.ownedItemIds || {}, i.currency || {});
				} catch (t) {}
				const o = Object.entries(e).map(([t, a]) => `${a}${n.translation ? n.translation(t) : t}`);
				o.length && R(`获得：${o.join("，")}`);
			} catch (t) {}
		}
	}),
		I.startBtn.addEventListener("click", () => {
			const t = { started: !0, difficulty: I.getDifficulty(), chapterId: E?.id ?? null, chapterTitle: E?.title ?? null, levelId: B?.id ?? null, levelTitle: B?.title ?? null, gameData: B?.gameData ?? null, nextProgressId: H(B?.id) || null };
			(a?.(t), P({ immediate: !0, increaseToken: !0 }));
		}),
		$(Z.modal, () => v(Z.modal)),
		$(x.modal, () => {
			(v(x.modal), w(Z.modal));
		}),
		$(I.modal, () => v(I.modal)),
		$(O.modal, () => v(O.modal)),
		$(T.modal, () => v(T.modal)));
	const J = t => {
		"Escape" === t.key &&
			s.isConnected &&
			(t.preventDefault(),
			(function () {
				if (!document.getElementById(j)) {
					if (!I.modal.classList.contains("is-open")) return x.modal.classList.contains("is-open") ? (v(x.modal), void w(Z.modal)) : void (Z.modal.classList.contains("is-open") ? v(Z.modal) : O.modal.classList.contains("is-open") ? v(O.modal) : T.modal.classList.contains("is-open") && v(T.modal));
					v(I.modal);
				}
			})());
	};
	(document.addEventListener("keydown", J),
		(s.t = () => {
			document.removeEventListener("keydown", J);
		}),
		document.body.appendChild(s));
	const V = new o(s, { particleCount: 30 });
	(V.start(),
		V.layer && (V.layer.style.pointerEvents = "none"),
		V.canvas && (V.canvas.style.pointerEvents = "none"),
		(s.l = V),
		window.requestAnimationFrame(() => {
			(s.classList.add("is-mounted"), s.focus());
		}));
}
async function tt() {
	const t = ++m;
	(P({ immediate: !0, increaseToken: !1 }), document.fonts.load("1px huangcao"), document.fonts.load("1px xinwei"));
	const a = e.init.css(e.assetURL + "extension/忽然而已/css/mode", "style");
	return (await x(a))
		? t !== m
			? { started: !1, reason: "session-changed" }
			: new Promise(t => {
					let a = !1;
					X(e => {
						a || ((a = !0), t(e));
					});
				})
		: { started: !1, reason: "style-load-failed" };
}
export default tt;
