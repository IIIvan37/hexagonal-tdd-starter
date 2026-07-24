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
  FIRST, with **fake ports** standing in for the real adapters — take them from
  `@app/core/testing` (`InMemoryNameSource`, `InMemoryGreetingSink`,
  `FailingNameSource`), don't hand-roll a stub. A new port means a new fake there.
  Assert the observable `Result` and what the fake received.
- Add the slice's **end-to-end acceptance test** at the adapter level too:
  `packages/cli/src/run.spec.ts` drives the real composition root in process,
  doubling only the process boundary (stdout/stderr).
- Define the use-case signature it forces:
  `packages/core/src/application/<verb-noun>.ts` — `(deps) => Promise<Result<T, E>>`
  using `shared/result.ts`. `E` is a union of **tags** (`{ kind: '…' }`), never a
  message: the adapter owns the wording and the exit code (`cli/src/report.ts`),
  and its `switch` must stay exhaustive via `exhausted(error: never)`.
- `try/catch` goes around a **single port call**, mapped to its own tag. Never
  wrap the use-case body — that turns a `TypeError` into a fake business outcome.
- Prefer removing an error case over handling it: if a precondition can be
  encoded in a type (see the branded `HourOfDay`), the function becomes total.
- It fails because the domain it calls doesn't exist yet. Good — that failure is
  your to-do list for the inner loop.

## 3. INNER loop — pull the domain into existence (TDD)

- Only now create domain units, and only the ones the outer test demands.
  **Where they are born**: in the NURSERY (`packages/core/src/domain/<name>.ts`,
  flat) when the concept is new — or directly inside an existing feature module
  (`core/src/<feature>/domain/`) when it plainly belongs to one. Never invent a
  feature folder for a first file: boundaries are discovered, not decreed
  ([ADR-0006](../../../docs/adr/0006-emergent-feature-modules.md)).
  (+ `<name>.spec.ts`, RED first per `tdd-cycle`: one behavior per test, fake-it,
  triangulate.)
- Pure functions over your model. No `node:*`, no globals (Biome `noRestricted*` +
  Sheriff enforce it). No config edit is ever needed for a feature folder — the
  Sheriff placeholder rules (`core/src/<feature>/…`) are dormant and pick it up
  the moment it exists.
- **Ambient state is a port, never a global.** Time, randomness, IDs, env config:
  the moment a domain function wants one, stop and inject a port that yields the
  value. `Clock` is the worked example — `SystemClock` reads the host, the core
  receives an `Instant` and does pure arithmetic, `FixedClock` pins it in tests.
  `packages/core/src/purity.spec.ts` fails the gate if you forget.
- `fast-check` for cross-input invariants.
- Stop when the outer acceptance test goes green. No extra domain API.

## 4. Adapter in cli/web (the only impure code)

- `packages/cli/src/adapters/<name>.ts` implements the port (fs, a client lib…);
  web adapters use Web Audio / DOM. Wired in the composition root
  (`cli/src/run.ts`): assemble input → inject real ports → map Result to an exit
  code. Adapters may import `node:*` / browser APIs — they live outside the hexagon.
- **Replay the port contract, don't rewrite it.** Every adapter spec calls the
  suite from `@app/core/testing` (`nameSourceContract`, `greetingSinkContract`)
  with a factory, then tests only what is specific to that implementation. A new
  port means a new contract + in-memory fake in its feature's `testing/` folder
  (nursery ports: `core/src/testing/`), first validated against the fake, and
  re-exported from the `core/src/testing/index.ts` barrel so adapters keep one
  import path (`@app/core/testing`).
- Export the public surface from `packages/core/src/index.ts`.

> Three test altitudes, on purpose: the **contract** says an adapter is
> substitutable, the **acceptance test** (`run.spec.ts`) says the slice works
> wired together, the **binary test** (`main.spec.ts`) says the shipped artefact
> starts. Each catches what the others structurally cannot.

> A new package (say, a hypothetical `web` one) is this recipe at package scale: a package
> depending on `@app/core`, adapters implementing the EXISTING ports, no new core
> code unless a port is genuinely missing. Wire BOTH boundary tools for it:
> a Sheriff tag + depRule (`sheriff.config.ts`), and a Biome override banning
> `@app/core/testing` outside `*.spec.ts` (copy the `packages/cli` override in
> `biome.json`) — Sheriff cannot split a package by file pattern.

## 4bis. Extraction — when a module becomes apparent

The signal is the rule of three: a third file sharing a prefix/concept, a
use-case + port serving a single cluster (`pnpm modules:hint` points at
candidates; naming the boundary stays YOUR call). Then:

1. **Name** the module.
2. **`git mv` the whole slice's center** — domain files, its use-cases, its
   ports (out of the nursery `ports.ts`), its fakes — into
   `core/src/<name>/{domain,application,testing}`. Zero config edits.
3. **Let the gate enumerate the frontier.** Each Sheriff violation is one
   decision with three exits: join the module / promote to `shared/` (second
   consumer only — never create there directly) / a declared one-line depRule
   exception. Mikado stop rule: prerequisites deeper than ~2 levels → revert,
   extract the prerequisites first.
4. **Depth check** before closing (Ousterhout): exports vs files — a module
   whose surface grows as fast as its contents was not ready.

The ratchet holds automatically: a feature importing the nursery is a
violation, so extraction only ever increases structure.

## 5. Prove it & register

- Full gate green: `/quality-gate`. Knip must not flag a new orphan export — if it
  does, the export had no consumer (the very smell this skill prevents): wire it or
  delete it.
- **Public surface is fitness-checked**: `packages/core/src/public-surface.spec.ts`
  fails the gate if a VALUE export of `index.ts` has no consumer outside the
  core (its first run caught `buildGreeting`, exported since day one and
  consumed by nobody). Type-only exports stay a review concern — structural
  typing makes them lexically undetectable. Hyrum's Law is the stake: every
  export becomes a dependency you can never retract.
- Append the new use-case/port to `packages/core/src/application/README.md`.

## 6. Close the step

Run `/session-report` to update `docs/STATUS.md` and append a dated report.
