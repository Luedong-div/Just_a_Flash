import { createApp } from "vue";
import MillenDreamEntryApp from "./MillenDreamEntryApp.vue";

/**
 * 挂载千禧梦入口的完整 Vue 应用
 * @param {HTMLElement | null} host
 * @param {{ ctx: Object, onStartGame?: Function }} options
 * @returns {(() => void) | null}
 */
export function mountMillenDreamEntryVueApp(host, options = {}) {
	if (!host) return null;

	const app = createApp(MillenDreamEntryApp, {
		ctx: options.ctx || {},
		onStartGame: options.onStartGame,
	});

	app.mount(host);

	return () => {
		try {
			app.unmount();
		} catch {
			// ignore
		}
	};
}
