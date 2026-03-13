const characterTitle = {
	jaf_grass: "生生不息",
};
for (const key in characterTitle) {
	characterTitle[key] = `<span class="jaf-character-title">${characterTitle[key]}</span>`;
}

export default characterTitle;
