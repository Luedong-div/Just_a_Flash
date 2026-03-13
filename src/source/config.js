import { game, ui } from "noname";
import { showUpdateTip } from "../api/changelog.js";
import info from "../info.js";
import updateHistory from "../components/UpdateTip/updateHistory.js";

let observed = false;

export const config = {
	updateInfo: {
		name: `版本：${updateHistory[0].version}`,
		unfrequent: true,
		intro: "查看更新内容",
		init: "1",
		item: {
			1: "<font color=#2cb625>更新内容</font>",
		},
		visualBar(node, item, create, switcher) {
			if (observed) return;
			observed = true;
			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.type === "attributes" && mutation.attributeName === "class" && switcher.classList.contains("on")) {
						showUpdateTip(updateHistory, info.name, () => {
							const popupContainer = ui.window.querySelector(".popup-container");
							if (popupContainer) {
								popupContainer.hide();
							}
							switcher.classList.remove("on");
						});
					}
				});
			});
			observer.observe(switcher, {
				attributes: true,
				attributeOldValue: true,
				attributeFilter: ["class"],
			});
		},
		visualMenu(node, link, name, config) {
			node.parentElement.style.display = "none";
		},
	},
	repository: {
		clear: true,
		name: '<ins style="color:#fe7300">复制仓库地址</ins>',
		async onclick() {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(info.diskURL);
			}
		},
	},
};
