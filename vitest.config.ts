import { defineConfig } from 'vitest/config'

// No `resolve.alias` for '@app/core' on purpose: vitest resolves it through the
// workspace symlink + the package `exports` map, the same path production takes.
// One less place to update when renaming the packages. (tsconfig `paths` still
// exist, but for a different reader: Sheriff — see the comment there.)
export default defineConfig({
  test: {
    // No `globals: true`: every spec imports from 'vitest' explicitly, so the
    // implicit globals were dead config — and an explicit import is what makes a
    // spec readable on its own.
    environment: 'node',
    // `docs/` holds no code — only the fitness function that keeps the
    // project-state docs bounded (docs/docs.spec.ts).
    include: ['packages/*/src/**/*.spec.ts', 'docs/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/index.ts',
        '**/*.d.ts',
        // The process boundary: a single `process.exit(await run(…))`. It cannot
        // be reached in process, and `main.spec.ts` covers it by running the
        // real binary — which v8 does not instrument.
        'packages/cli/src/main.ts'
      ],
      // TDD strict, greenfield: written test-first means covered, so the bar is
      // 100 everywhere and a drop is a regression, not a budget to spend. Raise
      // a genuine exception here with a comment rather than lowering the bar.
      thresholds: {
        '**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100
        }
      }
    }
  }
})
