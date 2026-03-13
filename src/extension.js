import extensionInfo from "./info.js";
import { basic } from "./source/basic.js";
import { config } from "./source/config.js";
import { arenaReady } from "./source/arenaReady.js";
import { content } from "./source/content.js";
import { prepare } from "./source/prepare.js";
import { help } from "./source/help.js";
import { precontent } from "./source/precontent.js";

export const type = "extension";

export default async function () {
	const extension = {
		name: extensionInfo.name,
		arenaReady,
		content,
		prepare,
		precontent,
		config: await basic.resolve(config),
		help: await basic.resolve(help),
		package: {},
	};

	Object.keys(extensionInfo)
		.filter(key => key !== "name")
		.forEach(key => (extension.package[key] = extensionInfo[key]));

	return extension;
}
