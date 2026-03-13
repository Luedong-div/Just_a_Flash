import updateHistory from "../src/components/UpdateTip/updateHistory.js";

function writeDynamicFiles() {
	const readme =
		"# 更新内容\n\n" +
		updateHistory
			.map(item => {
				const changes = item.changes.map((change, index) => `${index + 1}. ${change}`).join("\n");
				return `## ${item.version} (${item.date})\n${changes}`;
			})
			.join("\n\n") +
		"\n\n注意：为了方便起见，部分 `css` 样式由 AI 生成，如需引用，请仔细斟酌！";

	return [
		{
			fileName: "README.md",
			source: readme,
		},
	];
}

export default function writeFilePlugin() {
	return {
		name: "generate-write-file",
		generateBundle() {
			const dynamicList = writeDynamicFiles();
			for (const { fileName, source } of dynamicList) {
				this.emitFile({
					type: "asset",
					fileName,
					source,
				});
			}
		},
	};
}
