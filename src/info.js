import updateHistory from "./components/UpdateTip/updateHistory.js";

const latest = updateHistory[0];

export default {
	name: "忽然而已",
	author: "<span class='jaf-author'>少年</span>",
	intro: "<span class='jaf-intro'>人生天地之间，若白驹之过隙，忽然而已。</span>",
	version: latest.version,
	diskURL: "https://example.com/your-repo",
	forumURL: "https://example.com/your-homepage",
};
