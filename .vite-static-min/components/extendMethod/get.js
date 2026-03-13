import { lib as t, get as o, game as p } from "noname";
if (!window?.customElements.get("jaf-poptip")) {
	class e extends HTMLElement {
		connectedCallback() {
			if (this.t) return;
			this.t = !0;
			const e = this.getAttribute("poptip") || "",
				i = this.getAttribute("color") || "";
			let s;
			const n = t?.poptip?.getName(e) ?? "";
			((s = i ? `<span style="color:${i}">${n}</span>` : n),
				(this.innerHTML = s),
				(this.style.cssText = "cursor:pointer;transition:mix-blend-mode .12s ease, filter .12s ease, color .12s ease;"),
				this.addEventListener("click", i => {
					(i && "function" == typeof i.stopPropagation && (i.stopPropagation(), i.stopImmediatePropagation && i.stopImmediatePropagation()), i && "function" == typeof i.preventDefault && i.preventDefault(), p.closePoptipDialog());
					o.poptipIntro(t.poptip.getInfo(e), e, i).style.zIndex = 9999;
				}));
		}
	}
	window.customElements.define("jaf-poptip", e);
}
export default {
	easyPoptip(o, p, e, i) {
		const s = { id: o, name: p, type: "character", info: e };
		i = i || "";
		return `<span class="jaf-poptip-name"><jaf-poptip poptip=${t && t.poptip && t.poptip.add ? t.poptip.add(s) : o} color="${i}"></jaf-poptip></span>`;
	},
};
