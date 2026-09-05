import js from "@eslint/js"
import reactCompiler from "eslint-plugin-react-compiler"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([
    "dist",
    "node_modules",
    "helper",
    ".cursor",
    ".tailwind-plus",
    ".tailwind-plus-catalyst-ui-library_copy_what_you_need",
    "docs",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      "react-compiler": reactCompiler,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
])
