// 核心签名生成函数（兼容对象/字符串）
function generateConfigSign(content, secretKey) {
	let sortedStr;
	if (typeof content === "string") {
		sortedStr = content;
	} else if (typeof content === "object" && content !== null) {
		sortedStr = JSON.stringify(content, Object.keys(content).sort());
	} else {
		throw new Error("格式错误");
	}

	let hash = 0;
	for (let i = 0; i < sortedStr.length; i++) {
		const char = sortedStr.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	const keySum = secretKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return (hash + keySum).toString(16);
}

function encryptConfig(content, secretKey) {
	const rawStr = typeof content === "object" ? JSON.stringify(content) : content;
	const utf8Bytes = new TextEncoder().encode(rawStr);
	const binaryString = String.fromCharCode(...utf8Bytes);
	const base64Data = btoa(binaryString);
	const sign = generateConfigSign(content, secretKey);
	return `${base64Data}|${sign}`;
}

function decryptAndVerifyConfig(encryptedStr, secretKey) {
	const [base64Data, sign] = encryptedStr.split("|");
	if (!base64Data || !sign) {
		throw new Error("格式错误");
	}
	let rawStr;
	try {
		const binaryString = atob(base64Data);
		const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
		rawStr = new TextDecoder().decode(bytes);
	} catch (e) {
		throw new Error("格式错误");
	}
	let content;
	try {
		content = JSON.parse(rawStr);
	} catch (e) {
		content = rawStr;
	}
	const newSign = generateConfigSign(content, secretKey);
	if (newSign !== sign) {
		throw new Error("数据异常");
	}
	return content;
}

function ensureCheatButtonWatcherInstalled() {
	if (typeof _status._jafDisposeCheatButtonWatcher === "function") {
		return;
	}

	const markCheatUsed = event => {
		const target = event?.target;
		if (!(target instanceof Element)) return;

		const btn = target.closest(".menubutton.round.highlight");
		if (!btn) return;

		const text = String(btn.textContent || "").trim();
		if (text && text !== "作") return;

		_status.jafCheatUsed = true;
	};

	document.addEventListener("click", markCheatUsed, true);
	document.addEventListener("touchstart", markCheatUsed, { passive: true, capture: true });

	_status._jafDisposeCheatButtonWatcher = () => {
		document.removeEventListener("click", markCheatUsed, true);
		document.removeEventListener("touchstart", markCheatUsed, { passive: true, capture: true });
		delete _status._jafDisposeCheatButtonWatcher;
	};
}

export { encryptConfig, decryptAndVerifyConfig, ensureCheatButtonWatcherInstalled };

// { memoryZhu: [ 5, 20 ], dreamDian: [1, 2], jiangFu: [7, 12] }

console.log(encryptConfig({ memoryZhu: [5, 20], dreamDian: [1, 2], jiangFu: [7, 12] }, "shaonian"));
// console.log(decryptAndVerifyConfig("eyJkcmVhbURpYW4iOjV9|293f687f", "shaonian"));
