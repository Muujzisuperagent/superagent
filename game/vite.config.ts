import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/]three[\\/]/.test(id)) return 'three'
          if (id.includes('node_modules')) return 'vendor'
        }
      }
    }
  },
  // 编辑器保存时会往 src/ 里写临时目录（如 .scene.ts.<pid>.<guid>.tmpdir），
  // vite 的 FSWatcher 一旦 watch 到被锁定的临时文件就会 EBUSY 直接崩掉 dev server。
  // 这些路径一律不进 watch。
  server: {
    watch: {
      ignored: ['**/*.tmpdir/**', '**/*.tmpdir', '**/.*.tmp*', '**/.*.tmp']
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
})
