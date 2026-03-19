<template>
	<div class="jaf-vue-app-shell">
		<div class="jaf-noise" aria-hidden="true"></div>

		<div class="jaf-game-container" role="dialog" aria-label="忽然而已 · 千禧梦入口">
			<h1 class="jaf-game-title">忽然而已</h1>
			<p class="jaf-game-subtitle">—— 流年拾梦 · 光景藏情 ——</p>

			<div class="jaf-btn-container">
				<button class="jaf-game-btn" @click="openChapter">入梦</button>
				<button class="jaf-game-btn" @click="openAlbum">千禧册</button>
				<button class="jaf-game-btn" @click="openInventory">背包</button>
				<button class="jaf-game-btn" @click="openShop">小卖铺</button>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.chapter }" @click.self="closeChapter">
			<div class="jaf-modal-content jaf-chapter-modal-content">
				<h2 class="jaf-modal-title">入梦 · 章节选择</h2>
				<div class="jaf-chapter-list">
					<button v-for="chapter in chapterList" :key="chapter.id" class="jaf-chapter-item" @click="selectChapter(chapter.id)">
						{{ chapter.title }}
					</button>
				</div>
				<button class="jaf-game-btn" @click="closeChapter">关闭</button>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.level }" @click.self="backToChapter">
			<div class="jaf-modal-content jaf-modal-shell jaf-level-modal-content">
				<div class="jaf-level-header">
					<h2 class="jaf-modal-title jaf-level-title">{{ selectedChapter?.title || "关卡选择" }}</h2>
				</div>
				<div class="jaf-level-viewport">
					<div class="jaf-level-cards">
						<div v-for="level in currentLevels" :key="level.id" class="jaf-level-card" :class="{ 'is-locked': !isLevelUnlocked(level.id) }" @click="clickLevel(level)" @contextmenu.prevent="ctx.showLevelIntroDialog(level)">
							<img class="jaf-level-card-image" :src="getLevelImage(level)" :alt="`${level.title} 预览图`" draggable="false" />
							<div class="jaf-level-card-title">{{ level.title }}</div>
							<div class="jaf-level-card-intro" v-html="getLevelCardIntroHtml(level)"></div>
						</div>
					</div>
				</div>
				<div class="jaf-level-wrapper">
					<button class="jaf-game-btn" @click="backToChapter">返回章节</button>
					<button class="jaf-game-btn" @click="openPrepare">备战</button>
				</div>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.challenge }" @click.self="closeChallenge">
			<div class="jaf-modal-content jaf-modal-shell jaf-challenge-modal-content">
				<button class="jaf-game-close" @click="closeChallenge">×</button>
				<div class="jaf-challenge-layout">
					<img class="jaf-challenge-image" :src="getLevelImage(selectedLevel || {})" alt="关卡预览图" draggable="false" />
					<div class="jaf-challenge-panel">
						<h2 class="jaf-challenge-title">{{ selectedLevel?.title || "未知关卡" }}</h2>
						<p class="jaf-challenge-desc">{{ selectedLevel?.hint || selectedLevel?.intro || "该关卡暂无额外描述。" }}</p>
						<div class="jaf-challenge-difficulty-label">难度</div>
						<div class="jaf-challenge-difficulty">
							<button v-for="n in [1, 2, 3]" :key="n" class="jaf-difficulty-star" :class="{ 'is-filled': n <= difficulty }" @click="difficulty = n">
								{{ n <= difficulty ? "★" : "☆" }}
							</button>
						</div>
						<button class="jaf-challenge-start" @click="startChallenge">开始挑战</button>
					</div>
				</div>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.prepare }" @click.self="closePrepare">
			<div class="jaf-modal-content jaf-modal-shell jaf-prepare-modal-content">
				<div class="jaf-prepare-header">
					<h2 class="jaf-modal-title jaf-prepare-title">备战 · 携带宝物（最多4个）</h2>
					<div class="jaf-prepare-count">已选择：{{ selectedTreasureIds.length }}/4</div>
				</div>
				<button class="jaf-game-close" @click="closePrepare">×</button>
				<div class="jaf-prepare-treasure-grid">
					<div
						v-for="item in ownedTreasures"
						:key="item.id"
						class="jaf-prepare-treasure-card"
						:class="{
							'is-selected': selectedTreasureIds.includes(item.id),
							'is-disabled': !selectedTreasureIds.includes(item.id) && selectedTreasureIds.length >= 4,
						}"
						@click="toggleTreasure(item.id)"
						@contextmenu.prevent="ctx.showTreasureInfoDialog(item)"
					>
						<div class="jaf-prepare-treasure-image-wrap">
							<img class="jaf-prepare-treasure-image" :src="item.image || ''" :alt="item.name" draggable="false" />
							<div class="jaf-prepare-treasure-image-placeholder">宝物</div>
						</div>
						<div class="jaf-prepare-treasure-name">{{ item.name }}</div>
						<div class="jaf-prepare-treasure-checkbox"><div class="jaf-prepare-treasure-checkmark">✓</div></div>
					</div>
				</div>
				<div class="jaf-prepare-footer">
					<button class="jaf-game-btn" @click="confirmPrepare">确定</button>
				</div>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.album }" @click.self="closeAlbum">
			<div class="jaf-modal-content jaf-modal-shell jaf-album-modal-content">
				<div class="jaf-album-header">
					<h2 class="jaf-modal-title jaf-album-title">千禧册 · 武将图鉴</h2>
					<input v-model="albumSearch" class="jaf-search" type="search" placeholder="搜索武将" />
					<div class="jaf-album-stats">已拥有 {{ albumOwnedCount }} / {{ filteredAlbumCharacters.length }}</div>
				</div>
				<button class="jaf-game-close" @click="closeAlbum">×</button>
				<div ref="albumPackListRef" class="jaf-album-pack-list" @wheel="onAlbumPackWheel">
					<button v-for="packId in albumPackIds" :key="packId" class="jaf-album-tab" :class="{ active: packId === albumPackId }" @click="changeAlbumPack(packId)">
						<span v-html="packLabel(packId)"></span>
					</button>
				</div>
				<div class="jaf-album-subpack-list">
					<button v-for="subId in albumSubPackIds" :key="subId" class="jaf-album-subtab" :class="{ active: subId === albumSubPackId }" @click="albumSubPackId = subId">
						<span v-html="subPackLabel(subId)"></span>
					</button>
				</div>
				<div ref="albumViewportRef" class="jaf-album-viewport">
					<section class="jaf-album-group" data-group="owned">
						<h3 class="jaf-album-group-title">已拥有（{{ ownedAlbumCharacters.length }}）</h3>
						<div ref="ownedAlbumGridRef" class="jaf-album-character-grid"></div>
						<div v-if="!ownedAlbumCharacters.length" class="jaf-album-empty-tip">暂无已拥有武将</div>
					</section>
					<section class="jaf-album-group is-unowned" data-group="unowned">
						<h3 class="jaf-album-group-title">未拥有（{{ unownedAlbumCharacters.length }}）</h3>
						<div ref="unownedAlbumGridRef" class="jaf-album-character-grid"></div>
						<div v-if="!unownedAlbumCharacters.length" class="jaf-album-empty-tip">暂无未拥有武将</div>
					</section>
				</div>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.inventory }" @click.self="closeInventory">
			<div class="jaf-modal-content jaf-modal-shell">
				<div class="jaf-inventory-header">
					<h2 class="jaf-modal-title jaf-inventory-title">背包 · 物品管理</h2>
					<input v-model="inventorySearch" class="jaf-search" type="search" placeholder="搜索物品" />
					<div class="jaf-inventory-stats">已拥有 {{ inventoryTotalCount }} 件物品</div>
				</div>
				<button class="jaf-game-close" @click="closeInventory">×</button>
				<div class="jaf-inventory-body">
					<div class="jaf-category-list">
						<button v-for="category in inventoryCategories" :key="category.id" class="jaf-category-tab" :class="{ active: category.id === inventoryCategoryId }" @click="inventoryCategoryId = category.id">
							{{ category.name }}
						</button>
					</div>
					<div class="jaf-items-panel">
						<div class="jaf-items-grid">
							<template v-if="filteredInventoryItems.length">
								<article v-for="item in filteredInventoryItems" :key="item.id" class="jaf-item-card" @click="openInventoryDetail(item)">
									<div class="jaf-item-link">
										<div class="jaf-item-image-wrap">
											<img v-if="item.image" class="jaf-item-image" :src="item.image" :alt="item.name" draggable="false" />
											<span v-else class="jaf-item-image-placeholder">{{ item.name }}</span>
											<span class="jaf-inventory-count-badge">×{{ item.count }}</span>
										</div>
										<h4 class="jaf-item-name">{{ item.name }}</h4>
									</div>
								</article>
							</template>
							<div v-else class="jaf-inventory-empty">{{ inventorySearch.trim() ? "未找到匹配的物品" : "背包空空如也" }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="jaf-modal" :class="{ 'is-open': modal.shop }" @click.self="closeShop">
			<div class="jaf-modal-content jaf-modal-shell">
				<div class="jaf-shop-header">
					<h2 class="jaf-modal-title jaf-shop-title">小卖铺</h2>
					<input v-model="shopSearch" class="jaf-search" type="search" placeholder="搜索商品/卡池" />
					<div class="jaf-shop-wallet">
						<div class="jaf-shop-currency">忆铢：{{ shopState.memoryZhu }}</div>
						<div class="jaf-shop-currency">梦钿：{{ shopState.dreamDian }}</div>
						<div class="jaf-shop-currency">将符：{{ shopState.jiangFu }}</div>
					</div>
				</div>
				<button class="jaf-game-close" @click="closeShop">×</button>
				<div class="jaf-shop-body">
					<div class="jaf-category-list">
						<button v-for="category in shopCategories" :key="category.id" class="jaf-category-tab" :class="{ active: category.id === shopCategoryId }" @click="shopCategoryId = category.id">
							{{ category.name }}
						</button>
					</div>
					<div class="jaf-items-panel">
						<h3 class="jaf-shop-goods-title">{{ currentShopTitle }}</h3>
						<div class="jaf-items-grid">
							<template v-if="isGachaCategory">
								<article v-for="pool in filteredGachaPools" :key="pool.id" class="jaf-item-card jaf-item-card-gacha" @click="openGachaPool(pool)">
									<div class="jaf-item-link">
										<div class="jaf-item-image-wrap">
											<img class="jaf-item-image" :src="pool.image" :alt="pool.name" draggable="false" />
										</div>
										<h4 class="jaf-item-name">{{ pool.name }}</h4>
										<span class="jaf-item-price-text">单抽{{ pool.singleCost }}忆铢<br />十连{{ pool.tenCost }}忆铢</span>
									</div>
								</article>
							</template>
							<template v-else>
								<article v-for="item in filteredShopGoods" :key="item.id" class="jaf-item-card" @click="openShopItem(item)">
									<div class="jaf-item-link">
										<div class="jaf-item-image-wrap">
											<img v-if="item.image" class="jaf-item-image" :src="item.image" :alt="item.name" draggable="false" />
											<span v-else class="jaf-item-image-placeholder">图片预留</span>
										</div>
										<h4 class="jaf-item-name">{{ item.name }}</h4>
										<span class="jaf-item-price-text">{{ item.priceText }}</span>
									</div>
								</article>
							</template>
							<div v-if="isGachaCategory ? !filteredGachaPools.length : !filteredShopGoods.length" class="jaf-item-empty">
								{{ shopSearch.trim() ? "未找到匹配商品" : "当前分类暂无商品" }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { _status, get, lib, ui } from "noname";
import "./style.css";

const props = defineProps({
	ctx: {
		type: Object,
		required: true,
	},
});

const emit = defineEmits(["start-game"]);
const ctx = props.ctx;
const version = ref(0);
const touch = () => {
	version.value += 1;
};

const modal = reactive({
	chapter: false,
	level: false,
	challenge: false,
	prepare: false,
	album: false,
	inventory: false,
	shop: false,
});

const selectedChapterId = ref("");
const selectedLevel = ref(null);
const difficulty = ref(1);

const albumPackId = ref("");
const albumSubPackId = ref("all-characters");
const albumSearch = ref("");
const albumPackListRef = ref(null);
const albumViewportRef = ref(null);
const ownedAlbumGridRef = ref(null);
const unownedAlbumGridRef = ref(null);
const albumRenderQueue = ref([]);
const albumRenderedCount = ref(0);
let albumScrollRafId = 0;
let removeAlbumScrollListener = null;

const inventoryCategoryId = ref("");
const inventorySearch = ref("");

const shopCategoryId = ref("");
const shopSearch = ref("");
const shopState = reactive({
	ownedItemIds: {},
	memoryZhu: 0,
	dreamDian: 0,
	jiangFu: 0,
	isSaving: false,
});

const selectedTreasureIds = ref([]);

const t = id => get.translation(id) || id;
const normalizeSearchKeyword = keyword =>
	String(keyword || "")
		.trim()
		.toLowerCase();
const matchesKeyword = (keyword, ...fields) => {
	if (!keyword) return true;
	return fields.some(field =>
		String(field || "")
			.toLowerCase()
			.includes(keyword)
	);
};

const SHOP_CURRENCY = ["memoryZhu", "dreamDian", "jiangFu"];

const parseProgressId = progressId => {
	if (typeof progressId !== "string") return null;
	const match = /^c(\d+)l(\d+)$/i.exec(progressId.trim());
	if (!match) return null;
	const chapter = Number(match[1]);
	const level = Number(match[2]);
	if (!Number.isInteger(chapter) || !Number.isInteger(level) || chapter < 1 || level < 1) return null;
	return { chapter, level };
};

const normalizeProgressId = progressId => {
	const parsed = parseProgressId(progressId);
	if (!parsed) return "c1l1";
	return `c${parsed.chapter}l${parsed.level}`;
};

const isLevelUnlockedByProgress = (levelId, progressId) => {
	const levelParsed = parseProgressId(levelId);
	if (!levelParsed) return true;
	const progressParsed = parseProgressId(progressId) || parseProgressId("c1l1");
	if (!progressParsed) return true;
	if (levelParsed.chapter < progressParsed.chapter) return true;
	if (levelParsed.chapter > progressParsed.chapter) return false;
	return levelParsed.level <= progressParsed.level;
};

const formatProgressText = progressId => {
	const parsed = parseProgressId(progressId);
	if (!parsed) return "第1章第1关";
	return `第${parsed.chapter}章第${parsed.level}关`;
};

const getNextProgressId = currentProgressId => {
	const chapters = ctx.chapters || {};
	if (!chapters || typeof chapters !== "object") return null;

	const chapterIds = Object.keys(chapters).sort();
	for (let ci = 0; ci < chapterIds.length; ci++) {
		const chapterId = chapterIds[ci];
		const chapter = chapters[chapterId];
		if (!chapter || !chapter.levels) continue;

		const levelIds = Object.keys(chapter.levels).sort();
		for (let li = 0; li < levelIds.length; li++) {
			const levelId = levelIds[li];
			if (String(levelId) === String(currentProgressId)) {
				if (li + 1 < levelIds.length) return levelIds[li + 1];
				for (let nc = ci + 1; nc < chapterIds.length; nc++) {
					const nextChapter = chapters[chapterIds[nc]];
					if (!nextChapter || !nextChapter.levels) continue;
					const nextLevelIds = Object.keys(nextChapter.levels).sort();
					if (nextLevelIds.length > 0) return nextLevelIds[0];
				}
				return null;
			}
		}
	}

	const parsed = parseProgressId(currentProgressId);
	if (!parsed) return null;
	const chapter = chapters[`c${parsed.chapter}`];
	if (!chapter || !chapter.levels) return null;

	const levelIds = Object.keys(chapter.levels).sort();
	const nextLevelId = `c${parsed.chapter}l${parsed.level + 1}`;
	if (levelIds.includes(nextLevelId)) return nextLevelId;

	const nextChapter = chapters[`c${parsed.chapter + 1}`];
	if (nextChapter && nextChapter.levels) {
		const nextLevelIds = Object.keys(nextChapter.levels).sort();
		if (nextLevelIds.length > 0) return nextLevelIds[0];
	}
	return null;
};

const getLevelImage = level => {
	if (level?.image) return level.image;
	const levelId = level?.id;
	if (!levelId) return null;
	const baseImage = String(ctx.entryKiteImage || "");
	const dir = baseImage.replace(/\/kite\.jpg(?:\?.*)?$/i, "");
	if (!dir) return null;
	return `${dir}/${levelId}.jpg`;
};

const getAlbumPackList = () => {
	const opened = Array.isArray(lib.config?.characters) ? lib.config.characters : [];
	const all = Array.isArray(lib.config?.all?.characters) ? lib.config.all.characters : [];
	const extra = Object.keys(lib.characterPack || {}).filter(pack => !all.includes(pack) && Object.keys(lib.characterPack[pack] || {}).length > 0);
	const enabled = all.filter(pack => opened.includes(pack));
	return ["all-pack", ...enabled, ...extra];
};

const getAlbumSubPackList = packId => {
	if (packId === "all-pack") return ["all-characters"];
	const sortMap = lib.characterSort?.[packId] || {};
	const subPacks = Object.keys(sortMap);
	return ["all-characters", ...subPacks];
};

const getAlbumCharacters = (packId, subPackId) => {
	let characters = [];
	const ownSet = new Set(_status.characterlist);
	const normalizeCharacters = list => [...new Set(list)].filter(id => id && lib.character[id]);

	if (packId === "all-pack") {
		const allPackIds = getAlbumPackList().filter(id => id && id !== "all-pack");
		characters = normalizeCharacters(allPackIds.flatMap(id => Object.keys(lib.characterPack?.[id] || {})));
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
};

const getRankCharacterObject = () => {
	if (_status.rankCharacterObject) return _status.rankCharacterObject;

	const bans = Object.keys(lib.characterPack.millenDream || {});
	const validKeys = Object.keys(lib.character || {}).filter(charId => {
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
};

const normalizeOwnedItemCounts = raw => {
	if (!raw || typeof raw !== "object") return {};
	return Object.entries(raw).reduce((acc, [id, count]) => {
		if (typeof id !== "string" || !id.length) return acc;
		const normalized = Math.max(0, Math.floor(Number(count) || 0));
		if (normalized > 0) acc[id] = normalized;
		return acc;
	}, {});
};

const normalizeShopPrice = priceInput => {
	if (!priceInput || typeof priceInput !== "object") return {};
	return SHOP_CURRENCY.reduce((acc, key) => {
		const amount = Number(priceInput[key]) || 0;
		if (amount > 0) acc[key] = amount;
		return acc;
	}, {});
};

const normalizeShopCurrency = (raw = {}) => {
	return SHOP_CURRENCY.reduce((acc, key) => {
		const value = Number(raw?.[key]);
		acc[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
		return acc;
	}, {});
};

const formatShopPrice = priceInput => {
	const price = normalizeShopPrice(priceInput);
	const entries = SHOP_CURRENCY.filter(key => Number(price[key]) > 0).map(key => `${price[key]}${get.translation(key)}`);
	return entries.length ? entries.join(" + ") : "免费";
};

const canAffordShopPrice = (wallet, priceInput) => {
	const price = normalizeShopPrice(priceInput);
	return SHOP_CURRENCY.every(key => (Number(wallet?.[key]) || 0) >= (Number(price[key]) || 0));
};

const applyShopPrice = (wallet, priceInput, direction = -1) => {
	const price = normalizeShopPrice(priceInput);
	SHOP_CURRENCY.forEach(key => {
		const current = Number(wallet?.[key]) || 0;
		const delta = (Number(price[key]) || 0) * direction;
		wallet[key] = Math.max(0, current + delta);
	});
};

const applyParsedShopDataToState = (state, parsed) => {
	if (!parsed || typeof parsed !== "object") return;
	state.ownedItemIds = normalizeOwnedItemCounts(parsed.ownedItemIds);
	const normalizedCurrency = normalizeShopCurrency(parsed.currency);
	SHOP_CURRENCY.forEach(key => {
		state[key] = normalizedCurrency[key];
	});
};

const getGachaPoolCharacters = prizePool => {
	if (!prizePool || typeof prizePool !== "object") return [];
	if (Array.isArray(prizePool)) return prizePool;
	if (prizePool.type === "character_rank") {
		const rankObject = getRankCharacterObject();
		const poolKey = String(prizePool.poolKey || "");
		if (rankObject[poolKey] && poolKey !== "random") {
			return Array.isArray(rankObject?.[poolKey]) ? rankObject[poolKey] : [];
		}
		return Object.values(rankObject).flat();
	}
	return [];
};

const getGachaCostDetail = ({ singleCostMemoryZhu, drawCount, jiangFuOwned }) => {
	const isTen = drawCount === 10;
	const discountedMemory = isTen ? Math.floor(singleCostMemoryZhu * drawCount * 0.9) : singleCostMemoryZhu;
	const usedJiangFu = Math.min(Math.max(0, Number(jiangFuOwned) || 0), discountedMemory);
	const finalMemoryCost = discountedMemory - usedJiangFu;
	return {
		discountedMemory,
		usedJiangFu,
		finalMemoryCost,
	};
};

const runGachaDraw = async ({ shopState, poolConfig, drawCount }) => {
	const randomPick = list => {
		if (!Array.isArray(list) || !list.length) return null;
		const index = Math.floor(Math.random() * list.length);
		return list[index];
	};

	if (!poolConfig || !shopState) return { ok: false, message: "抽卡参数错误。" };
	if (shopState.isSaving) return { ok: false, message: "操作过快，请稍后再试。" };

	const poolCharacters = getGachaPoolCharacters(poolConfig.prizePool);
	if (!poolCharacters.length) {
		return { ok: false, message: `${poolConfig.name} 暂无可抽取武将。` };
	}

	const ownSet = new Set(Array.isArray(_status.characterlist) ? _status.characterlist : []);
	const singleCostMemoryZhu = poolConfig.price.memoryZhu;
	const cost = getGachaCostDetail({
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
	gameData().currency = normalizeShopCurrency(shopState);
	gameData().characterlist = Array.isArray(_status.characterlist) ? _status.characterlist : [];
	await ctx.saveGameData();
	shopState.isSaving = false;
	return { ok: true, results, cost };
};

const gameData = () => ctx.getGameData();
const currentProgressId = computed(() => {
	version.value;
	return normalizeProgressId(gameData()?.progress || "c1l1");
});

const chapterList = computed(() => {
	return Object.entries(ctx.chapters || {}).map(([id, chapter]) => ({ id, ...chapter }));
});

const selectedChapter = computed(() => chapterList.value.find(ch => ch.id === selectedChapterId.value) || null);
const currentLevels = computed(() => {
	const levelsObj = selectedChapter.value?.levels || {};
	const levels = Object.entries(levelsObj).map(([id, level]) => ({ id, ...level }));
	if (levels.length) return levels;
	return [{ id: `${selectedChapterId.value || "chapter"}-coming-soon`, title: "敬请期待", intro: "该章节关卡正在制作中。", hint: "目前暂无额外提示，请耐心等待更新。", image: null }];
});

const isLevelUnlocked = levelId => isLevelUnlockedByProgress(levelId, currentProgressId.value);

// 关卡简洁介绍文本，未解锁时附加当前进度提示
const getLevelCardIntroHtml = level => {
	const introHtml = String(level?.intro || "");
	if (isLevelUnlocked(level?.id)) return introHtml;
	const progressText = formatProgressText(currentProgressId.value);
	const lockedTip = `<span class="jaf-level-locked-tip">（未解锁，当前进度：${progressText}）</span>`;
	return introHtml ? `${introHtml}<br/>${lockedTip}` : lockedTip;
};

const ownedTreasures = computed(() => {
	version.value;
	const ids = Array.isArray(gameData()?.treasure) ? gameData().treasure : [];
	return ids.map(id => ({ id, ...(ctx.treasureData[id] || {}) })).filter(item => item.name);
});

const ownedCharacterSet = computed(() => {
	version.value;
	const list = Array.isArray(_status.characterlist) ? _status.characterlist : [];
	return new Set(list);
});

const albumPackIds = computed(() => getAlbumPackList());
const albumSubPackIds = computed(() => getAlbumSubPackList(albumPackId.value));
const filteredAlbumCharacters = computed(() => {
	const chars = getAlbumCharacters(albumPackId.value, albumSubPackId.value);
	const keyword = normalizeSearchKeyword(albumSearch.value);
	if (!keyword) return chars;
	return chars.filter(id => matchesKeyword(keyword, t(id), id));
});

const albumOwnedCount = computed(() => filteredAlbumCharacters.value.filter(id => ownedCharacterSet.value.has(id)).length);
const ownedAlbumCharacters = computed(() => filteredAlbumCharacters.value.filter(id => ownedCharacterSet.value.has(id)));
const unownedAlbumCharacters = computed(() => filteredAlbumCharacters.value.filter(id => !ownedCharacterSet.value.has(id)));

const inventoryCategories = computed(() => {
	return Object.entries(ctx.shopData || {})
		.filter(([id]) => id !== "gacha")
		.map(([id, data]) => ({ id, ...data }));
});

const inventoryRawItems = computed(() => {
	version.value;
	const category = inventoryCategories.value.find(c => c.id === inventoryCategoryId.value) || inventoryCategories.value[0];
	if (!category) return [];
	const ownedItemIds = gameData()?.ownedItemIds || {};
	return Object.entries(category.goods || {})
		.filter(([id]) => (Number(ownedItemIds[id]) || 0) > 0)
		.map(([id, item]) => ({
			id,
			name: t(id) || item.name || "未知物品",
			desc: get.translation(`${id}_info`) || item.desc || "暂无描述",
			image: item.image || "",
			count: Math.max(0, Math.floor(Number(ownedItemIds[id]) || 0)),
			skills: item.skills || [],
		}));
});

const filteredInventoryItems = computed(() => {
	const kw = normalizeSearchKeyword(inventorySearch.value);
	if (!kw) return inventoryRawItems.value;
	return inventoryRawItems.value.filter(item => matchesKeyword(kw, item.name, item.id, item.desc));
});

const inventoryTotalCount = computed(() => inventoryRawItems.value.reduce((sum, item) => sum + item.count, 0));

const shopCategories = computed(() => Object.entries(ctx.shopData || {}).map(([id, data]) => ({ id, ...data })));
const isGachaCategory = computed(() => shopCategoryId.value === "gacha");
const currentShopCategory = computed(() => shopCategories.value.find(c => c.id === shopCategoryId.value) || shopCategories.value[0]);
const currentShopTitle = computed(() => {
	if (!currentShopCategory.value) return "商品列表";
	if (isGachaCategory.value) {
		const count = Object.keys(currentShopCategory.value.goods || {}).length;
		return `抽卡卡池（${count}）`;
	}
	const count = Object.keys(currentShopCategory.value.goods || {}).length;
	return `${currentShopCategory.value.name || "商品"}（${count}）`;
});

const gachaPools = computed(() => {
	if (!isGachaCategory.value) return [];
	const goods = currentShopCategory.value?.goods || {};
	return Object.entries(goods).map(([id, pool]) => {
		const singleCost = getGachaCostDetail({
			singleCostMemoryZhu: pool.price.memoryZhu,
			drawCount: 1,
			jiangFuOwned: shopState.jiangFu,
		}).discountedMemory;
		const tenCost = getGachaCostDetail({
			singleCostMemoryZhu: pool.price.memoryZhu,
			drawCount: 10,
			jiangFuOwned: shopState.jiangFu,
		}).discountedMemory;
		return {
			id,
			...pool,
			name: t(id),
			singleCost,
			tenCost,
		};
	});
});

const shopGoods = computed(() => {
	if (isGachaCategory.value) return [];
	const goods = currentShopCategory.value?.goods || {};
	return Object.entries(goods).map(([id, item]) => ({
		id,
		...item,
		name: t(id) || item.name || "未命名商品",
		priceText: formatShopPrice(normalizeShopPrice(item.price)),
	}));
});

const filteredGachaPools = computed(() => {
	const keyword = normalizeSearchKeyword(shopSearch.value);
	if (!keyword) return gachaPools.value;
	return gachaPools.value.filter(pool => matchesKeyword(keyword, pool.name, pool.id, get.translation(`${pool.id}_info`), pool.desc));
});

const filteredShopGoods = computed(() => {
	const keyword = normalizeSearchKeyword(shopSearch.value);
	if (!keyword) return shopGoods.value;
	return shopGoods.value.filter(item => matchesKeyword(keyword, item.name, item.id, item.priceText, get.translation(`${item.id}_info`), item.desc));
});

function closeAll() {
	Object.keys(modal).forEach(key => {
		modal[key] = false;
	});
}

function openChapter() {
	closeAll();
	modal.chapter = true;
}
function closeChapter() {
	modal.chapter = false;
}
function selectChapter(chapterId) {
	selectedChapterId.value = chapterId;
	modal.chapter = false;
	modal.level = true;
}
function backToChapter() {
	modal.level = false;
	modal.chapter = true;
}
function clickLevel(level) {
	if (!isLevelUnlocked(level.id)) {
		ctx.showShopNoticeDialog({
			title: "关卡未解锁",
			message: `该关卡尚未解锁，当前最多可挑战到 ${formatProgressText(currentProgressId.value)}。`,
		});
		return;
	}
	selectedLevel.value = level;
	difficulty.value = 1;
	modal.challenge = true;
}
function closeChallenge() {
	modal.challenge = false;
}

function startChallenge() {
	const chapter = selectedChapter.value;
	const level = selectedLevel.value;
	const next = getNextProgressId(level?.id);
	const nextProgressId = next ? normalizeProgressId(next) : null;
	emit("start-game", {
		started: true,
		difficulty: difficulty.value,
		chapterId: chapter?.id ?? null,
		chapterTitle: chapter?.title ?? null,
		levelId: level?.id ?? null,
		levelTitle: level?.title ?? null,
		gameData: level?.gameData ?? null,
		nextProgressId,
	});
}

function openPrepare() {
	selectedTreasureIds.value = Array.isArray(gameData()?.selectedTreasures) ? [...gameData().selectedTreasures] : [];
	modal.level = false;
	modal.prepare = true;
}
function closePrepare() {
	modal.prepare = false;
	modal.level = true;
}
function toggleTreasure(id) {
	const list = selectedTreasureIds.value;
	const exists = list.includes(id);
	if (exists) {
		selectedTreasureIds.value = list.filter(item => item !== id);
		return;
	}
	if (list.length >= 4) return;
	selectedTreasureIds.value = [...list, id];
}
async function confirmPrepare() {
	gameData().selectedTreasures = [...selectedTreasureIds.value];
	await ctx.saveGameData();
	touch();
	modal.prepare = false;
	modal.level = true;
	ctx.showToast(`已携带 ${selectedTreasureIds.value.length} 个宝物`);
}

function openAlbum() {
	if (!albumPackId.value) {
		albumPackId.value = albumPackIds.value[1] || albumPackIds.value[0] || "";
	}
	albumSubPackId.value = "all-characters";
	albumSearch.value = "";
	closeAll();
	modal.album = true;
	nextTick(() => {
		scrollActiveAlbumPackIntoView();
	});
}
function closeAlbum() {
	modal.album = false;
}
function changeAlbumPack(packId) {
	albumPackId.value = packId;
	albumSubPackId.value = "all-characters";
	nextTick(() => {
		scrollActiveAlbumPackIntoView();
	});
}

function onAlbumPackWheel(event) {
	const list = albumPackListRef.value;
	if (!list || list.scrollWidth <= list.clientWidth) return;

	const deltaX = Number(event.deltaX) || 0;
	const deltaY = Number(event.deltaY) || 0;
	const delta = Math.abs(deltaX) > 0 ? deltaX : deltaY;
	if (!delta) return;

	if (Math.abs(deltaY) > Math.abs(deltaX)) {
		event.preventDefault();
	}
	list.scrollLeft += delta;
}

function scrollActiveAlbumPackIntoView() {
	const list = albumPackListRef.value;
	if (!list) return;
	const activeButton = list.querySelector(".jaf-album-tab.active");
	if (!activeButton) return;
	activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}
function packLabel(id) {
	if (id === "all-pack") return "所有卡包";
	return lib.translate?.[`${id}_character_config`] || lib.translate?.[id] || id;
}
function subPackLabel(id) {
	if (id === "all-characters") return "所有武将";
	return lib.translate?.[id] || id;
}

function appendAlbumCharacterButton(grid, characterId, isUnowned = false) {
	if (!grid || !characterId) return;
	const tempWrapper = document.createElement("div");
	const [button] = ui.create.buttons([characterId], "character", tempWrapper);
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
}

function disposeAlbumLazyLoad() {
	if (albumScrollRafId) {
		window.cancelAnimationFrame(albumScrollRafId);
		albumScrollRafId = 0;
	}
	if (typeof removeAlbumScrollListener === "function") {
		removeAlbumScrollListener();
		removeAlbumScrollListener = null;
	}
}

function renderAlbumNext(step = 1) {
	const ownedGrid = ownedAlbumGridRef.value;
	const unownedGrid = unownedAlbumGridRef.value;
	if (!ownedGrid || !unownedGrid) return;

	const count = Math.max(1, Number(step) || 1);
	for (let i = 0; i < count && albumRenderedCount.value < albumRenderQueue.value.length; i++) {
		const item = albumRenderQueue.value[albumRenderedCount.value];
		appendAlbumCharacterButton(item.isUnowned ? unownedGrid : ownedGrid, item.characterId, item.isUnowned);
		albumRenderedCount.value += 1;
	}
}

function initAlbumLazyLoad() {
	disposeAlbumLazyLoad();
	const viewport = albumViewportRef.value;
	if (!viewport) return;

	const onViewportScroll = () => {
		if (albumScrollRafId) return;
		albumScrollRafId = window.requestAnimationFrame(() => {
			albumScrollRafId = 0;
			const nearBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 120;
			if (!nearBottom) return;

			renderAlbumNext(1);
			if (albumRenderedCount.value >= albumRenderQueue.value.length) {
				disposeAlbumLazyLoad();
			}
		});
	};

	viewport.addEventListener("scroll", onViewportScroll, { passive: true });
	removeAlbumScrollListener = () => viewport.removeEventListener("scroll", onViewportScroll);
}

function renderAlbumCharacterButtons() {
	const ownedGrid = ownedAlbumGridRef.value;
	const unownedGrid = unownedAlbumGridRef.value;
	if (!ownedGrid || !unownedGrid) return;

	disposeAlbumLazyLoad();
	ownedGrid.replaceChildren();
	unownedGrid.replaceChildren();
	albumRenderQueue.value = [...ownedAlbumCharacters.value.map(characterId => ({ characterId, isUnowned: false })), ...unownedAlbumCharacters.value.map(characterId => ({ characterId, isUnowned: true }))];
	albumRenderedCount.value = 0;

	// 恢复旧逻辑：首次最多渲染 70 个
	renderAlbumNext(70);
	if (albumRenderedCount.value < albumRenderQueue.value.length) {
		initAlbumLazyLoad();
	}
}

function openInventory() {
	inventoryCategoryId.value = inventoryCategories.value[0]?.id || "";
	inventorySearch.value = "";
	closeAll();
	modal.inventory = true;
}
function closeInventory() {
	modal.inventory = false;
}

function openInventoryDetail(item) {
	const category = inventoryCategories.value.find(c => c.id === inventoryCategoryId.value);
	const actionButtons = [];

	if (category?.id === "props") {
		actionButtons.push({
			label: "装备",
			onClick: async () => {
				ctx.showToast(`装备了 ${item.name}`);
				return true;
			},
		});
	} else if (category?.usable) {
		actionButtons.push({
			label: "使用",
			onClick: async () => {
				const owned = gameData().ownedItemIds || {};
				owned[item.id] = Math.max(0, Number(owned[item.id] || 0) - 1);
				gameData().ownedItemIds = normalizeOwnedItemCounts(owned);
				await ctx.saveGameData();
				touch();
				ctx.showToast(`使用了 ${item.name}`);
				const cfg = category?.goods?.[item.id];
				const skills = Array.isArray(cfg?.skills) ? cfg.skills : [];
				if (skills.length) {
					_status.additionalEffect = Array.isArray(_status.additionalEffect) ? _status.additionalEffect : [];
					_status.additionalEffect.push(...skills);
				}
				return true;
			},
		});
	}

	actionButtons.push({
		label: "丢弃",
		onClick: async () => {
			const owned = gameData().ownedItemIds || {};
			owned[item.id] = Math.max(0, Number(owned[item.id] || 0) - 1);
			gameData().ownedItemIds = normalizeOwnedItemCounts(owned);
			await ctx.saveGameData();
			touch();
			ctx.showToast(`丢弃了 ${item.name}`);
			return true;
		},
	});

	ctx.showShopPurchaseDialog({
		item,
		isOwned: true,
		isRepeatable: false,
		actionButtons,
		onPurchase: async () => false,
		purchase: false,
	});
}

function openShop() {
	closeAll();
	modal.shop = true;
	shopSearch.value = "";
	applyParsedShopDataToState(shopState, gameData());
	shopCategoryId.value = Object.keys(ctx.shopData || {})[0] || "gacha";
}
function closeShop() {
	modal.shop = false;
}

async function openGachaPool(pool) {
	const poolCharacters = getGachaPoolCharacters(pool.prizePool);
	const unownedCount = poolCharacters.filter(id => !ownedCharacterSet.value.has(id)).length;
	const single = getGachaCostDetail({
		singleCostMemoryZhu: pool.price.memoryZhu,
		drawCount: 1,
		jiangFuOwned: shopState.jiangFu,
	});
	const ten = getGachaCostDetail({
		singleCostMemoryZhu: pool.price.memoryZhu,
		drawCount: 10,
		jiangFuOwned: shopState.jiangFu,
	});

	const draw = async drawCount => {
		const result = await runGachaDraw({
			shopState,
			poolConfig: pool,
			drawCount,
		});
		if (!result.ok) {
			ctx.showShopNoticeDialog({ title: "抽卡失败", message: result.message || "抽卡失败，请稍后重试。" });
			touch();
			return false;
		}
		touch();
		ctx.showGachaResultOverlay({
			poolName: pool.name,
			results: result.results,
			isTen: drawCount === 10,
			actionButtons: drawCount === 10 ? [{ label: "再来十抽", onClick: () => draw(10), className: "jaf-game-btn" }] : [{ label: "再来一抽", onClick: () => draw(1), className: "jaf-game-btn" }],
		});
		return true;
	};

	ctx.showShopPurchaseDialog({
		showEffect: false,
		item: {
			id: pool.id,
			price: `单抽${single.discountedMemory}忆铢 / 十连${ten.discountedMemory}忆铢（9折）`,
			desc: `${get.translation(`${pool.id}_info`)}（1 将符可以折扣 1 忆铢）\n卡池数量：${poolCharacters.length}，未拥有：${unownedCount}，重复返还：+${pool.duplicateJiangFu}将符。`,
			image: pool.image,
		},
		actionButtons: [
			{ label: `单抽（实付 ${single.finalMemoryCost} 忆铢）`, onClick: () => draw(1), className: "jaf-game-btn jaf-gacha-btn" },
			{ label: `十连（实付 ${ten.finalMemoryCost} 忆铢）`, onClick: () => draw(10), className: "jaf-game-btn jaf-gacha-btn" },
		],
	});
}

function openShopItem(item) {
	const normalizedPrice = normalizeShopPrice(item.price);
	const isRepeatable = Boolean(item.repeatable);
	const ownedCount = Number(shopState.ownedItemIds?.[item.id]) || 0;
	const isOwned = !isRepeatable && ownedCount > 0;

	const purchaseItem = async () => {
		if (shopState.isSaving || (!isRepeatable && (Number(shopState.ownedItemIds?.[item.id]) || 0) > 0)) return false;
		if (!canAffordShopPrice(shopState, normalizedPrice)) {
			ctx.showShopNoticeDialog({
				title: "余额不足",
				message: `${item.name} 需要 ${formatShopPrice(normalizedPrice)}，当前余额：忆铢 ${shopState.memoryZhu}，梦钿 ${shopState.dreamDian}，将符 ${shopState.jiangFu}。`,
			});
			return false;
		}

		applyShopPrice(shopState, normalizedPrice, -1);
		shopState.isSaving = true;
		shopState.ownedItemIds[item.id] = isRepeatable ? ownedCount + 1 : Math.max(ownedCount, 1);
		gameData().currency = normalizeShopCurrency(shopState);
		gameData().ownedItemIds = normalizeOwnedItemCounts(shopState.ownedItemIds);
		await ctx.saveGameData();
		shopState.isSaving = false;
		touch();
		ctx.showToast("购买成功");
		return true;
	};

	ctx.showShopPurchaseDialog({
		item,
		isOwned,
		isRepeatable,
		onPurchase: purchaseItem,
	});
}

function onGlobalEsc(event) {
	if (event.key !== "Escape") return;
	if (document.getElementById("jaf-level-intro-overlay")) return;
	event.preventDefault();

	if (modal.prepare) {
		closePrepare();
		return;
	}
	if (modal.challenge) {
		closeChallenge();
		return;
	}
	if (modal.level) {
		backToChapter();
		return;
	}
	if (modal.chapter) {
		closeChapter();
		return;
	}
	if (modal.album) {
		closeAlbum();
		return;
	}
	if (modal.inventory) {
		closeInventory();
		return;
	}
	if (modal.shop) {
		closeShop();
	}
}

onMounted(() => {
	selectedTreasureIds.value = Array.isArray(gameData()?.selectedTreasures) ? [...gameData().selectedTreasures] : [];
	inventoryCategoryId.value = inventoryCategories.value[0]?.id || "";
	albumPackId.value = albumPackIds.value[1] || albumPackIds.value[0] || "";
	shopCategoryId.value = Object.keys(ctx.shopData || {})[0] || "gacha";
	document.addEventListener("keydown", onGlobalEsc);
});

watch(
	() => [modal.album, albumPackId.value, albumSubPackId.value, albumSearch.value, version.value],
	async ([isAlbumOpen]) => {
		if (!isAlbumOpen) {
			disposeAlbumLazyLoad();
			return;
		}
		await nextTick();
		renderAlbumCharacterButtons();
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	disposeAlbumLazyLoad();
	document.removeEventListener("keydown", onGlobalEsc);
});
</script>

<style scoped>
.jaf-vue-app-shell {
	display: contents;
}
</style>
