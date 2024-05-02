import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: '@tato30/vue-polygon-cropper',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', 'fabric'],
      output: {
        exports: 'named',
        globals: {
          'vue': 'vue',
          'fabric': 'fabric'
        }
      }
    }
  },
  plugins: [vue()],
})
