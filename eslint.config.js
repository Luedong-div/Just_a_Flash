import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
    {
        name: "app/files-to-lint",
        files: ["**/*.{js,mjs,cjs}"]
    },

    globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

    {
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    },

    js.configs.recommended
]);
