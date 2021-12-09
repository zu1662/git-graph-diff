import path from 'path'
import { defineConfig } from 'vite'
import tsComplier from 'rollup-plugin-typescript2'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// ts
const tsPlugin = tsComplier({
  tsconfig: path.resolve(__dirname, './tsconfig.json'), // 导入本地ts配置
  include: ['src/*.ts'],
  abortOnError: false
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsPlugin,
    viteStaticCopy({
      targets: [
        {
          src: 'package.json',
          dest: '.'
        },
        {
          src: 'README.md',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    cssCodeSplit: false,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'GItGraph',
      formats: ['es'],
      fileName: () => `index.js`,
    },
  },
})
