import os from 'node:os'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

export default defineConfig({
  plugins: [devtools(), viteReact({ compiler: true }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    target: browserslistToEsbuild(),
  },
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(import.meta.dirname),
        path.join(os.homedir(), '.bun/install/cache/links'),
      ],
    },
  },
})
