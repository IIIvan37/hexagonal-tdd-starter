import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/index.ts', '**/*.d.ts'],
      // TDD strict: the pure core is meant to stay fully covered. Thresholds gate
      // `core`; cli adapters are exercised end-to-end and main.ts is the entrypoint.
      thresholds: {
        'packages/core/src/**': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90
        }
      }
    }
  },
  resolve: {
    alias: {
      '@app/core': new URL('./packages/core/src/index.ts', import.meta.url)
        .pathname
    }
  }
})
