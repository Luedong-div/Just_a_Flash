import "noname";

declare module "noname" {
	interface Get {
		/**
		 * 创建一个带有颜色配置的 poptip 元素，点击后显示对应信息
		 * @param id poptip 的唯一标识符
		 * @param name poptip 显示名称
		 * @param info poptip 弹框信息
		 * @param color poptip 修改显示名称的颜色
		 */
		easyPoptip?(id: string, name?: string, info?: string, color?: string): string;
	}

	interface Game {
		/**
		 * 章节对话播放（支持旁白与角色台词）
		 * lines 结构：
		 * - ["旁白文本"]
		 * - ["characterId", "角色台词"]
		 * @param {Array<Array<string>>} lines
		 * @returns {Promise<void>}
		 */
		playConvo?: (lines: Array<Array<string>>) => Promise<void>;
	}
}

declare module "noname-typings/nonameModules/noname/library/element/player.js" {
	interface Player {
		/**
		 * 仅作为测试
		 */
		testMethod(): void;
	}
}

declare global {
	const get: typeof import("noname").get;
	const Get: typeof import("noname").Get;
	const lib: typeof import("noname").lib;
	const Game: typeof import("noname").Game;
}

export {};
