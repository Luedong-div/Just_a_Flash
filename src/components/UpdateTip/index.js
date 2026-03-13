import { ui } from "noname";
import updateTipCss from "./style.css?raw";
import { MapleFallingEffect } from "../effects/mapleFalling.js";

class UpdateTipShadowDOM {
	static activeInstance = null;

	constructor(hostElement, data, extname, onClose = () => {}) {
		if (UpdateTipShadowDOM.activeInstance) {
			UpdateTipShadowDOM.activeInstance.close();
			UpdateTipShadowDOM.activeInstance = null;
		}

		this.host = hostElement;
		this.data = data;
		this.extname = extname;
		this.onClose = onClose;
		this.shadow = this.host.attachShadow({ mode: "open" });
		this.mapleEffect = null;

		this.render();
		UpdateTipShadowDOM.activeInstance = this;
	}

	createStyles() {
		const style = document.createElement("style");
		style.textContent = updateTipCss;
		return style;
	}

	createHeader(container) {
		const header = document.createElement("header");
		const title = document.createElement("h1");
		title.textContent = `《${this.extname}》更新内容`;

		const subtitle = document.createElement("p");
		subtitle.className = "subtitle";
		subtitle.textContent = "旧梦不须记，新篇待君书";

		header.append(title, subtitle);
		container.appendChild(header);
	}

	createVersionCard(item, index) {
		const versionCard = ui.create.div(".version-card");
		versionCard.style.animationDelay = `${0.1 * (index + 1)}s`;

		const marker = ui.create.div(".version-marker");
		const versionHeader = ui.create.div(".version-header");
		const versionNumber = ui.create.div(".version-number");
		const versionDate = ui.create.div(".version-date");

		versionNumber.textContent = item.version;
		versionDate.textContent = item.date;
		versionHeader.append(versionNumber, versionDate);

		const changesList = document.createElement("ul");
		changesList.className = "changes-list";

		item.changes.forEach(change => {
			const listItem = document.createElement("li");
			listItem.textContent = change;
			changesList.appendChild(listItem);
		});

		versionCard.append(marker, versionHeader, changesList);
		return versionCard;
	}

	createTimeline(container) {
		const timeline = ui.create.div(".timeline#changelog-timeline");
		this.data.forEach((item, index) => {
			timeline.appendChild(this.createVersionCard(item, index));
		});
		container.appendChild(timeline);
	}

	createFooter(container) {
		const footer = document.createElement("footer");
		const footerText = document.createElement("p");
		footerText.textContent = "已经到底啦 ~ 感谢支持！";
		footer.appendChild(footerText);
		container.appendChild(footer);
	}

	createCloseButton() {
		const close = ui.create.div(".close");
		close.onclick = () => this.close();
		return close;
	}

	render() {
		const container = ui.create.div(".container");
		const inner = document.createElement("div");
		inner.className = "inner";

		this.createHeader(inner);
		this.createTimeline(inner);
		this.createFooter(inner);

		container.appendChild(inner);
		container.appendChild(this.createCloseButton());

		this.shadow.append(this.createStyles(), container);
		this.mapleEffect = new MapleFallingEffect(container);
		this.mapleEffect.start();
	}

	close() {
		this.mapleEffect?.destroy();
		this.mapleEffect = null;
		this.host.remove();
		this.onClose?.();
		UpdateTipShadowDOM.activeInstance = null;
	}
}

export function showUpdateTip(data, extname, onClose = () => {}) {
	const panel = ui.create.div(ui.window);
	Object.assign(panel.style, {
		position: "absolute",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		zIndex: "100",
	});

	new UpdateTipShadowDOM(panel, data, extname, onClose);
}
