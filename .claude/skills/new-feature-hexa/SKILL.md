---
name: new-feature-hexa
description: Build a new vertical slice in the hexagonal architecture OUTSIDE-IN — start from the consumer's need (a use-case / acceptance test), let it pull the domain into existence, then implement the adapter. Use when adding any feature. Forces consumer-driven design, port reuse, and a pure core.
---

# New hexagonal feature (vertical slice, outside-in)

Add a feature as a thin slice through the layers, **driven from the outside in**:
the domain is a *supplier*, so its API must be pulled into existence by a real
consumer need — never pushed "just in case". Pair with `tdd-cycle` (the inner
red-green-refactor loop runs inside the outer acceptance loop = double loop).

> Why outside-in: a domain function written before a consumer demands it is
> speculative. The output shape is only known once its consumer (a writer, a UI,
> an external format) exists. Let the consumer pin the contract.

## 0. Start from the consumer & the contract it needs

Name who will USE this and what observable result they need:
- A driving adapter (CLI command, web action) → expressed as a **use-case**.
- A driven side-effect (read a file, write output, call a service) → a **port**
  whose shape is dictated by its real consumer.

If the output contract isn't yet known because its consumer doesn't exist, **go
build/spike that consumer first**. Don't invent the shape.

## 1. Reuse before you write (anti-duplication gate)

1. Read `packages/core/src/application/README.md` — the port/use-case registry.
2. Grep so you reuse, not reinvent:
   `rg "export (interface|type|function|class)" packages/core/src`
3. If a side-effect already has a port (`NameSource`, `GreetingSink`), reuse it.
   Only add a port when none fits.

## 2. OUTER loop — failing acceptance test for the use-case

- `packages/core/src/application/<verb-noun>.spec.ts`: write the use-case test
  FIRST, with **fake ports** (in-memory stubs) standing in for the real adapters.
  Assert the observable `Result` and what the fake received.
- Define the use-case signature it forces:
  `packages/core/src/application/<verb-noun>.ts` — `(input, deps) => Promise<Result>`,
  `Result` an explicit ok/error union.
- It fails because the domain it calls doesn't exist yet. Good — that failure is
  your to-do list for the inner loop.

## 3. INNER loop — pull the domain into existence (TDD)

- Only now create domain units, and only the ones the outer test demands:
  `packages/core/src/domain/<name>.ts` (+ `<name>.spec.ts`, RED first per
  `tdd-cycle`: one assertion, fake-it, triangulate).
- Pure functions over your model. No `node:*`, no globals (Biome `noRestricted*` +
  Sheriff enforce it). New domain sub-folder? Add its tag to `sheriff.config.ts`.
- `fast-check` for cross-input invariants.
- Stop when the outer acceptance test goes green. No extra domain API.

## 4. Adapter in cli/web (the only impure code)

- `packages/cli/src/adapters/<name>.ts` implements the port (fs, a client lib…);
  web adapters use Web Audio / DOM. Wired in the entrypoint (`cli/src/main.ts`):
  assemble input → inject real ports → map Result. Adapters may import `node:*` /
  browser APIs — they live outside the hexagon.
- Export the public surface from `packages/core/src/index.ts`.

> A new package (e.g. `packages/web`) is this recipe at package scale: a package
> depending on `@app/core`, adapters implementing the EXISTING ports, no new core
> code unless a port is genuinely missing.

## 5. Prove it & register

- Full gate green: `/quality-gate`. Knip must not flag a new orphan export — if it
  does, the export had no consumer (the very smell this skill prevents): wire it or
  delete it.
- Append the new use-case/port to `packages/core/src/application/README.md`.

## 6. Close the step

Run `/session-report` to update `docs/STATUS.md` and append a dated report.
