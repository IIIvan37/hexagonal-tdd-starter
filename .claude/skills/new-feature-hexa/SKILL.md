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
  using `domain/result.ts`. `E` is a union of **tags** (`{ kind: '…' }`), never a
  message: the adapter owns the wording and the exit code (`cli/src/report.ts`),
  and its `switch` must stay exhaustive via `exhausted(error: never)`.
- `try/catch` goes around a **single port call**, mapped to its own tag. Never
  wrap the use-case body — that turns a `TypeError` into a fake business outcome.
- Prefer removing an error case over handling it: if a precondition can be
  encoded in a type (see the branded `HourOfDay`), the function becomes total.
- It fails because the domain it calls doesn't exist yet. Good — that failure is
  your to-do list for the inner loop.

## 3. INNER loop — pull the domain into existence (TDD)

- Only now create domain units, and only the ones the outer test demands:
  `packages/core/src/domain/<name>.ts` (+ `<name>.spec.ts`, RED first per
  `tdd-cycle`: one assertion, fake-it, triangulate).
- Pure functions over your model. No `node:*`, no globals (Biome `noRestricted*` +
  Sheriff enforce it). New domain sub-folder? Add its tag to `sheriff.config.ts`.
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
  port means a new contract in `packages/core/src/testing/port-contracts.ts`,
  first validated against its in-memory reference implementation.
- Export the public surface from `packages/core/src/index.ts`.

> Three test altitudes, on purpose: the **contract** says an adapter is
> substitutable, the **acceptance test** (`run.spec.ts`) says the slice works
> wired together, the **binary test** (`main.spec.ts`) says the shipped artefact
> starts. Each catches what the others structurally cannot.

> A new package (e.g. `packages/web`) is this recipe at package scale: a package
> depending on `@app/core`, adapters implementing the EXISTING ports, no new core
> code unless a port is genuinely missing. Wire BOTH boundary tools for it:
> a Sheriff tag + depRule (`sheriff.config.ts`), and a Biome override banning
> `@app/core/testing` outside `*.spec.ts` (copy the `packages/cli` override in
> `biome.json`) — Sheriff cannot split a package by file pattern.

## 5. Prove it & register

- Full gate green: `/quality-gate`. Knip must not flag a new orphan export — if it
  does, the export had no consumer (the very smell this skill prevents): wire it or
  delete it.
- **Knip blind spot**: `@app/core`'s `index.ts` is the package entry, so knip
  CANNOT flag a core public export that nothing consumes — it only catches
  orphans inside packages. For the core surface, YOU are the check: before
  exporting from `index.ts`, name the consumer (adapter, use-case, or the next
  slice that pulls it); if you can't, don't export it yet.
- Append the new use-case/port to `packages/core/src/application/README.md`.

## 6. Close the step

Run `/session-report` to update `docs/STATUS.md` and append a dated report.
