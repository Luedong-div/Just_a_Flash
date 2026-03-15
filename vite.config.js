import { fileURLToPath, URL } from "node:url";
import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { viteStaticCopy } from "vite-plugin-static-copy";
import writeFilePlugin from "./vite-plugins/vite-write-file-plugin.js";

// 方便直接测试
function copyDistToTargetPlugin(targetDir) {
	let config;

	return {
		name: "copy-dist-to-target",
		apply: "build",
		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},
		async closeBundle() {
			const distDir = resolve(config.root, config.build.outDir);
			await mkdir(targetDir, { recursive: true });
			await cp(distDir, targetDir, {
				recursive: true,
				force: true,
			});
			console.log(`[copy-dist-to-target] 已复制到: ${targetDir}`);
		},
	};
}

export default defineConfig(({ command, mode }) => {
	const isDev = command === "serve" || mode === "development";
	const currentDir = fileURLToPath(new URL(".", import.meta.url));
	// 测试地址
	const extraCopyTarget = resolve(currentDir, "../忽然而已");

	return {
		plugins: [
			vue(),
			// 先删除 dist/extension（如果构建时残留），再执行其它复制/拷贝行为
			// 方便测试
			writeFilePlugin(),
			copyDistToTargetPlugin(extraCopyTarget),
			// removeDistExtensionPlugin(),
			viteStaticCopy({
				targets: [
					{ src: "src/assets", dest: "" },
					{ src: "LICENSE", dest: "" },
					{ src: ".gitignore", dest: "" },
				],
			}),
			cssInjectedByJsPlugin(),
		],
		define: {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
		},
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		build: {
			minify: !isDev && "terser",
			sourcemap: isDev,
			rollupOptions: {
				// ensure entry signatures are preserved when using preserveModules
				preserveEntrySignatures: "strict",
				external: id => id === "noname" || id === "vue" || id.startsWith("@vue/"),
				// use the real source entry so Rollup emits it as `dist/extension.js`
				input: { extension: resolve(currentDir, "src/extension.js") },
				output: {
					// keep the root entry named exactly `extension.js`
					entryFileNames: chunkInfo => (chunkInfo.name === "extension" ? "extension.js" : "[name].js"),
					chunkFileNames: "[name].js",
					assetFileNames: "[name][extname]",
					// preserve modules under `src/` so that `src/source/*` becomes `dist/source/*`
					preserveModules: true,
					preserveModulesRoot: "src",
					format: "es",
				},
			},
			copyPublicDir: false,
		},
		terserOptions: {
			compress: {
				drop_console: !isDev,
				collapse_vars: true,
				reduce_vars: true,
			},
			format: {
				comments: false,
				beautify: false,
			},
			mangle: {
				properties: {
					regex: /^_[a-zA-Z]/,
				},
			},
		},
	};
});
