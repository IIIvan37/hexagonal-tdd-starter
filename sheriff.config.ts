import { type SheriffConfig, sameTag } from '@softarc/sheriff-core'

/**
 * Hexagonal boundaries + emergent feature modules, verified on the real module
 * graph (see docs/adr/0006-emergent-feature-modules.md).
 *
 * Two tag dimensions:
 *   - `layer:*`  — the hexagon (domain ← application ← api ← adapters)
 *   - `feature:*`— the module a file belongs to, matched by the DORMANT
 *     placeholder rules below: creating `core/src/<name>/domain` is all it
 *     takes, no config edit. Extraction = one `git mv`.
 *
 * The nursery (`core/src/domain`, `core/src/application`, flat files) is where
 * concepts are born before a module is apparent. Rules encode the ratchet:
 * the nursery may use features and `shared`, but a feature may NEVER import
 * the nursery — extraction only increases structure.
 *
 * What Sheriff cannot see stays with Biome (ambient globals/imports in core,
 * fakes banned from cli production code) and with the fitness functions
 * (purity.spec.ts, public-surface.spec.ts). NOTE: Sheriff only walks the graph
 * from the entry points, so *.spec.ts files are invisible to it — spec-only
 * imports are Biome's problem, not Sheriff's. That is also why the testing
 * barrel is an entry point of its own: adapter SPECS are its only consumers,
 * so without it the whole testing subtree (and every rule about it) would be
 * unverified — proven by injection: a nursery import in the barrel went green
 * until the entry point existed.
 */
export const config: SheriffConfig = {
  entryPoints: {
    cli: 'packages/cli/src/main.ts',
    'core-testing': 'packages/core/src/testing/index.ts'
  },
  enableBarrelLess: true,
  modules: {
    // The kernel: grows by promotion only (second consumer), never creation.
    'packages/core/src/shared': ['shared'],
    // The nurseries (flat newborn files).
    'packages/core/src/domain': ['nursery', 'layer:domain'],
    'packages/core/src/application': ['nursery', 'layer:application'],
    // DORMANT placeholders: any core/src/<feature>/{domain,application,testing}
    // folder is tagged the moment it exists.
    'packages/core/src/<feature>/domain': ['feature:<feature>', 'layer:domain'],
    'packages/core/src/<feature>/application': [
      'feature:<feature>',
      'layer:application'
    ],
    'packages/core/src/<feature>/testing': [
      'feature:<feature>',
      'layer:testing'
    ],
    // The @app/core/testing barrel re-exporting each feature's test kit.
    'packages/core/src/testing': ['core:testing'],
    // The public contract (index.ts).
    'packages/core/src': ['core:api'],
    'packages/cli/src': ['cli']
  },
  depRules: {
    root: 'noTag',
    noTag: 'noTag',

    // The kernel depends on nothing but itself.
    shared: ['shared'],

    // The hexagon, per layer (holds inside features and nurseries alike).
    'layer:domain': ['layer:domain', 'shared'],
    'layer:application': ['layer:application', 'layer:domain', 'shared'],
    'layer:testing': [
      'layer:testing',
      'layer:application',
      'layer:domain',
      'shared'
    ],

    // Feature isolation: a feature sees itself and the kernel. A REAL
    // inter-feature dependency is one explicit line here (e.g.
    // `'feature:structure': [sameTag, 'shared', 'feature:harmony']`),
    // visible in review. The nursery carries no feature tag, so a feature
    // importing the nursery violates this rule — that is the ratchet.
    'feature:*': [sameTag, 'shared'],

    // The nursery may use the kernel, itself, and any already-extracted
    // feature (downward only — the reverse is the ratchet above).
    nursery: ['nursery', 'shared', 'feature:*'],

    // The public contract re-exports features, nursery use-cases and kernel.
    'core:api': ['feature:*', 'nursery', 'shared'],
    // The testing barrel re-exports each feature's test kit — and the fakes of
    // still-in-nursery ports, which live directly in core/src/testing until
    // their module is extracted (see new-feature-hexa step 4).
    'core:testing': ['feature:*', 'nursery', 'shared'],
    // Adapters consume the core's public contract; their SPECS also replay the
    // port contracts from the testing barrel (spec files are invisible to
    // Sheriff; the production-code ban is Biome's override on packages/cli).
    cli: ['core:api', 'core:testing']
  }
}
