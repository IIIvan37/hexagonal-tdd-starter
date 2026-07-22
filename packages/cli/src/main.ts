#!/usr/bin/env node
import { run } from './run.ts'

// Entrypoint: the process boundary, and nothing else. Everything testable lives
// in `run.ts` — see `run.spec.ts` (in process) and `main.spec.ts` (real binary).
// `exitCode`, not `exit()`: exit() tears the process down without waiting for
// stdout/stderr to drain, so a piped consumer (CI, execFile) can get the right
// code with an empty message. Setting exitCode lets the process end naturally.
process.exitCode = await run(process.argv.slice(2))
