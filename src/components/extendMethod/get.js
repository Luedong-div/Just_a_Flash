import { lib } from "noname";

function escapeHtmlAttr(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;");
}

export default {
	/**
	 * 创建一个带有颜色配置的 poptip 元素，点击后显示对应信息
	 * @param {String} id poptip 的唯一标识符
	 * @param {String} name poptip 显示名称
	 * @param {String} info poptip 弹框信息
	 * @param {String} color poptip 修改显示名称的颜色
	 * @returns {String} 包含 poptip 的 HTML 字符串
	 */
	easyPoptip(id, name, info, color) {
		const pop = {
			id,
			name,
			type: "character",
			info,
		};
		const styleAttr = color ? ` style="color:${escapeHtmlAttr(color)};"` : "";
		const element = lib?.poptip?.getElement ? lib.poptip.getElement(pop) : escapeHtmlAttr(name);
		return `<span class="jaf-poptip-name"${styleAttr}>${element}</span>`;
	},
};
