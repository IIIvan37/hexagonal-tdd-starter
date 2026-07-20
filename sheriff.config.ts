import type { SheriffConfig } from '@softarc/sheriff-core'

/**
 * Hexagonal boundaries, verified on the real module graph. The two invariants
 * Sheriff can't see (browser globals + Node builtins inside the pure core) are
 * held by Biome (noRestrictedGlobals / noRestrictedImports, override on
 * packages/core in biome.json).
 *
 *   domain  ← application  ← api (index.ts)  ← cli adapter
 *
 * The domain is the center and depends on nothing. Add packages/web (or any new
 * adapter) as another entry point + module + depRule when you grow the workspace.
 */
export const config: SheriffConfig = {
  entryPoints: {
    cli: 'packages/cli/src/main.ts'
  },
  enableBarrelLess: true,
  modules: {
    'packages/core/src/domain': ['core:domain'],
    'packages/core/src/application': ['core:application'],
    'packages/core/src/testing': ['core:testing'],
    'packages/core/src': ['core:api'],
    'packages/cli/src': ['cli']
  },
  depRules: {
    root: 'noTag',
    noTag: 'noTag',

    // The domain is the center: it depends on no other layer.
    'core:domain': [],
    // Orchestration sees only the domain.
    'core:application': ['core:domain'],
    // The public contract (index.ts) re-exports domain + application.
    'core:api': ['core:domain', 'core:application'],
    // Test support (fakes + port contracts): sees the layers it doubles, and is
    // itself invisible to production code — nothing but an adapter's *specs*
    // depends on it, which is why no rule grants `core:api` access to it.
    'core:testing': ['core:domain', 'core:application'],
    // Adapters consume the core's public contract, plus the test support their
    // specs replay the port contracts from.
    cli: ['core:api', 'core:testing']
  }
}
