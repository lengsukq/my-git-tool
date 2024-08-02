import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import optimizer from 'vite-plugin-optimizer'
import * as path from "path";
import electron_render from "vite-plugin-electron-renderer" //添加
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': path.resolve(__dirname, 'src'),
      }
    },
    plugins: [vue(),electron_render()]
  }
})
