import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import * as topLevelAwaitModule from 'vite-plugin-top-level-await';
import * as wasmModule from 'vite-plugin-wasm';

const topLevelAwait = (topLevelAwaitModule as unknown as { default: (options?: unknown) => any }).default;
const wasm = (wasmModule as unknown as { default: () => any }).default;

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  resolve: {
    alias: [
      { find: /^assert$/, replacement: fileURLToPath(new URL('./node_modules/assert/build/assert.js', import.meta.url)) },
      { find: /^isomorphic-ws$/, replacement: fileURLToPath(new URL('./src/platform/websocket.ts', import.meta.url)) },
    ],
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    host: true,
    port: 5173,
  },
});
