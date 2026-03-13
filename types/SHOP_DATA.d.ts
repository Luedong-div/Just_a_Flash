/**
 * Shop item definition used by the test shop data.
 */
export interface ShopPrice {
	/** 忆铢价格（可选） */
	memoryZhu?: number;
	/** 梦钿价格（可选） */
	dreamDian?: number;
	/** 将符价格（可选） */
	jiangFu?: number;
}

export interface GachaPrizePoolConfig {
	type: string;
	poolKey?: string;
}

export interface ShopItem {
	/**
	 * 商品唯一 ID
	 * @deprecated 已废弃，现在使用对象键作为 ID
	 */
	id?: string;
	/**
	 * 商品名称
	 * @deprecated 已废弃，应使用 get.translation(itemId) 获取翻译名称
	 */
	name?: string;
	/** 商品价格对象*/
	price: ShopPrice;
	/** 抽卡池定义（仅抽卡商品使用） */
	prizePool?: string[] | GachaPrizePoolConfig;
	/** 抽到重复武将时返还将符（仅抽卡商品使用） */
	duplicateJiangFu?: number;
	/** 商品描述（可选） */
	desc?: string;
	/** 图片 URL（可选） */
	image?: string | null;
	/** 是否可重复购买（默认 false） */
	repeatable?: boolean;
	/** 使用效果（可选） */
	skills?: string[] | string;
}

/**
 * 商品分类（一个分类包含若干商品）
 */
export interface ShopCategoryData {
	/** 分类名称 */
	name: string;
	/** 分类下的商品对象（键为商品 ID） */
	goods: { [itemId: string]: ShopItem };
	/** 是否可以使用（为了区分消耗品）*/
	usable?: boolean;
}

/**
 * Shop 配置，由若干分类组成（对象形式，键为分类 ID）
 */
export type ShopConfig = {
	/** 抽卡 */
	gacha: ShopCategoryData;
	/** 增益物品 */
	boostItem: ShopCategoryData;
	/** 永久增益物品 */
	permanentBoostItem: ShopCategoryData;
	[categoryId: string]: ShopCategoryData;
};

declare const SHOP_DATA: ShopConfig;
export default SHOP_DATA;
